import type { LineItem, TaxRule } from "./types";

/**
 * Customs value exactly as computed by TEMPLATE 2025:
 *   ((CRSP / d1) * (1 - depreciation) / d2 / d3 ...) * (1 - extra depreciation)
 * The divisor chain is stored per category in tax_rules.customs_divisors.
 */
export function customsValue(
  rule: TaxRule,
  crsp: number,
  depreciationRate: number,
  extraDepreciation: number,
): LineItem {
  const divisors = rule.customs_divisors.map(Number);
  const [first, ...rest] = divisors;
  let value = (crsp / (first ?? 1)) * (1 - depreciationRate);
  for (const d of rest) value = value / d;
  value = value * (1 - extraDepreciation);

  const chain = divisors.join(" / ");
  return {
    key: "customs_value",
    label: "Customs value",
    base: crsp,
    baseLabel: "CRSP (KES)",
    rate: null,
    fixedAmount: null,
    formula: `((CRSP / ${first}) * (1 - ${depreciationRate}) / ${rest.join(" / ") || "1"}) * (1 - ${extraDepreciation})  [divisor chain ${chain}]`,
    result: value,
    sourceRuleId: rule.id,
    source: rule.source,
    verificationStatus: rule.verification_status,
  };
}
