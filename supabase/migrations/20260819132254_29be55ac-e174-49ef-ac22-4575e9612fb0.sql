
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ DATASETS ============
CREATE TABLE public.vehicle_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  source_file text NOT NULL,
  effective_date date,
  imported_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft',
  notes text
);

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.vehicle_datasets(id) ON DELETE CASCADE,
  source_row integer,
  make text,
  model text,
  model_number text,
  transmission text,
  drive_configuration text,
  engine_capacity_raw text,
  engine_capacity_cc integer,
  body_type text,
  gvw text,
  seating text,
  fuel_raw text,
  fuel_normalized text,
  crsp_kes numeric,
  original_row_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_text text,
  flags text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.motorcycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.vehicle_datasets(id) ON DELETE CASCADE,
  source_row integer,
  make text,
  model text,
  model_number text,
  transmission text,
  engine_capacity_raw text,
  engine_capacity_cc integer,
  seating text,
  fuel_raw text,
  fuel_normalized text,
  crsp_kes numeric,
  original_row_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_text text,
  flags text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.machinery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.vehicle_datasets(id) ON DELETE CASCADE,
  source_row integer,
  make text,
  model text,
  rating_raw text,
  crsp_kes numeric,
  original_row_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_text text,
  flags text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.data_validation_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.vehicle_datasets(id) ON DELETE CASCADE,
  record_table text NOT NULL,
  record_id uuid,
  source_row integer,
  issue_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehicles_dataset_idx ON public.vehicles(dataset_id);
CREATE INDEX vehicles_search_trgm ON public.vehicles USING gin (search_text gin_trgm_ops);
CREATE INDEX vehicles_make_idx ON public.vehicles(make);
CREATE INDEX vehicles_fuel_idx ON public.vehicles(fuel_normalized);
CREATE INDEX vehicles_engine_idx ON public.vehicles(engine_capacity_cc);
CREATE INDEX motorcycles_search_trgm ON public.motorcycles USING gin (search_text gin_trgm_ops);
CREATE INDEX motorcycles_dataset_idx ON public.motorcycles(dataset_id);
CREATE INDEX machinery_search_trgm ON public.machinery USING gin (search_text gin_trgm_ops);
CREATE INDEX machinery_dataset_idx ON public.machinery(dataset_id);
CREATE INDEX validation_dataset_idx ON public.data_validation_issues(dataset_id);

-- ============ RULES ============
CREATE TABLE public.vehicle_categories (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  hs_codes text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  source text,
  verification_status text NOT NULL DEFAULT 'guideline_subject_to_verification'
);

CREATE TABLE public.hs_code_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code text NOT NULL REFERENCES public.vehicle_categories(code) ON DELETE CASCADE,
  hs_code text NOT NULL,
  description text,
  source text,
  verification_status text NOT NULL DEFAULT 'guideline_subject_to_verification'
);

CREATE TABLE public.engine_capacity_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code text NOT NULL REFERENCES public.vehicle_categories(code) ON DELETE CASCADE,
  fuel_types text[] NOT NULL DEFAULT '{}',
  min_cc integer,
  max_cc integer,
  priority integer NOT NULL DEFAULT 0,
  source text,
  verification_status text NOT NULL DEFAULT 'guideline_subject_to_verification'
);

CREATE TABLE public.tax_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  effective_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'draft',
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.tax_rule_versions(id) ON DELETE CASCADE,
  category_code text NOT NULL REFERENCES public.vehicle_categories(code) ON DELETE CASCADE,
  import_type text NOT NULL,
  name text NOT NULL,
  tax_type text NOT NULL,
  rate numeric,
  fixed_amount numeric,
  formula text NOT NULL,
  calculation_base text NOT NULL,
  customs_divisors numeric[] NOT NULL DEFAULT '{}',
  vehicle_type text,
  engine_min_cc integer,
  engine_max_cc integer,
  fuel_types text[] NOT NULL DEFAULT '{}',
  hs_codes text[] NOT NULL DEFAULT '{}',
  effective_date date,
  expiry_date date,
  source text,
  verification_status text NOT NULL DEFAULT 'guideline_subject_to_verification',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX tax_rules_lookup_idx ON public.tax_rules(version_id, category_code, import_type);

CREATE TABLE public.depreciation_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  effective_date date,
  status text NOT NULL DEFAULT 'draft',
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.depreciation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.depreciation_rule_versions(id) ON DELETE CASCADE,
  import_type text NOT NULL,
  label text NOT NULL,
  min_years numeric NOT NULL,
  max_years numeric,
  rate numeric NOT NULL,
  source text,
  verification_status text NOT NULL DEFAULT 'guideline_subject_to_verification',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX depreciation_rules_lookup_idx ON public.depreciation_rules(version_id, import_type);

CREATE TABLE public.exchange_rate_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  effective_date date,
  status text NOT NULL DEFAULT 'draft',
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.exchange_rate_versions(id) ON DELETE CASCADE,
  currency text NOT NULL,
  rate_to_kes numeric NOT NULL,
  source text,
  verification_status text NOT NULL DEFAULT 'requires_verification',
  UNIQUE (version_id, currency)
);

CREATE TABLE public.calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  dataset_id uuid REFERENCES public.vehicle_datasets(id),
  tax_rule_version_id uuid REFERENCES public.tax_rule_versions(id),
  depreciation_version_id uuid REFERENCES public.depreciation_rule_versions(id),
  exchange_rate_version_id uuid REFERENCES public.exchange_rate_versions(id),
  input jsonb NOT NULL,
  result jsonb NOT NULL
);

-- ============ GRANTS + RLS ============
GRANT SELECT ON public.vehicle_datasets, public.vehicles, public.motorcycles, public.machinery,
  public.data_validation_issues, public.vehicle_categories, public.hs_code_rules,
  public.engine_capacity_brackets, public.tax_rule_versions, public.tax_rules,
  public.depreciation_rule_versions, public.depreciation_rules,
  public.exchange_rate_versions, public.exchange_rates TO anon, authenticated;

GRANT ALL ON public.vehicle_datasets, public.vehicles, public.motorcycles, public.machinery,
  public.data_validation_issues, public.vehicle_categories, public.hs_code_rules,
  public.engine_capacity_brackets, public.tax_rule_versions, public.tax_rules,
  public.depreciation_rule_versions, public.depreciation_rules,
  public.exchange_rate_versions, public.exchange_rates, public.calculations TO service_role;

ALTER TABLE public.vehicle_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_validation_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hs_code_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_capacity_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read datasets" ON public.vehicle_datasets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read vehicles" ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read motorcycles" ON public.motorcycles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read machinery" ON public.machinery FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read validation issues" ON public.data_validation_issues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read categories" ON public.vehicle_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read hs codes" ON public.hs_code_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read brackets" ON public.engine_capacity_brackets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read tax rule versions" ON public.tax_rule_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read tax rules" ON public.tax_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read dep versions" ON public.depreciation_rule_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read dep rules" ON public.depreciation_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read fx versions" ON public.exchange_rate_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read fx rates" ON public.exchange_rates FOR SELECT TO anon, authenticated USING (true);
