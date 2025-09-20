import { ref, computed, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type {
  Warehouse,
  WarehouseZone,
  WarehouseAisle,
  WarehouseShelf,
  WarehouseShelfPosition,
  ProductLocationDetailed
} from '@/composables/useWarehouseManager'

export interface Product {
  id: string
  name: string
  sku: string
  description?: string
  active: boolean
}

export interface WarehouseVisualizerData {
  warehouse: Warehouse
  zones: WarehouseZone[]
  aisles: WarehouseAisle[]
  shelves: WarehouseShelf[]
  shelfPositions: WarehouseShelfPosition[]
  productLocations: ProductLocationDetailed[]
}

export function useWarehouseVisualizer() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedWarehouse = ref<string | null>(null)
  const selectedProduct = ref<string | null>(null)
  const viewMode = ref<'cards' | 'table' | '2d' | '3d'>('cards')
  const searchQuery = ref('')

  const warehouses = ref<Warehouse[]>([])
  const zones = ref<WarehouseZone[]>([])
  const aisles = ref<WarehouseAisle[]>([])
  const shelves = ref<WarehouseShelf[]>([])
  const shelfPositions = ref<WarehouseShelfPosition[]>([])
  const productLocations = ref<ProductLocationDetailed[]>([])
  const products = ref<Product[]>([])

  // Computed properties
  const selectedWarehouseData = computed(() => {
    const warehouse = selectedWarehouse.value
      ? warehouses.value.find(w => w.id === selectedWarehouse.value)
      : warehouses.value[0] // Use first warehouse as default

    if (!warehouse) return null

    const warehouseZones = zones.value.filter(z => z.warehouse_id === warehouse.id)
    const warehouseAisles = aisles.value.filter(a =>
      warehouseZones.some(z => z.id === a.warehouse_zone_id)
    )
    const warehouseShelves = shelves.value.filter(s =>
      warehouseAisles.some(a => a.id === s.warehouse_aisle_id)
    )
    const warehouseShelfPositions = shelfPositions.value.filter(sp =>
      warehouseShelves.some(s => s.id === sp.warehouse_shelf_id)
    )
    const warehouseProductLocations = productLocations.value.filter(pl => {
      // Handle both detailed view field names and basic table field names
      const locationZoneId = pl.warehouse_zone_id || pl.zone_id
      return warehouseZones.some(z => z.id === locationZoneId)
    })

    return {
      warehouse,
      zones: warehouseZones,
      aisles: warehouseAisles,
      shelves: warehouseShelves,
      shelfPositions: warehouseShelfPositions,
      productLocations: warehouseProductLocations
    } as WarehouseVisualizerData
  })

  const filteredLocations = computed(() => {
    // If no warehouse selected, show all locations
    if (!selectedWarehouseData.value) {
      let filtered = productLocations.value

      if (selectedProduct.value) {
        filtered = filtered.filter(l => l.product_id === selectedProduct.value)
      }

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(l => {
          return (
            (l.product_name && l.product_name.toLowerCase().includes(query)) ||
            (l.product_sku && l.product_sku.toLowerCase().includes(query))
          )
        })
      }

      return filtered
    }

    let filtered = selectedWarehouseData.value.productLocations

    if (selectedProduct.value) {
      filtered = filtered.filter(l => l.product_id === selectedProduct.value)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(l => {
        return (
          (l.product_name && l.product_name.toLowerCase().includes(query)) ||
          (l.product_sku && l.product_sku.toLowerCase().includes(query))
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
      height: warehouse.height || 20,
      length: warehouse.length || 80
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

  const fetchWarehouseAisles = async (companyId: string) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_aisles')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('code')

      if (err) throw err
      aisles.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching aisles:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchWarehouseShelves = async (companyId: string) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_shelves')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('code')

      if (err) throw err
      shelves.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching shelves:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchShelfPositions = async (companyId: string) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_shelf_positions')
        .select('*')
        .eq('company_id', companyId)
        .order('location_code')

      if (err) throw err
      shelfPositions.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching shelf positions:', err)
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

  const fetchDetailedProductLocations = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true
      console.log('🔍 Fetching detailed product locations for company:', companyId, 'warehouse:', warehouseId)

      // First try the detailed view
      let query = supabase
        .from('v_product_locations_detailed')
        .select('*')

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId)
      }

      const { data, error: err } = await query.order('warehouse_name').order('zone_code').order('aisle_code').order('shelf_code')

      if (err) {
        console.warn('❌ Detailed view failed:', err.message)
        console.log('🔄 Trying fallback query to product_location...')

        // Fallback to basic product_location table
        const { data: basicData, error: basicErr } = await supabase
          .from('product_location')
          .select(`
            id,
            product_id,
            warehouse_zone_id,
            warehouse_shelf_position_id,
            position_x,
            position_y,
            position_z,
            capacity_max,
            stock_actual,
            es_principal,
            estado,
            created_at,
            updated_at
          `)
          .eq('estado', true)
          .order('created_at', { ascending: false })

        if (basicErr) {
          throw basicErr
        }

        console.log('📊 Basic product_location data:', basicData?.length || 0, 'records')
        productLocations.value = basicData || []
      } else {
        console.log('📊 Detailed product locations found:', data?.length || 0, 'records')
        productLocations.value = data || []
      }
    } catch (err: any) {
      error.value = err.message
      console.error('❌ Error fetching detailed product locations:', err)
    } finally {
      loading.value = false
    }
  }

  const initializeData = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true

      // Fetch all data in parallel
      await Promise.all([
        fetchWarehouses(companyId),
        fetchWarehouseZones(companyId, warehouseId),
        fetchWarehouseAisles(companyId),
        fetchWarehouseShelves(companyId),
        fetchShelfPositions(companyId),
        fetchProducts(companyId),
        fetchDetailedProductLocations(companyId, warehouseId)
      ])

      if (warehouseId) {
        selectedWarehouse.value = warehouseId
      } else if (warehouses.value.length > 0) {
        // Auto-select first warehouse with most data
        let bestWarehouse = warehouses.value[0]
        let bestScore = 0

        for (const warehouse of warehouses.value) {
          const warehouseZones = zones.value.filter(z => z.warehouse_id === warehouse.id)
          const warehouseLocations = productLocations.value.filter(pl =>
            warehouseZones.some(z => z.id === pl.warehouse_zone_id)
          )
          const score = warehouseZones.length + warehouseLocations.length

          if (score > bestScore) {
            bestWarehouse = warehouse
            bestScore = score
          }
        }

        selectedWarehouse.value = bestWarehouse.id
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error initializing data:', err)
    } finally {
      loading.value = false
    }
  }

  const setViewMode = (mode: 'cards' | 'table' | '2d' | '3d') => {
    viewMode.value = mode
  }

  const setSelectedWarehouse = (warehouseId: string | null) => {
    selectedWarehouse.value = warehouseId
  }

  const setSelectedProduct = (productId: string | null) => {
    selectedProduct.value = productId
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // Helper methods for positioning with hierarchical structure
  const get3DPosition = (location: ProductLocationDetailed) => {
    return {
      x: location.final_x || 0,
      y: location.final_z || 0, // Z becomes Y in 3D space (height)
      z: -(location.final_y || 0) // Y becomes -Z in 3D space (depth, negative for proper orientation)
    }
  }

  const get2DPosition = (location: ProductLocationDetailed) => {
    return {
      x: location.final_x || 0,
      y: location.final_y || 0
    }
  }

  const getLocationHierarchy = (location: ProductLocationDetailed) => {
    return {
      warehouse: location.warehouse_name || 'Sin almacén',
      zone: location.zone_name || 'Sin zona',
      aisle: location.aisle_name || 'Sin pasillo',
      shelf: location.shelf_name || 'Sin estante',
      position: location.full_location_code || 'Sin posición'
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
    aisles: readonly(aisles),
    shelves: readonly(shelves),
    shelfPositions: readonly(shelfPositions),
    productLocations: readonly(productLocations),
    products: readonly(products),
    
    // Computed
    selectedWarehouseData,
    filteredLocations,
    warehouseBounds,
    
    // Methods
    initializeData,
    fetchWarehouses,
    fetchWarehouseZones,
    fetchWarehouseAisles,
    fetchWarehouseShelves,
    fetchShelfPositions,
    fetchProducts,
    fetchDetailedProductLocations,
    setViewMode,
    setSelectedWarehouse,
    setSelectedProduct,
    setSearchQuery,
    get3DPosition,
    get2DPosition,
    getLocationHierarchy
  }
}

function readonly<T>(ref: Ref<T>) {
  return computed(() => ref.value)
}