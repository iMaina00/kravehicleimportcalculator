export type ImportType = "direct" | "previously_registered";

export type CategoryCode =
  | "UNDER_1500CC"
  | "OVER_1500CC"
  | "LARGE_ENGINE"
  | "ELECTRIC_PASSENGER"
  | "SCHOOL_BUS_PUBLIC"
  | "PRIME_MOVER"
  | "TRAILER"
  | "AMBULANCE"
  | "MOTORCYCLE"
  | "SPECIAL_PURPOSE"
  | "HEAVY_MACHINERY";

export type TaxType =
  | "customs_value"
  | "import_duty"
  | "excise"
  | "vat"
  | "rdl"
  | "idf";

export interface TaxRule {
  id: string;
  version_id: string;
  category_code: CategoryCode;
  import_type: ImportType;
  name: string;
  tax_type: TaxType;
  rate: number | null;
  fixed_amount: number | null;
  formula: string;
  calculation_base: string;
  customs_divisors: number[];
  source: string | null;
  verification_status: string;
}

export interface DepreciationRule {
  id: string;
  version_id: string;
  import_type: ImportType;
  label: string;
  min_years: number;
  max_years: number | null;
  rate: number;
  source: string | null;
}

export interface ExchangeRate {
  currency: string;
  rate_to_kes: number;
}

export interface RuleSet {
  taxRuleVersionId: string;
  depreciationVersionId: string;
  exchangeRateVersionId: string;
  datasetId: string | null;
  taxRules: TaxRule[];
  depreciationRules: DepreciationRule[];
  exchangeRates: ExchangeRate[];
}

/** Vehicle facts used for classification and valuation. */
export interface VehicleInput {
  id?: string | null;
  make?: string | null;
  model?: string | null;
  engineCapacityCc?: number | null;
  fuel?: string | null;
  bodyType?: string | null;
  crspKes: number;
  /** Overrides automatic classification when the user knows the category. */
  categoryOverride?: CategoryCode | null;
  /** "vehicle" | "motorcycle" | "machinery" — which source table the record came from. */
  recordType?: "vehicle" | "motorcycle" | "machinery";
}

export interface CalculationInput {
  vehicle: VehicleInput;
  importType: ImportType;
  yearOfManufacture: number;
  firstRegistrationYear?: number | null;
  importDate: string; // ISO date
  purchasePrice?: number | null;
  currency: string;
  freight?: number | null;
  insurance?: number | null;
  otherCosts?: number | null;
  /** Extra depreciation fraction (0-1). The workbook exposes this cell but states no rule for it. */
  extraDepreciation?: number | null;
}

export interface LineItem {
  key: string;
  label: string;
  base: number;
  baseLabel: string;
  rate: number | null;
  fixedAmount: number | null;
  formula: string;
  result: number;
  sourceRuleId: string | null;
  source: string | null;
  verificationStatus: string;
}

export interface CalculationResult {
  vehicle: VehicleInput;
  category: { code: CategoryCode; reason: string };
  importType: ImportType;
  ageYears: number;
  crspKes: number;
  depreciation: {
    rate: number;
    percentage: number;
    amount: number;
    ruleId: string | null;
    label: string;
    source: string | null;
  };
  extraDepreciation: number;
  customsValue: LineItem;
  importDuty: LineItem;
  exciseDuty: LineItem;
  vat: LineItem;
  rdl: LineItem;
  idf: LineItem;
  totalGovernmentTaxes: number;
  /** Sum used by the "Previously Registered" columns of the workbook (duty + excise + VAT only). */
  workbookPreviouslyRegisteredTotal: number;
  otherImportCosts: {
    purchasePriceKes: number;
    freightKes: number;
    insuranceKes: number;
    otherKes: number;
    total: number;
    currency: string;
    exchangeRateToKes: number | null;
  };
  estimatedLandedCost: number;
  versions: {
    datasetId: string | null;
    taxRuleVersionId: string;
    depreciationVersionId: string;
    exchangeRateVersionId: string;
  };
  warnings: string[];
}
