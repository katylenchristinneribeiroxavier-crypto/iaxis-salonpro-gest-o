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
          client_whatsapp: string | null
          commission_amount: number | null
          created_at: string
          deposit: number
          duration_min: number
          id: string
          motivo_alteracao: string
          payment_received_at: string | null
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
          whatsapp_confirmacao: string
          whatsapp_enviado_em: string | null
        }
        Insert: {
          applied_commission_pct?: number | null
          client_id?: string | null
          client_name: string
          client_whatsapp?: string | null
          commission_amount?: number | null
          created_at?: string
          deposit?: number
          duration_min?: number
          id?: string
          motivo_alteracao?: string
          payment_received_at?: string | null
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
          whatsapp_confirmacao?: string
          whatsapp_enviado_em?: string | null
        }
        Update: {
          applied_commission_pct?: number | null
          client_id?: string | null
          client_name?: string
          client_whatsapp?: string | null
          commission_amount?: number | null
          created_at?: string
          deposit?: number
          duration_min?: number
          id?: string
          motivo_alteracao?: string
          payment_received_at?: string | null
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
          whatsapp_confirmacao?: string
          whatsapp_enviado_em?: string | null
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
      booking_handoffs: {
        Row: {
          created_at: string
          id: string
          message: string
          salon_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          salon_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          salon_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_handoffs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
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
      configuracoes_salao: {
        Row: {
          evolution_api_key: string | null
          evolution_api_url: string | null
          evolution_connection_state: string
          evolution_instance: string
          evolution_last_received_at: string | null
          evolution_managed: boolean
          evolution_webhook_enabled: boolean
          id: string
          nome_salao: string
          salon_id: string
          user_id: string
          whatsapp_salao: string
        }
        Insert: {
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_connection_state?: string
          evolution_instance?: string
          evolution_last_received_at?: string | null
          evolution_managed?: boolean
          evolution_webhook_enabled?: boolean
          id?: string
          nome_salao?: string
          salon_id: string
          user_id: string
          whatsapp_salao?: string
        }
        Update: {
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_connection_state?: string
          evolution_instance?: string
          evolution_last_received_at?: string | null
          evolution_managed?: boolean
          evolution_webhook_enabled?: boolean
          id?: string
          nome_salao?: string
          salon_id?: string
          user_id?: string
          whatsapp_salao?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_salao_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          arquivo_nome: string
          arquivo_path: string
          categoria: string
          created_at: string
          data_documento: string | null
          descricao: string
          fornecedor: string
          id: string
          numero_documento: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          arquivo_nome?: string
          arquivo_path: string
          categoria?: string
          created_at?: string
          data_documento?: string | null
          descricao?: string
          fornecedor?: string
          id?: string
          numero_documento?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Update: {
          arquivo_nome?: string
          arquivo_path?: string
          categoria?: string
          created_at?: string
          data_documento?: string | null
          descricao?: string
          fornecedor?: string
          id?: string
          numero_documento?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      despesas_salao: {
        Row: {
          arquivo_path: string
          categoria: string
          created_at: string
          criado_por: string | null
          data_despesa: string
          descricao: string
          documento_hash: string | null
          fornecedor: string
          id: string
          item_index: number | null
          professional_id: string | null
          quantidade: number | null
          salon_id: string
          unidade: string | null
          valor: number
        }
        Insert: {
          arquivo_path?: string
          categoria?: string
          created_at?: string
          criado_por?: string | null
          data_despesa?: string
          descricao?: string
          documento_hash?: string | null
          fornecedor?: string
          id?: string
          item_index?: number | null
          professional_id?: string | null
          quantidade?: number | null
          salon_id: string
          unidade?: string | null
          valor: number
        }
        Update: {
          arquivo_path?: string
          categoria?: string
          created_at?: string
          criado_por?: string | null
          data_despesa?: string
          descricao?: string
          documento_hash?: string | null
          fornecedor?: string
          id?: string
          item_index?: number | null
          professional_id?: string | null
          quantidade?: number | null
          salon_id?: string
          unidade?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_salao_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_professional_salon_fk"
            columns: ["professional_id", "salon_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "salon_id"]
          },
        ]
      }
      evolution_config_global: {
        Row: {
          ativo: boolean
          criado_em: string
          evolution_api_key_global: string
          evolution_url: string
          id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          evolution_api_key_global?: string
          evolution_url?: string
          id?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          evolution_api_key_global?: string
          evolution_url?: string
          id?: string
        }
        Relationships: []
      }
      evolution_webhook_events: {
        Row: {
          event: string
          event_key: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string
          received_at: string
          retry_at: string
          salon_id: string
        }
        Insert: {
          event: string
          event_key: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string
          received_at?: string
          retry_at?: string
          salon_id: string
        }
        Update: {
          event?: string
          event_key?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string
          received_at?: string
          retry_at?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolution_webhook_events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_mensagens_ia: {
        Row: {
          agendado_para: string
          appointment_id: string | null
          attempts: number
          claimed_at: string | null
          client_id: string | null
          cliente_whatsapp: string
          dedupe_key: string
          error: string
          id: string
          mensagem: string
          provider_message_id: string | null
          salon_id: string
          sent_at: string | null
          status: string
          tipo: string
        }
        Insert: {
          agendado_para: string
          appointment_id?: string | null
          attempts?: number
          claimed_at?: string | null
          client_id?: string | null
          cliente_whatsapp: string
          dedupe_key: string
          error?: string
          id?: string
          mensagem: string
          provider_message_id?: string | null
          salon_id: string
          sent_at?: string | null
          status?: string
          tipo: string
        }
        Update: {
          agendado_para?: string
          appointment_id?: string | null
          attempts?: number
          claimed_at?: string | null
          client_id?: string | null
          cliente_whatsapp?: string
          dedupe_key?: string
          error?: string
          id?: string
          mensagem?: string
          provider_message_id?: string | null
          salon_id?: string
          sent_at?: string | null
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
      imported_client_visits: {
        Row: {
          client_id: string
          created_at: string
          id: string
          salon_id: string
          service_id: string
          source_key: string
          visited_on: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          salon_id: string
          service_id: string
          source_key: string
          visited_on: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          salon_id?: string
          service_id?: string
          source_key?: string
          visited_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_client_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "salon_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_client_visits_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_client_visits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
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
      licencas_nacionais: {
        Row: {
          aceitou_termos: boolean
          bloqueado_por_expiracao: boolean
          data_expira: string
          data_inicio: string
          email_cliente: string
          id: string
          salao_id: string
          status: string
          termos_aceitos_em: string | null
          termos_aceitos_por: string | null
          tipo_plano: string
          ultimo_pagamento: string | null
        }
        Insert: {
          aceitou_termos?: boolean
          bloqueado_por_expiracao?: boolean
          data_expira?: string
          data_inicio?: string
          email_cliente: string
          id?: string
          salao_id: string
          status?: string
          termos_aceitos_em?: string | null
          termos_aceitos_por?: string | null
          tipo_plano?: string
          ultimo_pagamento?: string | null
        }
        Update: {
          aceitou_termos?: boolean
          bloqueado_por_expiracao?: boolean
          data_expira?: string
          data_inicio?: string
          email_cliente?: string
          id?: string
          salao_id?: string
          status?: string
          termos_aceitos_em?: string | null
          termos_aceitos_por?: string | null
          tipo_plano?: string
          ultimo_pagamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licencas_nacionais_salao_id_fkey"
            columns: ["salao_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          client_name: string
          created_at: string
          desired_at: string
          id: string
          notified_at: string | null
          professional_id: string | null
          salon_id: string
          service_id: string | null
          status: string
          whatsapp: string
        }
        Insert: {
          client_name: string
          created_at?: string
          desired_at: string
          id?: string
          notified_at?: string | null
          professional_id?: string | null
          salon_id: string
          service_id?: string | null
          status?: string
          whatsapp: string
        }
        Update: {
          client_name?: string
          created_at?: string
          desired_at?: string
          id?: string
          notified_at?: string | null
          professional_id?: string | null
          salon_id?: string
          service_id?: string | null
          status?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      platform_automation_audit: {
        Row: {
          action: string
          id: string
          performed_at: string
          performed_by: string
        }
        Insert: {
          action: string
          id?: string
          performed_at?: string
          performed_by: string
        }
        Update: {
          action?: string
          id?: string
          performed_at?: string
          performed_by?: string
        }
        Relationships: []
      }
      platform_evolution_settings: {
        Row: {
          api_key: string
          api_url: string
          callback_origin: string
          enabled: boolean
          id: boolean
          updated_at: string
          updated_by: string
          verified_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          callback_origin: string
          enabled?: boolean
          id?: boolean
          updated_at?: string
          updated_by: string
          verified_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          callback_origin?: string
          enabled?: boolean
          id?: boolean
          updated_at?: string
          updated_by?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      platform_reminder_control: {
        Row: {
          enabled: boolean
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          id?: boolean
          updated_at?: string
          updated_by?: string | null
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
      platform_test_purchase: {
        Row: {
          id: boolean
          redeemed_at: string
          redeemed_by: string
          request_id: string
          salon_id: string
        }
        Insert: {
          id?: boolean
          redeemed_at?: string
          redeemed_by: string
          request_id: string
          salon_id: string
        }
        Update: {
          id?: boolean
          redeemed_at?: string
          redeemed_by?: string
          request_id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_test_purchase_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_test_purchase_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          consumo_por_servico: number
          created_at: string
          custo_unitario: number
          foto_path: string
          id: string
          marca: string
          nome: string
          qtd_usos_restantes: number | null
          quantidade_atual: number
          quantidade_minima: number
          salon_id: string
          servico_relacionado: string
          supplier_id: string | null
          unidade: string
        }
        Insert: {
          consumo_por_servico?: number
          created_at?: string
          custo_unitario?: number
          foto_path?: string
          id?: string
          marca?: string
          nome?: string
          qtd_usos_restantes?: number | null
          quantidade_atual?: number
          quantidade_minima?: number
          salon_id: string
          servico_relacionado?: string
          supplier_id?: string | null
          unidade?: string
        }
        Update: {
          consumo_por_servico?: number
          created_at?: string
          custo_unitario?: number
          foto_path?: string
          id?: string
          marca?: string
          nome?: string
          qtd_usos_restantes?: number | null
          quantidade_atual?: number
          quantidade_minima?: number
          salon_id?: string
          servico_relacionado?: string
          supplier_id?: string | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_salon_id_fkey"
            columns: ["supplier_id", "salon_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id", "salon_id"]
          },
        ]
      }
      professionals: {
        Row: {
          commission_pct: number
          id: string
          name: string
          photo_url: string
          portal_token: string
          profession_id: string | null
          salon_id: string
          whatsapp: string
        }
        Insert: {
          commission_pct?: number
          id?: string
          name: string
          photo_url?: string
          portal_token?: string
          profession_id?: string | null
          salon_id: string
          whatsapp?: string
        }
        Update: {
          commission_pct?: number
          id?: string
          name?: string
          photo_url?: string
          portal_token?: string
          profession_id?: string | null
          salon_id?: string
          whatsapp?: string
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
      salon_automation_preferences: {
        Row: {
          appointment_reminders: boolean
          birthday_reminders: boolean
          intelligent_return: boolean
          reminder_24h: boolean
          return_days: number
          return_reminders: boolean
          salon_id: string
          special_date_messages: boolean
          thank_you_messages: boolean
          updated_at: string
        }
        Insert: {
          appointment_reminders?: boolean
          birthday_reminders?: boolean
          intelligent_return?: boolean
          reminder_24h?: boolean
          return_days?: number
          return_reminders?: boolean
          salon_id: string
          special_date_messages?: boolean
          thank_you_messages?: boolean
          updated_at?: string
        }
        Update: {
          appointment_reminders?: boolean
          birthday_reminders?: boolean
          intelligent_return?: boolean
          reminder_24h?: boolean
          return_days?: number
          return_reminders?: boolean
          salon_id?: string
          special_date_messages?: boolean
          thank_you_messages?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_automation_preferences_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_booking_rules: {
        Row: {
          cancel_min_hours: number
          salon_id: string
          updated_at: string
        }
        Insert: {
          cancel_min_hours?: number
          salon_id: string
          updated_at?: string
        }
        Update: {
          cancel_min_hours?: number
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_booking_rules_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
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
          api_token: string
          evolution_instance: string
          evolution_url: string
          id: string
          salon_id: string
        }
        Insert: {
          api_token?: string
          evolution_instance?: string
          evolution_url?: string
          id?: string
          salon_id: string
        }
        Update: {
          api_token?: string
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
      salon_finance_ai_state: {
        Row: {
          pause_status: number | null
          paused_reason: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          pause_status?: number | null
          paused_reason?: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          pause_status?: number | null
          paused_reason?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_finance_ai_state_salon_id_fkey"
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
      salon_messages: {
        Row: {
          appointment_id: string | null
          body: string
          contact_name: string
          contact_phone: string
          created_at: string
          created_by: string | null
          direction: string
          error: string
          id: string
          provider_message_id: string | null
          provider_timestamp: string | null
          salon_id: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          body: string
          contact_name?: string
          contact_phone: string
          created_at?: string
          created_by?: string | null
          direction: string
          error?: string
          id?: string
          provider_message_id?: string | null
          provider_timestamp?: string | null
          salon_id: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          body?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          direction?: string
          error?: string
          id?: string
          provider_message_id?: string | null
          provider_timestamp?: string | null
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_messages_salon_id_fkey"
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
          closing_time: string
          cobrar_sinal: boolean
          created_at: string
          evolution_conectado: boolean
          evolution_instance_name: string
          evolution_ultimo_qr: string | null
          foto_dona_url: string
          id: string
          logo_url: string
          name: string
          name_article: string
          opening_time: string
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
          closing_time?: string
          cobrar_sinal?: boolean
          created_at?: string
          evolution_conectado?: boolean
          evolution_instance_name?: string
          evolution_ultimo_qr?: string | null
          foto_dona_url?: string
          id?: string
          logo_url?: string
          name?: string
          name_article?: string
          opening_time?: string
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
          closing_time?: string
          cobrar_sinal?: boolean
          created_at?: string
          evolution_conectado?: boolean
          evolution_instance_name?: string
          evolution_ultimo_qr?: string | null
          foto_dona_url?: string
          id?: string
          logo_url?: string
          name?: string
          name_article?: string
          opening_time?: string
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
          intervalo_cliente_antiga_dias: number
          intervalo_retorno_dias: number
          name: string
          price: number
          regra_cliente: string
          salon_id: string
        }
        Insert: {
          duration_min?: number
          id?: string
          intervalo_cliente_antiga_dias?: number
          intervalo_retorno_dias?: number
          name: string
          price?: number
          regra_cliente?: string
          salon_id: string
        }
        Update: {
          duration_min?: number
          id?: string
          intervalo_cliente_antiga_dias?: number
          intervalo_retorno_dias?: number
          name?: string
          price?: number
          regra_cliente?: string
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
      stock_movements: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          custo_total: number
          id: string
          motivo: string
          product_id: string
          quantidade: number
          salon_id: string
          tipo: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          custo_total?: number
          id?: string
          motivo?: string
          product_id: string
          quantidade: number
          salon_id: string
          tipo: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          custo_total?: number
          id?: string
          motivo?: string
          product_id?: string
          quantidade?: number
          salon_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_salon_id_fkey"
            columns: ["product_id", "salon_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "salon_id"]
          },
          {
            foreignKeyName: "stock_movements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          aceitou_termos: boolean
          amount: number
          billing: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          is_test_purchase: boolean
          name: string
          phone: string | null
          plan_id: string | null
          status: string
          trial_ends_at: string | null
          user_id: string | null
        }
        Insert: {
          aceitou_termos?: boolean
          amount: number
          billing?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          is_test_purchase?: boolean
          name: string
          phone?: string | null
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          user_id?: string | null
        }
        Update: {
          aceitou_termos?: boolean
          amount?: number
          billing?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_test_purchase?: boolean
          name?: string
          phone?: string | null
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
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
      suppliers: {
        Row: {
          categoria: string
          created_at: string
          email: string
          id: string
          nome: string
          observacoes: string
          salon_id: string
          whatsapp: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string
          observacoes?: string
          salon_id: string
          whatsapp?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string
          observacoes?: string
          salon_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_developer: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_developer: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_developer?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_suporte"
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
      client_service_patterns: {
        Row: {
          interval_days: number | null
          last_visit: string | null
          preference_rank: number | null
          salon_client_id: string | null
          salon_id: string | null
          service_id: string | null
          visits: number | null
        }
        Relationships: [
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
      service_return_targets: {
        Row: {
          client_id: string | null
          first_visit: string | null
          interval_days: number | null
          last_visit: string | null
          next_return: string | null
          salon_id: string | null
          service: string | null
          service_id: string | null
          visits: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aceitar_termos_licenca: { Args: { _salon: string }; Returns: undefined }
      activate_evolving_queue: { Args: { _salon: string }; Returns: number }
      assistant_book_appointment: {
        Args: {
          _client?: string
          _professional: string
          _salon: string
          _service: string
          _starts: string
        }
        Returns: Json
      }
      become_reseller: { Args: never; Returns: string }
      belongs_salon: { Args: { _salon: string }; Returns: boolean }
      booked_slots: {
        Args: { _day: string; _professional: string }
        Returns: string[]
      }
      can_create_own_salon: { Args: { _owner: string }; Returns: boolean }
      claim_salon_reminders: {
        Args: { _limit?: number }
        Returns: {
          agendado_para: string
          appointment_id: string | null
          attempts: number
          claimed_at: string | null
          client_id: string | null
          cliente_whatsapp: string
          dedupe_key: string
          error: string
          id: string
          mensagem: string
          provider_message_id: string | null
          salon_id: string
          sent_at: string | null
          status: string
          tipo: string
        }[]
        SetofOptions: {
          from: "*"
          to: "fila_mensagens_ia"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_salon_clients: {
        Args: { _rows: Json; _salon: string }
        Returns: Json
      }
      licenca_valida: { Args: { _salon: string }; Returns: boolean }
      manages_salon: { Args: { _salon: string }; Returns: boolean }
      master_gerar_instancia_futura: {
        Args: { _salon: string }
        Returns: string
      }
      master_licenca: {
        Args: { _acao: string; _email: string }
        Returns: {
          aceitou_termos: boolean
          bloqueado_por_expiracao: boolean
          data_expira: string
          data_inicio: string
          email_cliente: string
          id: string
          salao_id: string
          status: string
          termos_aceitos_em: string | null
          termos_aceitos_por: string | null
          tipo_plano: string
          ultimo_pagamento: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "licencas_nacionais"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      master_set_salon_access: {
        Args: {
          _action: string
          _days?: number
          _reason: string
          _salon: string
        }
        Returns: undefined
      }
      owner_prepare_service_returns: {
        Args: { _salon: string }
        Returns: number
      }
      owns_salon: { Args: { _salon: string }; Returns: boolean }
      pay_referral_commission: { Args: { _sale: string }; Returns: undefined }
      prepare_evolving_messages: { Args: { _salon?: string }; Returns: number }
      prepare_salon_reminders: { Args: { _salon?: string }; Returns: number }
      prepare_service_returns: {
        Args: { _manual?: boolean; _salon?: string }
        Returns: number
      }
      public_book_appointment: {
        Args: {
          _name: string
          _professional: string
          _salon: string
          _service: string
          _starts: string
          _whatsapp: string
        }
        Returns: Json
      }
      public_cancel_appointment: {
        Args: { _appointment: string; _whatsapp: string }
        Returns: Json
      }
      public_join_waitlist: {
        Args: {
          _desired: string
          _name: string
          _professional: string
          _salon: string
          _service: string
          _whatsapp: string
        }
        Returns: string
      }
      public_pix_payment: {
        Args: never
        Returns: {
          pix_bank: string
          pix_cnpj: string
          pix_holder: string
          pix_key: string
        }[]
      }
      public_plans: {
        Args: never
        Returns: {
          annual_monthly_price: number
          id: string
          name: string
          online_fee_pct: number
          price: number
          sort: number
        }[]
      }
      public_salon_booking_contact: {
        Args: { _salon: string }
        Returns: {
          nome_salao: string
          whatsapp_salao: string
        }[]
      }
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
      queue_special_date: {
        Args: { _date: string; _key: string; _message: string; _salon: string }
        Returns: number
      }
      record_salon_receipt: {
        Args: { _hash: string; _items: Json; _path: string; _salon: string }
        Returns: Json
      }
      redeem_sale_code: { Args: { _code: string }; Returns: string }
      redeem_single_test_purchase: {
        Args: { _city?: string; _name: string }
        Returns: string
      }
      reply_support_ticket: {
        Args: { _body: string; _status?: string; _ticket: string }
        Returns: string
      }
      salon_access_allowed: { Args: { _salon: string }; Returns: boolean }
      salon_available_slots: {
        Args: {
          _day: string
          _professional: string
          _salon: string
          _service: string
        }
        Returns: {
          label: string
          starts_at: string
        }[]
      }
      salon_booking_catalog: { Args: { _salon: string }; Returns: Json }
      salon_crm_insights: { Args: { _salon: string }; Returns: Json }
      salon_financial_month: {
        Args: { _month: string; _professional?: string; _salon: string }
        Returns: Json
      }
      salon_production_year: {
        Args: { _salon: string; _year: number }
        Returns: Json
      }
      save_owner_photo: {
        Args: { _salon: string; _url: string }
        Returns: undefined
      }
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
      staff_change_appointment: {
        Args: {
          _action: string
          _appointment: string
          _new_starts?: string
          _reason: string
          _token: string
        }
        Returns: Json
      }
      staff_financial_month: {
        Args: { _month: string; _token: string }
        Returns: Json
      }
      staff_portal: { Args: { _token: string }; Returns: Json }
      verificar_licenca: { Args: never; Returns: Json }
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
