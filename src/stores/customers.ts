import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface Customer {
  id: string
  company_id: string
  doc_type: string
  doc_number: string
  apellido_paterno: string | null
  apellido_materno: string | null
  nombres: string | null
  razon_social: string | null
  fullname: string
  email: string | null
  phone: string | null
  address: string | null
  ubigeo_code: string | null
  country_code: string
  has_location: boolean
  primary_location?: {
    latitude: number
    longitude: number
    description: string | null
  }
  // Sales statistics
  total_sales: number
  total_documents: number
  avg_sale_amount: number
  last_purchase_date: string | null
  created_at: string
  updated_at: string
}

export interface CustomerContact {
  id: string
  customer_id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

export interface CustomerLocation {
  id: string
  party_id: string
  latitude: number
  longitude: number
  sequence: number | null
  is_primary: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export const useCustomersStore = defineStore('customers', () => {
  // State
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const totalCustomers = computed(() => customers.value.length)
  
  const totalIndividuals = computed(() => 
    customers.value.filter(c => c.doc_type === '1').length
  )
  
  const totalCompanies = computed(() => 
    customers.value.filter(c => c.doc_type === '6').length
  )
  
  const totalWithLocation = computed(() =>
    customers.value.filter(c => c.has_location).length
  )

  // Actions
  const fetchCustomers = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('parties')
        .select(`
          id,
          company_id,
          doc_type,
          doc_number,
          apellido_paterno,
          apellido_materno,
          nombres,
          razon_social,
          fullname,
          email,
          phone,
          address,
          ubigeo_code,
          country_code,
          created_at,
          updated_at,
          party_locations (
            id,
            latitude,
            longitude,
            is_primary,
            description
          )
        `)
        .eq('company_id', companyId)
        .eq('is_customer', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Transform data to include sales statistics
      const customersWithStats = await Promise.all((data || []).map(async (customer) => {
        // Fetch sales statistics
        const { data: salesData, error: salesError } = await supabase
          .from('sales_docs')
          .select('total, issue_date')
          .eq('company_id', companyId)
          .eq('customer_id', customer.id)
          .is('deleted_at', null)

        if (salesError) {
          console.warn('Error fetching sales data for customer:', customer.id, salesError)
        }

        const sales = salesData || []
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        const totalDocuments = sales.length
        const avgSaleAmount = totalDocuments > 0 ? totalSales / totalDocuments : 0
        const lastPurchaseDate = sales.length > 0 
          ? sales.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())[0].issue_date
          : null

        // Extract primary location
        const primaryLocation = customer.party_locations?.find((loc: any) => loc.is_primary) || null

        return {
          ...customer,
          has_location: customer.party_locations?.length > 0,
          primary_location: primaryLocation ? {
            latitude: primaryLocation.latitude,
            longitude: primaryLocation.longitude,
            description: primaryLocation.description
          } : undefined,
          total_sales: totalSales,
          total_documents: totalDocuments,
          avg_sale_amount: avgSaleAmount,
          last_purchase_date: lastPurchaseDate
        }
      }))

      customers.value = customersWithStats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching customers'
      console.error('Error fetching customers:', err)
    } finally {
      loading.value = false
    }
  }

  const createCustomer = async (companyId: string, customerData: Partial<Customer>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('parties')
        .insert([{
          company_id: companyId,
          is_customer: true,
          is_supplier: false,
          doc_type: customerData.doc_type,
          doc_number: customerData.doc_number,
          apellido_paterno: customerData.apellido_paterno,
          apellido_materno: customerData.apellido_materno,
          nombres: customerData.nombres,
          razon_social: customerData.razon_social,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          ubigeo_code: customerData.ubigeo_code,
          country_code: customerData.country_code || 'PE'
        }])
        .select()
        .single()

      if (createError) throw createError

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating customer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('parties')
        .update({
          doc_type: customerData.doc_type,
          doc_number: customerData.doc_number,
          apellido_paterno: customerData.apellido_paterno,
          apellido_materno: customerData.apellido_materno,
          nombres: customerData.nombres,
          razon_social: customerData.razon_social,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          ubigeo_code: customerData.ubigeo_code,
          country_code: customerData.country_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = customers.value.findIndex(c => c.id === customerId)
      if (index !== -1) {
        customers.value[index] = { ...customers.value[index], ...data }
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error updating customer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCustomer = async (customerId: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('parties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', customerId)

      if (deleteError) throw deleteError

      // Remove from local state
      customers.value = customers.value.filter(c => c.id !== customerId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting customer'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addCustomerLocation = async (customerId: string, location: Omit<CustomerLocation, 'id' | 'party_id' | 'created_at' | 'updated_at'>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: addError } = await supabase
        .from('party_locations')
        .insert([{
          party_id: customerId,
          ...location
        }])
        .select()
        .single()

      if (addError) throw addError

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error adding customer location'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCustomerLocation = async (locationId: string, location: Partial<CustomerLocation>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('party_locations')
        .update({
          ...location,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)
        .select()
        .single()

      if (updateError) throw updateError

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error updating customer location'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCustomerContacts = async (customerId: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('party_contacts')
        .select('*')
        .eq('party_id', customerId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching customer contacts'
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchCustomers = async (companyId: string, query: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: searchError } = await supabase
        .from('parties')
        .select(`
          id,
          doc_type,
          doc_number,
          fullname,
          email,
          phone
        `)
        .eq('company_id', companyId)
        .eq('is_customer', true)
        .is('deleted_at', null)
        .or(`fullname.ilike.%${query}%,doc_number.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

      if (searchError) throw searchError

      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error searching customers'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    customers,
    loading,
    error,
    
    // Computed
    totalCustomers,
    totalIndividuals,
    totalCompanies,
    totalWithLocation,
    
    // Actions
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerLocation,
    updateCustomerLocation,
    fetchCustomerContacts,
    searchCustomers
  }
})