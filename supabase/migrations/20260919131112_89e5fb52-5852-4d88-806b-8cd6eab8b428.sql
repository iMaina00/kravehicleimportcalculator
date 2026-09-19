
CREATE OR REPLACE FUNCTION public.crsp_model_base(t text) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE toks text[]; i int; out_toks text[] := '{}'; tok text; src text;
BEGIN
  src := coalesce(public.crsp_norm(t), '');
  src := regexp_replace(src, '(^| )([XSME]) (DRIVE|SPORT|LINE|CLASS)( |$)', '\1\2\3\4', 'g');
  toks := string_to_array(src, ' ');
  IF toks IS NULL OR array_length(toks,1) IS NULL THEN RETURN NULL; END IF;
  FOR i IN 1..array_length(toks,1) LOOP
    tok := toks[i];
    IF i > 1 AND (tok ~ '[0-9]' OR tok IN ('XDRIVE','SDRIVE','MDRIVE','EDRIVE','MSPORT','MLINE','ELINE','SLINE','AMG','QUATTRO','TFSI','TDI','TSI','TDCI','VTEC','LINE','SPORT','LUXURY','PREMIUM','LIMITED','EDITION','PACKAGE','HYBRID','MATIC','AWD','4WD','2WD','FWD','RWD','TURBO','DIESEL','PETROL','ELECTRIC')) THEN
      EXIT;
    END IF;
    out_toks := out_toks || tok;
  END LOOP;
  RETURN array_to_string(out_toks, ' ');
END $$;

ALTER TABLE public.vehicles
  DROP COLUMN IF EXISTS model_normalized,
  DROP COLUMN IF EXISTS trim_normalized;

ALTER TABLE public.vehicles
  ADD COLUMN model_normalized text GENERATED ALWAYS AS (public.crsp_model_base(model)) STORED,
  ADD COLUMN trim_normalized text GENERATED ALWAYS AS (public.crsp_model_trim(model)) STORED;

CREATE INDEX IF NOT EXISTS vehicles_model_norm_idx ON public.vehicles (model_normalized);
CREATE INDEX IF NOT EXISTS vehicles_trim_norm_idx ON public.vehicles (trim_normalized);
