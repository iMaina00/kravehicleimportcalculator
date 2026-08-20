import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const categoryCodes = [
  "UNDER_1500CC",
  "OVER_1500CC",
  "LARGE_ENGINE",
  "ELECTRIC_PASSENGER",
  "SCHOOL_BUS_PUBLIC",
  "PRIME_MOVER",
  "TRAILER",
  "AMBULANCE",
  "MOTORCYCLE",
  "SPECIAL_PURPOSE",
  "HEAVY_MACHINERY",
] as const;

const searchSchema = z.object({
  query: z.string().max(120).default(""),
  recordType: z.enum(["vehicle", "motorcycle", "machinery"]).default("vehicle"),
  fuel: z.string().max(40).nullable().optional(),
  bodyType: z.string().max(60).nullable().optional(),
  transmission: z.string().max(40).nullable().optional(),
  drive: z.string().max(40).nullable().optional(),
  engineMin: z.number().int().nonnegative().nullable().optional(),
  engineMax: z.number().int().nonnegative().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export const searchRecords = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadActiveRuleSet, publicClient } = await import("@/lib/rules.server");
    const { queryTokens, normalizeQuery } = await import("@/lib/search/normalize");
    const supabase = publicClient();
    const rules = await loadActiveRuleSet();
    const datasetId = rules.datasetId!;
    const q = normalizeQuery(data.query);
    const tokens = queryTokens(data.query);

    if (data.recordType === "motorcycle") {
      const { data: rows, error } = await supabase.rpc("search_motorcycles", {
        p_dataset: datasetId,
        p_query: q,
        p_tokens: tokens,
        p_limit: data.limit,
      });
      if (error) throw new Error(error.message);
      return { records: rows ?? [], recordType: data.recordType, datasetId };
    }
    if (data.recordType === "machinery") {
      const { data: rows, error } = await supabase.rpc("search_machinery", {
        p_dataset: datasetId,
        p_query: q,
        p_tokens: tokens,
        p_limit: data.limit,
      });
      if (error) throw new Error(error.message);
      return { records: rows ?? [], recordType: data.recordType, datasetId };
    }

    const { data: rows, error } = await supabase.rpc("search_vehicles", {
      p_dataset: datasetId,
      p_query: q,
      p_tokens: tokens,
      p_fuel: data.fuel ?? undefined,
      p_body_type: data.bodyType ?? undefined,
      p_transmission: data.transmission ?? undefined,
      p_drive: data.drive ?? undefined,
      p_engine_min: data.engineMin ?? undefined,
      p_engine_max: data.engineMax ?? undefined,
      p_limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { records: rows ?? [], recordType: data.recordType, datasetId };
  });

const calcSchema = z.object({
  vehicle: z.object({
    id: z.string().uuid().nullable().optional(),
    make: z.string().max(80).nullable().optional(),
    model: z.string().max(160).nullable().optional(),
    engineCapacityCc: z.number().int().nullable().optional(),
    fuel: z.string().max(40).nullable().optional(),
    bodyType: z.string().max(80).nullable().optional(),
    crspKes: z.number().positive().max(1_000_000_000),
    categoryOverride: z.enum(categoryCodes).nullable().optional(),
    recordType: z.enum(["vehicle", "motorcycle", "machinery"]).optional(),
  }),
  importType: z.enum(["direct", "previously_registered"]),
  yearOfManufacture: z.number().int().min(1950).max(2100),
  importDate: z.string().min(4).max(30),
  purchasePrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(6).default("KES"),
  freight: z.number().nonnegative().nullable().optional(),
  insurance: z.number().nonnegative().nullable().optional(),
  otherCosts: z.number().nonnegative().nullable().optional(),
  extraDepreciation: z.number().min(0).max(1).nullable().optional(),
});

export const calculateTaxes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => calcSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadActiveRuleSet } = await import("@/lib/rules.server");
    const { calculateImportTaxes } = await import("@/lib/calculator/calculateImportTaxes");
    const rules = await loadActiveRuleSet();
    const result = calculateImportTaxes(data, rules);
    return {
      result,
      meta: {
        datasetName: rules.datasetName ?? null,
        taxRuleVersionName: rules.taxRuleVersionName ?? null,
      },
    };
  });

export const getRuleReference = createServerFn({ method: "GET" }).handler(async () => {
  const { loadActiveRuleSet } = await import("@/lib/rules.server");
  const rules = await loadActiveRuleSet();
  return {
    datasetName: rules.datasetName ?? null,
    taxRuleVersionName: rules.taxRuleVersionName ?? null,
    taxRules: rules.taxRules,
    depreciationRules: rules.depreciationRules,
    exchangeRates: rules.exchangeRates,
  };
});
