import type { DepreciationRule, ImportType } from "./types";

/**
 * Age counter exactly as used by the source workbook (TEMPLATE 2025):
 *   age = year of import - year of manufacture
 * No fractional / arrival-date ageing is stated anywhere in the workbook, so
 * none is applied here.
 */
export function vehicleAgeYears(
  importDate: string,
  yearOfManufacture: number,
  firstRegistrationYear?: number | null,
): number {
  const startYear = firstRegistrationYear ?? yearOfManufacture;
  const importYear = new Date(importDate).getUTCFullYear();
  if (Number.isNaN(importYear)) return new Date().getUTCFullYear() - startYear;
  return importYear - startYear;
}


export interface DepreciationResult {
  rate: number;
  label: string;
  ruleId: string | null;
  source: string | null;
  warning?: string | undefined;
}

/**
 * Picks the depreciation band for an age, using the bands exactly as tabulated
 * in TEMPLATE 2025 (lower bound exclusive, upper bound inclusive).
 */
export function resolveDepreciation(
  rules: DepreciationRule[],
  importType: ImportType,
  ageYears: number,
): DepreciationResult {
  const applicable = rules
    .filter((r) => r.import_type === importType)
    .sort((a, b) => a.min_years - b.min_years);

  if (applicable.length === 0) {
    return { rate: 0, label: "No depreciation rules", ruleId: null, source: null, warning: "REQUIRES VERIFICATION: no depreciation rules loaded" };
  }

  const match = applicable.find(
    (r) => ageYears > r.min_years && (r.max_years === null || ageYears <= r.max_years),
  );
  if (match) {
    return { rate: Number(match.rate), label: match.label, ruleId: match.id, source: match.source };
  }

  const maxBand = applicable[applicable.length - 1]!;
  if (ageYears > (maxBand.max_years ?? Infinity)) {
    return {
      rate: Number(maxBand.rate),
      label: maxBand.label,
      ruleId: maxBand.id,
      source: maxBand.source,
      warning: `REQUIRES VERIFICATION: the source workbook has no ${importType} depreciation band above ${maxBand.max_years} years; the highest band was applied.`,
    };
  }

  return {
    rate: 0,
    label: "0% (under 1 year)",
    ruleId: null,
    source: null,
    warning: ageYears < 0 ? "Year of manufacture is later than the import year." : undefined,
  };
}
