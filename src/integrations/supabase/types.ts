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
          applied_commission_pct: number | null
          client_id: string | null
          client_name: string
          commission_amount: number | null
          created_at: string
          deposit: number
          duration_min: number
          id: string
          payment_status: string
          price: number
          professional_id: string
          salon_amount: number | null
          salon_client_id: string | null
          salon_id: string
          service_id: string | null
          starts_at: string
          status: string
          status_sinal: string
          valor_sinal_pago: number
        }
        Insert: {
          applied_commission_pct?: number | null
          client_id?: string | null
          client_name: string
          commission_amount?: number | null
          created_at?: string
          deposit?: number
          duration_min?: number
          id?: string
          payment_status?: string
          price?: number
          professional_id: string
          salon_amount?: number | null
          salon_client_id?: string | null
          salon_id: string
          service_id?: string | null
          starts_at: string
          status?: string
          status_sinal?: string
          valor_sinal_pago?: number
        }
        Update: {
          applied_commission_pct?: number | null
          client_id?: string | null
          client_name?: string
          commission_amount?: number | null
          created_at?: string
          deposit?: number
          duration_min?: number
          id?: string
          payment_status?: string
          price?: number
          professional_id?: string
          salon_amount?: number | null
          salon_client_id?: string | null
          salon_id?: string
          service_id?: string | null
          starts_at?: string
          status?: string
          status_sinal?: string
          valor_sinal_pago?: number
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
            foreignKeyName: "appointments_salon_client_id_fkey"
            columns: ["salon_client_id"]
            isOneToOne: false
            referencedRelation: "salon_clients"
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
      caixa_master_saas: {
        Row: {
          created_at: string
          criado_por: string | null
          data_recebimento: string
          descricao: string
          forma_pagamento: string
          id: string
          mes_referencia: string
          nome_salao: string
          salon_id: string | null
          status: string
          taxa: number
          tipo: string
          valor: number
          valor_liquido: number
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data_recebimento?: string
          descricao?: string
          forma_pagamento?: string
          id?: string
          mes_referencia?: string
          nome_salao?: string
          salon_id?: string | null
          status?: string
          taxa?: number
          tipo?: string
          valor?: number
          valor_liquido?: number
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data_recebimento?: string
          descricao?: string
          forma_pagamento?: string
          id?: string
          mes_referencia?: string
          nome_salao?: string
          salon_id?: string | null
          status?: string
          taxa?: number
          tipo?: string
          valor?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_master_saas_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      config_agente_secretario: {
        Row: {
          genero: string
          id: string
          nome_agente: string
          pronomes: string
          salon_id: string
        }
        Insert: {
          genero?: string
          id?: string
          nome_agente?: string
          pronomes?: string
          salon_id: string
        }
        Update: {
          genero?: string
          id?: string
          nome_agente?: string
          pronomes?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_agente_secretario_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      config_suporte_master: {
        Row: {
          email_master: string
          id: number
          nome_suporte: string
          whatsapp_master: string
        }
        Insert: {
          email_master?: string
          id?: number
          nome_suporte?: string
          whatsapp_master?: string
        }
        Update: {
          email_master?: string
          id?: number
          nome_suporte?: string
          whatsapp_master?: string
        }
        Relationships: []
      }
      fila_mensagens_ia: {
        Row: {
          agendado_para: string
          appointment_id: string | null
          attempts: number
          client_id: string | null
          cliente_whatsapp: string
          dedupe_key: string
          error: string
          id: string
          mensagem: string
          salon_id: string
          status: string
          tipo: string
        }
        Insert: {
          agendado_para: string
          appointment_id?: string | null
          attempts?: number
          client_id?: string | null
          cliente_whatsapp: string
          dedupe_key: string
          error?: string
          id?: string
          mensagem: string
          salon_id: string
          status?: string
          tipo: string
        }
        Update: {
          agendado_para?: string
          appointment_id?: string | null
          attempts?: number
          client_id?: string | null
          cliente_whatsapp?: string
          dedupe_key?: string
          error?: string
          id?: string
          mensagem?: string
          salon_id?: string
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fila_mensagens_ia_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_ia_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "salon_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_mensagens_ia_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_appointment_tenant"
            columns: ["salon_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "queue_client_tenant"
            columns: ["salon_id", "client_id"]
            isOneToOne: false
            referencedRelation: "salon_clients"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      lead_conversations: {
        Row: {
          channel: string
          contact: string
          handoff: boolean
          handoff_reason: string
          id: string
          messages: Json
          paused_reason: string
          salon_id: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          channel?: string
          contact?: string
          handoff?: boolean
          handoff_reason?: string
          id?: string
          messages?: Json
          paused_reason?: string
          salon_id: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          channel?: string
          contact?: string
          handoff?: boolean
          handoff_reason?: string
          id?: string
          messages?: Json
          paused_reason?: string
          salon_id?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      log_acoes_master: {
        Row: {
          action: string
          id: string
          performed_at: string
          performed_by: string
          previous_data: Json
          reason: string
          salon_id: string
        }
        Insert: {
          action: string
          id?: string
          performed_at?: string
          performed_by: string
          previous_data: Json
          reason?: string
          salon_id: string
        }
        Update: {
          action?: string
          id?: string
          performed_at?: string
          performed_by?: string
          previous_data?: Json
          reason?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_master_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      memoria_ia: {
        Row: {
          conversation_id: string
          correcao_dona: string
          created_at: string
          id: string
          pergunta: string
          resposta: string
          salon_id: string
        }
        Insert: {
          conversation_id: string
          correcao_dona?: string
          created_at?: string
          id?: string
          pergunta: string
          resposta?: string
          salon_id: string
        }
        Update: {
          conversation_id?: string
          correcao_dona?: string
          created_at?: string
          id?: string
          pergunta?: string
          resposta?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memoria_ia_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      month_closings: {
        Row: {
          closed_at: string
          commissions: number
          id: string
          month: string
          revenue: number
          salon_id: string
        }
        Insert: {
          closed_at?: string
          commissions?: number
          id?: string
          month: string
          revenue?: number
          salon_id: string
        }
        Update: {
          closed_at?: string
          commissions?: number
          id?: string
          month?: string
          revenue?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_closings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
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
          photo_url: string
          profession_id: string | null
          salon_id: string
        }
        Insert: {
          commission_pct?: number
          id?: string
          name: string
          photo_url?: string
          profession_id?: string | null
          salon_id: string
        }
        Update: {
          commission_pct?: number
          id?: string
          name?: string
          photo_url?: string
          profession_id?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_profession_tenant"
            columns: ["salon_id", "profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "professionals_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          id: string
          name: string
          salon_id: string
        }
        Insert: {
          id?: string
          name?: string
          salon_id: string
        }
        Update: {
          id?: string
          name?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professions_salon_id_fkey"
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
      referral_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          sale_id: string
          salon_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          sale_id: string
          salon_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          sale_id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_notifications_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "referral_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_notifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_sales: {
        Row: {
          amount: number
          applied_pct: number
          buyer_name: string
          commission: number
          created_at: string
          id: string
          paid_at: string | null
          request_id: string
          reseller_id: string
          salon_id: string
          status: string
        }
        Insert: {
          amount: number
          applied_pct?: number
          buyer_name?: string
          commission: number
          created_at?: string
          id?: string
          paid_at?: string | null
          request_id: string
          reseller_id: string
          salon_id: string
          status?: string
        }
        Update: {
          amount?: number
          applied_pct?: number
          buyer_name?: string
          commission?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          request_id?: string
          reseller_id?: string
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_sales_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_sales_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_ai_settings: {
        Row: {
          ideal_customer: string
          pause_status: number | null
          paused_reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ideal_customer?: string
          pause_status?: number | null
          paused_reason?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ideal_customer?: string
          pause_status?: number | null
          paused_reason?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reseller_leads: {
        Row: {
          call_reason: string
          call_recommended: boolean
          city: string
          contact_name: string
          context: string
          created_at: string
          id: string
          ideal_customer_snapshot: string
          phone: string
          qualification_error: string
          qualification_status: string
          qualified_at: string | null
          reseller_id: string
          salon_name: string
          score: number | null
          summary: string
        }
        Insert: {
          call_reason?: string
          call_recommended?: boolean
          city?: string
          contact_name?: string
          context: string
          created_at?: string
          id?: string
          ideal_customer_snapshot?: string
          phone?: string
          qualification_error?: string
          qualification_status?: string
          qualified_at?: string | null
          reseller_id: string
          salon_name: string
          score?: number | null
          summary?: string
        }
        Update: {
          call_reason?: string
          call_recommended?: boolean
          city?: string
          contact_name?: string
          context?: string
          created_at?: string
          id?: string
          ideal_customer_snapshot?: string
          phone?: string
          qualification_error?: string
          qualification_status?: string
          qualified_at?: string | null
          reseller_id?: string
          salon_name?: string
          score?: number | null
          summary?: string
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
      sale_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          note: string | null
          reseller_id: string
          salon_id: string | null
          used_at: string | null
          used_by: string | null
          used_by_name: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          reseller_id: string
          salon_id?: string | null
          used_at?: string | null
          used_by?: string | null
          used_by_name?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          reseller_id?: string
          salon_id?: string | null
          used_at?: string | null
          used_by?: string | null
          used_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_codes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_clients: {
        Row: {
          birthday: string | null
          consent: boolean
          id: string
          last_visit: string | null
          name: string
          salon_id: string
          total_visits: number
          whatsapp: string
        }
        Insert: {
          birthday?: string | null
          consent?: boolean
          id?: string
          last_visit?: string | null
          name?: string
          salon_id: string
          total_visits?: number
          whatsapp?: string
        }
        Update: {
          birthday?: string | null
          consent?: boolean
          id?: string
          last_visit?: string | null
          name?: string
          salon_id?: string
          total_visits?: number
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_connections: {
        Row: {
          evolution_instance: string
          evolution_url: string
          id: string
          salon_id: string
        }
        Insert: {
          evolution_instance?: string
          evolution_url?: string
          id?: string
          salon_id: string
        }
        Update: {
          evolution_instance?: string
          evolution_url?: string
          id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_connections_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_members: {
        Row: {
          access: string
          email: string
          id: string
          professional_id: string | null
          salon_id: string
          user_id: string
        }
        Insert: {
          access?: string
          email?: string
          id?: string
          professional_id?: string | null
          salon_id: string
          user_id: string
        }
        Update: {
          access?: string
          email?: string
          id?: string
          professional_id?: string | null
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_professional_tenant"
            columns: ["salon_id", "professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "salon_members_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_members_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          access_enabled: boolean
          archived_at: string | null
          block_reason: string
          blocked_at: string | null
          blocked_by: string | null
          brand_color: string
          city: string | null
          cobrar_sinal: boolean
          created_at: string
          id: string
          logo_url: string
          name: string
          name_article: string
          owner_id: string
          pix_city: string
          pix_holder: string
          pix_key: string
          plan_id: string | null
          released_at: string | null
          reseller_id: string | null
          slug: string
          status: string
          subscription_due_date: string | null
          suspended_until: string | null
          timezone: string
          tipo_sinal: string
          valor_sinal: number
        }
        Insert: {
          access_enabled?: boolean
          archived_at?: string | null
          block_reason?: string
          blocked_at?: string | null
          blocked_by?: string | null
          brand_color?: string
          city?: string | null
          cobrar_sinal?: boolean
          created_at?: string
          id?: string
          logo_url?: string
          name?: string
          name_article?: string
          owner_id: string
          pix_city?: string
          pix_holder?: string
          pix_key?: string
          plan_id?: string | null
          released_at?: string | null
          reseller_id?: string | null
          slug: string
          status?: string
          subscription_due_date?: string | null
          suspended_until?: string | null
          timezone?: string
          tipo_sinal?: string
          valor_sinal?: number
        }
        Update: {
          access_enabled?: boolean
          archived_at?: string | null
          block_reason?: string
          blocked_at?: string | null
          blocked_by?: string | null
          brand_color?: string
          city?: string | null
          cobrar_sinal?: boolean
          created_at?: string
          id?: string
          logo_url?: string
          name?: string
          name_article?: string
          owner_id?: string
          pix_city?: string
          pix_holder?: string
          pix_key?: string
          plan_id?: string | null
          released_at?: string | null
          reseller_id?: string | null
          slug?: string
          status?: string
          subscription_due_date?: string | null
          suspended_until?: string | null
          timezone?: string
          tipo_sinal?: string
          valor_sinal?: number
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
      supplier_brands: {
        Row: {
          contact_name: string
          id: string
          name: string
          salon_id: string
          whatsapp: string
        }
        Insert: {
          contact_name?: string
          id?: string
          name?: string
          salon_id: string
          whatsapp?: string
        }
        Update: {
          contact_name?: string
          id?: string
          name?: string
          salon_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_brands_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          items: Json
          salon_id: string
          status: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          items?: Json
          salon_id: string
          status?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          items?: Json
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_brand_tenant"
            columns: ["salon_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "supplier_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          brand_id: string
          id: string
          name: string
          salon_id: string
        }
        Insert: {
          brand_id: string
          id?: string
          name?: string
          salon_id: string
        }
        Update: {
          brand_id?: string
          id?: string
          name?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_brand_tenant"
            columns: ["salon_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "supplier_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_id: string | null
          salon_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient_id?: string | null
          salon_id: string
          sender_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string | null
          salon_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_suporte: {
        Row: {
          contato: string
          created_at: string
          id: string
          mensagem: string
          nome_cliente: string
          origem: string
          salon_id: string | null
          status: string
          tipo_usuario: string
          user_id: string
        }
        Insert: {
          contato?: string
          created_at?: string
          id?: string
          mensagem: string
          nome_cliente?: string
          origem?: string
          salon_id?: string | null
          status?: string
          tipo_usuario?: string
          user_id?: string
        }
        Update: {
          contato?: string
          created_at?: string
          id?: string
          mensagem?: string
          nome_cliente?: string
          origem?: string
          salon_id?: string | null
          status?: string
          tipo_usuario?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_suporte_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
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
      whatsapp_outbound: {
        Row: {
          body: string
          conversation_id: string | null
          created_at: string
          error: string
          id: string
          inbound_message_id: string | null
          provider_message_id: string | null
          recipient: string
          salon_id: string
          status: string
        }
        Insert: {
          body: string
          conversation_id?: string | null
          created_at?: string
          error?: string
          id?: string
          inbound_message_id?: string | null
          provider_message_id?: string | null
          recipient: string
          salon_id: string
          status?: string
        }
        Update: {
          body?: string
          conversation_id?: string | null
          created_at?: string
          error?: string
          id?: string
          inbound_message_id?: string | null
          provider_message_id?: string | null
          recipient?: string
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbound_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbound_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          delivery_id: string
          event: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string
          received_at: string
        }
        Insert: {
          delivery_id: string
          event: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string
          received_at?: string
        }
        Update: {
          delivery_id?: string
          event?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      become_reseller: { Args: never; Returns: string }
      belongs_salon: { Args: { _salon: string }; Returns: boolean }
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
      manages_salon: { Args: { _salon: string }; Returns: boolean }
      master_set_salon_access: {
        Args: {
          _action: string
          _days?: number
          _reason: string
          _salon: string
        }
        Returns: undefined
      }
      owns_salon: { Args: { _salon: string }; Returns: boolean }
      pay_referral_commission: { Args: { _sale: string }; Returns: undefined }
      public_salon_identity: {
        Args: { _salon: string }
        Returns: {
          brand_color: string
          genero: string
          id: string
          logo_url: string
          name: string
          name_article: string
          nome_agente: string
        }[]
      }
      public_support_contact: {
        Args: never
        Returns: {
          email_master: string
          nome_suporte: string
          whatsapp_master: string
        }[]
      }
      redeem_sale_code: { Args: { _code: string }; Returns: string }
      salon_access_allowed: { Args: { _salon: string }; Returns: boolean }
      save_salon_identity: {
        Args: {
          _article: string
          _color: string
          _logo: string
          _name: string
          _salon: string
        }
        Returns: undefined
      }
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
