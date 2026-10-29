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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          deposit: number
          id: string
          price: number
          professional_id: string
          salon_id: string
          service_id: string | null
          starts_at: string
          status: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          deposit?: number
          id?: string
          price?: number
          professional_id: string
          salon_id: string
          service_id?: string | null
          starts_at: string
          status?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          deposit?: number
          id?: string
          price?: number
          professional_id?: string
          salon_id?: string
          service_id?: string | null
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          annual_monthly_price: number
          id: string
          name: string
          online_fee_pct: number
          price: number
          sort: number
        }
        Insert: {
          annual_monthly_price?: number
          id?: string
          name: string
          online_fee_pct?: number
          price: number
          sort?: number
        }
        Update: {
          annual_monthly_price?: number
          id?: string
          name?: string
          online_fee_pct?: number
          price?: number
          sort?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: number
          pix_bank: string
          pix_cnpj: string
          pix_holder: string
          pix_key: string
        }
        Insert: {
          id?: number
          pix_bank?: string
          pix_cnpj?: string
          pix_holder?: string
          pix_key?: string
        }
        Update: {
          id?: number
          pix_bank?: string
          pix_cnpj?: string
          pix_holder?: string
          pix_key?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          commission_pct: number
          id: string
          name: string
          salon_id: string
        }
        Insert: {
          commission_pct?: number
          id?: string
          name: string
          salon_id: string
        }
        Update: {
          commission_pct?: number
          id?: string
          name?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      resellers: {
        Row: {
          code: string
          commission_pct: number
          created_at: string
          pix_key: string | null
          user_id: string
        }
        Insert: {
          code: string
          commission_pct?: number
          created_at?: string
          pix_key?: string | null
          user_id: string
        }
        Update: {
          code?: string
          commission_pct?: number
          created_at?: string
          pix_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      salons: {
        Row: {
          brand_color: string
          city: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          plan_id: string | null
          reseller_id: string | null
          slug: string
          status: string
        }
        Insert: {
          brand_color?: string
          city?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan_id?: string | null
          reseller_id?: string | null
          slug: string
          status?: string
        }
        Update: {
          brand_color?: string
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan_id?: string | null
          reseller_id?: string | null
          slug?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "salons_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          duration_min: number
          id: string
          name: string
          price: number
          salon_id: string
        }
        Insert: {
          duration_min?: number
          id?: string
          name: string
          price?: number
          salon_id: string
        }
        Update: {
          duration_min?: number
          id?: string
          name?: string
          price?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          amount: number
          billing: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          plan_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          billing?: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          plan_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          plan_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      booked_slots: {
        Args: { _day: string; _professional: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_salon: { Args: { _salon: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "revendedor" | "dono_salao" | "cliente"
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
    Enums: {
      app_role: ["super_admin", "revendedor", "dono_salao", "cliente"],
    },
  },
} as const
