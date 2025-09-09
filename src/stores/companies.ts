import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { companiesService } from '@/services/companiesService'
import type { Database } from '@/types/supabase'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

interface CompanyWithRelations extends Company {
  branches?: any[]
  user_companies?: any[]
}

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref<CompanyWithRelations[]>([])
  const userCompanies = ref<any[]>([])
  const selectedCompany = ref<CompanyWithRelations | null>(null)
  const currentCompany = ref<CompanyWithRelations | null>(null)
  const roles = ref<any[]>([])
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const errorMessage = computed(() => error.value)
  
  const companyOptions = computed(() => 
    companies.value.map(c => ({
      value: c.id,
      label: c.trade_name || c.legal_name,
      ruc: c.ruc
    }))
  )

  const userCompanyOptions = computed(() => 
    userCompanies.value.map(uc => ({
      value: uc.company.id,
      label: uc.company.trade_name || uc.company.legal_name,
      ruc: uc.company.ruc,
      role: uc.role?.name || 'Sin rol'
    }))
  )

  async function fetchAll() {
    loading.value = true
    error.value = null
    
    try {
      companies.value = await companiesService.getAll()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar empresas'
      console.error('Error fetching companies:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchUserCompanies(userId: string) {
    loading.value = true
    error.value = null
    
    try {
      userCompanies.value = await companiesService.getUserCompanies(userId)
      
      if (userCompanies.value.length > 0 && !currentCompany.value) {
        currentCompany.value = userCompanies.value[0].company
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar empresas del usuario'
      console.error('Error fetching user companies:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    error.value = null
    
    try {
      selectedCompany.value = await companiesService.getById(id)
      return selectedCompany.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar empresa'
      console.error('Error fetching company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(companyData: CompanyInsert) {
    loading.value = true
    error.value = null
    
    try {
      const newCompany = await companiesService.create(companyData)
      companies.value.push(newCompany)
      return newCompany
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear empresa'
      console.error('Error creating company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, companyData: CompanyUpdate) {
    loading.value = true
    error.value = null
    
    try {
      const updatedCompany = await companiesService.update(id, companyData)
      
      const index = companies.value.findIndex(c => c.id === id)
      if (index !== -1) {
        companies.value[index] = { ...companies.value[index], ...updatedCompany }
      }
      
      if (selectedCompany.value?.id === id) {
        selectedCompany.value = { ...selectedCompany.value, ...updatedCompany }
      }
      
      if (currentCompany.value?.id === id) {
        currentCompany.value = { ...currentCompany.value, ...updatedCompany }
      }
      
      return updatedCompany
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar empresa'
      console.error('Error updating company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCompany(id: string) {
    loading.value = true
    error.value = null
    
    try {
      await companiesService.delete(id)
      companies.value = companies.value.filter(c => c.id !== id)
      
      if (selectedCompany.value?.id === id) {
        selectedCompany.value = null
      }
      
      if (currentCompany.value?.id === id) {
        currentCompany.value = userCompanies.value[0]?.company || null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar empresa'
      console.error('Error deleting company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchRoles() {
    try {
      roles.value = await companiesService.getCompanyRoles()
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }

  async function assignUserToCompany(userId: string, companyId: string, roleId: string) {
    loading.value = true
    error.value = null
    
    try {
      const assignment = await companiesService.assignUserToCompany(userId, companyId, roleId)
      await fetchUserCompanies(userId)
      return assignment
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al asignar usuario a empresa'
      console.error('Error assigning user to company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentCompany(company: CompanyWithRelations) {
    currentCompany.value = company
  }

  function clearError() {
    error.value = null
  }

  function clearSelected() {
    selectedCompany.value = null
  }

  function reset() {
    companies.value = []
    userCompanies.value = []
    selectedCompany.value = null
    currentCompany.value = null
    roles.value = []
    loading.value = false
    error.value = null
  }

  return {
    companies,
    userCompanies,
    selectedCompany,
    currentCompany,
    roles,
    loading,
    error,
    isLoading,
    hasError,
    errorMessage,
    companyOptions,
    userCompanyOptions,
    
    fetchAll,
    fetchUserCompanies,
    fetchById,
    create,
    update,
    deleteCompany,
    fetchRoles,
    assignUserToCompany,
    setCurrentCompany,
    clearError,
    clearSelected,
    reset
  }
})