import { classifyVehicle } from "./classification";
import { resolveDepreciation, vehicleAgeYears } from "./depreciation";
import { exciseDuty } from "./excise";
import { idf } from "./idf";
import { importDuty } from "./importDuty";
import { estimatedLandedCost, otherImportCosts } from "./landedCost";
import { rdl } from "./rdl";
import type { CalculationInput, CalculationResult, RuleSet, TaxRule, TaxType } from "./types";
import { customsValue } from "./valuation";
import { vat } from "./vat";

function pick(rules: TaxRule[], category: string, importType: string, taxType: TaxType): TaxRule {
  const rule = rules.find(
    (r) => r.category_code === category && r.import_type === importType && r.tax_type === taxType,
  );
  if (!rule) {
    throw new Error(
      `No ${taxType} rule for category ${category} / ${importType} in the active tax-rule version. REQUIRES VERIFICATION.`,
    );
  }
  return rule;
}

/** Full workbook calculation flow: CRSP -> depreciation -> customs value -> taxes -> landed cost. */
export function calculateImportTaxes(input: CalculationInput, rules: RuleSet): CalculationResult {
  const warnings: string[] = [];
  const classification = classifyVehicle(input.vehicle);
  warnings.push(...classification.warnings);

  const age = vehicleAgeYears(input.importDate, input.yearOfManufacture, input.firstRegistrationYear);
  const dep = resolveDepreciation(rules.depreciationRules, input.importType, age);
  if (dep.warning) warnings.push(dep.warning);


  const crsp = Number(input.vehicle.crspKes);
  const extra = Number(input.extraDepreciation ?? 0);
  if (extra > 0) {
    warnings.push(
      "REQUIRES VERIFICATION: the workbook exposes an 'Extra Depreciation' cell but states no rule for when it applies.",
    );
  }

  const category = classification.code;
  const t = input.importType;

  const customs = customsValue(pick(rules.taxRules, category, t, "customs_value"), crsp, dep.rate, extra);
  const duty = importDuty(pick(rules.taxRules, category, t, "import_duty"), customs.result);
  const excise = exciseDuty(pick(rules.taxRules, category, t, "excise"), customs.result, duty.result);
  const vatItem = vat(pick(rules.taxRules, category, t, "vat"), customs.result, duty.result, excise.result);
  const rdlItem = rdl(pick(rules.taxRules, category, t, "rdl"), customs.result);
  const idfItem = idf(pick(rules.taxRules, category, t, "idf"), customs.result);

  const totalGovernmentTaxes =
    duty.result + excise.result + vatItem.result + rdlItem.result + idfItem.result;
  const workbookPreviouslyRegisteredTotal = duty.result + excise.result + vatItem.result;

  if (t === "previously_registered") {
    warnings.push(
      "Note: the workbook's 'Previously Registered' grand total adds only import duty, excise and VAT. RDL and IDF are computed in the direct-import columns only. Both totals are shown - REQUIRES VERIFICATION.",
    );
  }

  const costs = otherImportCosts(input, rules.exchangeRates);
  warnings.push(...costs.warnings);

  return {
    vehicle: input.vehicle,
    category: { code: category, reason: classification.reason },
    importType: t,
    ageYears: age,
    crspKes: crsp,
    depreciation: {
      rate: dep.rate,
      percentage: dep.rate * 100,
      amount: crsp * dep.rate,
      ruleId: dep.ruleId,
      label: dep.label,
      source: dep.source,
    },
    extraDepreciation: extra,
    customsValue: customs,
    importDuty: duty,
    exciseDuty: excise,
    vat: vatItem,
    rdl: rdlItem,
    idf: idfItem,
    totalGovernmentTaxes,
    workbookPreviouslyRegisteredTotal,
    otherImportCosts: {
      purchasePriceKes: costs.purchasePriceKes,
      freightKes: costs.freightKes,
      insuranceKes: costs.insuranceKes,
      otherKes: costs.otherKes,
      total: costs.total,
      currency: costs.currency,
      exchangeRateToKes: costs.exchangeRateToKes,
    },
    estimatedLandedCost: estimatedLandedCost(totalGovernmentTaxes, costs.total),
    versions: {
      datasetId: rules.datasetId,
      taxRuleVersionId: rules.taxRuleVersionId,
      depreciationVersionId: rules.depreciationVersionId,
      exchangeRateVersionId: rules.exchangeRateVersionId,
    },
    warnings,
  };
}
