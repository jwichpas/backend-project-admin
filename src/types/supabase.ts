export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          ruc: string
          legal_name: string
          trade_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          ubigeo_code: string | null
          currency_code: string
          valuation_method: string
          logo_url: string | null
          website: string | null
          sol_user: string | null
          sol_pass: string | null
          cert_path: string | null
          client_id: string | null
          client_secret: string | null
          production: boolean
          business_config: Json
          integrations: Json
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          version: number
        }
        Insert: {
          id?: string
          ruc: string
          legal_name: string
          trade_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          ubigeo_code?: string | null
          currency_code?: string
          valuation_method?: string
          logo_url?: string | null
          website?: string | null
          sol_user?: string | null
          sol_pass?: string | null
          cert_path?: string | null
          client_id?: string | null
          client_secret?: string | null
          production?: boolean
          business_config?: Json
          integrations?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          version?: number
        }
        Update: {
          id?: string
          ruc?: string
          legal_name?: string
          trade_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          ubigeo_code?: string | null
          currency_code?: string
          valuation_method?: string
          logo_url?: string | null
          website?: string | null
          sol_user?: string | null
          sol_pass?: string | null
          cert_path?: string | null
          client_id?: string | null
          client_secret?: string | null
          production?: boolean
          business_config?: Json
          integrations?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          version?: number
        }
      }
      branches: {
        Row: {
          id: string
          company_id: string
          code: string
          name: string
          address: string | null
          ubigeo_code: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          code: string
          name: string
          address?: string | null
          ubigeo_code?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          code?: string
          name?: string
          address?: string | null
          ubigeo_code?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          constraints: Json
          is_active: boolean
          hierarchy_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json
          constraints?: Json
          is_active?: boolean
          hierarchy_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          constraints?: Json
          is_active?: boolean
          hierarchy_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_companies: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role_id: string
          is_active: boolean
          permissions_override: Json
          valid_from: string
          valid_until: string | null
          last_login_at: string | null
          login_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          role_id: string
          is_active?: boolean
          permissions_override?: Json
          valid_from?: string
          valid_until?: string | null
          last_login_at?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          role_id?: string
          is_active?: boolean
          permissions_override?: Json
          valid_from?: string
          valid_until?: string | null
          last_login_at?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      warehouses: {
        Row: {
          id: string
          company_id: string
          branch_id: string | null
          code: string
          name: string
          width: number
          height: number
          length: number
          total_area: number
          total_volume: number
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          warehouse_type: string
          temperature_zone: string | null
          max_capacity_kg: number | null
          current_capacity_kg: number
          is_active: boolean
          operational_status: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          branch_id?: string | null
          code: string
          name: string
          width?: number
          height?: number
          length?: number
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          warehouse_type?: string
          temperature_zone?: string | null
          max_capacity_kg?: number | null
          current_capacity_kg?: number
          is_active?: boolean
          operational_status?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string | null
          code?: string
          name?: string
          width?: number
          height?: number
          length?: number
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          warehouse_type?: string
          temperature_zone?: string | null
          max_capacity_kg?: number | null
          current_capacity_kg?: number
          is_active?: boolean
          operational_status?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      ubigeo: {
        Row: {
          code: string
          departamento: string | null
          provincia: string | null
          distrito: string | null
        }
        Insert: {
          code: string
          departamento?: string | null
          provincia?: string | null
          distrito?: string | null
        }
        Update: {
          code?: string
          departamento?: string | null
          provincia?: string | null
          distrito?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}