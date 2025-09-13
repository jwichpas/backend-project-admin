import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface UnitConversion {
  id: string
  product_id: string
  from_unit: string
  to_unit: string
  conversion_factor: number
  from_unit_name?: string
  to_unit_name?: string
}

export interface ProductUnit {
  code: string
  name: string
  is_base: boolean
}

export function useProductConversions() {
  const conversions = ref<UnitConversion[]>([])
  const availableUnits = ref<ProductUnit[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch unit conversions for a specific product
  const fetchConversions = async (productId: string) => {
    loading.value = true
    error.value = null

    try {
      // First get the conversions
      const { data: conversionData, error: conversionError } = await supabase
        .from('product_unit_conversions')
        .select('id, product_id, from_unit, to_unit, conversion_factor')
        .eq('product_id', productId)

      if (conversionError) throw conversionError

      // Then get unit descriptions using the SUNAT function
      const { data: unitsData, error: unitsError } = await supabase.rpc('get_sunat_measurement_units')
      
      if (unitsError) throw unitsError

      // Create a map for quick lookup
      const unitsMap = new Map(
        unitsData?.map((unit: any) => [unit.code, unit.descripcion]) || []
      )

      conversions.value = conversionData?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        from_unit: item.from_unit,
        to_unit: item.to_unit,
        conversion_factor: item.conversion_factor,
        from_unit_name: unitsMap.get(item.from_unit) || item.from_unit,
        to_unit_name: unitsMap.get(item.to_unit) || item.to_unit
      })) || []

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar conversiones'
      console.error('Error fetching conversions:', err)
    } finally {
      loading.value = false
    }
  }

  // Fetch available measurement units using the SUNAT function
  const fetchAvailableUnits = async () => {
    try {
      const { data, error: fetchError } = await supabase.rpc('get_sunat_measurement_units')

      if (fetchError) throw fetchError

      availableUnits.value = data?.map((unit: any) => ({
        code: unit.code,
        name: unit.descripcion,
        is_base: false
      })) || []

    } catch (err) {
      console.error('Error fetching units:', err)
    }
  }

  // Convert quantity using database function
  const convertQuantity = async (
    productId: string,
    fromUnit: string,
    toUnit: string,
    quantity: number
  ): Promise<number | null> => {
    try {
      const { data, error: convertError } = await supabase.rpc('convert_unit', {
        p_product_id: productId,
        p_from_unit: fromUnit,
        p_to_unit: toUnit,
        p_quantity: quantity
      })

      if (convertError) {
        console.error('Error converting unit:', convertError)
        return null
      }

      return data
    } catch (err) {
      console.error('Error in unit conversion:', err)
      return null
    }
  }

  // Get available conversions for a product
  const getAvailableConversions = (productId: string, baseUnit: string) => {
    return conversions.value.filter(conv => 
      conv.product_id === productId && 
      (conv.from_unit === baseUnit || conv.to_unit === baseUnit)
    )
  }

  // Get conversion factor between two units
  const getConversionFactor = (productId: string, fromUnit: string, toUnit: string): number | null => {
    const directConversion = conversions.value.find(conv =>
      conv.product_id === productId &&
      conv.from_unit === fromUnit &&
      conv.to_unit === toUnit
    )

    if (directConversion) {
      return directConversion.conversion_factor
    }

    // Try inverse conversion
    const inverseConversion = conversions.value.find(conv =>
      conv.product_id === productId &&
      conv.from_unit === toUnit &&
      conv.to_unit === fromUnit
    )

    if (inverseConversion) {
      return 1 / inverseConversion.conversion_factor
    }

    return null
  }

  // Get all convertible units for a product
  const getConvertibleUnits = (productId: string, baseUnit: string) => {
    const units = new Set([baseUnit])
    
    conversions.value
      .filter(conv => conv.product_id === productId)
      .forEach(conv => {
        if (conv.from_unit === baseUnit || conv.to_unit === baseUnit) {
          units.add(conv.from_unit)
          units.add(conv.to_unit)
        }
      })

    return Array.from(units).map(unitCode => ({
      code: unitCode,
      name: availableUnits.value.find(u => u.code === unitCode)?.name || unitCode
    }))
  }

  // Format quantity with unit
  const formatQuantityWithUnit = (quantity: number, unitCode: string): string => {
    const unitName = availableUnits.value.find(u => u.code === unitCode)?.name || unitCode
    return `${quantity.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unitName}`
  }

  // Add a new unit conversion
  const addConversion = async (conversion: Omit<UnitConversion, 'id'>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: insertError } = await supabase
        .from('product_unit_conversions')
        .insert([conversion])
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh conversions
      await fetchConversions(conversion.product_id)

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al agregar conversión'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update a unit conversion
  const updateConversion = async (id: string, updates: Partial<UnitConversion>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('product_unit_conversions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = conversions.value.findIndex(conv => conv.id === id)
      if (index !== -1) {
        conversions.value[index] = { ...conversions.value[index], ...updates }
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar conversión'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Remove a unit conversion
  const removeConversion = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('product_unit_conversions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Remove from local state
      conversions.value = conversions.value.filter(conv => conv.id !== id)

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar conversión'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const hasConversions = computed(() => conversions.value.length > 0)

  return {
    // State
    conversions: computed(() => conversions.value || []),
    availableUnits: computed(() => availableUnits.value || []),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    hasConversions,

    // Methods
    fetchConversions,
    fetchAvailableUnits,
    convertQuantity,
    getAvailableConversions,
    getConversionFactor,
    getConvertibleUnits,
    formatQuantityWithUnit,
    addConversion,
    updateConversion,
    removeConversion
  }
}