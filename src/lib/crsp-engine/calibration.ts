import type { CalibrationMethod, CalibrationReference, CalibrationReport } from "./types";

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1));
}

/**
 * Calibrates implied CRSP values across the references for one vehicle.
 * Never assumes one CRSP across years and never averages inconsistent values
 * automatically: inconsistent groups keep all candidate methods visible and
 * always require explicit user approval.
 */
export function calibrateReferences(
  references: CalibrationReference[],
  tolerancePct: number,
): CalibrationReport {
  const warnings: string[] = [];
  const values = references.map((r) => r.impliedCrspKes);
  const m = mean(values);
  const med = median(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sd = stdDev(values);
  const spreadPct = med > 0 ? ((max - min) / med) * 100 : 0;

  const outliers = references.filter(
    (r) => med > 0 && Math.abs(r.impliedCrspKes - med) / med > tolerancePct / 100,
  );
  if (outliers.length > 0) {
    warnings.push(
      `${outliers.length} reference(s) fall outside the ${tolerancePct}% tolerance from the median implied CRSP. Review them before approving - do not average inconsistent values automatically.`,
    );
  }

  const byYearMap = new Map<number, CalibrationReference[]>();
  for (const r of references) {
    const list = byYearMap.get(r.manufacturingYear) ?? [];
    list.push(r);
    byYearMap.set(r.manufacturingYear, list);
  }
  const byYear = [...byYearMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, refs]) => ({
      manufacturingYear: year,
      impliedCrspKes: mean(refs.map((r) => r.impliedCrspKes)),
      referenceIds: refs.map((r) => r.referenceId),
    }));

  if (byYear.length > 1 && spreadPct > tolerancePct) {
    warnings.push(
      "Implied CRSP differs across manufacturing years beyond tolerance. The workbook does not state that one CRSP applies to every year - prefer the model-year method or approve a value explicitly.",
    );
  }

  const weights = references.map((r) => r.weight ?? 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const weighted =
    weightSum > 0 ? references.reduce((acc, r, i) => acc + r.impliedCrspKes * weights[i]!, 0) / weightSum : m;

  const singleYear = byYear.length === 1;
  const modelYearValue: number | null = singleYear ? byYear[0]!.impliedCrspKes : null;
  if (singleYear) {
    warnings.push(
      "Only one manufacturing year is referenced, so a single calibration value stands for that year only - it must not be applied to other years.",
    );
  }

  const methods = {
    mean: m,
    median: med,
    weighted,
    model_year: modelYearValue,
  } as CalibrationReport["methods"];

  const status: "consistent" | "inconsistent" = spreadPct <= tolerancePct ? "consistent" : "inconsistent";
  const recommendedMethod: CalibrationMethod = singleYear
    ? "model_year"
    : status === "consistent"
      ? "mean"
      : "model_year";

  return {
    references,
    count: references.length,
    meanKes: m,
    medianKes: med,
    minKes: min,
    maxKes: max,
    standardDeviationKes: sd,
    spreadPct,
    tolerancePct,
    outliers,
    status,
    byYear,
    methods,
    recommendedMethod,
    requiresUserApproval: true,
    warnings,
  };
}
