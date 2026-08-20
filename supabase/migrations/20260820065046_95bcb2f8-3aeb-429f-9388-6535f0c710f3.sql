
ALTER TABLE public.vehicles ADD COLUMN search_compact text GENERATED ALWAYS AS (replace(coalesce(search_text,''),' ','')) STORED;
ALTER TABLE public.motorcycles ADD COLUMN search_compact text GENERATED ALWAYS AS (replace(coalesce(search_text,''),' ','')) STORED;
ALTER TABLE public.machinery ADD COLUMN search_compact text GENERATED ALWAYS AS (replace(coalesce(search_text,''),' ','')) STORED;
CREATE INDEX vehicles_compact_trgm ON public.vehicles USING gin (search_compact gin_trgm_ops);
CREATE INDEX motorcycles_compact_trgm ON public.motorcycles USING gin (search_compact gin_trgm_ops);
CREATE INDEX machinery_compact_trgm ON public.machinery USING gin (search_compact gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_vehicles(
  p_dataset uuid,
  p_query text,
  p_tokens text[],
  p_fuel text DEFAULT NULL,
  p_body_type text DEFAULT NULL,
  p_transmission text DEFAULT NULL,
  p_drive text DEFAULT NULL,
  p_engine_min integer DEFAULT NULL,
  p_engine_max integer DEFAULT NULL,
  p_limit integer DEFAULT 25
)
RETURNS TABLE (
  id uuid, make text, model text, model_number text, transmission text,
  drive_configuration text, engine_capacity_raw text, engine_capacity_cc integer,
  body_type text, gvw text, seating text, fuel_raw text, fuel_normalized text,
  crsp_kes numeric, flags text[], score real
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT v.id, v.make, v.model, v.model_number, v.transmission, v.drive_configuration,
         v.engine_capacity_raw, v.engine_capacity_cc, v.body_type, v.gvw, v.seating,
         v.fuel_raw, v.fuel_normalized, v.crsp_kes, v.flags,
         similarity(v.search_text, p_query) AS score
  FROM public.vehicles v
  WHERE v.dataset_id = p_dataset
    AND (p_tokens IS NULL OR cardinality(p_tokens) = 0
         OR v.search_compact LIKE ALL (SELECT '%' || t || '%' FROM unnest(p_tokens) t))
    AND (p_fuel IS NULL OR v.fuel_normalized = p_fuel)
    AND (p_body_type IS NULL OR upper(v.body_type) = upper(p_body_type))
    AND (p_transmission IS NULL OR upper(v.transmission) = upper(p_transmission))
    AND (p_drive IS NULL OR upper(v.drive_configuration) = upper(p_drive))
    AND (p_engine_min IS NULL OR v.engine_capacity_cc >= p_engine_min)
    AND (p_engine_max IS NULL OR v.engine_capacity_cc <= p_engine_max)
  ORDER BY similarity(v.search_text, p_query) DESC, v.make, v.model
  LIMIT LEAST(coalesce(p_limit, 25), 100);
$$;

CREATE OR REPLACE FUNCTION public.search_motorcycles(
  p_dataset uuid, p_query text, p_tokens text[], p_limit integer DEFAULT 25
)
RETURNS TABLE (
  id uuid, make text, model text, model_number text, transmission text,
  engine_capacity_raw text, engine_capacity_cc integer, seating text,
  fuel_raw text, fuel_normalized text, crsp_kes numeric, flags text[], score real
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT m.id, m.make, m.model, m.model_number, m.transmission, m.engine_capacity_raw,
         m.engine_capacity_cc, m.seating, m.fuel_raw, m.fuel_normalized, m.crsp_kes, m.flags,
         similarity(m.search_text, p_query) AS score
  FROM public.motorcycles m
  WHERE m.dataset_id = p_dataset
    AND (p_tokens IS NULL OR cardinality(p_tokens) = 0
         OR m.search_compact LIKE ALL (SELECT '%' || t || '%' FROM unnest(p_tokens) t))
  ORDER BY similarity(m.search_text, p_query) DESC, m.make, m.model
  LIMIT LEAST(coalesce(p_limit, 25), 100);
$$;

CREATE OR REPLACE FUNCTION public.search_machinery(
  p_dataset uuid, p_query text, p_tokens text[], p_limit integer DEFAULT 25
)
RETURNS TABLE (
  id uuid, make text, model text, rating_raw text, crsp_kes numeric, flags text[], score real
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT k.id, k.make, k.model, k.rating_raw, k.crsp_kes, k.flags,
         similarity(k.search_text, p_query) AS score
  FROM public.machinery k
  WHERE k.dataset_id = p_dataset
    AND (p_tokens IS NULL OR cardinality(p_tokens) = 0
         OR k.search_compact LIKE ALL (SELECT '%' || t || '%' FROM unnest(p_tokens) t))
  ORDER BY similarity(k.search_text, p_query) DESC, k.make, k.model
  LIMIT LEAST(coalesce(p_limit, 25), 100);
$$;

GRANT EXECUTE ON FUNCTION public.search_vehicles(uuid,text,text[],text,text,text,text,integer,integer,integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_motorcycles(uuid,text,text[],integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_machinery(uuid,text,text[],integer) TO anon, authenticated, service_role;
