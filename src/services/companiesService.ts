import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export class CompaniesService {
  async getAll() {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        user_companies!inner(
          user_id,
          role_id,
          is_active,
          roles(name, permissions)
        )
      `)
      .is('deleted_at', null)
      .order('legal_name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getUserCompanies(userId: string) {
    const { data, error } = await supabase
      .from('user_companies')
      .select(`
        *,
        company:companies!inner(
          id,
          ruc,
          legal_name,
          trade_name,
          email,
          phone,
          address,
          logo_url,
          website,
          currency_code,
          created_at
        ),
        role:roles(name, permissions)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('companies.deleted_at', null)

    if (error) throw error
    return data || []
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        branches(
          id,
          code,
          name,
          address,
          ubigeo_code,
          created_at
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  async create(company: CompanyInsert) {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, company: CompanyUpdate) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...company,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async assignUserToCompany(userId: string, companyId: string, roleId: string) {
    const { data, error } = await supabase
      .from('user_companies')
      .insert({
        user_id: userId,
        company_id: companyId,
        role_id: roleId,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async removeUserFromCompany(userId: string, companyId: string) {
    const { data, error } = await supabase
      .from('user_companies')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateUserRole(userId: string, companyId: string, roleId: string) {
    const { data, error } = await supabase
      .from('user_companies')
      .update({ role_id: roleId })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getCompanyRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('hierarchy_level', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const companiesService = new CompaniesService()