# Complete CRSP Intelligence

## Goal
Finish the pending CRSP Intelligence module: account sign-in, usable screens backed by the existing calculation engine and database, the specified G63 references, and downloadable CSV/Excel reports.

## Approach
1. Add email/password account access without profile storage, preserve email confirmation, and protect Intelligence screens and every private read/write with authenticated server-side checks.
2. Build a shared Intelligence workspace with a dashboard and the six requested sections: Reverse Engineer, CRSP Calibration, Insider References, Missing-Year Estimator, Calculation History, and Rules & Depreciation. Keep the existing calculator and CRSP search intact.
3. Connect forms to the existing engine and database. Save inputs, reverse/forward results, estimates, calibration versions, and audit entries without overwriting history; require explicit approval before using a calibration.
4. Add the G63 2021/2024 references and the 2025 unresolved-depreciation case as unverified; retain workbook-derived rules and expose unresolved inputs rather than inventing them.
5. Add CSV and Excel downloads for the reference database, calibration reports, estimates, and calculation history; verify calculations, saved data, exports, and desktop/mobile use.

## Technical details
- Reuse the existing CRSP `vehicles` data, Intelligence tables, Supabase clients, and `src/lib/crsp-engine/` functions.
- Use TanStack Start server functions for database operations, with authenticated middleware and server-checked admin roles for approval/rule changes.
- Keep calculation math in tested, pure engine modules; use additive database changes only if the inspected schema lacks a needed field.
- No profile table or profile attributes; use email/password authentication with signup confirmation and no anonymous access.