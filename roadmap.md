# Roadmap

## In progress — Liquid Glass UI redesign (mid-way)
- [x] Design tokens (Midnight Black / Cobalt / Acid Lime) + glass utilities in src/styles.css
- [x] App shell, fonts (Space Grotesk + DM Sans), ambient background
- [x] UI primitives re-themed (button, card, input, tabs, badge, select, sheet, alert, popover, table, slider, skeleton)
- [ ] Calculator page, manual form, currency panel (src/routes/index.tsx)
- [ ] Results breakdown + clearing costs
- [ ] CRSP vehicle search, facet dropdowns, combobox, legacy search
- [ ] Rules page, error page, command
- [ ] Verify desktop + mobile, build log clean

## Queued — KRA CRSP Reverse Engineering Engine (user prompt 2026-11-02)
- [ ] Stage 1 — DB: insider_tax_references, reverse_engineering_results, crsp_calibration_groups, calibrated_crsp_values, missing_year_estimates, calculation_audit_logs, calculation_rule_versions (+ admin roles, grants, RLS); reuse `vehicles` as the official CRSP database
- [ ] Stage 2 — Engine: reverse calculation, forward verification, CRSP calibration (mean/median/weighted/model-year), missing-year estimation (src/lib/crsp-engine/ + tests)
- [ ] Stage 3 — Server functions + admin auth gating
- [ ] Stage 4 — UI: "CRSP Intelligence" nav → Dashboard, Reverse Engineer, CRSP Calibration, Insider References, Missing-Year Estimator, Calculation History
- [ ] Stage 5 — Seed G63 reference data (2021/2024/2025), rule-versioning + audit trail
- [ ] Stage 6 — Tests A–D (G63), CSV/Excel export

## CRSP Intelligence progress
- [x] Database tables, admin role checks, audit log
- [x] Engine: reverse calculation, calibration, missing-year estimates (G63 tests pass)
- [ ] Server functions + sign-in
- [ ] CRSP Intelligence screens (dashboard, reverse, calibration, references, estimator, history)
- [ ] G63 seed references, CSV/Excel exports
