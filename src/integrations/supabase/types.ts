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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          category: string | null
          code: string
          created_at: string
          department: string | null
          employee_type: string
          id: string
          job_title: string | null
          name: string
          national_id: string | null
          section: string | null
          sub_section: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          department?: string | null
          employee_type?: string
          id?: string
          job_title?: string | null
          name: string
          national_id?: string | null
          section?: string | null
          sub_section?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          department?: string | null
          employee_type?: string
          id?: string
          job_title?: string | null
          name?: string
          national_id?: string | null
          section?: string | null
          sub_section?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      production_sections: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      violation_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      violations: {
        Row: {
          created_at: string
          employee_code: string | null
          employee_department: string | null
          employee_id: string | null
          employee_job_title: string | null
          employee_name: string | null
          id: string
          image_url: string | null
          inspector_name: string | null
          notes: string | null
          production_section: string | null
          severity: string
          status: string
          updated_at: string
          violation_date: string
          violation_type_id: string | null
        }
        Insert: {
          created_at?: string
          employee_code?: string | null
          employee_department?: string | null
          employee_id?: string | null
          employee_job_title?: string | null
          employee_name?: string | null
          id?: string
          image_url?: string | null
          inspector_name?: string | null
          notes?: string | null
          production_section?: string | null
          severity?: string
          status?: string
          updated_at?: string
          violation_date?: string
          violation_type_id?: string | null
        }
        Update: {
          created_at?: string
          employee_code?: string | null
          employee_department?: string | null
          employee_id?: string | null
          employee_job_title?: string | null
          employee_name?: string | null
          id?: string
          image_url?: string | null
          inspector_name?: string | null
          notes?: string | null
          production_section?: string | null
          severity?: string
          status?: string
          updated_at?: string
          violation_date?: string
          violation_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "violations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violations_violation_type_id_fkey"
            columns: ["violation_type_id"]
            isOneToOne: false
            referencedRelation: "violation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_forms: {
        Row: {
          id: string
          form_type: Database["public"]["Enums"]["quality_form_type"]
          form_date: string
          supervisor_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_type: Database["public"]["Enums"]["quality_form_type"]
          form_date: string
          supervisor_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_type?: Database["public"]["Enums"]["quality_form_type"]
          form_date?: string
          supervisor_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quality_form_records: {
        Row: {
          id: string
          form_id: string
          record_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          record_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          record_data?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_form_records_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "quality_forms"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      quality_form_type:
        | "in_process_control"
        | "daily_quality_report"
        | "baking_temperature"
        | "metal_detector"
        | "sifting"
        | "sensory_evaluation"
        | "non_conforming"
        | "cleaning"
        | "food_safety"
        | "final_release"
        | "weight_monitoring"
        | "additives_weights"
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
