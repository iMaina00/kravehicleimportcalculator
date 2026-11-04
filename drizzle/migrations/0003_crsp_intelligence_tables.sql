-- ============ CRSP Intelligence module tables ============

-- Roles: admin can edit rules and approve calibrations.
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own role" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- B. Insider tax reference database
create table public.insider_tax_references (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid,
  make text not null,
  model text not null,
  variant text,
  manufacturing_year int not null,
  engine_cc int,
  fuel text,
  transmission text,
  drivetrain text,
  assessment_year int not null default 2026,
  import_category text not null default 'direct' check (import_category in ('direct','previously_registered')),
  tax_category_code text,
  final_taxes_kes numeric not null check (final_taxes_kes > 0),
  is_rounded boolean not null default false,
  rounding_precision numeric,
  import_duty_kes numeric,
  excise_duty_kes numeric,
  vat_kes numeric,
  rdl_kes numeric,
  idf_kes numeric,
  customs_value_kes numeric,
  extra_depreciation_pct numeric not null default 0 check (extra_depreciation_pct >= 0 and extra_depreciation_pct < 1),
  standard_depreciation_pct numeric check (standard_depreciation_pct is null or (standard_depreciation_pct >= 0 and standard_depreciation_pct < 1)),
  source_reference text,
  date_received date,
  notes text,
  status text not null default 'active' check (status in ('active','excluded'))
);
create unique index insider_tax_refs_dedup
  on public.insider_tax_references (lower(make), lower(model), coalesce(lower(variant),''), manufacturing_year, assessment_year, final_taxes_kes)
  where status = 'active';
create index insider_tax_refs_vehicle on public.insider_tax_references (lower(make), lower(model), manufacturing_year);

-- C. Reverse-engineering calculation history (append-only)
create table public.reverse_engineering_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid,
  reference_id uuid references public.insider_tax_references(id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  forward jsonb not null,
  confidence text not null check (confidence in ('confirmed','calibrated','estimated','unverified')),
  inferred_crsp_kes numeric,
  forward_calculated_kes numeric,
  difference_kes numeric,
  notes text
);
create index reverse_results_reference on public.reverse_engineering_results (reference_id);
create index reverse_results_created on public.reverse_engineering_results (created_at desc);

-- D. Calibration groups per vehicle
create table public.crsp_calibration_groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  make text not null,
  model text not null,
  variant text,
  engine_cc int,
  fuel text,
  transmission text,
  drivetrain text,
  tolerance_pct numeric not null default 5 check (tolerance_pct > 0),
  status text not null default 'open' check (status in ('open','consistent','inconsistent')),
  approved_method text check (approved_method in ('mean','median','weighted','model_year')),
  approved_crsp_kes numeric,
  approved_at timestamptz,
  approved_by uuid,
  notes text
);
create unique index calib_groups_dedup
  on public.crsp_calibration_groups (lower(make), lower(model), coalesce(lower(variant),''), engine_cc, fuel);

-- Approved calibrated CRSP values (version history kept, never overwritten)
create table public.calibrated_crsp_values (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_id uuid not null references public.crsp_calibration_groups(id) on delete cascade,
  method text not null check (method in ('mean','median','weighted','model_year')),
  value numeric not null check (value > 0),
  includes_reference_ids uuid[] not null default '{}',
  confidence text not null default 'calibrated' check (confidence in ('confirmed','calibrated','estimated','unverified')),
  created_by uuid,
  approved_at timestamptz,
  notes text
);
create index calibrated_values_group on public.calibrated_crsp_values (group_id);

-- E. Missing model-year estimates
create table public.missing_year_estimates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  group_id uuid not null references public.crsp_calibration_groups(id) on delete cascade,
  manufacturing_year int not null,
  age_years int not null,
  standard_depreciation_pct numeric,
  extra_depreciation_pct numeric not null default 0,
  crsp_source text not null check (crsp_source in ('calibrated','model_year','manual')),
  crsp_kes numeric not null check (crsp_kes > 0),
  estimated_taxes_kes numeric not null,
  status text not null default 'estimated' check (status in ('estimated','confirmed','superseded')),
  notes text,
  unique (group_id, manufacturing_year)
);
create index missing_estimates_group on public.missing_year_estimates (group_id);

-- 14. Permanent audit trail
create table public.calculation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  notes text
);
create index audit_logs_created on public.calculation_audit_logs (created_at desc);

-- 18. Configurable rule versions (assessment year, tolerances, rounding)
create table public.calculation_rule_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  effective_date date,
  status text not null default 'active' check (status in ('active','retired')),
  settings jsonb not null default '{}'::jsonb,
  notes text
);

-- ============ Grants ============
grant select, insert, update, delete on public.insider_tax_references to authenticated;
grant select, insert, update, delete on public.reverse_engineering_results to authenticated;
grant select, insert, update, delete on public.crsp_calibration_groups to authenticated;
grant select, insert, update, delete on public.calibrated_crsp_values to authenticated;
grant select, insert, update, delete on public.missing_year_estimates to authenticated;
grant select, insert, update, delete on public.calculation_audit_logs to authenticated;
grant select, insert, update, delete on public.calculation_rule_versions to authenticated;
grant all on public.insider_tax_references to service_role;
grant all on public.reverse_engineering_results to service_role;
grant all on public.crsp_calibration_groups to service_role;
grant all on public.calibrated_crsp_values to service_role;
grant all on public.missing_year_estimates to service_role;
grant all on public.calculation_audit_logs to service_role;
grant all on public.calculation_rule_versions to service_role;

-- ============ RLS ============
alter table public.insider_tax_references enable row level security;
alter table public.reverse_engineering_results enable row level security;
alter table public.crsp_calibration_groups enable row level security;
alter table public.calibrated_crsp_values enable row level security;
alter table public.missing_year_estimates enable row level security;
alter table public.calculation_audit_logs enable row level security;
alter table public.calculation_rule_versions enable row level security;

-- Read: signed-in users only
create policy "insider refs read" on public.insider_tax_references for select to authenticated using (true);
create policy "reverse results read" on public.reverse_engineering_results for select to authenticated using (true);
create policy "calibration groups read" on public.crsp_calibration_groups for select to authenticated using (true);
create policy "calibrated values read" on public.calibrated_crsp_values for select to authenticated using (true);
create policy "missing estimates read" on public.missing_year_estimates for select to authenticated using (true);
create policy "audit logs read" on public.calculation_audit_logs for select to authenticated using (true);
create policy "rule versions read" on public.calculation_rule_versions for select to authenticated using (true);

-- Insert: any signed-in user
create policy "insider refs insert" on public.insider_tax_references for insert to authenticated with check (true);
create policy "reverse results insert" on public.reverse_engineering_results for insert to authenticated with check (true);
create policy "calibration groups insert" on public.crsp_calibration_groups for insert to authenticated with check (true);
create policy "calibrated values insert" on public.calibrated_crsp_values for insert to authenticated with check (true);
create policy "missing estimates insert" on public.missing_year_estimates for insert to authenticated with check (true);
create policy "audit logs insert" on public.calculation_audit_logs for insert to authenticated with check (true);
create policy "rule versions insert admin" on public.calculation_rule_versions for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

-- Update/delete: admin only (spec: only authorised users edit rules or approve calibrations)
create policy "insider refs update admin" on public.insider_tax_references for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "insider refs delete admin" on public.insider_tax_references for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "calibration groups update admin" on public.crsp_calibration_groups for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "calibration groups delete admin" on public.crsp_calibration_groups for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "calibrated values update admin" on public.calibrated_crsp_values for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "calibrated values delete admin" on public.calibrated_crsp_values for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "missing estimates update admin" on public.missing_year_estimates for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "missing estimates delete admin" on public.missing_year_estimates for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "rule versions update admin" on public.calculation_rule_versions for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "rule versions delete admin" on public.calculation_rule_versions for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "reverse results delete admin" on public.reverse_engineering_results for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "audit logs delete admin" on public.calculation_audit_logs for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
