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
          body_type: string | null
          crsp_kes: number | null
          dataset_id: string
          drive_configuration: string | null
          engine_capacity_cc: number | null
          engine_capacity_raw: string | null
          flags: string[]
          fuel_normalized: string | null
          fuel_raw: string | null
          gvw: string | null
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
          body_type?: string | null
          crsp_kes?: number | null
          dataset_id: string
          drive_configuration?: string | null
          engine_capacity_cc?: number | null
          engine_capacity_raw?: string | null
          flags?: string[]
          fuel_normalized?: string | null
          fuel_raw?: string | null
          gvw?: string | null
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
          body_type?: string | null
          crsp_kes?: number | null
          dataset_id?: string
          drive_configuration?: string | null
          engine_capacity_cc?: number | null
          engine_capacity_raw?: string | null
          flags?: string[]
          fuel_normalized?: string | null
          fuel_raw?: string | null
          gvw?: string | null
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
