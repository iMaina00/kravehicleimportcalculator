# Source data analysis — `New-CRSP---July-2026.xlsx`

**File status:** found and fully inspected (uploaded as `New-CRSP---July-2026.xlsx`).
**Authority:** this workbook is the single source of truth for CRSP values, tax tabulations and depreciation
schedules used by the calculator. Every rate stored in the database carries a `source` reference back to a cell
range in this file and a `verification_status`.

## 1. Worksheets

| Worksheet | Data rows | Purpose |
|---|---|---|
| `M.Vehicle CRSP July 2025` | 5,281 | Motor vehicle CRSP schedule |
| `Motor Cycles July 2025` | 467 | Motorcycle CRSP schedule |
| `Tractors & Graders July 2025` | 136 | Machinery CRSP schedule |
| `TEMPLATE 2025` | — | Tax tabulations, formulas and depreciation schedules |

Imported into the database: **5,279 vehicles, 465 motorcycles, 112 machinery records** (rows rejected were
header/blank/section rows carrying no make or model).

## 2. Columns

**Motor vehicles:** Make, Model, Model Number, Transmission, Drive Configuration, Engine Capacity, Body Type,
GVW, Seating, Fuel Type, CRSP (KES). Every original row is preserved verbatim in `vehicles.original_row_data`.

**Motorcycles:** Make, Model, Model Number, Transmission, Engine Capacity, Seating, Fuel Type, CRSP.

**Tractors & graders:** Make, Model, Rating (hp/kW text), CRSP.

## 3. Tax rules found in `TEMPLATE 2025`

Eleven tabulations, each stated twice (direct imports and previously registered):

1. Engine capacity **not exceeding 1500cc** (incl. single-cab pickups, lorries, buses; excl. public school buses)
2. Engine rating **exceeding 1500cc** (HS 8702, 8703, 8704; excl. 8703.24.90 and 8703.33.90)
3. **HS 8703.24.90 / 8703.33.90** — petrol above 3000cc, diesel above 2500cc
4. **Electric** vehicles for the transport of persons
5. **School buses for public schools**
6. **Prime movers**
7. **Trailers**
8. **Ambulances**
9. **Motorcycles**
10. **Special purpose vehicles**
11. **Tractors / graders / heavy machinery**

### Formulas (transcribed exactly)

```
Customs value = ((CRSP / 1.25) * (100% - Depreciation) / d2 / d3 / 1.16) * (100% - Extra depreciation)
Import Duty   = Customs value * rate
Excise Value  = Customs value + Import Duty
Excise Duty   = Excise Value * rate
VAT Value     = Customs value + Import Duty + Excise Duty
VAT           = VAT Value * 16%
RDL           = Customs value * 2%
IDF Fees      = Customs value * 2.5%
Grand Total   = Import Duty + Excise + VAT + RDL + IDF
```

The divisor chain differs per category and is stored per rule in `tax_rules.customs_divisors` — for example
`1.25 / 1.35 / 1.20 / 1.16` for ≤1500cc and `1.25 / 1.35 / 1.25 / 1.16` for >1500cc. The engine reproduces the
division order of the spreadsheet rather than pre-multiplying, so results match the workbook to the cent.

### Depreciation

*Direct imports* (`TEMPLATE 2025!B3:C9`): >1≤2y 20%, >2≤3y 30%, >3≤4y 40%, >4≤5y 50%, >5≤6y 55%, >6≤7y 60%,
>7≤8y 65%. The schedule stops at 8 years.

*Previously registered*: extends further, to 15+ years at 95%.

Age counter, from the workbook: `current year − year of manufacture`. Bands are lower-bound exclusive and
upper-bound inclusive.

## 4. Ambiguities and discrepancies (all surfaced in the app, none silently resolved)

1. **Labels vs formulas.** Several rows are labelled "Import Duty 35%" while the formula computes 25%
   (electric vehicles, prime movers). The engine follows the **formula**, and the rule reference page shows both.
2. **Grand total inconsistency.** The previously-registered columns total only duty + excise + VAT; RDL and IDF
   appear only in the direct-import columns. The app shows the full total and, for previously registered units,
   also the workbook's narrower total.
3. **"Extra Depreciation".** The workbook exposes the cell but states no rule for when it applies. It defaults
   to 0 and raises a verification warning when set.
4. **Depreciation above 8 years for direct imports** is undefined; the app applies the highest band and warns.
5. **Categories not derivable from CRSP columns** — school bus, ambulance, prime mover, trailer, special purpose —
   must be chosen by the user; automatic classification never guesses them.
6. **No exchange rates in the workbook.** Freight/insurance/purchase-price conversion uses a separately versioned
   rate table and is flagged `requires_verification`.

## 5. Data quality (recorded in `data_validation_issues`)

| Issue | Severity | Count |
|---|---|---|
| Duplicate make/model/spec variants | warning | 552 |
| Non-numeric engine capacity | warning | 294 |
| Engine capacity formatting (e.g. "3000cc", "2,000") | warning | 123 |
| Missing engine capacity | warning | 74 |
| Missing fuel type | warning | 16 |
| Unrecognised fuel spelling (e.g. "ELECCTRIC") | warning | 2 |
| Missing CRSP | critical | 2 |

Of 5,279 vehicles, 361 have no numeric engine capacity and 2 have no CRSP. Records without a CRSP cannot be
calculated and are marked as such in search results.

Fuel normalisation applied (raw values preserved): PETROL 3,021 · DIESEL 1,513 · ELECTRIC 356 · HYBRID 269 ·
PLUG_IN_HYBRID 71 · PETROL_ELECTRIC 26 · LNG 2 · CNG 2 · PETROL_DIESEL 1 · blank 18.

## 6. Reproducibility

Every calculation resolves against an explicit dataset version, tax rule version and depreciation version, and
the result records those version IDs so any historical estimate can be re-derived exactly.
