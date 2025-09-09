import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Branch = Database['public']['Tables']['branches']['Row']
type BranchInsert = Database['public']['Tables']['branches']['Insert']
type BranchUpdate = Database['public']['Tables']['branches']['Update']

export class BranchesService {
  async getAll(companyId: string) {
    const { data, error } = await supabase
      .from('branches')
      .select(`
        *,
        warehouses(
          id,
          code,
          name,
          warehouse_type,
          is_active,
          operational_status
        )
      `)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('branches')
      .select(`
        *,
        company:companies(
          legal_name,
          trade_name,
          ruc
        ),
        warehouses(
          id,
          code,
          name,
          warehouse_type,
          address,
          is_active,
          operational_status,
          max_capacity_kg,
          current_capacity_kg
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  async create(branch: BranchInsert) {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, branch: BranchUpdate) {
    // Extract only the fields that belong to the branches table
    const updateData = {
      company_id: branch.company_id,
      code: branch.code,
      name: branch.name,
      address: branch.address,
      ubigeo_code: branch.ubigeo_code,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string) {
    const { data, error } = await supabase
      .from('branches')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getByCompanyCode(companyId: string, code: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('company_id', companyId)
      .eq('code', code)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  async validateUniqueCode(companyId: string, code: string, excludeId?: string) {
    let query = supabase
      .from('branches')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', code)
      .is('deleted_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).length === 0
  }

  async getUbigeoData() {
    const { data, error } = await supabase
      .rpc('get_sunat_ubigeo', { search_term: '' })

    if (error) throw error
    return data || []
  }

  async searchUbigeo(search: string) {
    const { data, error } = await supabase
      .rpc('get_sunat_ubigeo', { search_term: search })

    if (error) throw error
    return data || []
  }
}

export const branchesService = new BranchesService()
