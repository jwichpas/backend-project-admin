import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface DocumentType {
  code: string
  descripcion: string
}

export interface UbigeoLocation {
  code: string
  departamento: string
  provincia: string
  distrito: string
  full_name: string
}

export function useSunatData() {
  const documentTypes = ref<DocumentType[]>([])
  const ubigeoLocations = ref<UbigeoLocation[]>([])
  const loadingDocTypes = ref(false)
  const loadingUbigeo = ref(false)
  const errorDocTypes = ref<string | null>(null)
  const errorUbigeo = ref<string | null>(null)

  // Computed for formatted options
  const documentTypeOptions = computed(() => 
    documentTypes.value.map(doc => ({
      value: doc.code,
      label: doc.descripcion,
      description: doc.code
    }))
  )

  const ubigeoOptions = computed(() => 
    ubigeoLocations.value.map(location => ({
      value: location.code,
      label: location.full_name,
      description: `Código: ${location.code}`
    }))
  )

  const fetchDocumentTypes = async () => {
    if (documentTypes.value.length > 0) return // Already loaded
    
    loadingDocTypes.value = true
    errorDocTypes.value = null

    try {
      console.log('Fetching document types from SUNAT...')
      const { data, error } = await supabase.rpc('get_sunat_identity_document_types')
      
      if (error) {
        console.error('Supabase RPC Error:', error)
        throw error
      }
      
      console.log('Document types received:', data)
      documentTypes.value = data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading document types'
      errorDocTypes.value = errorMessage
      console.error('Error fetching document types:', err)
      
      // Fallback data in case of error
      documentTypes.value = [
        { code: '1', descripcion: 'DNI' },
        { code: '6', descripcion: 'RUC' },
        { code: '7', descripcion: 'Pasaporte' },
        { code: 'A', descripcion: 'Cédula Diplomática' },
        { code: 'B', descripcion: 'Carnet de Extranjería' }
      ]
    } finally {
      loadingDocTypes.value = false
    }
  }

  const fetchUbigeoLocations = async (searchTerm?: string) => {
    loadingUbigeo.value = true
    errorUbigeo.value = null

    try {
      console.log('Fetching ubigeo with search term:', searchTerm)
      const { data, error } = await supabase.rpc('get_sunat_ubigeo', {
        search_term: searchTerm || null
      })
      
      if (error) {
        console.error('Supabase RPC Error:', error)
        throw error
      }
      
      console.log('Ubigeo locations received:', data?.length, 'results')
      ubigeoLocations.value = data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading ubigeo locations'
      errorUbigeo.value = errorMessage
      console.error('Error fetching ubigeo locations:', err)
      ubigeoLocations.value = []
    } finally {
      loadingUbigeo.value = false
    }
  }

  const searchUbigeo = async (searchTerm: string) => {
    if (searchTerm.trim().length >= 2) {
      await fetchUbigeoLocations(searchTerm.trim())
    } else {
      ubigeoLocations.value = []
    }
  }

  const findUbigeoByCode = async (code: string): Promise<UbigeoLocation | null> => {
    try {
      // First check if we already have it in memory
      let found = ubigeoLocations.value.find(loc => loc.code === code)
      if (found) return found
      
      // Try to fetch by searching the first digits of the code to get the department/province
      const departmentCode = code.substring(0, 2)
      const provinceCode = code.substring(2, 4)
      
      console.log(`Searching for ubigeo code: ${code} (dept: ${departmentCode}, prov: ${provinceCode})`)
      
      // Search by code prefix to find related locations
      const { data, error } = await supabase.rpc('get_sunat_ubigeo', {
        search_term: null // Get initial locations
      })
      
      if (error) {
        console.error('Error fetching ubigeo for code search:', error)
        throw error
      }
      
      // Update locations and search for the specific code
      ubigeoLocations.value = data || []
      found = ubigeoLocations.value.find(loc => loc.code === code)
      
      // If still not found, try to fetch more specifically  
      if (!found && code.length === 6) {
        // Try searching by department name based on common codes
        const departmentNames: Record<string, string> = {
          '15': 'Lima',
          '04': 'Arequipa', 
          '08': 'Cusco',
          '13': 'La Libertad',
          '14': 'Lambayeque',
          '25': 'Ucayali'
        }
        
        const deptName = departmentNames[departmentCode]
        if (deptName) {
          await searchUbigeo(deptName)
          found = ubigeoLocations.value.find(loc => loc.code === code)
        }
      }
      
      console.log('Found ubigeo:', found ? `${found.full_name} (${found.code})` : 'Not found')
      return found || null
    } catch (err) {
      console.error('Error finding ubigeo by code:', err)
      return null
    }
  }

  return {
    documentTypes,
    ubigeoLocations,
    documentTypeOptions,
    ubigeoOptions,
    loadingDocTypes,
    loadingUbigeo,
    errorDocTypes,
    errorUbigeo,
    fetchDocumentTypes,
    fetchUbigeoLocations,
    searchUbigeo,
    findUbigeoByCode
  }
}