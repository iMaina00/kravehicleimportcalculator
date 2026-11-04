export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      calculation_audit_logs: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      calculation_rule_versions: {
        Row: {
          created_at: string
          effective_date: string | null
          id: string
          name: string
          notes: string | null
          settings: Json
          status: string
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          id?: string
          name: string
          notes?: string | null
          settings?: Json
          status?: string
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          settings?: Json
          status?: string
        }
        Relationships: []
      }
      calculations: {
        Row: {
          created_at: string
          dataset_id: string | null
          depreciation_version_id: string | null
          exchange_rate_version_id: string | null
          id: string
          input: Json
          result: Json
          tax_rule_version_id: string | null
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          depreciation_version_id?: string | null
          exchange_rate_version_id?: string | null
          id?: string
          input: Json
          result: Json
          tax_rule_version_id?: string | null
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          depreciation_version_id?: string | null
          exchange_rate_version_id?: string | null
          id?: string
          input?: Json
          result?: Json
          tax_rule_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculations_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "vehicle_datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculations_depreciation_version_id_fkey"
            columns: ["depreciation_version_id"]
            isOneToOne: false
            referencedRelation: "depreciation_rule_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculations_exchange_rate_version_id_fkey"
            columns: ["exchange_rate_version_id"]
            isOneToOne: false
            referencedRelation: "exchange_rate_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculations_tax_rule_version_id_fkey"
            columns: ["tax_rule_version_id"]
            isOneToOne: false
            referencedRelation: "tax_rule_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      calibrated_crsp_values: {
        Row: {
          approved_at: string | null
          confidence: string
          created_at: string
          created_by: string | null
          group_id: string
          id: string
          includes_reference_ids: string[]
          method: string
          notes: string | null
          value: number
        }
        Insert: {
          approved_at?: string | null
          confidence?: string
          created_at?: string
          created_by?: string | null
          group_id: string
          id?: string
          includes_reference_ids?: string[]
          method: string
          notes?: string | null
          value: number
        }
        Update: {
          approved_at?: string | null
          confidence?: string
          created_at?: string
          created_by?: string | null
          group_id?: string
          id?: string
          includes_reference_ids?: string[]
          method?: string
          notes?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "calibrated_crsp_values_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "crsp_calibration_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      crsp_calibration_groups: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_crsp_kes: number | null
          approved_method: string | null
          created_at: string
          drivetrain: string | null
          engine_cc: number | null
          fuel: string | null
          id: string
          make: string
          model: string
          notes: string | null
          status: string
          tolerance_pct: number
          transmission: string | null
          variant: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_crsp_kes?: number | null
          approved_method?: string | null
          created_at?: string
          drivetrain?: string | null
          engine_cc?: number | null
          fuel?: string | null
          id?: string
          make: string
          model: string
          notes?: string | null
          status?: string
          tolerance_pct?: number
          transmission?: string | null
          variant?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_crsp_kes?: number | null
          approved_method?: string | null
          created_at?: string
          drivetrain?: string | null
          engine_cc?: number | null
          fuel?: string | null
          id?: string
          make?: string
          model?: string
          notes?: string | null
          status?: string
          tolerance_pct?: number
          transmission?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      data_validation_issues: {
        Row: {
          created_at: string
          dataset_id: string
          detail: string | null
          id: string
          issue_type: string
          record_id: string | null
          record_table: string
          severity: string
          source_row: number | null
        }
        Insert: {
          created_at?: string
          dataset_id: string
          detail?: string | null
          id?: string
          issue_type: string
          record_id?: string | null
          record_table: string
          severity?: string
          source_row?: number | null
        }
        Update: {
          created_at?: string
          dataset_id?: string
          detail?: string | null
          id?: string
          issue_type?: string
          record_id?: string | null
          record_table?: string
          severity?: string
          source_row?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_validation_issues_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "vehicle_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      depreciation_rule_versions: {
        Row: {
          created_at: string
          effective_date: string | null
          id: string
          name: string
          notes: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          id?: string
          name: string
          notes?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      depreciation_rules: {
        Row: {
          id: string
          import_type: string
          label: string
          max_years: number | null
          min_years: number
          rate: number
          sort_order: number
          source: string | null
          verification_status: string
          version_id: string
        }
        Insert: {
          id?: string
          import_type: string
          label: string
          max_years?: number | null
          min_years: number
          rate: number
          sort_order?: number
          source?: string | null
          verification_status?: string
          version_id: string
        }
        Update: {
          id?: string
          import_type?: string
          label?: string
          max_years?: number | null
          min_years?: number
          rate?: number
          sort_order?: number
          source?: string | null
          verification_status?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_rules_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "depreciation_rule_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_capacity_brackets: {
        Row: {
          category_code: string
          fuel_types: string[]
          id: string
          max_cc: number | null
          min_cc: number | null
          priority: number
          source: string | null
          verification_status: string
        }
        Insert: {
          category_code: string
          fuel_types?: string[]
          id?: string
          max_cc?: number | null
          min_cc?: number | null
          priority?: number
          source?: string | null
          verification_status?: string
        }
        Update: {
          category_code?: string
          fuel_types?: string[]
          id?: string
          max_cc?: number | null
          min_cc?: number | null
          priority?: number
          source?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "engine_capacity_brackets_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      exchange_rate_versions: {
        Row: {
          created_at: string
          effective_date: string | null
          id: string
          name: string
          notes: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          id?: string
          name: string
          notes?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          currency: string
          id: string
          rate_to_kes: number
          source: string | null
          verification_status: string
          version_id: string
        }
        Insert: {
          currency: string
          id?: string
          rate_to_kes: number
          source?: string | null
          verification_status?: string
          version_id: string
        }
        Update: {
          currency?: string
          id?: string
          rate_to_kes?: number
          source?: string | null
          verification_status?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "exchange_rate_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      hs_code_rules: {
        Row: {
          category_code: string
          description: string | null
          hs_code: string
          id: string
          source: string | null
          verification_status: string
        }
        Insert: {
          category_code: string
          description?: string | null
          hs_code: string
          id?: string
          source?: string | null
          verification_status?: string
        }
        Update: {
          category_code?: string
          description?: string | null
          hs_code?: string
          id?: string
          source?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hs_code_rules_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      insider_tax_references: {
        Row: {
          assessment_year: number
          created_at: string
          created_by: string | null
          customs_value_kes: number | null
          date_received: string | null
          drivetrain: string | null
          engine_cc: number | null
          excise_duty_kes: number | null
          extra_depreciation_pct: number
          final_taxes_kes: number
          fuel: string | null
          id: string
          idf_kes: number | null
          import_category: string
          import_duty_kes: number | null
          is_rounded: boolean
          make: string
          manufacturing_year: number
          model: string
          notes: string | null
          rdl_kes: number | null
          rounding_precision: number | null
          source_reference: string | null
          standard_depreciation_pct: number | null
          status: string
          tax_category_code: string | null
          transmission: string | null
          variant: string | null
          vat_kes: number | null
        }
        Insert: {
          assessment_year?: number
          created_at?: string
          created_by?: string | null
          customs_value_kes?: number | null
          date_received?: string | null
          drivetrain?: string | null
          engine_cc?: number | null
          excise_duty_kes?: number | null
          extra_depreciation_pct?: number
          final_taxes_kes: number
          fuel?: string | null
          id?: string
          idf_kes?: number | null
          import_category?: string
          import_duty_kes?: number | null
          is_rounded?: boolean
          make: string
          manufacturing_year: number
          model: string
          notes?: string | null
          rdl_kes?: number | null
          rounding_precision?: number | null
          source_reference?: string | null
          standard_depreciation_pct?: number | null
          status?: string
          tax_category_code?: string | null
          transmission?: string | null
          variant?: string | null
          vat_kes?: number | null
        }
        Update: {
          assessment_year?: number
          created_at?: string
          created_by?: string | null
          customs_value_kes?: number | null
          date_received?: string | null
          drivetrain?: string | null
          engine_cc?: number | null
          excise_duty_kes?: number | null
          extra_depreciation_pct?: number
          final_taxes_kes?: number
          fuel?: string | null
          id?: string
          idf_kes?: number | null
          import_category?: string
          import_duty_kes?: number | null
          is_rounded?: boolean
          make?: string
          manufacturing_year?: number
          model?: string
          notes?: string | null
          rdl_kes?: number | null
          rounding_precision?: number | null
          source_reference?: string | null
          standard_depreciation_pct?: number | null
          status?: string
          tax_category_code?: string | null
          transmission?: string | null
          variant?: string | null
          vat_kes?: number | null
        }
        Relationships: []
      }
      machinery: {
        Row: {
          crsp_kes: number | null
          dataset_id: string
          flags: string[]
          id: string
          make: string | null
          model: string | null
          original_row_data: Json
          rating_raw: string | null
          search_compact: string | null
          search_text: string | null
          source_row: number | null
        }
        Insert: {
          crsp_kes?: number | null
          dataset_id: string
          flags?: string[]
          id?: string
          make?: string | null
          model?: string | null
          original_row_data?: Json
          rating_raw?: string | null
          search_compact?: string | null
          search_text?: string | null
          source_row?: number | null
        }
        Update: {
          crsp_kes?: number | null
          dataset_id?: string
          flags?: string[]
          id?: string
          make?: string | null
          model?: string | null
          original_row_data?: Json
          rating_raw?: string | null
          search_compact?: string | null
          search_text?: string | null
          source_row?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machinery_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "vehicle_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      missing_year_estimates: {
        Row: {
          age_years: number
          created_at: string
          crsp_kes: number
          crsp_source: string
          estimated_taxes_kes: number
          extra_depreciation_pct: number
          group_id: string
          id: string
          manufacturing_year: number
          notes: string | null
          standard_depreciation_pct: number | null
          status: string
        }
        Insert: {
          age_years: number
          created_at?: string
          crsp_kes: number
          crsp_source: string
          estimated_taxes_kes: number
          extra_depreciation_pct?: number
          group_id: string
          id?: string
          manufacturing_year: number
          notes?: string | null
          standard_depreciation_pct?: number | null
          status?: string
        }
        Update: {
          age_years?: number
          created_at?: string
          crsp_kes?: number
          crsp_source?: string
          estimated_taxes_kes?: number
          extra_depreciation_pct?: number
          group_id?: string
          id?: string
          manufacturing_year?: number
          notes?: string | null
          standard_depreciation_pct?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_year_estimates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "crsp_calibration_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          crsp_kes: number | null
          dataset_id: string
          engine_capacity_cc: number | null
          engine_capacity_raw: string | null
          flags: string[]
          fuel_normalized: string | null
          fuel_raw: string | null
          id: string
          make: string | null
          model: string | null
          model_number: string | null
          original_row_data: Json
          search_compact: string | null
          search_text: string | null
          seating: string | null
          source_row: number | null
          transmission: string | null
        }
        Insert: {
          crsp_kes?: number | null
          dataset_id: string
          engine_capacity_cc?: number | null
          engine_capacity_raw?: string | null
          flags?: string[]
          fuel_normalized?: string | null
          fuel_raw?: string | null
          id?: string
          make?: string | null
          model?: string | null
          model_number?: string | null
          original_row_data?: Json
          search_compact?: string | null
          search_text?: string | null
          seating?: string | null
          source_row?: number | null
          transmission?: string | null
        }
        Update: {
          crsp_kes?: number | null
          dataset_id?: string
          engine_capacity_cc?: number | null
          engine_capacity_raw?: string | null
          flags?: string[]
          fuel_normalized?: string | null
          fuel_raw?: string | null
          id?: string
          make?: string | null
          model?: string | null
          model_number?: string | null
          original_row_data?: Json
          search_compact?: string | null
          search_text?: string | null
          seating?: string | null
          source_row?: number | null
          transmission?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "vehicle_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      reverse_engineering_results: {
        Row: {
          confidence: string
          created_at: string
          created_by: string | null
          difference_kes: number | null
          forward: Json
          forward_calculated_kes: number | null
          id: string
          inferred_crsp_kes: number | null
          input: Json
          notes: string | null
          reference_id: string | null
          result: Json
        }
        Insert: {
          confidence: string
          created_at?: string
          created_by?: string | null
          difference_kes?: number | null
          forward: Json
          forward_calculated_kes?: number | null
          id?: string
          inferred_crsp_kes?: number | null
          input: Json
          notes?: string | null
          reference_id?: string | null
          result: Json
        }
        Update: {
          confidence?: string
          created_at?: string
          created_by?: string | null
          difference_kes?: number | null
          forward?: Json
          forward_calculated_kes?: number | null
          id?: string
          inferred_crsp_kes?: number | null
          input?: Json
          notes?: string | null
          reference_id?: string | null
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "reverse_engineering_results_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "insider_tax_references"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rule_versions: {
        Row: {
          created_at: string
          effective_date: string | null
          expiry_date: string | null
          id: string
          name: string
          notes: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          name: string
          notes?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          calculation_base: string
          category_code: string
          customs_divisors: number[]
          effective_date: string | null
          engine_max_cc: number | null
          engine_min_cc: number | null
          expiry_date: string | null
          fixed_amount: number | null
          formula: string
          fuel_types: string[]
          hs_codes: string[]
          id: string
          import_type: string
          name: string
          rate: number | null
          sort_order: number
          source: string | null
          tax_type: string
          vehicle_type: string | null
          verification_status: string
          version_id: string
        }
        Insert: {
          calculation_base: string
          category_code: string
          customs_divisors?: number[]
          effective_date?: string | null
          engine_max_cc?: number | null
          engine_min_cc?: number | null
          expiry_date?: string | null
          fixed_amount?: number | null
          formula: string
          fuel_types?: string[]
          hs_codes?: string[]
          id?: string
          import_type: string
          name: string
          rate?: number | null
          sort_order?: number
          source?: string | null
          tax_type: string
          vehicle_type?: string | null
          verification_status?: string
          version_id: string
        }
        Update: {
          calculation_base?: string
          category_code?: string
          customs_divisors?: number[]
          effective_date?: string | null
          engine_max_cc?: number | null
          engine_min_cc?: number | null
          expiry_date?: string | null
          fixed_amount?: number | null
          formula?: string
          fuel_types?: string[]
          hs_codes?: string[]
          id?: string
          import_type?: string
          name?: string
          rate?: number | null
          sort_order?: number
          source?: string | null
          tax_type?: string
          vehicle_type?: string | null
          verification_status?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_rules_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tax_rules_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "tax_rule_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_categories: {
        Row: {
          code: string
          description: string | null
          hs_codes: string[]
          name: string
          sort_order: number
          source: string | null
          verification_status: string
        }
        Insert: {
          code: string
          description?: string | null
          hs_codes?: string[]
          name: string
          sort_order?: number
          source?: string | null
          verification_status?: string
        }
        Update: {
          code?: string
          description?: string | null
          hs_codes?: string[]
          name?: string
          sort_order?: number
          source?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      vehicle_datasets: {
        Row: {
          effective_date: string | null
          id: string
          imported_at: string
          name: string
          notes: string | null
          source_file: string
          status: string
        }
        Insert: {
          effective_date?: string | null
          id?: string
          imported_at?: string
          name: string
          notes?: string | null
          source_file: string
          status?: string
        }
        Update: {
          effective_date?: string | null
          id?: string
          imported_at?: string
          name?: string
          notes?: string | null
          source_file?: string
          status?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_normalized: string | null
          body_type: string | null
          crsp_kes: number | null
          dataset_id: string
          drive_configuration: string | null
          drive_normalized: string | null
          engine_capacity_cc: number | null
          engine_capacity_raw: string | null
          engine_hp: number | null
          engine_kwh: number | null
          flags: string[]
          fuel_label: string | null
          fuel_normalized: string | null
          fuel_raw: string | null
          gvw: string | null
          id: string
          make: string | null
          make_normalized: string | null
          model: string | null
          model_normalized: string | null
          model_number: string | null
          original_row_data: Json
          search_blob: string | null
          search_compact: string | null
          search_text: string | null
          seating: string | null
          seating_count: number | null
          source_row: number | null
          transmission: string | null
          transmission_normalized: string | null
          trim_normalized: string | null
        }
        Insert: {
          body_normalized?: string | null
          body_type?: string | null
          crsp_kes?: number | null
          dataset_id: string
          drive_configuration?: string | null
          drive_normalized?: string | null
          engine_capacity_cc?: number | null
          engine_capacity_raw?: string | null
          engine_hp?: number | null
          engine_kwh?: number | null
          flags?: string[]
          fuel_label?: string | null
          fuel_normalized?: string | null
          fuel_raw?: string | null
          gvw?: string | null
          id?: string
          make?: string | null
          make_normalized?: string | null
          model?: string | null
          model_normalized?: string | null
          model_number?: string | null
          original_row_data?: Json
          search_blob?: string | null
          search_compact?: string | null
          search_text?: string | null
          seating?: string | null
          seating_count?: number | null
          source_row?: number | null
          transmission?: string | null
          transmission_normalized?: string | null
          trim_normalized?: string | null
        }
        Update: {
          body_normalized?: string | null
          body_type?: string | null
          crsp_kes?: number | null
          dataset_id?: string
          drive_configuration?: string | null
          drive_normalized?: string | null
          engine_capacity_cc?: number | null
          engine_capacity_raw?: string | null
          engine_hp?: number | null
          engine_kwh?: number | null
          flags?: string[]
          fuel_label?: string | null
          fuel_normalized?: string | null
          fuel_raw?: string | null
          gvw?: string | null
          id?: string
          make?: string | null
          make_normalized?: string | null
          model?: string | null
          model_normalized?: string | null
          model_number?: string | null
          original_row_data?: Json
          search_blob?: string | null
          search_compact?: string | null
          search_text?: string | null
          seating?: string | null
          seating_count?: number | null
          source_row?: number | null
          transmission?: string | null
          transmission_normalized?: string | null
          trim_normalized?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "vehicle_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      __probe_has: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      crsp_body_label: { Args: { t: string }; Returns: string }
      crsp_drive_label: { Args: { t: string }; Returns: string }
      crsp_engine_cc: { Args: { t: string }; Returns: number }
      crsp_engine_hp: { Args: { t: string }; Returns: number }
      crsp_engine_kwh: { Args: { t: string }; Returns: number }
      crsp_filter_options: {
        Args: {
          p_dataset: string
          p_field: string
          p_limit?: number
          p_makes?: string[]
          p_models?: string[]
          p_query?: string
          p_trims?: string[]
        }
        Returns: {
          record_count: number
          value: string
        }[]
      }
      crsp_fuel_label: { Args: { t: string }; Returns: string }
      crsp_model_base: { Args: { t: string }; Returns: string }
      crsp_model_trim: { Args: { t: string }; Returns: string }
      crsp_norm: { Args: { t: string }; Returns: string }
      crsp_options: {
        Args: {
          p_dataset: string
          p_field: string
          p_limit?: number
          p_make?: string
          p_model?: string
          p_query?: string
          p_record_type: string
        }
        Returns: {
          record_count: number
          value: string
        }[]
      }
      crsp_search: {
        Args: {
          p_bodies?: string[]
          p_cc_max?: number
          p_cc_min?: number
          p_crsp_max?: number
          p_crsp_min?: number
          p_dataset: string
          p_drives?: string[]
          p_fuels?: string[]
          p_limit?: number
          p_makes?: string[]
          p_model_numbers?: string[]
          p_models?: string[]
          p_offset?: number
          p_query?: string
          p_seats?: number[]
          p_sort?: string
          p_transmissions?: string[]
          p_trims?: string[]
        }
        Returns: {
          body_normalized: string
          body_type: string
          crsp_kes: number
          drive_configuration: string
          drive_normalized: string
          engine_capacity_cc: number
          engine_capacity_raw: string
          engine_hp: number
          engine_kwh: number
          flags: string[]
          fuel_label: string
          fuel_normalized: string
          fuel_raw: string
          gvw: string
          id: string
          make: string
          model: string
          model_normalized: string
          model_number: string
          score: number
          seating: string
          seating_count: number
          source_row: number
          total_count: number
          transmission: string
          transmission_normalized: string
          trim_normalized: string
        }[]
      }
      crsp_seat_count: { Args: { t: string }; Returns: number }
      crsp_transmission_label: { Args: { t: string }; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      search_machinery: {
        Args: {
          p_dataset: string
          p_limit?: number
          p_query: string
          p_tokens: string[]
        }
        Returns: {
          crsp_kes: number
          flags: string[]
          id: string
          make: string
          model: string
          rating_raw: string
          score: number
        }[]
      }
      search_motorcycles: {
        Args: {
          p_dataset: string
          p_limit?: number
          p_query: string
          p_tokens: string[]
        }
        Returns: {
          crsp_kes: number
          engine_capacity_cc: number
          engine_capacity_raw: string
          flags: string[]
          fuel_normalized: string
          fuel_raw: string
          id: string
          make: string
          model: string
          model_number: string
          score: number
          seating: string
          transmission: string
        }[]
      }
      search_vehicles: {
        Args: {
          p_body_type?: string
          p_dataset: string
          p_drive?: string
          p_engine_max?: number
          p_engine_min?: number
          p_fuel?: string
          p_limit?: number
          p_query: string
          p_tokens: string[]
          p_transmission?: string
        }
        Returns: {
          body_type: string
          crsp_kes: number
          drive_configuration: string
          engine_capacity_cc: number
          engine_capacity_raw: string
          flags: string[]
          fuel_normalized: string
          fuel_raw: string
          gvw: string
          id: string
          make: string
          model: string
          model_number: string
          score: number
          seating: string
          transmission: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
