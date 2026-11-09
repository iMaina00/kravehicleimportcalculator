ALTER TABLE public.insider_tax_references
  ADD COLUMN total_components text NOT NULL DEFAULT 'all'
  CHECK (total_components IN ('all', 'duty_excise_vat'));

ALTER TABLE public.calibrated_crsp_values
  ADD COLUMN manufacturing_year integer;

ALTER TABLE public.missing_year_estimates
  ADD COLUMN assessment_year integer NOT NULL DEFAULT 2026,
  ADD COLUMN calculation_input jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.missing_year_estimates
  DROP CONSTRAINT IF EXISTS missing_year_estimates_group_id_manufacturing_year_key;
CREATE INDEX IF NOT EXISTS missing_estimates_group_year_created
  ON public.missing_year_estimates (group_id, manufacturing_year, created_at DESC);

DROP POLICY IF EXISTS "calibration groups insert" ON public.crsp_calibration_groups;
CREATE POLICY "calibration groups insert unapproved"
  ON public.crsp_calibration_groups FOR INSERT TO authenticated
  WITH CHECK (
    status = 'open' AND approved_method IS NULL AND approved_crsp_kes IS NULL
    AND approved_at IS NULL AND approved_by IS NULL
  );

DROP POLICY IF EXISTS "calibrated values insert" ON public.calibrated_crsp_values;
CREATE POLICY "calibrated values insert unapproved"
  ON public.calibrated_crsp_values FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND approved_at IS NULL
    AND confidence IN ('calibrated', 'estimated', 'unverified')
  );

DROP POLICY IF EXISTS "insider refs insert" ON public.insider_tax_references;
CREATE POLICY "insider refs insert own actor"
  ON public.insider_tax_references FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "reverse results insert" ON public.reverse_engineering_results;
CREATE POLICY "reverse results insert own actor"
  ON public.reverse_engineering_results FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND confidence <> 'confirmed');

DROP POLICY IF EXISTS "missing estimates insert" ON public.missing_year_estimates;
CREATE POLICY "missing estimates insert estimates only"
  ON public.missing_year_estimates FOR INSERT TO authenticated
  WITH CHECK (status = 'estimated');

DROP POLICY IF EXISTS "audit logs insert" ON public.calculation_audit_logs;
DROP POLICY IF EXISTS "audit logs delete admin" ON public.calculation_audit_logs;
DROP POLICY IF EXISTS "reverse results delete admin" ON public.reverse_engineering_results;
DROP POLICY IF EXISTS "insider refs delete admin" ON public.insider_tax_references;
DROP POLICY IF EXISTS "calibration groups delete admin" ON public.crsp_calibration_groups;
DROP POLICY IF EXISTS "calibrated values delete admin" ON public.calibrated_crsp_values;
DROP POLICY IF EXISTS "missing estimates delete admin" ON public.missing_year_estimates;
DROP POLICY IF EXISTS "rule versions delete admin" ON public.calculation_rule_versions;

CREATE OR REPLACE FUNCTION public.intelligence_audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.calculation_audit_logs (actor, action, entity, entity_id, before, after)
  VALUES (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD)->>'id')::uuid ELSE (to_jsonb(NEW)->>'id')::uuid END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER intelligence_audit_insider_refs
  AFTER INSERT OR UPDATE ON public.insider_tax_references
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_audit_changes();
CREATE TRIGGER intelligence_audit_reverse_results
  AFTER INSERT OR UPDATE ON public.reverse_engineering_results
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_audit_changes();
CREATE TRIGGER intelligence_audit_calibration_groups
  AFTER INSERT OR UPDATE ON public.crsp_calibration_groups
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_audit_changes();
CREATE TRIGGER intelligence_audit_calibrated_values
  AFTER INSERT OR UPDATE ON public.calibrated_crsp_values
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_audit_changes();
CREATE TRIGGER intelligence_audit_missing_estimates
  AFTER INSERT OR UPDATE ON public.missing_year_estimates
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_audit_changes();
CREATE TRIGGER intelligence_audit_rule_versions
  AFTER INSERT OR UPDATE ON public.calculation_rule_versions
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_audit_changes();