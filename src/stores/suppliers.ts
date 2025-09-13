import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface Supplier {
  id: string
  company_id: string
  party_type: 'individual' | 'company'
  doc_type: string
  doc_number: string
  name: string
  commercial_name?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  reference?: string
  ubigeo?: string
  coordinates?: string
  is_supplier: boolean
  is_customer: boolean
  is_employee: boolean
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface SupplierStats {
  total: number
  companies: number
  individuals: number
  recentlyAdded: number
}

export interface CreateSupplierRequest {
  party_type: 'individual' | 'company'
  doc_type: string
  doc_number: string
  name: string
  commercial_name?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  reference?: string
  ubigeo?: string
  coordinates?: string
  notes?: string
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string
}

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const stats = ref<SupplierStats>({
    total: 0,
    companies: 0,
    individuals: 0,
    recentlyAdded: 0
  })

  const fetchSuppliers = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('parties')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_supplier', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      suppliers.value = data || []
      updateStats()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching suppliers'
      console.error('Error fetching suppliers:', err)
    } finally {
      loading.value = false
    }
  }

  const createSupplier = async (supplierData: CreateSupplierRequest, companyId: string): Promise<Supplier | null> => {
    if (!companyId) {
      error.value = 'No company selected'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const newSupplier = {
        ...supplierData,
        company_id: companyId,
        is_supplier: true,
        is_customer: false,
        is_employee: false,
      }

      const { data, error: supabaseError } = await supabase
        .from('parties')
        .insert(newSupplier)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      suppliers.value.unshift(data)
      updateStats()
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating supplier'
      console.error('Error creating supplier:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateSupplier = async (supplierData: UpdateSupplierRequest): Promise<Supplier | null> => {
    loading.value = true
    error.value = null

    try {
      const { id, ...updateData } = supplierData

      const { data, error: supabaseError } = await supabase
        .from('parties')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      const index = suppliers.value.findIndex(s => s.id === id)
      if (index !== -1) {
        suppliers.value[index] = data
        updateStats()
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error updating supplier'
      console.error('Error updating supplier:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteSupplier = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const { error: supabaseError } = await supabase
        .from('parties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (supabaseError) throw supabaseError

      suppliers.value = suppliers.value.filter(s => s.id !== id)
      updateStats()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting supplier'
      console.error('Error deleting supplier:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const getSupplierById = (id: string): Supplier | undefined => {
    return suppliers.value.find(s => s.id === id)
  }

  const getSuppliersByType = (type: 'individual' | 'company'): Supplier[] => {
    return suppliers.value.filter(s => s.party_type === type)
  }

  const searchSuppliers = (query: string): Supplier[] => {
    if (!query.trim()) return suppliers.value

    const searchTerm = query.toLowerCase().trim()
    return suppliers.value.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.commercial_name?.toLowerCase().includes(searchTerm) ||
      supplier.doc_number.includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.mobile?.includes(searchTerm)
    )
  }

  const updateStats = () => {
    const total = suppliers.value.length
    const companies = suppliers.value.filter(s => s.party_type === 'company').length
    const individuals = suppliers.value.filter(s => s.party_type === 'individual').length
    
    // Count suppliers added in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentlyAdded = suppliers.value.filter(s => 
      new Date(s.created_at) > thirtyDaysAgo
    ).length

    stats.value = {
      total,
      companies,
      individuals,
      recentlyAdded
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    suppliers,
    loading,
    error,
    stats,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    getSuppliersByType,
    searchSuppliers,
    clearError
  }
})