import type { LineItem, TaxRule } from "./types";

/** VAT = (customs value + import duty + excise) * rate (TEMPLATE 2025). */
export function vat(rule: TaxRule, customs: number, duty: number, excise: number): LineItem {
  const base = customs + duty + excise;
  const rate = Number(rule.rate ?? 0);
  return {
    key: "vat",
    label: rule.name,
    base,
    baseLabel: "Customs value + import duty + excise duty",
    rate,
    fixedAmount: null,
    formula: `(customs value + import duty + excise duty) * ${(rate * 100).toFixed(2)}%`,
    result: base * rate,
    sourceRuleId: rule.id,
    source: rule.source,
    verificationStatus: rule.verification_status,
  };
}
