import type { CalculationInput, ExchangeRate } from "./types";

export interface OtherCosts {
  purchasePriceKes: number;
  freightKes: number;
  insuranceKes: number;
  otherKes: number;
  total: number;
  currency: string;
  exchangeRateToKes: number | null;
  warnings: string[];
}

/** Converts the user's non-tax import costs to KES using the versioned rate table. */
export function otherImportCosts(input: CalculationInput, rates: ExchangeRate[]): OtherCosts {
  const currency = input.currency.toUpperCase();
  const rate = rates.find((r) => r.currency.toUpperCase() === currency);
  const warnings: string[] = [];
  const factor = rate ? Number(rate.rate_to_kes) : null;
  if (factor === null) {
    warnings.push(
      `REQUIRES VERIFICATION: no exchange rate for ${currency} in the active exchange-rate version. Purchase price, freight, insurance and other costs were excluded from the landed cost.`,
    );
  }
  const conv = (v: number | null | undefined) => (factor === null ? 0 : (v ?? 0) * factor);
  const purchasePriceKes = conv(input.purchasePrice);
  const freightKes = conv(input.freight);
  const insuranceKes = conv(input.insurance);
  const otherKes = conv(input.otherCosts);
  return {
    purchasePriceKes,
    freightKes,
    insuranceKes,
    otherKes,
    total: purchasePriceKes + freightKes + insuranceKes + otherKes,
    currency,
    exchangeRateToKes: factor,
    warnings,
  };
}

/** Estimated landed cost = total government taxes + other import costs. */
export function estimatedLandedCost(totalTaxes: number, otherCostsTotal: number): number {
  return totalTaxes + otherCostsTotal;
}
