import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DepreciationRule, ExchangeRate, RuleSet, TaxRule } from "@/lib/calculator/types";

/** Publishable-key client for the public, read-only reference data. */
export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Loads the active dataset + rule versions so every calculation is reproducible. */
export async function loadActiveRuleSet(): Promise<RuleSet> {
  const supabase = publicClient();

  const [datasets, taxVersions, depVersions, fxVersions] = await Promise.all([
    supabase.from("vehicle_datasets").select("id, name, effective_date").in("status", ["published", "active"]).order("effective_date", { ascending: false }).limit(1),
    supabase.from("tax_rule_versions").select("id, name, effective_date").in("status", ["published", "active"]).order("effective_date", { ascending: false }).limit(1),
    supabase.from("depreciation_rule_versions").select("id, name, effective_date").in("status", ["published", "active"]).order("effective_date", { ascending: false }).limit(1),
    supabase.from("exchange_rate_versions").select("id, name, effective_date").in("status", ["published", "active"]).order("effective_date", { ascending: false }).limit(1),
  ]);

  const datasetId = datasets.data?.[0]?.id ?? null;
  const taxRuleVersionId = taxVersions.data?.[0]?.id ?? null;
  const depreciationVersionId = depVersions.data?.[0]?.id ?? null;
  const exchangeRateVersionId = fxVersions.data?.[0]?.id ?? null;

  if (!datasetId || !taxRuleVersionId || !depreciationVersionId) {
    throw new Error("No active dataset or rule version is published.");
  }

  const [taxRules, depRules, fxRates] = await Promise.all([
    supabase.from("tax_rules").select("*").eq("version_id", taxRuleVersionId).order("sort_order"),
    supabase.from("depreciation_rules").select("*").eq("version_id", depreciationVersionId).order("sort_order"),
    exchangeRateVersionId
      ? supabase.from("exchange_rates").select("*").eq("version_id", exchangeRateVersionId)
      : Promise.resolve({ data: [] as ExchangeRate[], error: null }),
  ]);

  if (taxRules.error) throw taxRules.error;
  if (depRules.error) throw depRules.error;

  return {
    datasetId,
    datasetName: datasets.data?.[0]?.name ?? null,
    taxRuleVersionId,
    taxRuleVersionName: taxVersions.data?.[0]?.name ?? null,
    depreciationVersionId,
    exchangeRateVersionId,
    taxRules: (taxRules.data ?? []) as unknown as TaxRule[],
    depreciationRules: (depRules.data ?? []) as unknown as DepreciationRule[],
    exchangeRates: ((fxRates.data ?? []) as unknown as ExchangeRate[]),
  };
}
