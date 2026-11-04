import type { CategoryCode, DepreciationRule, ImportType, TaxRule } from "@/lib/calculator/types";

export type ConfidenceLevel = "confirmed" | "calibrated" | "estimated" | "unverified";

export type TotalComponents = "all" | "duty_excise_vat";

/** A tax reference supplied by the KRA contact (table: insider_tax_references). */
export interface InsiderReference {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  manufacturing_year: number;
  engine_cc: number | null;
  fuel: string | null;
  transmission: string | null;
  drivetrain: string | null;
  assessment_year: number;
  import_category: ImportType;
  tax_category_code: CategoryCode | null;
  final_taxes_kes: number;
  is_rounded: boolean;
  rounding_precision: number | null;
  extra_depreciation_pct: number;
  standard_depreciation_pct: number | null;
  source_reference: string | null;
  date_received: string | null;
  notes: string | null;
  status: "active" | "excluded";
}

/** The workbook tax chain for one category / import type, extracted from tax_rules. */
export interface TaxChain {
  categoryCode: CategoryCode;
  importType: ImportType;
  importDutyRate: number;
  exciseRate: number | null;
  exciseFixedKes: number | null;
  vatRate: number;
  rdlRate: number;
  idfRate: number;
  divisors: number[];
  ruleSources: { taxType: string; ruleId: string; source: string | null; verificationStatus: string }[];
}

export interface ReverseInput {
  finalTaxesKes: number;
  importType: ImportType;
  taxCategoryCode: CategoryCode;
  /** age in whole years, computed as assessment year − year of manufacture (workbook convention) */
  ageYears: number;
  extraDepreciationPct: number;
  /** Which tax components the quoted total contains. "duty_excise_vat" matches the workbook's Previously Registered grand total. */
  totalComponents: TotalComponents;
  /** Only set when the workbook has no depreciation band for this age and the user explicitly assumes one. */
  assumedDepreciationPct?: number | null;
  /** Set when the reference total is a rounded figure; produces a CRSP uncertainty range. */
  isRounded?: boolean;
  roundingPrecision?: number | null;
}

export interface ReverseStep {
  key: string;
  label: string;
  formula: string;
  value: number;
}

export interface ReverseResult {
  chain: TaxChain;
  totalComponents: TotalComponents;
  standardDepreciationPct: number;
  depreciationLabel: string;
  depreciationRuleId: string | null;
  extraDepreciationPct: number;
  customsValueKes: number;
  taxesFactor: number;
  fixedTaxesKes: number;
  /** CRSP implied by working the workbook formulas backwards. */
  impliedCrspKes: number;
  /** When the quoted total is rounded: CRSP range implied by (total ± precision/2). */
  roundingRange: { minKes: number; maxKes: number } | null;
  steps: ReverseStep[];
  warnings: string[];
  missingInputs: string[];
  forwardVerification: {
    recalculatedTaxesKes: number;
    differenceKes: number;
    toleranceKes: number;
    withinTolerance: boolean;
  };
  /** Suggested confidence - never CONFIRMED on forward verification alone. */
  suggestedConfidence: ConfidenceLevel;
}

export interface CalibrationReference {
  referenceId: string;
  manufacturingYear: number;
  impliedCrspKes: number;
  isRounded: boolean;
  confidence: ConfidenceLevel;
  weight?: number;
}

export type CalibrationMethod = "mean" | "median" | "weighted" | "model_year";

export interface CalibrationReport {
  references: CalibrationReference[];
  count: number;
  meanKes: number;
  medianKes: number;
  minKes: number;
  maxKes: number;
  standardDeviationKes: number;
  spreadPct: number;
  tolerancePct: number;
  outliers: CalibrationReference[];
  status: "consistent" | "inconsistent";
  byYear: { manufacturingYear: number; impliedCrspKes: number; referenceIds: string[] }[];
  methods: Record<Exclude<CalibrationMethod, "model_year">, number> & { model_year: number | null };
  recommendedMethod: CalibrationMethod;
  requiresUserApproval: true;
  warnings: string[];
}

export interface EstimateYearResult {
  manufacturingYear: number;
  ageYears: number;
  standardDepreciationPct: number;
  depreciationLabel: string;
  depreciationDefined: boolean;
  extraDepreciationPct: number;
  crspKes: number;
  estimatedTaxesKes: number;
  warnings: string[];
}

export type CrspSource = "calibrated" | "model_year" | "manual";

export interface EstimateInput {
  approvedCrspKes: number;
  crspSource: CrspSource;
  importType: ImportType;
  taxCategoryCode: CategoryCode;
  assessmentYear: number;
  manufacturingYears: number[];
  extraDepreciationPct: number;
  depRules: DepreciationRule[];
  taxRules: TaxRule[];
}
