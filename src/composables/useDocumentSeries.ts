import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface DocumentSeries {
  id: number
  document_type_code: string
  document_type_name: string
  series: string
  branch_id: string | null
  branch_name: string | null
  last_number: number
  is_active: boolean
}

export interface OperationType {
  code: string
  descripcion: string
}

export function useDocumentSeries() {
  const series = ref<DocumentSeries[]>([])
  const operationTypes = ref<OperationType[]>([])
  const operationTypesV2 = ref<OperationType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Obtener series disponibles
  const fetchAvailableSeries = async (
    companyId: string,
    documentTypeCode?: string,
    branchId?: string
  ) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase.rpc(
        'get_available_document_series',
        {
          p_company_id: companyId,
          p_document_type_code: documentTypeCode || null,
          p_branch_id: branchId || null
        }
      )

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      series.value = data || []
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching document series:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Validar serie
  const validateSeries = async (
    companyId: string,
    documentTypeCode: string,
    seriesCode: string
  ): Promise<boolean> => {
    try {
      const { data, error: supabaseError } = await supabase.rpc(
        'validate_document_series',
        {
          p_company_id: companyId,
          p_document_type_code: documentTypeCode,
          p_series: seriesCode
        }
      )

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      return data === true
    } catch (err) {
      console.error('Error validating series:', err)
      return false
    }
  }

  // Obtener siguiente número de documento
  const getNextDocumentNumber = async (
    companyId: string,
    documentTypeCode: string,
    seriesCode: string
  ): Promise<number | null> => {
    try {
      const { data, error: supabaseError } = await supabase.rpc(
        'next_document_number',
        {
          p_company_id: companyId,
          p_document_type_code: documentTypeCode,
          p_series: seriesCode
        }
      )

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      return data
    } catch (err) {
      console.error('Error getting next document number:', err)
      return null
    }
  }

  // Computed properties
  const seriesByDocumentType = computed(() => {
    const grouped: Record<string, DocumentSeries[]> = {}
    series.value.forEach((serie) => {
      if (!grouped[serie.document_type_code]) {
        grouped[serie.document_type_code] = []
      }
      grouped[serie.document_type_code].push(serie)
    })
    return grouped
  })

  const activeSeries = computed(() => 
    series.value.filter(serie => serie.is_active)
  )

  // Obtener tipos de operación SUNAT (cat_12) usando función RPC
  const fetchOperationTypes = async () => {
    try {
      const { data, error: supabaseError } = await supabase.rpc('get_sunat_operation_types')

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      operationTypes.value = data || []
      return data
    } catch (err) {
      console.error('Error fetching operation types:', err)
      return []
    }
  }

  // Obtener tipos de operación SUNAT v2 (cat_17) usando función RPC
  const fetchOperationTypesV2 = async () => {
    try {
      const { data, error: supabaseError } = await supabase.rpc('get_sunat_operation_types_v2')

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      operationTypesV2.value = data || []
      return data
    } catch (err) {
      console.error('Error fetching operation types v2:', err)
      return []
    }
  }

  // Helper para formatear número completo
  const formatFullDocumentNumber = (series: string, number: number): string => {
    return `${series}-${number.toString().padStart(8, '0')}`
  }

  return {
    // State
    series,
    operationTypes,
    operationTypesV2,
    loading,
    error,
    
    // Computed
    seriesByDocumentType,
    activeSeries,
    
    // Actions
    fetchAvailableSeries,
    validateSeries,
    getNextDocumentNumber,
    fetchOperationTypes,
    fetchOperationTypesV2,
    
    // Helpers
    formatFullDocumentNumber
  }
}