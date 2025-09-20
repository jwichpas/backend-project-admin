import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface AvailablePosition {
  position_id: string
  location_code: string
  zone_id: string
  zone_code: string
  zone_name: string
  aisle_id: string
  aisle_code: string
  shelf_id: string
  shelf_code: string
  level_number: number
  position_number: number
  is_occupied: boolean
  current_product_id?: string
  current_stock: number
}

export interface UnassignedProduct {
  product_id: string
  product_name: string
  sku: string
  total_stock: number
  category_name?: string
  brand_name?: string
}

export interface WarehouseStats {
  total_zones: number
  total_aisles: number
  total_shelves: number
  total_positions: number
  occupied_positions: number
  available_positions: number
  occupancy_rate: number
}

export interface BulkAssignmentResult {
  product_id: string
  position_id?: string
  location_code?: string
  success: boolean
  error_message?: string
}

export function useLocationAssignment() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Data stores
  const availablePositions = ref<AvailablePosition[]>([])
  const unassignedProducts = ref<UnassignedProduct[]>([])
  const warehouseStats = ref<WarehouseStats | null>(null)

  // Computed properties
  const freePositions = computed(() =>
    availablePositions.value.filter(pos => !pos.is_occupied)
  )

  const occupiedPositions = computed(() =>
    availablePositions.value.filter(pos => pos.is_occupied)
  )

  const positionsByZone = computed(() => {
    const zones = new Map<string, AvailablePosition[]>()
    availablePositions.value.forEach(position => {
      const zoneKey = position.zone_id
      if (!zones.has(zoneKey)) {
        zones.set(zoneKey, [])
      }
      zones.get(zoneKey)!.push(position)
    })
    return zones
  })

  // Get available positions for a warehouse
  const fetchAvailablePositions = async (warehouseId: string, zoneId?: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase.rpc('get_available_positions', {
        p_warehouse_id: warehouseId,
        p_zone_id: zoneId || null
      })

      if (err) throw err

      availablePositions.value = data || []
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching available positions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get unassigned products for a company
  const fetchUnassignedProducts = async (companyId: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase.rpc('get_unassigned_products', {
        p_company_id: companyId
      })

      if (err) throw err

      unassignedProducts.value = data || []
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching unassigned products:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get warehouse statistics
  const fetchWarehouseStats = async (warehouseId: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase.rpc('get_warehouse_stats', {
        p_warehouse_id: warehouseId
      })

      if (err) throw err

      warehouseStats.value = data?.[0] || null
      return data?.[0]
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching warehouse stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Assign a single product to a position
  const assignProduct = async (
    productId: string,
    warehouseId: string,
    zoneId: string,
    positionId: string,
    stockAmount: number = 0,
    capacityMax: number = 100,
    isPrimary: boolean = false
  ) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('product_location')
        .insert({
          product_id: productId,
          warehouse_id: warehouseId,
          warehouse_zone_id: zoneId,
          warehouse_shelf_position_id: positionId,
          stock_actual: stockAmount,
          capacity_max: capacityMax,
          location_priority: 1,
          es_principal: isPrimary,
          estado: true
        })
        .select()
        .single()

      if (err) throw err

      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error assigning product:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Bulk assign products using database function
  const bulkAssignProducts = async (
    companyId: string,
    warehouseId: string,
    productIds: string[],
    zoneId?: string,
    defaultStock: number = 0,
    strategy: 'sequential' | 'by_category' | 'by_size' | 'random' = 'sequential'
  ): Promise<BulkAssignmentResult[]> => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase.rpc('bulk_assign_products', {
        p_company_id: companyId,
        p_warehouse_id: warehouseId,
        p_product_ids: productIds,
        p_zone_id: zoneId || null,
        p_default_stock: defaultStock,
        p_strategy: strategy
      })

      if (err) throw err

      return data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error in bulk assignment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Remove product from location
  const removeProductFromLocation = async (locationId: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('product_location')
        .update({ estado: false })
        .eq('id', locationId)

      if (err) throw err

      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error removing product from location:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Move product between locations
  const moveProduct = async (
    locationId: string,
    newPositionId: string,
    newZoneId: string
  ) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('product_location')
        .update({
          warehouse_zone_id: newZoneId,
          warehouse_shelf_position_id: newPositionId
        })
        .eq('id', locationId)
        .select()
        .single()

      if (err) throw err

      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error moving product:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Auto-assign products using intelligent algorithm
  const autoAssignProducts = async (
    companyId: string,
    warehouseId: string,
    maxProducts?: number,
    preferredZoneId?: string
  ) => {
    try {
      loading.value = true
      error.value = null

      // Get unassigned products
      const products = await fetchUnassignedProducts(companyId)
      const productsToAssign = maxProducts
        ? products.slice(0, maxProducts)
        : products

      if (productsToAssign.length === 0) {
        return { success: true, message: 'No hay productos para asignar' }
      }

      // Get available positions
      const positions = await fetchAvailablePositions(warehouseId, preferredZoneId)
      const freePositions = positions.filter(pos => !pos.is_occupied)

      if (freePositions.length < productsToAssign.length) {
        throw new Error(`No hay suficientes posiciones disponibles. Necesarias: ${productsToAssign.length}, Disponibles: ${freePositions.length}`)
      }

      // Execute bulk assignment
      const productIds = productsToAssign.map(p => p.product_id)
      const results = await bulkAssignProducts(
        companyId,
        warehouseId,
        productIds,
        preferredZoneId,
        0,
        'sequential'
      )

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      return {
        success: true,
        message: `Asignación completada. Éxitos: ${successCount}, Fallos: ${failureCount}`,
        results
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error in auto assignment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get location assignment summary
  const getLocationSummary = async (warehouseId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('mv_location_summary')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('zone_code')

      if (err) throw err

      return data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching location summary:', err)
      throw err
    }
  }

  // Refresh materialized view
  const refreshLocationSummary = async () => {
    try {
      const { error: err } = await supabase.rpc('refresh_location_summary')
      if (err) throw err
      return true
    } catch (err: any) {
      console.error('Error refreshing location summary:', err)
      return false
    }
  }

  return {
    // State
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Data
    availablePositions: computed(() => availablePositions.value),
    unassignedProducts: computed(() => unassignedProducts.value),
    warehouseStats: computed(() => warehouseStats.value),

    // Computed
    freePositions,
    occupiedPositions,
    positionsByZone,

    // Methods
    fetchAvailablePositions,
    fetchUnassignedProducts,
    fetchWarehouseStats,
    assignProduct,
    bulkAssignProducts,
    removeProductFromLocation,
    moveProduct,
    autoAssignProducts,
    getLocationSummary,
    refreshLocationSummary
  }
}