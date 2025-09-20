import { ref, computed, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'

// Types for product location tracking and history
export interface ProductLocation {
  id: string
  product_id: string
  warehouse_id: string
  warehouse_zone_id: string
  warehouse_shelf_position_id?: string
  location_priority: number
  position_x?: number
  position_y?: number
  position_z?: number
  capacity_max?: number
  stock_actual: number
  es_principal: boolean
  estado: boolean
  last_stock_check?: string
  created_at: string
  updated_at: string
}

export interface ProductLocationHistory {
  id: string
  product_id: string
  from_warehouse_zone_id?: string
  to_warehouse_zone_id?: string
  from_shelf_position_id?: string
  to_shelf_position_id?: string
  quantity: number
  movement_type: 'TRANSFER' | 'RECEIPT' | 'SHIPMENT' | 'ADJUSTMENT'
  reference_id?: string
  reference_type?: string
  moved_by?: string
  moved_at: string
  notes?: string
}

export interface ProductLocationDetailed {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  warehouse_name: string
  warehouse_zone_id: string
  zone_code: string
  zone_name?: string
  warehouse_shelf_position_id?: string
  shelf_position_code?: string
  aisle_code?: string
  shelf_code?: string
  level_number?: number
  position_number?: number
  stock_actual: number
  capacity_max?: number
  es_principal: boolean
  location_priority: number
  created_at: string
  updated_at: string
}

export interface LocationMovementRequest {
  product_id: string
  from_location_id?: string
  to_warehouse_zone_id: string
  to_shelf_position_id?: string
  quantity: number
  movement_type: 'TRANSFER' | 'RECEIPT' | 'SHIPMENT' | 'ADJUSTMENT'
  reference_id?: string
  reference_type?: string
  notes?: string
}

export function useProductLocationTracking() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Data stores
  const productLocations = ref<ProductLocation[]>([])
  const locationHistory = ref<ProductLocationHistory[]>([])
  const detailedLocations = ref<ProductLocationDetailed[]>([])

  // Current stock summary by product and warehouse
  const currentStock = ref<Record<string, { product_id: string; warehouse_id: string; total_stock: number; locations: number }>>({})

  // Computed properties
  const activeLocations = computed(() =>
    productLocations.value.filter(loc => loc.estado)
  )

  const primaryLocations = computed(() =>
    productLocations.value.filter(loc => loc.es_principal && loc.estado)
  )

  const movementsByType = computed(() => {
    const summary = {
      TRANSFER: 0,
      RECEIPT: 0,
      SHIPMENT: 0,
      ADJUSTMENT: 0
    }
    locationHistory.value.forEach(move => {
      summary[move.movement_type] = (summary[move.movement_type] || 0) + 1
    })
    return summary
  })

  // Fetch product locations with detailed information
  const fetchDetailedLocations = async (companyId: string, filters?: {
    product_id?: string
    warehouse_id?: string
    zone_id?: string
    active_only?: boolean
  }) => {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('v_product_locations_detailed')
        .select('*')

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id)
      }
      if (filters?.zone_id) {
        query = query.eq('warehouse_zone_id', filters.zone_id)
      }

      const { data, error: err } = await query
        .order('warehouse_name')
        .order('zone_code')
        .order('aisle_code')
        .order('shelf_code')
        .order('level_number')
        .order('position_number')

      if (err) throw err
      detailedLocations.value = data || []
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching detailed locations:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch product locations for a specific product or warehouse
  const fetchProductLocations = async (filters: {
    company_id: string
    product_id?: string
    warehouse_id?: string
    warehouse_zone_id?: string
  }) => {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('product_location')
        .select(`
          *,
          products!inner(id, name, sku),
          warehouse_zones!inner(id, code, name, warehouse_id, warehouses(name)),
          warehouse_shelf_positions(id, location_code, level_number, position_number, warehouse_shelf_id, warehouse_shelves(code, warehouse_aisle_id, warehouse_aisles(code)))
        `)

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id)
      }
      if (filters.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id)
      }
      if (filters.warehouse_zone_id) {
        query = query.eq('warehouse_zone_id', filters.warehouse_zone_id)
      }

      const { data, error: err } = await query
        .eq('estado', true)
        .order('location_priority')
        .order('es_principal', { ascending: false })

      if (err) throw err
      productLocations.value = data || []
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching product locations:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch location history for a product
  const fetchLocationHistory = async (productId: string, limit = 50) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('product_location_history')
        .select(`
          *,
          from_zone:warehouse_zones!from_warehouse_zone_id(code, name),
          to_zone:warehouse_zones!to_warehouse_zone_id(code, name),
          from_position:warehouse_shelf_positions!from_shelf_position_id(location_code),
          to_position:warehouse_shelf_positions!to_shelf_position_id(location_code)
        `)
        .eq('product_id', productId)
        .order('moved_at', { ascending: false })
        .limit(limit)

      if (err) throw err
      locationHistory.value = data || []
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching location history:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create a new product location
  const createProductLocation = async (location: Omit<ProductLocation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('product_location')
        .insert(location)
        .select()
        .single()

      if (err) throw err
      if (data) {
        productLocations.value.push(data)
      }
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update product location stock
  const updateLocationStock = async (locationId: string, newStock: number) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('product_location')
        .update({
          stock_actual: newStock,
          last_stock_check: new Date().toISOString()
        })
        .eq('id', locationId)
        .select()
        .single()

      if (err) throw err

      // Update local state
      const index = productLocations.value.findIndex(loc => loc.id === locationId)
      if (index > -1 && data) {
        productLocations.value[index] = data
      }

      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Move product between locations
  const moveProduct = async (movement: LocationMovementRequest, userId?: string) => {
    try {
      loading.value = true
      error.value = null

      // Get current location details for history
      let fromLocation = null
      if (movement.from_location_id) {
        const { data } = await supabase
          .from('product_location')
          .select('warehouse_zone_id, warehouse_shelf_position_id, stock_actual')
          .eq('id', movement.from_location_id)
          .single()
        fromLocation = data
      }

      // Create location history entry
      const historyData = {
        product_id: movement.product_id,
        from_warehouse_zone_id: fromLocation?.warehouse_zone_id,
        to_warehouse_zone_id: movement.to_warehouse_zone_id,
        from_shelf_position_id: fromLocation?.warehouse_shelf_position_id,
        to_shelf_position_id: movement.to_shelf_position_id,
        quantity: movement.quantity,
        movement_type: movement.movement_type,
        reference_id: movement.reference_id,
        reference_type: movement.reference_type,
        moved_by: userId,
        notes: movement.notes
      }

      const { data: historyEntry, error: historyError } = await supabase
        .from('product_location_history')
        .insert(historyData)
        .select()
        .single()

      if (historyError) throw historyError

      // Update stock in locations based on movement type
      if (movement.movement_type === 'TRANSFER' && movement.from_location_id) {
        // Reduce stock from source location
        await supabase
          .from('product_location')
          .update({
            stock_actual: Math.max(0, (fromLocation?.stock_actual || 0) - movement.quantity)
          })
          .eq('id', movement.from_location_id)
      }

      // Add or update stock in destination location
      const { data: existingLocation } = await supabase
        .from('product_location')
        .select('id, stock_actual')
        .eq('product_id', movement.product_id)
        .eq('warehouse_zone_id', movement.to_warehouse_zone_id)
        .eq('warehouse_shelf_position_id', movement.to_shelf_position_id || '')
        .maybeSingle()

      if (existingLocation) {
        // Update existing location
        await supabase
          .from('product_location')
          .update({
            stock_actual: existingLocation.stock_actual + movement.quantity,
            last_stock_check: new Date().toISOString()
          })
          .eq('id', existingLocation.id)
      } else {
        // Create new location
        await createProductLocation({
          product_id: movement.product_id,
          warehouse_id: '', // Will need to be derived from zone
          warehouse_zone_id: movement.to_warehouse_zone_id,
          warehouse_shelf_position_id: movement.to_shelf_position_id,
          location_priority: 1,
          stock_actual: movement.quantity,
          es_principal: false,
          estado: true
        })
      }

      // Add to history
      if (historyEntry) {
        locationHistory.value.unshift(historyEntry)
      }

      return historyEntry
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get current stock summary using database function
  const getCurrentStock = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true
      error.value = null

      // Use the get_current_stock function if it exists, otherwise aggregate manually
      const { data, error: err } = await supabase
        .rpc('get_current_stock', {
          p_company_id: companyId,
          p_warehouse_id: warehouseId
        })

      if (err) {
        // Fallback to manual aggregation if function doesn't exist
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('product_location')
          .select(`
            product_id,
            warehouse_id,
            stock_actual,
            products(name, sku),
            warehouse_zones!inner(warehouse_id, warehouses(name))
          `)
          .eq('estado', true)
          .eq('warehouse_zones.warehouses.company_id', companyId)

        if (fallbackErr) throw fallbackErr

        // Aggregate manually
        const stockSummary: Record<string, any> = {}
        fallbackData?.forEach(location => {
          const key = `${location.product_id}-${location.warehouse_id}`
          if (!stockSummary[key]) {
            stockSummary[key] = {
              product_id: location.product_id,
              warehouse_id: location.warehouse_id,
              total_stock: 0,
              locations: 0
            }
          }
          stockSummary[key].total_stock += location.stock_actual
          stockSummary[key].locations += 1
        })

        currentStock.value = stockSummary
        return Object.values(stockSummary)
      }

      // Use function result
      const stockSummary: Record<string, any> = {}
      data?.forEach((item: any) => {
        const key = `${item.product_id}-${item.warehouse_id}`
        stockSummary[key] = item
      })
      currentStock.value = stockSummary
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error getting current stock:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Set primary location for a product
  const setPrimaryLocation = async (locationId: string, productId: string) => {
    try {
      loading.value = true
      error.value = null

      // First, set all other locations for this product as non-primary
      await supabase
        .from('product_location')
        .update({ es_principal: false })
        .eq('product_id', productId)

      // Then set the selected location as primary
      const { data, error: err } = await supabase
        .from('product_location')
        .update({ es_principal: true })
        .eq('id', locationId)
        .select()
        .single()

      if (err) throw err

      // Update local state
      productLocations.value.forEach(loc => {
        if (loc.product_id === productId) {
          loc.es_principal = loc.id === locationId
        }
      })

      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),

    // Data
    productLocations: readonly(productLocations),
    locationHistory: readonly(locationHistory),
    detailedLocations: readonly(detailedLocations),
    currentStock: readonly(currentStock),

    // Computed
    activeLocations,
    primaryLocations,
    movementsByType,

    // Methods
    fetchDetailedLocations,
    fetchProductLocations,
    fetchLocationHistory,
    createProductLocation,
    updateLocationStock,
    moveProduct,
    getCurrentStock,
    setPrimaryLocation
  }
}

function readonly<T>(ref: Ref<T>) {
  return computed(() => ref.value)
}