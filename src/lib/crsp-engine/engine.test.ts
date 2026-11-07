import { describe, expect, it } from "vitest";
import type { DepreciationRule, TaxRule } from "@/lib/calculator/types";
import { reverseEngineer } from "./reverse";
import { calibrateReferences } from "./calibration";
import { estimateMissingYears } from "./estimate";

const rule = (tax_type: TaxRule["tax_type"], rate: number | null): TaxRule => ({
  id: tax_type, version_id: "v", category_code: "LARGE_ENGINE", import_type: "direct", name: tax_type,
  tax_type, rate, fixed_amount: null, formula: "", calculation_base: "",
  customs_divisors: tax_type === "customs_value" ? [1.25, 1.35, 1.35, 1.16] : [],
  source: null, verification_status: "x",
});
const taxRules = [
  rule("customs_value", null), rule("import_duty", 0.35), rule("excise", 0.35),
  rule("vat", 0.16), rule("rdl", 0.02), rule("idf", 0.025),
];
const bands: [number, number, number][] = [[1, 2, 0.2], [2, 3, 0.3], [3, 4, 0.4], [4, 5, 0.5], [5, 6, 0.55]];
const depRules: DepreciationRule[] = bands.map(([min, max, rate], i) => ({
  id: `d${i}`, version_id: "d", import_type: "direct", label: `>${min}<=${max}`, min_years: min, max_years: max, rate, source: null,
}));

const rev = (year: number, total: number, assumed?: number) =>
  reverseEngineer(
    { finalTaxesKes: total, importType: "direct", taxCategoryCode: "LARGE_ENGINE", ageYears: 2026 - year,
      extraDepreciationPct: 0, totalComponents: "all", assumedDepreciationPct: assumed ?? null },
    taxRules, depRules,
  );

describe("G63 reverse engineering", () => {
  it("2021 KES 9,000,000 implies CRSP ≈ 41,038,089.90 at 50%", () => {
    const r = rev(2021, 9_000_000);
    expect(r.taxesFactor).toBeCloseTo(1.1591, 6);
    expect(r.standardDepreciationPct).toBe(0.5);
    expect(r.impliedCrspKes).toBeCloseTo(41_038_089.9, 0);
    expect(r.forwardVerification.withinTolerance).toBe(true);
    expect(r.suggestedConfidence).not.toBe("confirmed");
  });
  it("2024 KES 14,700,000 implies CRSP ≈ 41,893,050.10 at 20%", () => {
    expect(rev(2024, 14_700_000).impliedCrspKes).toBeCloseTo(41_893_050.1, 0);
  });
  it("2025 (age 1) has no band: requires an explicit assumption", () => {
    expect(rev(2025, 17_000_000).missingInputs.length).toBe(1);
    const a = rev(2025, 17_000_000, 0);
    expect(a.impliedCrspKes).toBeCloseTo(38_758_196.01, 0);
    expect(a.suggestedConfidence).toBe("unverified");
  });
});

describe("calibration and estimates", () => {
  it("2021+2024 mean ≈ 41,465,570 and missing years estimate", () => {
    const rep = calibrateReferences(
      [
        { referenceId: "a", manufacturingYear: 2021, impliedCrspKes: rev(2021, 9_000_000).impliedCrspKes, isRounded: true, confidence: "calibrated" },
        { referenceId: "b", manufacturingYear: 2024, impliedCrspKes: rev(2024, 14_700_000).impliedCrspKes, isRounded: true, confidence: "calibrated" },
      ],
      5,
    );
    expect(rep.methods.mean).toBeCloseTo(41_465_570, -1);
    expect(rep.status).toBe("consistent");
    const est = estimateMissingYears({
      approvedCrspKes: rep.methods.mean, crspSource: "calibrated", importType: "direct",
      taxCategoryCode: "LARGE_ENGINE", assessmentYear: 2026, manufacturingYears: [2022, 2023],
      extraDepreciationPct: 0, depRules, taxRules,
    });
    const byYear = Object.fromEntries(est.map((e) => [e.manufacturingYear, e.estimatedTaxesKes]));
    expect(byYear[2022]).toBeCloseTo(10_912_500, -3);
    expect(byYear[2023]).toBeCloseTo(12_731_250, -3);
  });
});
