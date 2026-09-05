import { describe, expect, it } from "vitest";
import { calculateImportTaxes } from "./calculateImportTaxes";
import { resolveDepreciation } from "./depreciation";
import type { DepreciationRule, RuleSet, TaxRule } from "./types";

function taxRule(partial: Partial<TaxRule> & Pick<TaxRule, "tax_type" | "category_code" | "import_type">): TaxRule {
  return {
    id: `${partial.category_code}-${partial.import_type}-${partial.tax_type}`,
    version_id: "v1",
    name: partial.tax_type,
    rate: null,
    fixed_amount: null,
    formula: "",
    calculation_base: "",
    customs_divisors: [],
    source: "TEMPLATE 2025",
    verification_status: "guideline_subject_to_verification",
    ...partial,
  } as TaxRule;
}

/** Rules mirroring TEMPLATE 2025 rows 22-52. */
const rules: RuleSet = {
  datasetId: "dataset",
  taxRuleVersionId: "tax-v1",
  depreciationVersionId: "dep-v1",
  exchangeRateVersionId: "fx-v1",
  exchangeRates: [{ currency: "USD", rate_to_kes: 130 }],
  depreciationRules: (
    [
      [">1 <=2 years", 1, 2, 0.2],
      [">2 <=3 years", 2, 3, 0.3],
      [">3 <=4 years", 3, 4, 0.4],
      [">4 <=5 years", 4, 5, 0.5],
      [">5 <=6 years", 5, 6, 0.55],
      [">6 <=7 years", 6, 7, 0.6],
      [">7 <=8 years", 7, 8, 0.65],
    ] as const
  ).map(([label, min, max, rate], i): DepreciationRule => ({
    id: `dep-${i}`,
    version_id: "dep-v1",
    import_type: "direct",
    label,
    min_years: min,
    max_years: max,
    rate,
    source: "TEMPLATE 2025!B3:C9",
  })),
  taxRules: [
    taxRule({ category_code: "UNDER_1500CC", import_type: "direct", tax_type: "customs_value", customs_divisors: [1.25, 1.35, 1.2, 1.16] }),
    taxRule({ category_code: "UNDER_1500CC", import_type: "direct", tax_type: "import_duty", rate: 0.35 }),
    taxRule({ category_code: "UNDER_1500CC", import_type: "direct", tax_type: "excise", rate: 0.2 }),
    taxRule({ category_code: "UNDER_1500CC", import_type: "direct", tax_type: "vat", rate: 0.16 }),
    taxRule({ category_code: "UNDER_1500CC", import_type: "direct", tax_type: "rdl", rate: 0.02 }),
    taxRule({ category_code: "UNDER_1500CC", import_type: "direct", tax_type: "idf", rate: 0.025 }),
    taxRule({ category_code: "OVER_1500CC", import_type: "direct", tax_type: "customs_value", customs_divisors: [1.25, 1.35, 1.25, 1.16] }),
    taxRule({ category_code: "OVER_1500CC", import_type: "direct", tax_type: "import_duty", rate: 0.35 }),
    taxRule({ category_code: "OVER_1500CC", import_type: "direct", tax_type: "excise", rate: 0.25 }),
    taxRule({ category_code: "OVER_1500CC", import_type: "direct", tax_type: "vat", rate: 0.16 }),
    taxRule({ category_code: "OVER_1500CC", import_type: "direct", tax_type: "rdl", rate: 0.02 }),
    taxRule({ category_code: "OVER_1500CC", import_type: "direct", tax_type: "idf", rate: 0.025 }),
  ],
};

describe("depreciation bands", () => {
  it("matches the workbook bands exactly (lower exclusive, upper inclusive)", () => {
    expect(resolveDepreciation(rules.depreciationRules, "direct", 2).rate).toBe(0.2);
    expect(resolveDepreciation(rules.depreciationRules, "direct", 3).rate).toBe(0.3);
    expect(resolveDepreciation(rules.depreciationRules, "direct", 8).rate).toBe(0.65);
    expect(resolveDepreciation(rules.depreciationRules, "direct", 0.5).rate).toBe(0);
  });

  it("flags ages beyond the last direct-import band", () => {
    const r = resolveDepreciation(rules.depreciationRules, "direct", 12);
    expect(r.rate).toBe(0.65);
    expect(r.warning).toContain("REQUIRES VERIFICATION");
  });
});

describe("calculateImportTaxes vs TEMPLATE 2025", () => {
  it("reproduces the <=1500cc direct-import tabulation for CRSP 1,000,000 with no depreciation", () => {
    const res = calculateImportTaxes(
      {
        vehicle: { crspKes: 1_000_000, engineCapacityCc: 1300, fuel: "PETROL", recordType: "vehicle" },
        importType: "direct",
        yearOfManufacture: 2025,
        importDate: "2025-07-01",
        currency: "KES",
      },
      rules,
    );

    const customs = ((1_000_000 / 1.25) * 1) / 1.35 / 1.2 / 1.16;
    expect(res.customsValue.result).toBeCloseTo(customs, 6);
    expect(res.importDuty.result).toBeCloseTo(customs * 0.35, 6);
    expect(res.exciseDuty.result).toBeCloseTo((customs + customs * 0.35) * 0.2, 6);
    const excise = (customs + customs * 0.35) * 0.2;
    expect(res.vat.result).toBeCloseTo((customs + customs * 0.35 + excise) * 0.16, 6);
    expect(res.rdl.result).toBeCloseTo(customs * 0.02, 6);
    expect(res.idf.result).toBeCloseTo(customs * 0.025, 6);
    expect(res.totalGovernmentTaxes).toBeCloseTo(
      res.importDuty.result + excise + res.vat.result + res.rdl.result + res.idf.result,
      6,
    );
  });

  it("applies the >1500cc divisor chain and 25% excise, with depreciation", () => {
    const res = calculateImportTaxes(
      {
        vehicle: { crspKes: 4_000_000, engineCapacityCc: 2500, fuel: "PETROL", recordType: "vehicle" },
        importType: "direct",
        yearOfManufacture: 2020,
        importDate: "2025-07-01",
        currency: "KES",
      },
      rules,
    );
    expect(res.category.code).toBe("OVER_1500CC");
    expect(res.ageYears).toBeCloseTo(5.5, 1);
    expect(res.depreciation.rate).toBe(0.55);
    const customs = ((4_000_000 / 1.25) * (1 - 0.55)) / 1.35 / 1.25 / 1.16;
    expect(res.customsValue.result).toBeCloseTo(customs, 6);
    expect(res.exciseDuty.rate).toBe(0.25);
  });

  it("converts other import costs with the versioned exchange rate", () => {
    const res = calculateImportTaxes(
      {
        vehicle: { crspKes: 1_000_000, engineCapacityCc: 1300, fuel: "PETROL", recordType: "vehicle" },
        importType: "direct",
        yearOfManufacture: 2025,
        importDate: "2025-07-01",
        currency: "USD",
        purchasePrice: 10_000,
        freight: 1_000,
      },
      rules,
    );
    expect(res.otherImportCosts.total).toBeCloseTo(11_000 * 130, 6);
    expect(res.estimatedLandedCost).toBeCloseTo(res.totalGovernmentTaxes + 11_000 * 130, 6);
  });

  it("warns instead of silently converting when the currency has no rate", () => {
    const res = calculateImportTaxes(
      {
        vehicle: { crspKes: 1_000_000, engineCapacityCc: 1300, fuel: "PETROL", recordType: "vehicle" },
        importType: "direct",
        yearOfManufacture: 2025,
        importDate: "2025-07-01",
        currency: "JPY",
        purchasePrice: 2_000_000,
      },
      rules,
    );
    expect(res.otherImportCosts.total).toBe(0);
    expect(res.warnings.join(" ")).toContain("no exchange rate for JPY");
  });

  it("routes electric vehicles to the electric tabulation via the category override path", () => {
    const res = calculateImportTaxes(
      {
        vehicle: {
          crspKes: 1_000_000,
          engineCapacityCc: null,
          fuel: "PETROL",
          recordType: "vehicle",
          categoryOverride: "OVER_1500CC",
        },
        importType: "direct",
        yearOfManufacture: 2025,
        importDate: "2025-07-01",
        currency: "KES",
      },
      rules,
    );
    expect(res.category.code).toBe("OVER_1500CC");
    expect(res.category.reason).toContain("user");
  });
});
