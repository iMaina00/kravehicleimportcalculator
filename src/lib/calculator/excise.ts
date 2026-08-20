import type { LineItem, TaxRule } from "./types";

/**
 * Excise duty. Percentage categories use (customs value + import duty) as the
 * excise value; motorcycles use the fixed amount stated in TEMPLATE 2025!D162.
 */
export function exciseDuty(rule: TaxRule, customs: number, duty: number): LineItem {
  const exciseValue = customs + duty;
  if (rule.fixed_amount !== null && rule.fixed_amount !== undefined) {
    const fixed = Number(rule.fixed_amount);
    return {
      key: "excise",
      label: rule.name,
      base: exciseValue,
      baseLabel: "Customs value + import duty (not used: fixed amount)",
      rate: null,
      fixedAmount: fixed,
      formula: `fixed amount KES ${fixed}`,
      result: fixed,
      sourceRuleId: rule.id,
      source: rule.source,
      verificationStatus: rule.verification_status,
    };
  }
  const rate = Number(rule.rate ?? 0);
  return {
    key: "excise",
    label: rule.name,
    base: exciseValue,
    baseLabel: "Customs value + import duty",
    rate,
    fixedAmount: null,
    formula: `(customs value + import duty) * ${(rate * 100).toFixed(2)}%`,
    result: exciseValue * rate,
    sourceRuleId: rule.id,
    source: rule.source,
    verificationStatus: rule.verification_status,
  };
}
