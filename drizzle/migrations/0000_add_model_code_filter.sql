DROP FUNCTION IF EXISTS public.crsp_search(uuid, text, text[], text[], text[], text[], text[], text[], text[], integer[], integer, integer, numeric, numeric, text, integer, integer);

CREATE OR REPLACE FUNCTION public.crsp_search(p_dataset uuid, p_query text DEFAULT NULL::text, p_makes text[] DEFAULT NULL::text[], p_models text[] DEFAULT NULL::text[], p_trims text[] DEFAULT NULL::text[], p_fuels text[] DEFAULT NULL::text[], p_transmissions text[] DEFAULT NULL::text[], p_drives text[] DEFAULT NULL::text[], p_bodies text[] DEFAULT NULL::text[], p_seats integer[] DEFAULT NULL::integer[], p_cc_min integer DEFAULT NULL::integer, p_cc_max integer DEFAULT NULL::integer, p_crsp_min numeric DEFAULT NULL::numeric, p_crsp_max numeric DEFAULT NULL::numeric, p_sort text DEFAULT 'relevance'::text, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0, p_model_numbers text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, make text, model text, model_number text, trim_normalized text, model_normalized text, transmission text, transmission_normalized text, drive_configuration text, drive_normalized text, engine_capacity_raw text, engine_capacity_cc integer, engine_kwh numeric, engine_hp numeric, body_type text, body_normalized text, gvw text, seating text, seating_count integer, fuel_raw text, fuel_normalized text, fuel_label text, crsp_kes numeric, flags text[], source_row integer, score real, total_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT public.crsp_norm(p_query) AS nq),
  base AS (
    SELECT v.*, (SELECT nq FROM q) AS nq
    FROM public.vehicles v
    WHERE v.dataset_id = p_dataset
      AND (p_makes IS NULL OR array_length(p_makes,1) IS NULL OR v.make = ANY(p_makes))
      AND (p_models IS NULL OR array_length(p_models,1) IS NULL OR v.model_normalized = ANY(p_models))
      AND (p_trims IS NULL OR array_length(p_trims,1) IS NULL OR v.trim_normalized = ANY(p_trims))
      AND (p_model_numbers IS NULL OR array_length(p_model_numbers,1) IS NULL OR v.model_number = ANY(p_model_numbers))
      AND (p_fuels IS NULL OR array_length(p_fuels,1) IS NULL OR v.fuel_label = ANY(p_fuels))
      AND (p_transmissions IS NULL OR array_length(p_transmissions,1) IS NULL OR v.transmission_normalized = ANY(p_transmissions))
      AND (p_drives IS NULL OR array_length(p_drives,1) IS NULL OR v.drive_normalized = ANY(p_drives))
      AND (p_bodies IS NULL OR array_length(p_bodies,1) IS NULL OR v.body_normalized = ANY(p_bodies))
      AND (p_seats IS NULL OR array_length(p_seats,1) IS NULL OR v.seating_count = ANY(p_seats))
      AND (p_cc_min IS NULL OR (v.engine_capacity_cc IS NOT NULL AND v.engine_capacity_cc >= p_cc_min))
      AND (p_cc_max IS NULL OR (v.engine_capacity_cc IS NOT NULL AND v.engine_capacity_cc <= p_cc_max))
      AND (p_crsp_min IS NULL OR v.crsp_kes >= p_crsp_min)
      AND (p_crsp_max IS NULL OR v.crsp_kes <= p_crsp_max)
  ),
  scored AS (
    SELECT b.*, (
      CASE WHEN b.nq IS NULL THEN 0
        WHEN public.crsp_norm(b.model_number) = b.nq THEN 1000
        WHEN public.crsp_norm(coalesce(b.make,'') || ' ' || coalesce(b.model,'')) = b.nq THEN 900
        WHEN b.search_blob = b.nq THEN 850
        WHEN b.search_blob LIKE b.nq || '%' THEN 700
        WHEN public.crsp_norm(b.model) LIKE b.nq || '%' THEN 650
        WHEN b.search_blob LIKE '%' || b.nq || '%' THEN 500
        WHEN (SELECT bool_and(b.search_blob LIKE '%' || t || '%')
              FROM unnest(string_to_array(b.nq,' ')) t) THEN 400
        ELSE similarity(b.search_blob, b.nq) * 100 END)::real AS score
    FROM base b
  ),
  filtered AS (
    SELECT * FROM scored WHERE nq IS NULL OR score >= 30
  ),
  counted AS (SELECT count(*) AS n FROM filtered)
  SELECT f.id, f.make, f.model, f.model_number, f.trim_normalized, f.model_normalized,
         f.transmission, f.transmission_normalized, f.drive_configuration, f.drive_normalized,
         f.engine_capacity_raw, f.engine_capacity_cc, f.engine_kwh, f.engine_hp,
         f.body_type, f.body_normalized, f.gvw, f.seating, f.seating_count,
         f.fuel_raw, f.fuel_normalized, f.fuel_label, f.crsp_kes, f.flags, f.source_row,
         f.score, (SELECT n FROM counted)
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort = 'crsp_asc' THEN f.crsp_kes END ASC NULLS LAST,
    CASE WHEN p_sort = 'crsp_desc' THEN f.crsp_kes END DESC NULLS LAST,
    CASE WHEN p_sort = 'relevance' THEN f.score END DESC NULLS LAST,
    CASE WHEN p_sort IN ('make_asc','model_asc','relevance','crsp_asc','crsp_desc')
         AND p_sort = 'model_asc' THEN f.model END ASC NULLS LAST,
    f.make ASC NULLS LAST, f.model ASC NULLS LAST, f.source_row ASC
  LIMIT greatest(coalesce(p_limit,25),1) OFFSET greatest(coalesce(p_offset,0),0)
$function$;

GRANT EXECUTE ON FUNCTION public.crsp_search(uuid, text, text[], text[], text[], text[], text[], text[], text[], integer[], integer, integer, numeric, numeric, text, integer, integer, text[]) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crsp_filter_options(p_dataset uuid, p_field text, p_query text DEFAULT NULL::text, p_makes text[] DEFAULT NULL::text[], p_models text[] DEFAULT NULL::text[], p_trims text[] DEFAULT NULL::text[], p_limit integer DEFAULT 50)
 RETURNS TABLE(value text, record_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      CASE p_field
        WHEN 'make' THEN v.make
        WHEN 'model' THEN v.model_normalized
        WHEN 'trim' THEN v.trim_normalized
        WHEN 'model_code' THEN v.model_number
        WHEN 'fuel' THEN v.fuel_label
        WHEN 'transmission' THEN v.transmission_normalized
        WHEN 'drive' THEN v.drive_normalized
        WHEN 'body' THEN v.body_normalized
        WHEN 'seating' THEN v.seating_count::text
      END AS value
    FROM public.vehicles v
    WHERE v.dataset_id = p_dataset
      AND (p_field = 'make' OR p_makes IS NULL OR array_length(p_makes,1) IS NULL OR v.make = ANY(p_makes))
      AND (p_field IN ('make','model','model_code') OR p_models IS NULL OR array_length(p_models,1) IS NULL OR v.model_normalized = ANY(p_models))
      AND (p_field IN ('make','model','trim','model_code') OR p_trims IS NULL OR array_length(p_trims,1) IS NULL OR v.trim_normalized = ANY(p_trims))
  )
  SELECT b.value, count(*) AS record_count
  FROM base b
  WHERE b.value IS NOT NULL AND b.value <> ''
    AND (p_query IS NULL OR btrim(p_query) = '' OR b.value ILIKE '%' || btrim(p_query) || '%')
  GROUP BY b.value
  ORDER BY
    CASE WHEN p_query IS NULL OR btrim(p_query) = '' THEN 0
         WHEN upper(b.value) = upper(btrim(p_query)) THEN 0
         WHEN b.value ILIKE btrim(p_query) || '%' THEN 1
         ELSE 2 END,
    CASE WHEN p_field = 'seating' THEN lpad(b.value, 4, '0') ELSE b.value END ASC
  LIMIT greatest(coalesce(p_limit,50),1)
$function$;

GRANT EXECUTE ON FUNCTION public.crsp_filter_options(uuid, text, text, text[], text[], text[], integer) TO anon, authenticated, service_role;