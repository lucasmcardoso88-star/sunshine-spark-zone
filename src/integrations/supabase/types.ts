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
      alert_events: {
        Row: {
          alert_rule_id: string | null
          company_id: string
          created_at: string
          description: string | null
          financial_impact: number
          id: string
          recommendation: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          title: string
        }
        Insert: {
          alert_rule_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          financial_impact?: number
          id?: string
          recommendation?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
        }
        Update: {
          alert_rule_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          financial_impact?: number
          id?: string
          recommendation?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          metric: string
          name: string
          operator: string
          severity: Database["public"]["Enums"]["alert_severity"]
          threshold_value: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          metric: string
          name: string
          operator: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          threshold_value: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          name?: string
          operator?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          threshold_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bem: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          created_at: string
          data_aquisicao: string | null
          descricao: string | null
          id: string
          nome: string
          raw: Json
          status: string
          updated_at: string
          valor_aquisicao: number
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          created_at?: string
          data_aquisicao?: string | null
          descricao?: string | null
          id: string
          nome: string
          raw?: Json
          status?: string
          updated_at?: string
          valor_aquisicao?: number
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          created_at?: string
          data_aquisicao?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          raw?: Json
          status?: string
          updated_at?: string
          valor_aquisicao?: number
        }
        Relationships: [
          {
            foreignKeyName: "bem_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bem_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_de_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_targets: {
        Row: {
          category_name: string
          company_id: string
          cost_center_name: string | null
          created_at: string
          id: string
          month: number
          planned_expense: number
          planned_profit: number
          planned_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          category_name: string
          company_id: string
          cost_center_name?: string | null
          created_at?: string
          id?: string
          month: number
          planned_expense?: number
          planned_profit?: number
          planned_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          category_name?: string
          company_id?: string
          cost_center_name?: string | null
          created_at?: string
          id?: string
          month?: number
          planned_expense?: number
          planned_profit?: number
          planned_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      centros_de_custo: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          document: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conta_azul_connections: {
        Row: {
          access_token_encrypted: string | null
          company_id: string
          connection_status: Database["public"]["Enums"]["connection_status"]
          created_at: string
          id: string
          last_sync_at: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          company_id: string
          connection_status?: Database["public"]["Enums"]["connection_status"]
          created_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          company_id?: string
          connection_status?: Database["public"]["Enums"]["connection_status"]
          created_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conta_azul_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          numero: string | null
          raw: Json
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id: string
          numero?: string | null
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          numero?: string | null
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_de_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string | null
          centro_custo: string | null
          conta_azul_event: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          fornecedor: string | null
          id: string
          raw: Json
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          centro_custo?: string | null
          conta_azul_event?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id: string
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          centro_custo?: string | null
          conta_azul_event?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      email_report_runs: {
        Row: {
          company_id: string
          generated_at: string
          id: string
          recipient_email: string
          report_payload: Json
          report_type: string
          sent_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          subject: string
        }
        Insert: {
          company_id: string
          generated_at?: string
          id?: string
          recipient_email: string
          report_payload: Json
          report_type: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject: string
        }
        Update: {
          company_id?: string
          generated_at?: string
          id?: string
          recipient_email?: string
          report_payload?: Json
          report_type?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_report_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          accounting_basis: Database["public"]["Enums"]["accounting_basis"]
          amount: number
          category_name: string | null
          company_id: string
          competence_date: string
          cost_center_name: string | null
          created_at: string
          customer_or_supplier_name: string | null
          description: string
          due_date: string | null
          external_id: string | null
          id: string
          payment_date: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          accounting_basis?: Database["public"]["Enums"]["accounting_basis"]
          amount: number
          category_name?: string | null
          company_id: string
          competence_date: string
          cost_center_name?: string | null
          created_at?: string
          customer_or_supplier_name?: string | null
          description: string
          due_date?: string | null
          external_id?: string | null
          id?: string
          payment_date?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          accounting_basis?: Database["public"]["Enums"]["accounting_basis"]
          amount?: number
          category_name?: string | null
          company_id?: string
          competence_date?: string
          cost_center_name?: string | null
          created_at?: string
          customer_or_supplier_name?: string | null
          description?: string
          due_date?: string | null
          external_id?: string | null
          id?: string
          payment_date?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions_raw: {
        Row: {
          company_id: string
          created_at: string
          external_id: string | null
          id: string
          imported_at: string
          raw_payload: Json
          source: string
        }
        Insert: {
          company_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          imported_at?: string
          raw_payload: Json
          source?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          imported_at?: string
          raw_payload?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_raw_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          accounting_basis: Database["public"]["Enums"]["accounting_basis"]
          accounts_payable: number
          accounts_receivable: number
          cash_balance: number
          company_id: string
          created_at: string
          ebitda: number
          gross_margin: number
          gross_revenue: number
          id: string
          month: number
          net_margin: number
          net_profit: number
          net_revenue: number
          operational_costs: number
          operational_expenses: number
          updated_at: string
          year: number
        }
        Insert: {
          accounting_basis?: Database["public"]["Enums"]["accounting_basis"]
          accounts_payable?: number
          accounts_receivable?: number
          cash_balance?: number
          company_id: string
          created_at?: string
          ebitda?: number
          gross_margin?: number
          gross_revenue?: number
          id?: string
          month: number
          net_margin?: number
          net_profit?: number
          net_revenue?: number
          operational_costs?: number
          operational_expenses?: number
          updated_at?: string
          year: number
        }
        Update: {
          accounting_basis?: Database["public"]["Enums"]["accounting_basis"]
          accounts_payable?: number
          accounts_receivable?: number
          cash_balance?: number
          company_id?: string
          created_at?: string
          ebitda?: number
          gross_margin?: number
          gross_revenue?: number
          id?: string
          month?: number
          net_margin?: number
          net_profit?: number
          net_revenue?: number
          operational_costs?: number
          operational_expenses?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          categoria: string | null
          centro_custo: string | null
          cliente: string | null
          conta_azul_event: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          id: string
          raw: Json
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          centro_custo?: string | null
          cliente?: string | null
          conta_azul_event?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id: string
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          centro_custo?: string | null
          cliente?: string | null
          conta_azul_event?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          evento: string
          executado_em: string
          id: string
          mensagem: string | null
          registro_id: string | null
          status: string
          tabela: string
        }
        Insert: {
          evento: string
          executado_em?: string
          id?: string
          mensagem?: string | null
          registro_id?: string | null
          status: string
          tabela: string
        }
        Update: {
          evento?: string
          executado_em?: string
          id?: string
          mensagem?: string | null
          registro_id?: string | null
          status?: string
          tabela?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente: string | null
          conta_azul_event: string | null
          created_at: string
          data: string | null
          descricao: string | null
          id: string
          numero: string | null
          raw: Json
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente?: string | null
          conta_azul_event?: string | null
          created_at?: string
          data?: string | null
          descricao?: string | null
          id: string
          numero?: string | null
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cliente?: string | null
          conta_azul_event?: string | null
          created_at?: string
          data?: string | null
          descricao?: string | null
          id?: string
          numero?: string | null
          raw?: Json
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      conta_azul_connections_safe: {
        Row: {
          company_id: string | null
          connection_status:
            | Database["public"]["Enums"]["connection_status"]
            | null
          created_at: string | null
          id: string | null
          last_sync_at: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          connection_status?:
            | Database["public"]["Enums"]["connection_status"]
            | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          connection_status?:
            | Database["public"]["Enums"]["connection_status"]
            | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conta_azul_connections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      accounting_basis: "cash" | "accrual"
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "open" | "in_review" | "resolved"
      app_role: "admin" | "controller" | "viewer"
      connection_status: "disconnected" | "connected" | "expired" | "error"
      report_status: "pending" | "generated" | "sent" | "failed"
      transaction_status: "pending" | "paid" | "overdue" | "canceled"
      transaction_type:
        | "revenue"
        | "expense"
        | "tax"
        | "transfer"
        | "financial_income"
        | "financial_expense"
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
    Enums: {
      accounting_basis: ["cash", "accrual"],
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["open", "in_review", "resolved"],
      app_role: ["admin", "controller", "viewer"],
      connection_status: ["disconnected", "connected", "expired", "error"],
      report_status: ["pending", "generated", "sent", "failed"],
      transaction_status: ["pending", "paid", "overdue", "canceled"],
      transaction_type: [
        "revenue",
        "expense",
        "tax",
        "transfer",
        "financial_income",
        "financial_expense",
      ],
    },
  },
} as const
