import type { DepreciationRule, ImportType } from "./types";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * EAC practice: age runs from the vehicle's manufacture / first registration
 * date to the date it arrives in Kenya, as a fraction of a year. When only a
 * year of manufacture is known, 1 January of that year is used.
 */
export function vehicleAgeYears(
  importDate: string,
  yearOfManufacture: number,
  firstRegistrationYear?: number | null,
): number {
  const startYear = firstRegistrationYear ?? yearOfManufacture;
  const start = Date.UTC(startYear, 0, 1);
  const arrival = new Date(importDate).getTime();
  if (Number.isNaN(arrival)) return new Date().getUTCFullYear() - startYear;
  return (arrival - start) / MS_PER_YEAR;
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
