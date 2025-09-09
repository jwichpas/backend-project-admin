import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { branchesService } from '@/services/branchesService'
import type { Database } from '@/types/supabase'

type Branch = Database['public']['Tables']['branches']['Row']
type BranchInsert = Database['public']['Tables']['branches']['Insert']
type BranchUpdate = Database['public']['Tables']['branches']['Update']

interface BranchWithRelations extends Branch {
  warehouses?: any[]
  company?: any
}

export const useBranchesStore = defineStore('branches', () => {
  const branches = ref<BranchWithRelations[]>([])
  const selectedBranch = ref<BranchWithRelations | null>(null)
  const ubigeoData = ref<any[]>([])
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const errorMessage = computed(() => error.value)
  
  const branchOptions = computed(() => 
    branches.value.map(b => ({
      value: b.id,
      label: `${b.code} - ${b.name}`,
      code: b.code,
      name: b.name
    }))
  )

  const activeBranches = computed(() => 
    branches.value.filter(b => !b.deleted_at)
  )

  async function fetchAll(companyId: string) {
    loading.value = true
    error.value = null
    
    try {
      branches.value = await branchesService.getAll(companyId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar sucursales'
      console.error('Error fetching branches:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    error.value = null
    
    try {
      selectedBranch.value = await branchesService.getById(id)
      return selectedBranch.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar sucursal'
      console.error('Error fetching branch:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(branchData: BranchInsert) {
    loading.value = true
    error.value = null
    
    try {
      const newBranch = await branchesService.create(branchData)
      branches.value.push(newBranch)
      return newBranch
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear sucursal'
      console.error('Error creating branch:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, branchData: BranchUpdate) {
    loading.value = true
    error.value = null
    
    try {
      const updatedBranch = await branchesService.update(id, branchData)
      
      const index = branches.value.findIndex(b => b.id === id)
      if (index !== -1) {
        branches.value[index] = { ...branches.value[index], ...updatedBranch }
      }
      
      if (selectedBranch.value?.id === id) {
        selectedBranch.value = { ...selectedBranch.value, ...updatedBranch }
      }
      
      return updatedBranch
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar sucursal'
      console.error('Error updating branch:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBranch(id: string) {
    loading.value = true
    error.value = null
    
    try {
      await branchesService.delete(id)
      branches.value = branches.value.filter(b => b.id !== id)
      
      if (selectedBranch.value?.id === id) {
        selectedBranch.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar sucursal'
      console.error('Error deleting branch:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function validateUniqueCode(companyId: string, code: string, excludeId?: string) {
    try {
      return await branchesService.validateUniqueCode(companyId, code, excludeId)
    } catch (err) {
      console.error('Error validating branch code:', err)
      return false
    }
  }

  async function fetchUbigeoData() {
    try {
      ubigeoData.value = await branchesService.getUbigeoData()
    } catch (err) {
      console.error('Error fetching ubigeo data:', err)
    }
  }

  async function searchUbigeo(search: string) {
    try {
      return await branchesService.searchUbigeo(search)
    } catch (err) {
      console.error('Error searching ubigeo:', err)
      return []
    }
  }

  function getBranchByCode(code: string) {
    return branches.value.find(b => b.code === code)
  }

  function getBranchById(id: string) {
    return branches.value.find(b => b.id === id)
  }

  function clearError() {
    error.value = null
  }

  function clearSelected() {
    selectedBranch.value = null
  }

  function reset() {
    branches.value = []
    selectedBranch.value = null
    ubigeoData.value = []
    loading.value = false
    error.value = null
  }

  return {
    branches,
    selectedBranch,
    ubigeoData,
    loading,
    error,
    isLoading,
    hasError,
    errorMessage,
    branchOptions,
    activeBranches,
    
    fetchAll,
    fetchById,
    create,
    update,
    deleteBranch,
    validateUniqueCode,
    fetchUbigeoData,
    searchUbigeo,
    getBranchByCode,
    getBranchById,
    clearError,
    clearSelected,
    reset
  }
})