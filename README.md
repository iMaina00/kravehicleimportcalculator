# Kenya Import Calc

You are building a production-ready Kenya Vehicle Import Tax & Duty Calculator.

IMPORTANT: Keep this project tightly focused on the calculation engine, source-data accuracy, database, and excellent vehicle search functionality.

Do not spend significant effort on visual design, animations, dashboards, complex UI, or unnecessary features. I have limited Lovable credits, so prioritize backend logic, data integrity, search, testing, and correctness.

PHASE 1: INSPECT THE SOURCE EXCEL FIRST

The authoritative source file is attached herein

Do not ask me to upload it again.

First locate the file in the workspace and inspect its complete contents.

Do not build the calculator logic until you understand the source workbook.

Determine:

Every worksheet

Headers and column structure

Number of records

Vehicle records

CRSP values

Depreciation schedules

Tax categories

Import-duty rates

Excise-duty rates

VAT rules

RDL rules

IDF rules

Engine-capacity thresholds

Fuel classifications

Vehicle categories

HS-code classifications

Fixed-amount taxes

Percentage-based taxes

Spreadsheet formulas

Direct-import rules

Previously registered vehicle rules

Special vehicle categories

Motorcycles

Machinery

Any other valuation rules

The Excel workbook is the source of truth.

Do not guess missing values.

If something cannot be determined from the workbook, mark it:

REQUIRES VERIFICATION

Do not invent a rule to make the calculation work.

PHASE 2: CREATE SOURCE_DATA_ANALYSIS.md

Create:

SOURCE_DATA_ANALYSIS.md

Document the actual structure discovered in the workbook.

Include:

CRSP data:

Worksheet names

Record counts

Column names

Data types

Vehicle categories

CRSP field

Missing values

Duplicate records

Important formatting inconsistencies

Valuation data:

Worksheets

Depreciation schedules

Tax categories

Engine thresholds

Fuel classifications

Tax rates

Formulas

Special cases

Direct-import rules

Previously registered rules

HS codes

Fixed taxes

Percentage taxes

Uncertainties requiring verification

Do not modify the original Excel file.

PHASE 3: DATABASE

Use PostgreSQL/Supabase if it is already configured in the project.

Create a proper database.

Do not read the Excel workbook every time a calculation runs.

Create versioned datasets.

Minimum tables:

vehicle_datasets

id

name

source_file

effective_date

imported_at

status

vehicles

id

dataset_id

make

model

model_number

transmission

drive_configuration

engine_capacity

body_type

gvw

seating

fuel

crsp_kes

original_row_data

motorcycles

Use an equivalent structure.

machinery

Use an equivalent structure.

Also create:

tax_rules

tax_rule_versions

depreciation_rules

vehicle_categories

engine_capacity_brackets

hs_code_rules

exchange_rates

Every tax rule must be versioned and configurable.

Never hard-code tax rates inside React components.

Every rule should support, where applicable:

Name

Category

Rate or formula

Calculation base

Vehicle type

Engine range

Fuel type

HS code

Import type

Effective date

Expiry date

Source

Verification status

PHASE 4: DATA IMPORT

Import the July 2026 CRSP workbook into the database.

Create:

Dataset: July 2026

Do not overwrite existing datasets.

Preserve original Excel row data wherever practical so every vehicle record can be traced back to its source.

Validate the imported data.

Check for:

Duplicate vehicles

Missing CRSP

Invalid engine capacities

Invalid fuel values

Formatting inconsistencies

Duplicate model variants

Empty required fields

Do not silently fix questionable data.

Flag questionable records for review.

PHASE 5: EXCELLENT VEHICLE SEARCH

Vehicle search is one of the highest priorities.

Build a fast searchable CRSP database.

Search should support:

Make

Model

Model number

Engine capacity

Fuel

Body type

Transmission

Drive configuration

Support fuzzy matching and normalization.

Users should not need to type the exact Excel formatting.

Examples:

"Mercedes GLE 450d"

should find relevant records even if the workbook contains variations such as:

Mercedes-Benz GLE 450 d

GLE450d

Mercedes GLE450d

Normalize:

Case

Spaces

Hyphens

Common punctuation

Manufacturer naming variations where safe

Do not merge genuinely different vehicles.

Search results should clearly show:

Make + Model

Engine
Fuel
Transmission
Drive
Body Type
CRSP

The selected database record becomes the source for the calculation.

Prioritize search speed and accuracy over visual complexity.

If PostgreSQL/Supabase supports suitable indexes or full-text/trigram search, use them.

Do not implement an unnecessarily complex search system if a simpler indexed approach is sufficient.

PHASE 6: CALCULATION ENGINE

Create a standalone calculation engine.

Suggested structure:

src/lib/calculator/

valuation.ts

depreciation.ts

classification.ts

importDuty.ts

excise.ts

vat.ts

rdl.ts

idf.ts

landedCost.ts

calculateImportTaxes.ts

The UI must never contain tax formulas.

The engine should accept structured input and return a structured calculation result.

Conceptual flow:

Vehicle
↓
CRSP
↓
Vehicle Age
↓
Depreciation
↓
Customs Value
↓
Vehicle Classification
↓
Import Duty
↓
Excise
↓
VAT
↓
RDL
↓
IDF
↓
Total Government Taxes
↓
Other Import Costs
↓
Estimated Landed Cost

Implement the formulas exactly as established from the Excel workbook.

Do not replace spreadsheet formulas with simplified assumptions.

PHASE 7: CALCULATOR INPUT

Keep the calculator interface simple.

The minimum inputs should be:

Vehicle type

Vehicle search

Year of manufacture

First registration date/year

Import date

Direct import or previously registered

Purchase price

Currency

Freight

Insurance

Other costs

Supported currencies:

USD
GBP
EUR
JPY
AED
KES

Use exchange rates from the database.

Do not build a complex multi-page UI.

A simple form is sufficient.

PHASE 8: CALCULATION RESULT

Return a structured calculation result containing:

Vehicle information

CRSP

Depreciation percentage

Depreciation amount

Customs value

Import duty

Excise duty

VAT

RDL

IDF

Total government taxes

Other import costs

Estimated landed cost

Each tax calculation should also return its calculation basis.

For example:

Import Duty:

Base

Rate

Formula

Result

Source rule

This is important for debugging and future verification.

PHASE 9: VERSIONING

Versioning is mandatory.

The July 2026 dataset must be stored as:

Dataset: July 2026

Tax rules must have their own version.

Depreciation rules must have their own version.

Exchange rates must have their own version.

Every calculation must permanently reference:

CRSP dataset version

Tax-rule version

Depreciation-rule version

Exchange-rate version

Historical calculations must remain reproducible.

Never overwrite historical source data or rules.

PHASE 10: AUTOMATED TESTING

Create automated tests based directly on the Excel valuation formulas.

Test at minimum:

Vehicles ≤1500cc

Vehicles >1500cc

Large petrol vehicles

Large diesel vehicles

EVs

School buses

Prime movers

Trailers

Ambulances

Motorcycles

Special-purpose vehicles

Heavy machinery

Direct imports

Previously registered vehicles

Where the workbook provides an example calculation, reproduce that example as an automated test.

Compare the application calculation against the spreadsheet.

If there is a discrepancy:

STOP.

Investigate the source formula, classification, depreciation rule, tax base, or data mapping.

Do not simply alter the application result to force a match.

Document the reason for the discrepancy.

PHASE 11: SIMPLE ADMIN DATA MANAGEMENT

Do not build a large admin dashboard.

Only create the minimum functionality required to manage the calculation data:

Import new CRSP XLSX

Preview imported records

Validate records

Import dataset

Publish dataset

Archive dataset

Manage tax-rule versions

Manage depreciation versions

Manage exchange-rate versions

Keep this functional and simple.

PHASE 12: SIMPLE UI

The UI should be minimal.

Do not spend credits on elaborate design.

The calculator only needs:

Vehicle search

Vehicle selection

Input form

Calculate button

Clear calculation results

Use clean typography and clear KES figures.

The primary message can be:

KNOW THE REAL COST BEFORE YOU IMPORT.

Do not build:

Complex animations

Marketing pages

Large landing pages

Complex navigation

Advanced visual dashboards

Unnecessary components

Elaborate admin UI

Focus development time on the calculator engine and search quality.

CRITICAL ARCHITECTURE

Use this separation:

Excel Source
↓
Data Import
↓
PostgreSQL/Supabase
↓
Versioned Rules
↓
Calculation Engine
↓
Simple API/Server Function
↓
Simple Calculator UI

The frontend should never contain authoritative tax rules.

The frontend should request calculations from the calculation engine.

CRITICAL RULES

The Excel workbook is the source of truth.

Do not:

Invent CRSP values

Invent tax rates

Invent depreciation percentages

Assume generic import-duty rates

Simplify spreadsheet formulas

Hard-code tax percentages in React

Overwrite the original Excel file

Delete historical datasets

Hide calculation discrepancies

If a value or rule cannot be established from the source:

REQUIRES VERIFICATION

Store it as configurable data instead of guessing.

DEVELOPMENT ORDER

Follow this exact priority:

Locate and inspect Excel

Create SOURCE_DATA_ANALYSIS.md

Create database schema

Import July 2026 data

Validate imported data

Create versioned tax rules

Build vehicle search

Build calculation engine

Build automated spreadsheet comparison tests

Validate all vehicle categories

Build the simple calculator interface

Add minimal data-management functionality

Do not start with UI.

Do not skip source analysis.

Do not build features that are not required for the calculator engine, vehicle search, data integrity, or validation.

FIRST TASK

Start by locating the source file which is attached herein

Inspect the complete workbook.

Then report exactly:

Whether the file was found

Every worksheet

Record counts

Column names

Relevant tax/valuation data discovered

Formulas discovered

Vehicle categories discovered

Any ambiguities

Any missing information

Create SOURCE_DATA_ANALYSIS.md.

Do not implement the calculation engine until this inspection is complete.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kravehicleimportcalculator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/72b2e0df-3e4f-4213-af48-cbe903c8d6ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
