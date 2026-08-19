# Kenya Vehicle Import Tax Calculator — Source Inspection + Build Plan

## Phase 1 result: workbook found and fully inspected

File: `New-CRSP---July-2026.xlsx` (found, read-only, not modified).

### Worksheets

| Sheet | Rows of data | Columns |
|---|---|---|
| `M.Vehicle CRSP July 2025` | 5,279 vehicles | Make, Model, Model number, Transmission, Drive Configuration, Engine Capacity, Body Type, GVW, Seating, Fuel, CRSP (KES.) |
| `Motor Cycles July 2025` | 465 motorcycles | Make, Model, Model number, Transmission, Engine Capacity, seating, Fuel, CRSP (KES) |
| `Tractors & Graders July 2025` | 125 rows (116 priced) | MODEL, HORSEPOWER/CC/KW, KSHS — grouped under brand header rows (e.g. MASSEY FERGUSON) |
| `TEMPLATE 2025` | rules sheet | Depreciation tables + 11 tax tabulations, each in Direct Import and Previously Registered variants |

Note: internal sheet names say "July 2025" though the file is titled July 2026 — flagged as REQUIRES VERIFICATION; dataset will be labelled "July 2026" per the file name with the discrepancy recorded.

### Depreciation schedules (TEMPLATE 2025)

Direct imports: >1–2y 20%, >2–3y 30%, >3–4y 40%, >4–5y 50%, >5–6y 55%, >6–7y 60%, >7–8y 65%.
Previously registered in Kenya: 1y 20%, 2y 35%, 3y 50%, 4y 60%, 5y 70%, 6y 75%, 7y 80%, 8y 83%, 9y 86%, 10y 89%, 11y 90%, 12y 91%, 13y 92%, 14y 93%, 15y 94%, over 15y 95%.
Age counter = current year − year of manufacture. Direct-import table has no band beyond 8 years — REQUIRES VERIFICATION.

### Tax tabulations found (exact spreadsheet formulas)

All use: `Customs Value = ((CRSP / 1.25) * (1 − Dep) / d1 / d2 / 1.16) * (1 − ExtraDep)` with category-specific divisors.

| Category | Customs divisors after /1.25 | Import duty | Excise | VAT | RDL | IDF |
|---|---|---|---|---|---|---|
| ≤1500cc (incl. s/cab pickups, lorries, buses; excl. public school buses) | /1.35 /1.2 /1.16 | 35% | 20% | 16% | 2% of customs | 2.5% of customs |
| >1500cc (HS 8702/8703/8704, excl. 8703.24.90 & 8703.33.90) | /1.35 /1.25 /1.16 | 35% | 25% | 16% | 2% | 2.5% |
| >3000cc petrol / >2500cc diesel (HS 8703.24.90, 8703.33.90) | /1.35 /1.35 /1.16 | 35% | 35% | 16% | 2% | 2.5% |
| 100% electric passenger (HS 8702.40.*, 8703.80.00) | /1.35 /1.1 /1.16 | 25% | 10% | 16% | 2% | 2.5% |
| Public school buses | /1.35 /1.25 /1.16 | 35% | 25% | 16% | 2% | 2.5% |
| Prime movers (no excise) | /1.35 /1.16 | 25% | 0 | 16% | 2% | 2.5% |
| Trailers (no excise) | /1.35 /1.16 | 35% | 0 | 16% | 2% | 2.5% |
| Ambulance | /1.25 /1.16 | 0% | 25% | 16% | 2% | 2.5% |
| Motorcycles | /1.25 /1.16 | 25% | KES 12,953 fixed | 16% | 2% | 2.5% |
| Special purpose | /1.16 | 0% | 0% | 16% | 2% | 2.5% |
| Heavy machinery | /1.16 | 0% | 0% | 16% | 2% | 2.5% |

Excise base = customs + import duty. VAT base = customs + import duty + excise. Previously-registered variants use identical rates; their "Grand Total" cells sum only duty + excise + VAT (they omit RDL/IDF) while direct-import totals include RDL + IDF — recorded as a spreadsheet inconsistency, REQUIRES VERIFICATION. Labels vs formulas also conflict in three places (EV "Import Duty 35%" label computes 25%; prime mover "35%" computes 25%; heavy-machinery VAT base cell references the K column) — formula wins, mismatch documented.

Every tabulation is headed "GUIDELINE SUBJECT TO VERIFICATION". Prepared 2025-05-30 by Walter Kimani, reviewed Frank Orondo, approved David Kirui.

### Data quality findings (to be flagged, not silently fixed)

- Fuel values are inconsistent: GASOLINE 2,351, DIESEL 1,354, PETROL 661, ELECTRIC 309, HYBRID 269, " DIESEL" 153, PLUG-IN HYBRID 66, PETROL/ELECTRIC 26, plus typos ELECCTRIC, DEISEL, "DI ESEL", "DIESE L", ELECTRIC(EV), blanks (16) and two numeric values (40, 37).
- Engine capacity is not always numeric: "EV" (127), "3000cc"-style strings, "HEAVY DUTY TRUCK" (31), "(84Kwh)", "480 HP".
- 2 vehicles have no CRSP; 340 make/model/model-number/engine/fuel key collisions (genuine variants vs duplicates need review).
- 66 makes, 46 body types; machinery sheet has 9 unpriced rows and brand rows mixed with model rows.
- No worked example calculation exists in the workbook — tests will be built from the template formulas themselves.

### Not present in the workbook (REQUIRES VERIFICATION, stored as configurable data, never guessed)

Exchange rates; freight/insurance treatment; which body types map to prime mover / trailer / ambulance / special purpose / school bus; HS-code assignment per vehicle; "Extra Depreciation" trigger rules; excise band for hybrids; direct-import depreciation beyond 8 years.

## Build plan

1. **SOURCE_DATA_ANALYSIS.md** — the full findings above, expanded with per-column data types, value distributions, and a numbered REQUIRES VERIFICATION list.
2. **Enable Lovable Cloud** and create the schema: `vehicle_datasets`, `vehicles`, `motorcycles`, `machinery`, `tax_rules`, `tax_rule_versions`, `depreciation_rules`, `vehicle_categories`, `engine_capacity_brackets`, `hs_code_rules`, `exchange_rates`, `calculations`. Every rule row carries rate/formula, base, vehicle type, engine range, fuel, HS code, import type, effective/expiry date, source, verification status. `pg_trgm` + GIN indexes on normalized search text.
3. **Import** the workbook as dataset "July 2026" (status: draft → published), preserving each source row as JSONB, with a validation report table listing every flagged record (bad fuel, non-numeric engine, missing CRSP, duplicate key).
4. **Seed rule versions** from TEMPLATE 2025 exactly as tabulated above, each marked `guideline_subject_to_verification`.
5. **Search**: server function using trigram similarity over a normalized `search_text` (case/space/hyphen folded, manufacturer aliases such as Mercedes → Mercedes-Benz), filters for engine/fuel/body/transmission/drive, returning make+model, engine, fuel, transmission, drive, body type, CRSP.
6. **Engine** in `src/lib/calculator/` (valuation, depreciation, classification, importDuty, excise, vat, rdl, idf, landedCost, calculateImportTaxes) — pure functions taking rules as data, each tax returning base, rate, formula string, result, source rule id.
7. **Tests** (vitest) covering all 11 categories × direct/previously-registered, replicating the template formulas at CRSP 1,000 and at real CRSP values; any discrepancy stops work and gets documented.
8. **UI**: one page — search, select, form (vehicle type, YOM, first registration, import date, import type, purchase price + currency, freight, insurance, other costs), Calculate, and a plain result breakdown. Headline: KNOW THE REAL COST BEFORE YOU IMPORT.
9. **Minimal admin route**: upload XLSX, preview/validate, import, publish, archive datasets; edit rule/depreciation/exchange-rate versions.

Every calculation record stores the dataset, tax-rule, depreciation-rule and exchange-rate version ids so results stay reproducible.
