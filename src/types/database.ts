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
      accounts: {
        Row: {
          balance: number
          contact_info: string | null
          created_at: string | null
          id: string
          name: string
          type: string
          entity_type: string | null
          currency: string | null
          is_international: boolean | null
        }
        Insert: {
          balance?: number
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name: string
          type: string
          entity_type?: string | null
          currency?: string | null
          is_international?: boolean | null
        }
        Update: {
          balance?: number
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          entity_type?: string | null
          currency?: string | null
          is_international?: boolean | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          id: string
          notes: string | null
          title: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          title: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          title?: string
        }
        Relationships: []
      }
      ledger: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          is_voided: boolean
          transaction_id: string | null
          type: string
          void_reason: string | null
          currency: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_voided?: boolean
          transaction_id?: string | null
          type: string
          void_reason?: string | null
          currency?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_voided?: boolean
          transaction_id?: string | null
          type?: string
          void_reason?: string | null
          currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          current_stock: number
          description: string | null
          id: string
          name: string
          purchase_price: number
          sale_price: number
          sku: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_stock?: number
          description?: string | null
          id?: string
          name: string
          purchase_price?: number
          sale_price?: number
          sku: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_stock?: number
          description?: string | null
          id?: string
          name?: string
          purchase_price?: number
          sale_price?: number
          sku?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          allowed_pages: Json
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          allowed_pages?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          allowed_pages?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
          unit_price: number | null
          vat_rate: number | null
          vat_included: boolean | null
          currency: string | null
          tax_exemption_code: string | null
          tax_exemption_reason: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
          unit_price?: number | null
          vat_rate?: number | null
          vat_included?: boolean | null
          currency?: string | null
          tax_exemption_code?: string | null
          tax_exemption_reason?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
          unit_price?: number | null
          vat_rate?: number | null
          vat_included?: boolean | null
          currency?: string | null
          tax_exemption_code?: string | null
          tax_exemption_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_net_profit: { Args: never; Returns: Json }
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      transaction_type: "in" | "out"
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
      transaction_type: ["in", "out"],
    },
  },
} as const

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience types
export type Product = Tables<'products'>
export type ProductInsert = TablesInsert<'products'>
export type ProductUpdate = TablesUpdate<'products'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Role = Tables<'roles'>
export type RoleInsert = TablesInsert<'roles'>
export type RoleUpdate = TablesUpdate<'roles'>

export type Transaction = Tables<'transactions'>
export type TransactionInsert = TablesInsert<'transactions'>
export type TransactionUpdate = TablesUpdate<'transactions'>

export type Account = Tables<'accounts'>
export type AccountInsert = TablesInsert<'accounts'>
export type AccountUpdate = TablesUpdate<'accounts'>

export type Expense = Tables<'expenses'>
export type ExpenseInsert = TablesInsert<'expenses'>
export type ExpenseUpdate = TablesUpdate<'expenses'>

export type Ledger = Tables<'ledger'>
export type LedgerInsert = TablesInsert<'ledger'>
export type LedgerUpdate = TablesUpdate<'ledger'>

export type TransactionType = Enums<'transaction_type'>

// Extended types with joins
export type TransactionWithProduct = Transaction & {
  products: Pick<Product, 'name' | 'sku'> | null
  accounts?: Pick<Account, 'name'> | null
}

export type ProfileWithRole = Profile & {
  roles: Role | null
}
