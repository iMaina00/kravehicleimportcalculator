
-- ---------- normalization helpers ----------
CREATE OR REPLACE FUNCTION public.crsp_norm(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(btrim(regexp_replace(regexp_replace(upper(coalesce(t,'')), '[^A-Z0-9]+', ' ', 'g'), '\s+', ' ', 'g')), '')
$$;

-- base model = leading tokens up to the first "variant" token (digit-bearing or known trim marker)
CREATE OR REPLACE FUNCTION public.crsp_model_base(t text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE toks text[]; i int; out_toks text[] := '{}'; tok text;
BEGIN
  toks := string_to_array(coalesce(public.crsp_norm(t), ''), ' ');
  IF toks IS NULL OR array_length(toks,1) IS NULL THEN RETURN NULL; END IF;
  FOR i IN 1..array_length(toks,1) LOOP
    tok := toks[i];
    IF i > 1 AND (tok ~ '[0-9]' OR tok IN ('XDRIVE','SDRIVE','MDRIVE','AMG','QUATTRO','TFSI','TDI','TSI','TDCI','VTEC','LINE','SPORT','LUXURY','PREMIUM','LIMITED','EDITION','PACKAGE','HYBRID','MATIC','AWD','4WD','2WD','FWD','RWD','TURBO','DIESEL','PETROL','ELECTRIC')) THEN
      EXIT;
    END IF;
    out_toks := out_toks || tok;
  END LOOP;
  RETURN array_to_string(out_toks, ' ');
END $$;

CREATE OR REPLACE FUNCTION public.crsp_model_trim(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(btrim(substr(coalesce(public.crsp_norm(t),''), length(coalesce(public.crsp_model_base(t),'')) + 1)), '')
$$;

CREATE OR REPLACE FUNCTION public.crsp_fuel_label(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN public.crsp_norm(t) IS NULL THEN NULL
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%PLUG%' THEN 'Plug-in Hybrid'
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%HYBRID%' THEN 'Hybrid'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'L[EA]?CT?RIC|^EV$|^WEV$' THEN 'Electric'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'D[IE]{1,3}S+E+L' THEN 'Diesel'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'PETROL|GASOLINE|GASOLENE' THEN 'Petrol'
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%CNG%' THEN 'CNG'
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%LNG%' THEN 'LNG'
    ELSE 'Other' END
$$;

CREATE OR REPLACE FUNCTION public.crsp_transmission_label(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN public.crsp_norm(t) IS NULL THEN NULL
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%CVT%' THEN 'CVT'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'DCT|DSG' THEN 'DCT'
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%AMT%' THEN 'AMT'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'MANUAL|^[0-9]*M(T|TM)?$|^MAN$|^MTM$|^[0-9]*MT$' THEN 'Manual'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'AUTO|AUT|^[0-9A-Z]*AT[A-Z0-9]*$|AT' THEN 'Automatic'
    ELSE 'Other' END
$$;

CREATE OR REPLACE FUNCTION public.crsp_drive_label(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN public.crsp_norm(t) IS NULL THEN NULL
    WHEN replace(public.crsp_norm(t),' ','') ~ 'HP$' THEN NULL
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%AWD%' THEN 'AWD'
    WHEN replace(public.crsp_norm(t),' ','') ~ '4WD|4X4|4W$|6X4|6X6|8X4|8X6|4WDD' THEN '4WD'
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%FWD%' THEN 'FWD'
    WHEN replace(public.crsp_norm(t),' ','') LIKE '%RWD%' THEN 'RWD'
    WHEN replace(public.crsp_norm(t),' ','') ~ '2WD|4X2|6X2|8X2' THEN '2WD'
    ELSE 'Other' END
$$;

CREATE OR REPLACE FUNCTION public.crsp_body_label(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN public.crsp_norm(t) IS NULL THEN NULL
    WHEN replace(public.crsp_norm(t),' ','') ~ 'HATC[H]?BACK' THEN 'Hatchback'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^SUVCOUPE$' THEN 'SUV Coupe'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^SUV$' THEN 'SUV'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'DOUBLECAB|DOUBLECABIN|DUALCAB|^DCAB$|^DCABIN$' THEN 'Double Cab'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'SINGLECAB|SINGLECABIN|^SCAB$|^SCABIN$' THEN 'Single Cab'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'CREWCAB' THEN 'Crew Cab'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'PICKUP' THEN 'Pickup'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'STATIONWAGON|^SWAGON$|^WAGON$' THEN 'Station Wagon'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'SEDAN|SALOON|^SAL$' THEN 'Sedan'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'MINIBUS' THEN 'Mini Bus'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'MINIVAN|MINVAN' THEN 'Minivan'
    WHEN replace(public.crsp_norm(t),' ','') ~ 'CONV[E]?RTIBLE' THEN 'Convertible'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^COUPE$' THEN 'Coupe'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^VAN$' THEN 'Van'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^BUS$' THEN 'Bus'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^TR[U]?[C]?K$' THEN 'Truck'
    WHEN replace(public.crsp_norm(t),' ','') ~ '^CROSSOVER$' THEN 'Crossover'
    ELSE initcap(public.crsp_norm(t)) END
$$;

CREATE OR REPLACE FUNCTION public.crsp_engine_cc(t text) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN t IS NULL THEN NULL
    WHEN upper(t) ~ 'KWH|[0-9]\s*HP' THEN NULL
    WHEN btrim(t) ~ '^[0-9]+(\.0+)?$' THEN floor(btrim(t)::numeric)::int
    WHEN upper(replace(btrim(t),' ','')) ~ '^[0-9]+CC$' THEN (regexp_replace(t, '[^0-9]', '', 'g'))::int
    ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.crsp_engine_kwh(t text) RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN upper(coalesce(t,'')) ~ 'KWH'
    THEN (substring(replace(upper(t),' ','') from '([0-9]+(\.[0-9]+)?)\s*KWH'))::numeric
    ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.crsp_engine_hp(t text) RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN upper(coalesce(t,'')) ~ 'HP'
    THEN (substring(replace(upper(t),' ','') from '([0-9]+(\.[0-9]+)?)\s*HP'))::numeric
    ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.crsp_seat_count(t text) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN coalesce(t,'') ~ '[0-9]' THEN (substring(btrim(t) from '([0-9]+)'))::int ELSE NULL END
$$;

-- ---------- generated columns ----------
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS make_normalized text GENERATED ALWAYS AS (public.crsp_norm(make)) STORED,
  ADD COLUMN IF NOT EXISTS model_normalized text GENERATED ALWAYS AS (public.crsp_model_base(model)) STORED,
  ADD COLUMN IF NOT EXISTS trim_normalized text GENERATED ALWAYS AS (public.crsp_model_trim(model)) STORED,
  ADD COLUMN IF NOT EXISTS fuel_label text GENERATED ALWAYS AS (public.crsp_fuel_label(fuel_raw)) STORED,
  ADD COLUMN IF NOT EXISTS transmission_normalized text GENERATED ALWAYS AS (public.crsp_transmission_label(transmission)) STORED,
  ADD COLUMN IF NOT EXISTS drive_normalized text GENERATED ALWAYS AS (public.crsp_drive_label(drive_configuration)) STORED,
  ADD COLUMN IF NOT EXISTS body_normalized text GENERATED ALWAYS AS (public.crsp_body_label(body_type)) STORED,
  ADD COLUMN IF NOT EXISTS engine_kwh numeric GENERATED ALWAYS AS (public.crsp_engine_kwh(engine_capacity_raw)) STORED,
  ADD COLUMN IF NOT EXISTS engine_hp numeric GENERATED ALWAYS AS (public.crsp_engine_hp(engine_capacity_raw)) STORED,
  ADD COLUMN IF NOT EXISTS seating_count integer GENERATED ALWAYS AS (public.crsp_seat_count(seating)) STORED,
  ADD COLUMN IF NOT EXISTS search_blob text GENERATED ALWAYS AS (
    public.crsp_norm(coalesce(make,'') || ' ' || coalesce(model,'') || ' ' || coalesce(model_number,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS vehicles_make_norm_idx ON public.vehicles (make_normalized);
CREATE INDEX IF NOT EXISTS vehicles_model_norm_idx ON public.vehicles (model_normalized);
CREATE INDEX IF NOT EXISTS vehicles_trim_norm_idx ON public.vehicles (trim_normalized);
CREATE INDEX IF NOT EXISTS vehicles_model_number_idx ON public.vehicles (model_number);
CREATE INDEX IF NOT EXISTS vehicles_fuel_label_idx ON public.vehicles (fuel_label);
CREATE INDEX IF NOT EXISTS vehicles_transmission_norm_idx ON public.vehicles (transmission_normalized);
CREATE INDEX IF NOT EXISTS vehicles_drive_norm_idx ON public.vehicles (drive_normalized);
CREATE INDEX IF NOT EXISTS vehicles_body_norm_idx ON public.vehicles (body_normalized);
CREATE INDEX IF NOT EXISTS vehicles_crsp_idx ON public.vehicles (crsp_kes);
CREATE INDEX IF NOT EXISTS vehicles_seating_count_idx ON public.vehicles (seating_count);
CREATE INDEX IF NOT EXISTS vehicles_engine_cc_idx ON public.vehicles (engine_capacity_cc);
CREATE INDEX IF NOT EXISTS vehicles_search_blob_trgm_idx ON public.vehicles USING gin (search_blob gin_trgm_ops);

-- ---------- search ----------
CREATE OR REPLACE FUNCTION public.crsp_search(
  p_dataset uuid,
  p_query text DEFAULT NULL,
  p_makes text[] DEFAULT NULL,
  p_models text[] DEFAULT NULL,
  p_trims text[] DEFAULT NULL,
  p_fuels text[] DEFAULT NULL,
  p_transmissions text[] DEFAULT NULL,
  p_drives text[] DEFAULT NULL,
  p_bodies text[] DEFAULT NULL,
  p_seats integer[] DEFAULT NULL,
  p_cc_min integer DEFAULT NULL,
  p_cc_max integer DEFAULT NULL,
  p_crsp_min numeric DEFAULT NULL,
  p_crsp_max numeric DEFAULT NULL,
  p_sort text DEFAULT 'relevance',
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid, make text, model text, model_number text, trim_normalized text, model_normalized text,
  transmission text, transmission_normalized text, drive_configuration text, drive_normalized text,
  engine_capacity_raw text, engine_capacity_cc integer, engine_kwh numeric, engine_hp numeric,
  body_type text, body_normalized text, gvw text, seating text, seating_count integer,
  fuel_raw text, fuel_normalized text, fuel_label text, crsp_kes numeric, flags text[],
  source_row integer, score real, total_count bigint
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH q AS (SELECT public.crsp_norm(p_query) AS nq),
  base AS (
    SELECT v.*, (SELECT nq FROM q) AS nq
    FROM public.vehicles v
    WHERE v.dataset_id = p_dataset
      AND (p_makes IS NULL OR array_length(p_makes,1) IS NULL OR v.make = ANY(p_makes))
      AND (p_models IS NULL OR array_length(p_models,1) IS NULL OR v.model_normalized = ANY(p_models))
      AND (p_trims IS NULL OR array_length(p_trims,1) IS NULL OR v.trim_normalized = ANY(p_trims))
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
$$;

GRANT EXECUTE ON FUNCTION public.crsp_search(uuid,text,text[],text[],text[],text[],text[],text[],text[],integer[],integer,integer,numeric,numeric,text,integer,integer) TO anon, authenticated, service_role;

-- ---------- dependent filter options ----------
CREATE OR REPLACE FUNCTION public.crsp_filter_options(
  p_dataset uuid,
  p_field text,
  p_query text DEFAULT NULL,
  p_makes text[] DEFAULT NULL,
  p_models text[] DEFAULT NULL,
  p_trims text[] DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (value text, record_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH base AS (
    SELECT
      CASE p_field
        WHEN 'make' THEN v.make
        WHEN 'model' THEN v.model_normalized
        WHEN 'trim' THEN v.trim_normalized
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
$$;

GRANT EXECUTE ON FUNCTION public.crsp_filter_options(uuid,text,text,text[],text[],text[],integer) TO anon, authenticated, service_role;
