import type { LineItem, TaxRule } from "./types";

/** Railway Development Levy = customs value * rate (TEMPLATE 2025). */
export function rdl(rule: TaxRule, customs: number): LineItem {
  const rate = Number(rule.rate ?? 0);
  return {
    key: "rdl",
    label: rule.name,
    base: customs,
    baseLabel: "Customs value",
    rate,
    fixedAmount: null,
    formula: `customs value * ${(rate * 100).toFixed(2)}%`,
    result: customs * rate,
    sourceRuleId: rule.id,
    source: rule.source,
    verificationStatus: rule.verification_status,
  };
}
