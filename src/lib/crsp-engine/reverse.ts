import { resolveDepreciation } from "@/lib/calculator/depreciation";
import type { DepreciationRule, TaxRule } from "@/lib/calculator/types";
import {
  buildTaxChain,
  chainTotals,
  customsValueFromCrsp,
  forwardTaxes,
  impliedCrspFromCustomsValue,
  reverseCustomsValue,
} from "./chain";
import type { ConfidenceLevel, ReverseInput, ReverseResult, ReverseStep } from "./types";

const FORWARD_TOLERANCE_KES = 1;

/**
 * Works a total tax figure backwards through the workbook formulas:
 *   total taxes -> customs value -> (back out depreciation + divisor chain) -> CRSP
 *
 * Every rate, divisor and depreciation band comes from the active workbook rule
 * set. Where the workbook is silent (e.g. no direct-import band for an age of
 * exactly 1 year) the result is flagged, and the CRSP is only produced when the
 * user explicitly supplies an assumption.
 */
export function reverseEngineer(
  input: ReverseInput,
  taxRules: TaxRule[],
  depRules: DepreciationRule[],
): ReverseResult {
  const warnings: string[] = [];
  const missingInputs: string[] = [];
  const steps: ReverseStep[] = [];

  const { chain, missingRules } = buildTaxChain(taxRules, input.taxCategoryCode, input.importType);
  if (!chain) {
    throw new Error(
      `Cannot reverse-engineer: ${missingRules.join(" ")} Import the workbook rules before running reverse engineering.`,
    );
  }
  for (const m of missingRules) warnings.push(`REQUIRES VERIFICATION: ${m}`);

  const dep = resolveDepreciation(depRules, input.importType, input.ageYears);
  let depRate = dep.rate;
  if (dep.warning) warnings.push(dep.warning);
  if (dep.ruleId === null && dep.warning === undefined && input.ageYears <= 1) {
    // The workbook tabulates no direct-import band for an age of exactly 1 year.
    if (input.assumedDepreciationPct == null) {
      missingInputs.push(
        `The workbook has no ${input.importType} depreciation band for an age of ${input.ageYears} year(s). Supply an assumed depreciation percentage to proceed - it will be recorded and the result stays UNVERIFIED.`,
      );
    } else {
      depRate = Number(input.assumedDepreciationPct);
      warnings.push(
        `ASSUMPTION: the workbook defines no ${input.importType} depreciation band for an age of ${input.ageYears} year(s). The assumed ${depRate * 100}% depreciation was supplied by the user; the implied CRSP is UNVERIFIED.`,
      );
    }
  }

  if (input.totalComponents === "duty_excise_vat") {
    warnings.push(
      "The quoted total covers import duty + excise + VAT only (the workbook's 'Previously Registered' grand total). RDL and IDF are excluded from the reverse calculation.",
    );
  }

  const { variableFactor, fixedKes } = chainTotals(chain, input.totalComponents);
  steps.push({
    key: "taxes_factor",
    label: "Total-taxes factor (from workbook rates)",
    formula:
      `${(chain.importDutyRate * 100).toFixed(2)}% duty + ` +
      (chain.exciseFixedKes !== null
        ? `fixed excise KES ${chain.exciseFixedKes} + `
        : `(${((1 + chain.importDutyRate) * 100).toFixed(2)}% × ${(chain.exciseRate ?? 0) * 100}%) excise + `) +
      `${(chain.vatRate * 100).toFixed(2)}% VAT` +
      (input.totalComponents === "all"
        ? ` + ${(chain.rdlRate * 100).toFixed(2)}% RDL + ${(chain.idfRate * 100).toFixed(2)}% IDF`
        : ""),
    value: variableFactor,
  });

  const { customsValueKes } = reverseCustomsValue(chain, input.finalTaxesKes, input.totalComponents);
  steps.push({
    key: "customs_value",
    label: "Customs value",
    formula: `(total taxes${fixedKes ? ` − fixed KES ${fixedKes}` : ""}) / factor`,
    value: customsValueKes,
  });

  const impliedCrsp = impliedCrspFromCustomsValue(chain, customsValueKes, depRate, input.extraDepreciationPct);
  steps.push({
    key: "implied_crsp",
    label: "Implied CRSP",
    formula: `customs value × ${chain.divisors.join(" × ")} ÷ ((1 − ${depRate}) × (1 − ${input.extraDepreciationPct}))`,
    value: impliedCrsp,
  });

  // Forward verification: recompute the taxes from the implied CRSP.
  const forwardCustoms = customsValueFromCrsp(chain, impliedCrsp, depRate, input.extraDepreciationPct);
  const recalculated = forwardTaxes(chain, forwardCustoms, input.totalComponents);
  const difference = recalculated - input.finalTaxesKes;
  const withinTolerance = Math.abs(difference) <= FORWARD_TOLERANCE_KES;
  if (!withinTolerance) {
    warnings.push(
      `REQUIRES VERIFICATION: forwarding the implied CRSP through the workbook formulas gives KES ${recalculated.toLocaleString("en-KE", { maximumFractionDigits: 2 })}, a difference of KES ${difference.toFixed(2)} from the quoted total.`,
    );
  }

  let roundingRange: ReverseResult["roundingRange"] = null;
  if (input.isRounded && input.roundingPrecision && input.roundingPrecision > 0) {
    const half = input.roundingPrecision / 2;
    const low = reverseCustomsValue(chain, input.finalTaxesKes - half, input.totalComponents).customsValueKes;
    const high = reverseCustomsValue(chain, input.finalTaxesKes + half, input.totalComponents).customsValueKes;
    roundingRange = {
      minKes: impliedCrspFromCustomsValue(chain, low, depRate, input.extraDepreciationPct),
      maxKes: impliedCrspFromCustomsValue(chain, high, depRate, input.extraDepreciationPct),
    };
    warnings.push(
      "The quoted total is a rounded figure, so the implied CRSP carries the rounding uncertainty shown in the range.",
    );
  }

  // A matching forward calculation alone never proves an official CRSP.
  let suggestedConfidence: ConfidenceLevel = "unverified";
  if (missingInputs.length === 0) {
    suggestedConfidence = "calibrated";
    if (dep.ruleId === null && input.assumedDepreciationPct != null) suggestedConfidence = "unverified";
  } else {
    suggestedConfidence = "unverified";
  }

  return {
    chain,
    totalComponents: input.totalComponents,
    standardDepreciationPct: depRate,
    depreciationLabel: dep.label,
    depreciationRuleId: dep.ruleId,
    extraDepreciationPct: input.extraDepreciationPct,
    customsValueKes,
    taxesFactor: variableFactor,
    fixedTaxesKes: fixedKes,
    impliedCrspKes: impliedCrsp,
    roundingRange,
    steps,
    warnings,
    missingInputs,
    forwardVerification: {
      recalculatedTaxesKes: recalculated,
      differenceKes: difference,
      toleranceKes: FORWARD_TOLERANCE_KES,
      withinTolerance,
    },
    suggestedConfidence,
  };
}
