CREATE OR REPLACE FUNCTION public.crsp_options(
  p_dataset uuid,
  p_record_type text,
  p_field text,
  p_query text DEFAULT '',
  p_make text DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(value text, record_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_table text;
  v_col text;
  v_q text := coalesce(trim(p_query), '');
BEGIN
  v_table := CASE p_record_type
    WHEN 'vehicle' THEN 'vehicles'
    WHEN 'motorcycle' THEN 'motorcycles'
    WHEN 'machinery' THEN 'machinery'
    ELSE NULL END;
  IF v_table IS NULL THEN RAISE EXCEPTION 'invalid record type'; END IF;

  v_col := CASE p_field
    WHEN 'make' THEN 'make'
    WHEN 'model' THEN 'model'
    WHEN 'model_number' THEN 'model_number'
    ELSE NULL END;
  IF v_col IS NULL THEN RAISE EXCEPTION 'invalid field'; END IF;
  IF v_col = 'model_number' AND v_table = 'machinery' THEN RAISE EXCEPTION 'invalid field for machinery'; END IF;

  RETURN QUERY EXECUTE format($f$
    SELECT t.%1$I::text AS value, count(*)::bigint AS record_count
    FROM public.%2$I t
    WHERE t.dataset_id = $1
      AND t.%1$I IS NOT NULL AND btrim(t.%1$I) <> ''
      AND ($2 = '' OR t.%1$I ILIKE '%%' || $2 || '%%')
      AND ($3 IS NULL OR t.make = $3)
      AND ($4 IS NULL OR t.model = $4)
    GROUP BY t.%1$I
    ORDER BY
      CASE
        WHEN $2 = '' THEN 3
        WHEN upper(t.%1$I) = upper($2) THEN 0
        WHEN t.%1$I ILIKE $2 || '%%' THEN 1
        ELSE 2
      END,
      t.%1$I ASC
    LIMIT $5
  $f$, v_col, v_table)
  USING p_dataset, v_q, p_make, p_model, greatest(1, least(p_limit, 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.crsp_options(uuid, text, text, text, text, text, integer) TO anon, authenticated, service_role;