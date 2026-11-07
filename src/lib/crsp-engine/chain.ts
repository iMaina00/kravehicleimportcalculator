import type { ImportType, TaxRule, TaxType } from "@/lib/calculator/types";
import type { TaxChain, TotalComponents } from "./types";

const TAX_TYPES: TaxType[] = ["import_duty", "excise", "vat", "rdl", "idf"];

/**
 * Extracts the workbook tax chain (rates + divisor chain) for one category and
 * import type from the active tax rules. Nothing is invented: a missing rule is
 * reported, never defaulted.
 */
export function buildTaxChain(
  taxRules: TaxRule[],
  categoryCode: TaxChain["categoryCode"],
  importType: ImportType,
): { chain: TaxChain | null; missingRules: string[] } {
  const missingRules: string[] = [];
  const picked = new Map<TaxType, TaxRule>();
  for (const taxType of TAX_TYPES) {
    const rule = taxRules.find(
      (r) => r.category_code === categoryCode && r.import_type === importType && r.tax_type === taxType,
    );
    if (rule) picked.set(taxType, rule);
    else missingRules.push(`No ${taxType} rule for category ${categoryCode} / ${importType} in the active tax-rule version.`);
  }

  const customsRule = picked.get("customs_value");
  if (!customsRule) missingRules.push(`No customs_value rule for category ${categoryCode} / ${importType}.`);
  if (missingRules.length > 0) return { chain: null, missingRules };

  const chain: TaxChain = {
    categoryCode,
    importType,
    importDutyRate: Number(picked.get("import_duty")?.rate ?? 0),
    exciseRate: picked.get("excise")?.rate != null ? Number(picked.get("excise")!.rate) : null,
    exciseFixedKes:
      picked.get("excise")?.fixed_amount != null ? Number(picked.get("excise")!.fixed_amount) : null,
    vatRate: Number(picked.get("vat")?.rate ?? 0),
    rdlRate: Number(picked.get("rdl")?.rate ?? 0),
    idfRate: Number(picked.get("idf")?.rate ?? 0),
    divisors: (customsRule?.customs_divisors ?? []).map(Number),
    ruleSources: [...picked.values()].map((r) => ({
      taxType: r.tax_type,
      ruleId: r.id,
      source: r.source,
      verificationStatus: r.verification_status,
    })),
  };
  return { chain, missingRules: [] };
}

export interface ChainTotals {
  variableFactor: number;
  fixedKes: number;
}

/**
 * Total taxes as a linear function of the customs value:
 *   total = customsValue * variableFactor + fixedKes
 * Percentage excise: ED = (CV + ID) * ex. Fixed-amount excise (e.g. motorcycles):
 * ED = fixed. VAT = (CV + ID + ED) * vat. RDL and IDF are charged on CV only.
 * `components` selects which components the quoted total contains
 * ("all" = the direct-import tabulation; "duty_excise_vat" = the workbook's
 * Previously Registered grand total).
 */
export function chainTotals(chain: TaxChain, components: TotalComponents): ChainTotals {
  const id = chain.importDutyRate;
  const vatRate = chain.vatRate;
  const includeLevies = components === "all";

  const exciseFactor = chain.exciseFixedKes === null && chain.exciseRate !== null ? (1 + id) * chain.exciseRate : 0;
  // VAT base = CV + ID + ED
  let factor = id + exciseFactor + (1 + id + exciseFactor) * vatRate;
  if (includeLevies) factor += chain.rdlRate + chain.idfRate;

  let fixed = 0;
  if (chain.exciseFixedKes !== null) {
    // ED = fixed; VAT applies on (CV + ID + fixed).
    fixed = chain.exciseFixedKes * (1 + vatRate);
  }

  return { variableFactor: factor, fixedKes: fixed };
}

/** Forward calculation: taxes for a given customs value through the chain. */
export function forwardTaxes(chain: TaxChain, customsValue: number, components: TotalComponents): number {
  const { variableFactor, fixedKes } = chainTotals(chain, components);
  return customsValue * variableFactor + fixedKes;
}

/**
 * Reverse calculation: the customs value implied by a total tax figure.
 * Only exact when every applicable component is in the total - anything else is
 * reported by the caller as a warning, never silently accepted.
 */
export function reverseCustomsValue(
  chain: TaxChain,
  totalTaxesKes: number,
  components: TotalComponents,
): { customsValueKes: number } {
  const { variableFactor, fixedKes } = chainTotals(chain, components);
  return { customsValueKes: (totalTaxesKes - fixedKes) / variableFactor };
}

/**
 * The CRSP implied by a customs value, inverting the workbook customs-value
 * formula: CV = (CRSP/d1) * (1 - dep) / d2 / d3 ... * (1 - extra).
 */
export function impliedCrspFromCustomsValue(
  chain: TaxChain,
  customsValueKes: number,
  depreciationRate: number,
  extraDepreciationRate: number,
): number {
  const product = chain.divisors.reduce((acc, d) => acc * d, 1);
  return (customsValueKes * product) / ((1 - depreciationRate) * (1 - extraDepreciationRate));
}

/** Forward customs value from a CRSP (same formula as the workbook). */
export function customsValueFromCrsp(
  chain: TaxChain,
  crspKes: number,
  depreciationRate: number,
  extraDepreciationRate: number,
): number {
  const [first, ...rest] = chain.divisors;
  let value = (crspKes / (first ?? 1)) * (1 - depreciationRate);
  for (const d of rest) value = value / d;
  return value * (1 - extraDepreciationRate);
}
