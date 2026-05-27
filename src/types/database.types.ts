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
      ai_logs: {
        Row: {
          created_at: string
          error_message: string | null
          estimated_cost: number | null
          id: string
          input_payload: Json
          mission_id: string | null
          model_name: string
          model_provider: string
          output_payload: Json
          prompt_version: string
          status: string
          token_input_estimate: number | null
          token_output_estimate: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          input_payload: Json
          mission_id?: string | null
          model_name: string
          model_provider: string
          output_payload: Json
          prompt_version: string
          status: string
          token_input_estimate?: number | null
          token_output_estimate?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          input_payload?: Json
          mission_id?: string | null
          model_name?: string
          model_provider?: string
          output_payload?: Json
          prompt_version?: string
          status?: string
          token_input_estimate?: number | null
          token_output_estimate?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_name: string
          business_segment: string
          contact_estimate: string
          created_at: string
          current_offer: string | null
          has_customer_database: string
          id: string
          main_sales_channel: string
          main_sales_problem: string
          product_or_service_summary: string
          status: string
          target_customer: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          business_segment: string
          contact_estimate: string
          created_at?: string
          current_offer?: string | null
          has_customer_database: string
          id?: string
          main_sales_channel: string
          main_sales_problem: string
          product_or_service_summary: string
          status?: string
          target_customer: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          business_segment?: string
          contact_estimate?: string
          created_at?: string
          current_offer?: string | null
          has_customer_database?: string
          id?: string
          main_sales_channel?: string
          main_sales_problem?: string
          product_or_service_summary?: string
          status?: string
          target_customer?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_evaluations: {
        Row: {
          admin_note: string | null
          created_at: string
          created_by: string
          evaluation_status: string
          id: string
          insight_summary: string | null
          mission_id: string
          recommendation_next_day: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          created_by?: string
          evaluation_status: string
          id?: string
          insight_summary?: string | null
          mission_id: string
          recommendation_next_day?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          created_by?: string
          evaluation_status?: string
          id?: string
          insight_summary?: string | null
          mission_id?: string
          recommendation_next_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_evaluations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_items: {
        Row: {
          action_instruction: string
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          mission_order: number
          mission_type: string
          quality_score: number | null
          quality_status: string | null
          script_text: string | null
          status: string
          target_description: string
          target_minimum: string | null
          user_id: string
        }
        Insert: {
          action_instruction: string
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          mission_order: number
          mission_type: string
          quality_score?: number | null
          quality_status?: string | null
          script_text?: string | null
          status?: string
          target_description: string
          target_minimum?: string | null
          user_id: string
        }
        Update: {
          action_instruction?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          mission_order?: number
          mission_type?: string
          quality_score?: number | null
          quality_status?: string | null
          script_text?: string | null
          status?: string
          target_description?: string
          target_minimum?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_items_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_reports: {
        Row: {
          chats_sent: number | null
          closing_status: boolean
          created_at: string
          id: string
          mission_id: string
          obstacle: string | null
          raw_user_reply: string | null
          report_code: string
          reported_at: string
          responses_count: number | null
          revenue_amount: number | null
          rga_count: number
          user_id: string
        }
        Insert: {
          chats_sent?: number | null
          closing_status?: boolean
          created_at?: string
          id?: string
          mission_id: string
          obstacle?: string | null
          raw_user_reply?: string | null
          report_code: string
          reported_at?: string
          responses_count?: number | null
          revenue_amount?: number | null
          rga_count?: number
          user_id: string
        }
        Update: {
          chats_sent?: number | null
          closing_status?: boolean
          created_at?: string
          id?: string
          mission_id?: string
          obstacle?: string | null
          raw_user_reply?: string | null
          report_code?: string
          reported_at?: string
          responses_count?: number | null
          revenue_amount?: number | null
          rga_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_reports_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      missions: {
        Row: {
          business_profile_id: string
          created_at: string
          created_by: string
          delivery_channel: string
          id: string
          mission_date: string
          mission_status: string
          product_id: string | null
          prompt_version: string
          sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string
          created_by?: string
          delivery_channel: string
          id?: string
          mission_date: string
          mission_status?: string
          product_id?: string | null
          prompt_version?: string
          sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string
          created_by?: string
          delivery_channel?: string
          id?: string
          mission_date?: string
          mission_status?: string
          product_id?: string | null
          prompt_version?: string
          sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_validations: {
        Row: {
          amount_paid: number | null
          cohort_name: string | null
          commitment_action: boolean
          created_at: string
          follow_up_date: string | null
          id: string
          offer_type: string
          payment_action: string
          payment_date: string | null
          payment_method: string | null
          reason_if_no: string | null
          updated_at: string
          user_id: string
          verbal_intent: string | null
        }
        Insert: {
          amount_paid?: number | null
          cohort_name?: string | null
          commitment_action?: boolean
          created_at?: string
          follow_up_date?: string | null
          id?: string
          offer_type: string
          payment_action?: string
          payment_date?: string | null
          payment_method?: string | null
          reason_if_no?: string | null
          updated_at?: string
          user_id: string
          verbal_intent?: string | null
        }
        Update: {
          amount_paid?: number | null
          cohort_name?: string | null
          commitment_action?: boolean
          created_at?: string
          follow_up_date?: string | null
          id?: string
          offer_type?: string
          payment_action?: string
          payment_date?: string | null
          payment_method?: string | null
          reason_if_no?: string | null
          updated_at?: string
          user_id?: string
          verbal_intent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_validations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_validations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: string | null
          business_profile_id: string
          created_at: string
          id: string
          is_primary: boolean
          notes: string | null
          price: number | null
          product_description: string | null
          product_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_status?: string | null
          business_profile_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          price?: number | null
          product_description?: string | null
          product_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_status?: string | null
          business_profile_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          price?: number | null
          product_description?: string | null
          product_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          payment_validation_id: string | null
          plan_name: string
          price: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          payment_validation_id?: string | null
          plan_name: string
          price: number
          start_date: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          payment_validation_id?: string | null
          plan_name?: string
          price?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_validation_id_fkey"
            columns: ["payment_validation_id"]
            isOneToOne: false
            referencedRelation: "payment_validations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          channel: string
          created_at: string
          id: string
          metadata: Json | null
          mission_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          channel: string
          created_at?: string
          id?: string
          metadata?: Json | null
          mission_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          mission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_mission_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          cohort_name: string
          consent_at: string | null
          consent_given: boolean
          created_at: string
          email: string | null
          fit_score: string | null
          full_name: string
          id: string
          status: string
          telegram_chat_id: string | null
          telegram_username: string | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          cohort_name?: string
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          email?: string | null
          fit_score?: string | null
          full_name: string
          id?: string
          status?: string
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          cohort_name?: string
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          email?: string | null
          fit_score?: string | null
          full_name?: string
          id?: string
          status?: string
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_user_mission_summary: {
        Row: {
          cohort_name: string | null
          fit_score: string | null
          full_name: string | null
          telegram_username: string | null
          total_chats_sent: number | null
          total_closings: number | null
          total_mission_days: number | null
          total_mission_items: number | null
          total_reports: number | null
          total_responses: number | null
          total_revenue: number | null
          total_rga: number | null
          user_id: string | null
          user_status: string | null
          whatsapp_number: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_rga_count: { Args: { p_mission_id: string }; Returns: number }
      mark_mission_item_done: {
        Args: { p_mission_item_id: string }
        Returns: undefined
      }
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
