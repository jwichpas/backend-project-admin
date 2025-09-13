import { ref, computed, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { ProductLocation, WarehouseZone, Warehouse, Product } from '@/stores/products'

export interface WarehouseWithZones extends Warehouse {
  zones?: WarehouseZone[]
}

export interface LocationWithProduct extends ProductLocation {
  product?: Product
  zone?: WarehouseZone
}

export interface WarehouseVisualizerData {
  warehouse: WarehouseWithZones
  locations: LocationWithProduct[]
  zones: WarehouseZone[]
}

export function useWarehouseVisualizer() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedWarehouse = ref<string | null>(null)
  const selectedProduct = ref<string | null>(null)
  const viewMode = ref<'table' | '2d' | '3d'>('table')
  const searchQuery = ref('')

  const warehouses = ref<Warehouse[]>([])
  const zones = ref<WarehouseZone[]>([])
  const locations = ref<LocationWithProduct[]>([])
  const products = ref<Product[]>([])

  // Computed properties
  const selectedWarehouseData = computed(() => {
    if (!selectedWarehouse.value) return null
    
    const warehouse = warehouses.value.find(w => w.id === selectedWarehouse.value)
    if (!warehouse) return null

    const warehouseZones = zones.value.filter(z => z.warehouse_id === warehouse.id)
    const warehouseLocations = locations.value.filter(l => 
      warehouseZones.some(z => z.id === l.warehouse_zone_id)
    )

    return {
      warehouse: { ...warehouse, zones: warehouseZones },
      locations: warehouseLocations,
      zones: warehouseZones
    } as WarehouseVisualizerData
  })

  const filteredLocations = computed(() => {
    let filtered = locations.value

    if (selectedWarehouse.value) {
      const warehouseZoneIds = zones.value
        .filter(z => z.warehouse_id === selectedWarehouse.value)
        .map(z => z.id)
      filtered = filtered.filter(l => 
        l.warehouse_zone_id && warehouseZoneIds.includes(l.warehouse_zone_id)
      )
    }

    if (selectedProduct.value) {
      filtered = filtered.filter(l => l.product_id === selectedProduct.value)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(l => {
        const product = l.product
        return product && (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
        )
      })
    }

    return filtered
  })

  const warehouseBounds = computed(() => {
    if (!selectedWarehouseData.value) return null
    
    const warehouse = selectedWarehouseData.value.warehouse
    return {
      width: warehouse.width || 100,
      height: warehouse.height || 50,
      length: warehouse.length || 100
    }
  })

  // Methods
  const fetchWarehouses = async (companyId: string) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name')

      if (err) throw err
      warehouses.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching warehouses:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchWarehouseZones = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true
      let query = supabase
        .from('warehouse_zones')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId)
      }

      const { data, error: err } = await query.order('code')

      if (err) throw err
      zones.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching zones:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchProducts = async (companyId: string) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('name')

      if (err) throw err
      products.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching products:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchProductLocations = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true
      
      // First get all locations
      let locationQuery = supabase
        .from('product_location')
        .select('*')
        .eq('estado', true)
        .order('created_at', { ascending: false })

      const { data: locationData, error: locationError } = await locationQuery

      if (locationError) throw locationError
      
      // Enrich locations with product and zone data
      const enrichedLocations: LocationWithProduct[] = (locationData || []).map(location => {
        const product = products.value.find(p => p.id === location.product_id)
        const zone = zones.value.find(z => z.id === location.warehouse_zone_id)
        
        return {
          ...location,
          product,
          zone
        }
      })

      // Filter by warehouse if specified
      if (warehouseId) {
        const warehouseZoneIds = zones.value
          .filter(z => z.warehouse_id === warehouseId)
          .map(z => z.id)
        
        locations.value = enrichedLocations.filter(l => 
          l.warehouse_zone_id && warehouseZoneIds.includes(l.warehouse_zone_id)
        )
      } else {
        locations.value = enrichedLocations
      }

    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching locations:', err)
    } finally {
      loading.value = false
    }
  }

  const initializeData = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true
      
      // Fetch data in sequence for dependencies
      await fetchWarehouses(companyId)
      await fetchWarehouseZones(companyId, warehouseId)
      await fetchProducts(companyId)
      await fetchProductLocations(companyId, warehouseId)

      if (warehouseId) {
        selectedWarehouse.value = warehouseId
      } else if (warehouses.value.length > 0) {
        selectedWarehouse.value = warehouses.value[0].id
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error initializing data:', err)
    } finally {
      loading.value = false
    }
  }

  const setViewMode = (mode: 'table' | '2d' | '3d') => {
    viewMode.value = mode
  }

  const setSelectedWarehouse = async (warehouseId: string | null) => {
    selectedWarehouse.value = warehouseId
    if (warehouseId && zones.value.length === 0) {
      await fetchWarehouseZones(warehouseId, warehouseId)
    }
  }

  const setSelectedProduct = (productId: string | null) => {
    selectedProduct.value = productId
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const getProductByLocation = (location: ProductLocation) => {
    return products.value.find(p => p.id === location.product_id)
  }

  const getZoneByLocation = (location: ProductLocation) => {
    return zones.value.find(z => z.id === location.warehouse_zone_id)
  }

  const getWarehouseByZone = (zone: WarehouseZone) => {
    return warehouses.value.find(w => w.id === zone.warehouse_id)
  }

  // Helper methods for 3D positioning
  const get3DPosition = (location: ProductLocation) => {
    return {
      x: location.position_x || 0,
      y: location.position_z || 0, // Z becomes Y in 3D space (height)
      z: -(location.position_y || 0) // Y becomes -Z in 3D space (depth, negative for proper orientation)
    }
  }

  const get2DPosition = (location: ProductLocation) => {
    return {
      x: location.position_x || 0,
      y: location.position_y || 0
    }
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    selectedWarehouse: readonly(selectedWarehouse),
    selectedProduct: readonly(selectedProduct),
    viewMode: readonly(viewMode),
    searchQuery: readonly(searchQuery),
    
    // Data
    warehouses: readonly(warehouses),
    zones: readonly(zones),
    locations: readonly(locations),
    products: readonly(products),
    
    // Computed
    selectedWarehouseData,
    filteredLocations,
    warehouseBounds,
    
    // Methods
    initializeData,
    fetchWarehouses,
    fetchWarehouseZones,
    fetchProducts,
    fetchProductLocations,
    setViewMode,
    setSelectedWarehouse,
    setSelectedProduct,
    setSearchQuery,
    getProductByLocation,
    getZoneByLocation,
    getWarehouseByZone,
    get3DPosition,
    get2DPosition
  }
}

function readonly<T>(ref: Ref<T>) {
  return computed(() => ref.value)
}