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
      AND (p_field IN ('make','model') OR p_models IS NULL OR array_length(p_models,1) IS NULL OR v.model_normalized = ANY(p_models))
      AND (p_field IN ('make','model','trim') OR p_trims IS NULL OR array_length(p_trims,1) IS NULL OR v.trim_normalized = ANY(p_trims))
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