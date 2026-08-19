-- Versioned rules seeded verbatim from the "TEMPLATE 2025" worksheet of the KRA CRSP workbook.
-- Every rate/divisor below is copied from a spreadsheet formula; nothing is inferred.
BEGIN;

INSERT INTO vehicle_categories (code,name,description,hs_codes,sort_order,source) VALUES
('UNDER_1500CC','MVs not exceeding 1500cc','Incl. s/cab pick ups, lorries, buses; excludes school buses for public schools','{}',1,'TEMPLATE 2025!B22'),
('OVER_1500CC','MVs exceeding 1500cc','HS 8702, 8703 and 8704 excluding 8703.24.90 and 8703.33.90','{8702,8703,8704}',2,'TEMPLATE 2025!B39'),
('LARGE_ENGINE','MVs >3000cc petrol / >2500cc diesel','HS 8703.24.90 and 8703.33.90','{8703.24.90,8703.33.90}',3,'TEMPLATE 2025!B56'),
('ELECTRIC_PASSENGER','100% electric vehicles for transport of persons','HS 8702.40.11/19/21/22/29/91/99 and 8703.80.00','{8702.40.11,8702.40.19,8702.40.21,8702.40.22,8702.40.29,8702.40.91,8702.40.99,8703.80.00}',4,'TEMPLATE 2025!B72'),
('SCHOOL_BUS_PUBLIC','School buses for public schools',NULL,'{}',5,'TEMPLATE 2025!B88'),
('PRIME_MOVER','Prime movers (no excise duty)',NULL,'{}',6,'TEMPLATE 2025!B106'),
('TRAILER','Trailers (no excise duty)',NULL,'{}',7,'TEMPLATE 2025!B122'),
('AMBULANCE','Ambulance',NULL,'{}',8,'TEMPLATE 2025!B138'),
('MOTORCYCLE','Motor cycles',NULL,'{}',9,'TEMPLATE 2025!B154'),
('SPECIAL_PURPOSE','Special purpose vehicles',NULL,'{}',10,'TEMPLATE 2025!B170'),
('HEAVY_MACHINERY','Heavy machinery',NULL,'{}',11,'TEMPLATE 2025!B187');

INSERT INTO hs_code_rules (category_code,hs_code,description,source)
SELECT code, unnest(hs_codes), name, source FROM vehicle_categories WHERE array_length(hs_codes,1) > 0;

-- Engine thresholds explicitly stated in the workbook headings.
INSERT INTO engine_capacity_brackets (category_code,fuel_types,min_cc,max_cc,priority,source) VALUES
('LARGE_ENGINE','{PETROL,PETROL_ELECTRIC}',3001,NULL,10,'TEMPLATE 2025!B56'),
('LARGE_ENGINE','{DIESEL,PETROL_DIESEL}',2501,NULL,10,'TEMPLATE 2025!B56'),
('UNDER_1500CC','{}',NULL,1500,20,'TEMPLATE 2025!B22'),
('OVER_1500CC','{}',1501,NULL,30,'TEMPLATE 2025!B39');

INSERT INTO tax_rule_versions (id,name,effective_date,status,source,notes) VALUES
('11111111-1111-4111-8111-111111111111','KRA TEMPLATE 2025 (July 2026 workbook)','2026-07-01','published',
 'New-CRSP---July-2026.xlsx / TEMPLATE 2025',
 'Every tabulation is headed "GUIDELINE SUBJECT TO VERIFICATION". Prepared 2025-05-30 by Walter Kimani, reviewed by Frank Orondo, approved by David Kirui.');

INSERT INTO depreciation_rule_versions (id,name,effective_date,status,source,notes) VALUES
('22222222-2222-4222-8222-222222222222','KRA TEMPLATE 2025 depreciation','2026-07-01','published',
 'New-CRSP---July-2026.xlsx / TEMPLATE 2025 rows 3-18',
 'Direct-import table stops at 8 years; ages above that are REQUIRES VERIFICATION.');

INSERT INTO exchange_rate_versions (id,name,effective_date,status,source,notes) VALUES
('33333333-3333-4333-8333-333333333333','Baseline (KES only)','2026-07-01','published','Not present in source workbook',
 'The workbook contains no exchange rates. Non-KES rates REQUIRE VERIFICATION and must be entered in admin before use.');

INSERT INTO exchange_rates (version_id,currency,rate_to_kes,source,verification_status) VALUES
('33333333-3333-4333-8333-333333333333','KES',1,'Identity','verified');

-- Depreciation: direct imports (TEMPLATE 2025!B3:C9)
INSERT INTO depreciation_rules (version_id,import_type,label,min_years,max_years,rate,source,sort_order) VALUES
('22222222-2222-4222-8222-222222222222','direct','>1 <=2 years',1,2,0.20,'TEMPLATE 2025!C3',1),
('22222222-2222-4222-8222-222222222222','direct','>2 <=3 years',2,3,0.30,'TEMPLATE 2025!C4',2),
('22222222-2222-4222-8222-222222222222','direct','>3 <=4 years',3,4,0.40,'TEMPLATE 2025!C5',3),
('22222222-2222-4222-8222-222222222222','direct','>4 <=5 years',4,5,0.50,'TEMPLATE 2025!C6',4),
('22222222-2222-4222-8222-222222222222','direct','>5 <=6 years',5,6,0.55,'TEMPLATE 2025!C7',5),
('22222222-2222-4222-8222-222222222222','direct','>6 <=7 years',6,7,0.60,'TEMPLATE 2025!C8',6),
('22222222-2222-4222-8222-222222222222','direct','>7 <=8 years',7,8,0.65,'TEMPLATE 2025!C9',7),
-- Depreciation: previously registered in Kenya (TEMPLATE 2025!I3:J18)
('22222222-2222-4222-8222-222222222222','previously_registered','1 year',0,1,0.20,'TEMPLATE 2025!J3',1),
('22222222-2222-4222-8222-222222222222','previously_registered','2 years',1,2,0.35,'TEMPLATE 2025!J4',2),
('22222222-2222-4222-8222-222222222222','previously_registered','3 years',2,3,0.50,'TEMPLATE 2025!J5',3),
('22222222-2222-4222-8222-222222222222','previously_registered','4 years',3,4,0.60,'TEMPLATE 2025!J6',4),
('22222222-2222-4222-8222-222222222222','previously_registered','5 years',4,5,0.70,'TEMPLATE 2025!J7',5),
('22222222-2222-4222-8222-222222222222','previously_registered','6 years',5,6,0.75,'TEMPLATE 2025!J8',6),
('22222222-2222-4222-8222-222222222222','previously_registered','7 years',6,7,0.80,'TEMPLATE 2025!J9',7),
('22222222-2222-4222-8222-222222222222','previously_registered','8 years',7,8,0.83,'TEMPLATE 2025!J10',8),
('22222222-2222-4222-8222-222222222222','previously_registered','9 years',8,9,0.86,'TEMPLATE 2025!J11',9),
('22222222-2222-4222-8222-222222222222','previously_registered','10 years',9,10,0.89,'TEMPLATE 2025!J12',10),
('22222222-2222-4222-8222-222222222222','previously_registered','11 years',10,11,0.90,'TEMPLATE 2025!J13',11),
('22222222-2222-4222-8222-222222222222','previously_registered','12 years',11,12,0.91,'TEMPLATE 2025!J14',12),
('22222222-2222-4222-8222-222222222222','previously_registered','13 years',12,13,0.92,'TEMPLATE 2025!J15',13),
('22222222-2222-4222-8222-222222222222','previously_registered','14 years',13,14,0.93,'TEMPLATE 2025!J16',14),
('22222222-2222-4222-8222-222222222222','previously_registered','15 years',14,15,0.94,'TEMPLATE 2025!J17',15),
('22222222-2222-4222-8222-222222222222','previously_registered','over 15 years',15,NULL,0.95,'TEMPLATE 2025!J18',16);

-- Tax rules. customs_divisors holds the full divisor chain of the workbook customs-value formula:
-- customs = ((CRSP / d1) * (1 - dep) / d2 / d3 ...) * (1 - extra_dep)
INSERT INTO tax_rules (version_id,category_code,import_type,name,tax_type,rate,fixed_amount,formula,calculation_base,customs_divisors,source,sort_order)
SELECT '11111111-1111-4111-8111-111111111111', c.code, t.import_type, r.name, r.tax_type, r.rate, r.fixed_amount, r.formula, r.calculation_base, r.divisors, r.source, r.sort_order
FROM (VALUES ('direct'),('previously_registered')) AS t(import_type)
CROSS JOIN LATERAL (VALUES (1)) AS dummy(x)
JOIN LATERAL (SELECT 1) s ON true
JOIN vehicle_categories c ON true
JOIN LATERAL (
  VALUES
  ('Customs value','customs_value',NULL::numeric,NULL::numeric,'((CRSP / d1) * (1 - depreciation) / d2 ... ) * (1 - extra_depreciation)','crsp',
    CASE c.code
      WHEN 'UNDER_1500CC' THEN ARRAY[1.25,1.35,1.2,1.16]
      WHEN 'OVER_1500CC' THEN ARRAY[1.25,1.35,1.25,1.16]
      WHEN 'LARGE_ENGINE' THEN ARRAY[1.25,1.35,1.35,1.16]
      WHEN 'ELECTRIC_PASSENGER' THEN ARRAY[1.25,1.35,1.1,1.16]
      WHEN 'SCHOOL_BUS_PUBLIC' THEN ARRAY[1.25,1.35,1.25,1.16]
      WHEN 'PRIME_MOVER' THEN ARRAY[1.25,1.35,1.16]
      WHEN 'TRAILER' THEN ARRAY[1.25,1.35,1.16]
      WHEN 'AMBULANCE' THEN ARRAY[1.25,1.25,1.16]
      WHEN 'MOTORCYCLE' THEN ARRAY[1.25,1.25,1.16]
      WHEN 'SPECIAL_PURPOSE' THEN ARRAY[1.25,1.16]
      WHEN 'HEAVY_MACHINERY' THEN ARRAY[1.25,1.16]
    END::numeric[], 'TEMPLATE 2025 customs value formula', 1),
  ('Import Duty','import_duty',
    CASE c.code
      WHEN 'ELECTRIC_PASSENGER' THEN 0.25 WHEN 'PRIME_MOVER' THEN 0.25 WHEN 'MOTORCYCLE' THEN 0.25
      WHEN 'AMBULANCE' THEN 0 WHEN 'SPECIAL_PURPOSE' THEN 0 WHEN 'HEAVY_MACHINERY' THEN 0
      ELSE 0.35 END::numeric,
    NULL::numeric,'customs_value * rate','customs_value','{}'::numeric[],'TEMPLATE 2025 import duty formula',2),
  ('Excise Duty','excise',
    CASE c.code
      WHEN 'UNDER_1500CC' THEN 0.20 WHEN 'OVER_1500CC' THEN 0.25 WHEN 'LARGE_ENGINE' THEN 0.35
      WHEN 'ELECTRIC_PASSENGER' THEN 0.10 WHEN 'SCHOOL_BUS_PUBLIC' THEN 0.25 WHEN 'AMBULANCE' THEN 0.25
      WHEN 'MOTORCYCLE' THEN NULL ELSE 0 END::numeric,
    CASE c.code WHEN 'MOTORCYCLE' THEN 12953 ELSE NULL END::numeric,
    CASE c.code WHEN 'MOTORCYCLE' THEN 'fixed amount' ELSE '(customs_value + import_duty) * rate' END,
    CASE c.code WHEN 'MOTORCYCLE' THEN 'fixed' ELSE 'customs_value_plus_import_duty' END,
    '{}'::numeric[],'TEMPLATE 2025 excise duty formula',3),
  ('VAT','vat',0.16,NULL::numeric,'(customs_value + import_duty + excise) * rate','customs_value_plus_import_duty_plus_excise','{}'::numeric[],'TEMPLATE 2025 VAT formula',4),
  ('Railway Development Levy (RDL)','rdl',0.02,NULL::numeric,'customs_value * rate','customs_value','{}'::numeric[],'TEMPLATE 2025 RDL formula',5),
  ('Import Declaration Fee (IDF)','idf',0.025,NULL::numeric,'customs_value * rate','customs_value','{}'::numeric[],'TEMPLATE 2025 IDF formula',6)
) AS r(name,tax_type,rate,fixed_amount,formula,calculation_base,divisors,source,sort_order) ON true;

COMMIT;
