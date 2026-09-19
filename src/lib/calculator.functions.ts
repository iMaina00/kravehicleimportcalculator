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

type SearchRow = Record<string, string | number | boolean | null | string[]>;

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
      return { records: (rows ?? []) as unknown as SearchRow[], recordType: data.recordType, datasetId };
    }
    if (data.recordType === "machinery") {
      const { data: rows, error } = await supabase.rpc("search_machinery", {
        p_dataset: datasetId,
        p_query: q,
        p_tokens: tokens,
        p_limit: data.limit,
      });
      if (error) throw new Error(error.message);
      return { records: (rows ?? []) as unknown as SearchRow[], recordType: data.recordType, datasetId };
    }

    const args: Record<string, unknown> = {
      p_dataset: datasetId,
      p_query: q,
      p_tokens: tokens,
      p_limit: data.limit,
    };
    if (data.fuel) args["p_fuel"] = data.fuel;
    if (data.bodyType) args["p_body_type"] = data.bodyType;
    if (data.transmission) args["p_transmission"] = data.transmission;
    if (data.drive) args["p_drive"] = data.drive;
    if (data.engineMin != null) args["p_engine_min"] = data.engineMin;
    if (data.engineMax != null) args["p_engine_max"] = data.engineMax;

    const { data: rows, error } = await (
      supabase.rpc as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
    )("search_vehicles", args);
    if (error) throw new Error(error.message);
    return { records: (rows ?? []) as unknown as SearchRow[], recordType: data.recordType, datasetId };
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
  exchangeRateOverride: z.number().positive().max(100000).nullable().optional(),
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

const optionsSchema = z.object({
  recordType: z.enum(["vehicle", "motorcycle", "machinery"]).default("vehicle"),
  field: z.enum(["make", "model", "model_number"]),
  query: z.string().max(80).default(""),
  make: z.string().max(120).nullable().optional(),
  model: z.string().max(200).nullable().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listCrspOptions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => optionsSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadActiveRuleSet, publicClient } = await import("@/lib/rules.server");
    const supabase = publicClient();
    const rules = await loadActiveRuleSet();
    const { data: rows, error } = await (
      supabase.rpc as unknown as (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
    )("crsp_options", {
      p_dataset: rules.datasetId!,
      p_record_type: data.recordType,
      p_field: data.field,
      p_query: data.query,
      p_make: data.make ?? null,
      p_model: data.model ?? null,
      p_limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { options: (rows ?? []) as Array<{ value: string; record_count: number }> };
  });

const recordsSchema = z.object({
  recordType: z.enum(["vehicle", "motorcycle", "machinery"]).default("vehicle"),
  make: z.string().min(1).max(120),
  model: z.string().max(200).nullable().optional(),
  modelNumber: z.string().max(200).nullable().optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

/** Returns the exact CRSP rows (all original columns) for a make/model/model number selection. */
export const findCrspRecords = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordsSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadActiveRuleSet, publicClient } = await import("@/lib/rules.server");
    const supabase = publicClient();
    const rules = await loadActiveRuleSet();
    const table = data.recordType === "motorcycle" ? "motorcycles" : data.recordType === "machinery" ? "machinery" : "vehicles";
    let q = supabase
      .from(table)
      .select("*")
      .eq("dataset_id", rules.datasetId!)
      .eq("make", data.make)
      .limit(data.limit);
    if (data.model) q = q.eq("model", data.model);
    if (data.modelNumber)
      q = (q as unknown as { eq: (c: string, v: string) => typeof q }).eq("model_number", data.modelNumber);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { records: (rows ?? []) as unknown as SearchRow[], recordType: data.recordType };
  });

type RpcFn = (
  fn: string,
  params: Record<string, unknown>,
) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;

const strList = z.array(z.string().max(200)).max(50).default([]);

const crspSearchSchema = z.object({
  query: z.string().max(120).default(""),
  makes: strList,
  models: strList,
  trims: strList,
  fuels: strList,
  transmissions: strList,
  drives: strList,
  bodies: strList,
  seats: z.array(z.number().int().min(0).max(200)).max(20).default([]),
  ccMin: z.number().int().min(0).max(30000).nullable().default(null),
  ccMax: z.number().int().min(0).max(30000).nullable().default(null),
  crspMin: z.number().min(0).max(1_000_000_000).nullable().default(null),
  crspMax: z.number().min(0).max(1_000_000_000).nullable().default(null),
  sort: z.enum(["relevance", "crsp_asc", "crsp_desc", "make_asc", "model_asc"]).default("make_asc"),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).max(10000).default(0),
});

export type CrspSearchInput = z.input<typeof crspSearchSchema>;

/** Database-side CRSP vehicle search with dependent filters, ranking, sorting and a total count. */
export const crspSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => crspSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadActiveRuleSet, publicClient } = await import("@/lib/rules.server");
    const supabase = publicClient();
    const rules = await loadActiveRuleSet();
    const nz = <T,>(a: T[]) => (a.length ? a : null);
    const { data: rows, error } = await (supabase.rpc as unknown as RpcFn)("crsp_search", {
      p_dataset: rules.datasetId!,
      p_query: data.query.trim() || null,
      p_makes: nz(data.makes),
      p_models: nz(data.models),
      p_trims: nz(data.trims),
      p_fuels: nz(data.fuels),
      p_transmissions: nz(data.transmissions),
      p_drives: nz(data.drives),
      p_bodies: nz(data.bodies),
      p_seats: nz(data.seats),
      p_cc_min: data.ccMin,
      p_cc_max: data.ccMax,
      p_crsp_min: data.crspMin,
      p_crsp_max: data.crspMax,
      p_sort: data.sort,
      p_limit: data.limit,
      p_offset: data.offset,
    });
    if (error) throw new Error(error.message);
    const records = (rows ?? []) as unknown as SearchRow[];
    const total = records.length > 0 ? Number(records[0]!["total_count"] ?? records.length) : 0;
    return { records, total, datasetId: rules.datasetId! };
  });

const crspFilterSchema = z.object({
  field: z.enum(["make", "model", "trim", "fuel", "transmission", "drive", "body", "seating"]),
  query: z.string().max(80).default(""),
  makes: strList,
  models: strList,
  trims: strList,
  limit: z.number().int().min(1).max(200).default(50),
});

/** Dependent filter option lists (make -> model -> trim, plus the attribute facets). */
export const crspFilterOptions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => crspFilterSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadActiveRuleSet, publicClient } = await import("@/lib/rules.server");
    const supabase = publicClient();
    const rules = await loadActiveRuleSet();
    const nz = <T,>(a: T[]) => (a.length ? a : null);
    const { data: rows, error } = await (supabase.rpc as unknown as RpcFn)("crsp_filter_options", {
      p_dataset: rules.datasetId!,
      p_field: data.field,
      p_query: data.query.trim() || null,
      p_makes: nz(data.makes),
      p_models: nz(data.models),
      p_trims: nz(data.trims),
      p_limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { options: (rows ?? []) as Array<{ value: string; record_count: number }> };
  });
