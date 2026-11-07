import { resolveDepreciation } from "@/lib/calculator/depreciation";
import { buildTaxChain, customsValueFromCrsp, forwardTaxes } from "./chain";
import type { EstimateInput, EstimateYearResult } from "./types";

/**
 * Estimates taxes for missing manufacturing years from an approved calibration
 * CRSP, using the workbook's own depreciation bands and tax chain.
 * Estimates are never silently extrapolated and are never "confirmed" here:
 * years with no workbook depreciation band (e.g. an age of exactly 1 year on a
 * direct import) are reported as needing an explicit assumption.
 */
export function estimateMissingYears(input: EstimateInput): EstimateYearResult[] {
  const { chain, missingRules } = buildTaxChain(
    input.taxRules,
    input.taxCategoryCode,
    input.importType,
  );
  if (!chain) throw new Error(`Cannot estimate: ${missingRules.join(" ")}`);

  return input.manufacturingYears
    .slice()
    .sort((a, b) => b - a)
    .map((year) => {
      const warnings: string[] = [];
      const ageYears = input.assessmentYear - year;
      const dep = resolveDepreciation(input.depRules, input.importType, ageYears);
      let depRate = dep.rate;
      let depreciationDefined = dep.ruleId !== null;

      if (dep.warning) {
        warnings.push(dep.warning);
        depreciationDefined = false;
      }
      if (dep.ruleId === null && ageYears <= 1) {
        // No workbook band for this age - the estimate cannot proceed without an
        // explicit assumption, so it is flagged rather than silently defaulted.
        warnings.push(
          `The workbook has no ${input.importType} depreciation band for an age of ${ageYears} year(s); the tax estimate for ${year} needs an explicit depreciation assumption.`,
        );
        depreciationDefined = false;
      }
      if (input.extraDepreciationPct > 0) {
        warnings.push(
          `Extra depreciation of ${input.extraDepreciationPct * 100}% was supplied by the user and is applied; the workbook states no rule for when extra depreciation applies.`,
        );
      }
      if (!depreciationDefined) {
        warnings.push(`ESTIMATE for ${year} is UNVERIFIED.`);
      } else {
        warnings.push(`Provisional estimate for ${year} - not a confirmed tax figure.`);
      }

      const customsValue = customsValueFromCrsp(chain, input.approvedCrspKes, depRate, input.extraDepreciationPct);
      const estimatedTaxes = forwardTaxes(chain, customsValue, "all");
      return {
        manufacturingYear: year,
        ageYears,
        standardDepreciationPct: depRate,
        depreciationLabel: dep.label,
        depreciationDefined,
        extraDepreciationPct: input.extraDepreciationPct,
        crspKes: input.approvedCrspKes,
        estimatedTaxesKes: estimatedTaxes,
        warnings,
      } satisfies EstimateYearResult;
    });
}
