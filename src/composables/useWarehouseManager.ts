import { ref, computed, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'

// Types for the hierarchical warehouse structure
export interface Warehouse {
  id: string
  company_id: string
  branch_id?: string
  code: string
  name: string
  address?: string
  width?: number
  height?: number
  length?: number
  total_area?: number
  total_volume?: number
  warehouse_type: string
  temperature_zone?: string
  max_capacity_kg?: number
  current_capacity_kg?: number
  is_active: boolean
  operational_status: string
  created_at: string
  updated_at: string
}

export interface WarehouseZone {
  id: string
  company_id: string
  warehouse_id: string
  code: string
  name?: string
  width?: number
  height?: number
  length?: number
  capacity_kg?: number
  x_coordinate?: number
  y_coordinate?: number
  z_coordinate?: number
  rotation_degrees?: number
  shape_type: string
  vertices?: any[]
  color_hex: string
  opacity?: number
  created_at: string
  updated_at: string
}

export interface WarehouseAisle {
  id: string
  company_id: string
  warehouse_zone_id: string
  code: string
  name?: string
  start_x?: number
  start_y?: number
  end_x?: number
  end_y?: number
  width?: number
  is_main_aisle: boolean
  direction: 'HORIZONTAL' | 'VERTICAL'
  created_at: string
  updated_at: string
}

export interface WarehouseShelf {
  id: string
  company_id: string
  warehouse_aisle_id: string
  code: string
  name?: string
  position_x?: number
  position_y?: number
  position_z?: number
  width?: number
  depth?: number
  height?: number
  levels: number
  level_height?: number
  max_weight_kg?: number
  load_capacity_per_level?: number
  shelf_type: string
  material: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseShelfPosition {
  id: string
  company_id: string
  warehouse_shelf_id: string
  level_number: number
  position_number: number
  location_code: string
  width?: number
  depth?: number
  height?: number
  calculated_x?: number
  calculated_y?: number
  calculated_z?: number
  max_weight_kg?: number
  max_volume_m3?: number
  is_reserved: boolean
  reserved_for_product_id?: string
  is_active: boolean
  condition: string
  created_at: string
  updated_at: string
}

export interface ProductLocationDetailed {
  id: string
  product_id: string
  warehouse_zone_id?: string
  warehouse_shelf_position_id?: string
  position_x?: number
  position_y?: number
  position_z?: number
  capacity_max?: number
  stock_actual: number
  es_principal: boolean
  estado: boolean
  created_at: string
  updated_at: string
  // Related data
  product?: any
  zone?: WarehouseZone
  aisle?: WarehouseAisle
  shelf?: WarehouseShelf
  shelf_position?: WarehouseShelfPosition
}

export function useWarehouseManager() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Data stores
  const warehouses = ref<Warehouse[]>([])
  const zones = ref<WarehouseZone[]>([])
  const aisles = ref<WarehouseAisle[]>([])
  const shelves = ref<WarehouseShelf[]>([])
  const shelfPositions = ref<WarehouseShelfPosition[]>([])
  const productLocations = ref<ProductLocationDetailed[]>([])
  
  // Selection state
  const selectedWarehouse = ref<string | null>(null)
  const selectedZone = ref<string | null>(null)
  const selectedAisle = ref<string | null>(null)
  const selectedShelf = ref<string | null>(null)

  // Computed properties
  const activeWarehouses = computed(() => 
    warehouses.value.filter(w => w.is_active)
  )
  
  const filteredZones = computed(() => 
    selectedWarehouse.value 
      ? zones.value.filter(z => z.warehouse_id === selectedWarehouse.value)
      : zones.value
  )
  
  const filteredAisles = computed(() => 
    selectedZone.value 
      ? aisles.value.filter(a => a.warehouse_zone_id === selectedZone.value)
      : aisles.value
  )
  
  const filteredShelves = computed(() => 
    selectedAisle.value 
      ? shelves.value.filter(s => s.warehouse_aisle_id === selectedAisle.value)
      : shelves.value
  )
  
  const filteredShelfPositions = computed(() => 
    selectedShelf.value 
      ? shelfPositions.value.filter(sp => sp.warehouse_shelf_id === selectedShelf.value)
      : shelfPositions.value
  )

  const currentWarehouse = computed(() => 
    selectedWarehouse.value 
      ? warehouses.value.find(w => w.id === selectedWarehouse.value)
      : null
  )

  const warehouseBounds = computed(() => {
    const warehouse = currentWarehouse.value
    if (!warehouse) return null
    
    return {
      width: warehouse.width || 100,
      height: warehouse.height || 20,
      length: warehouse.length || 80
    }
  })

  // CRUD Operations for Warehouses
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

  const createWarehouse = async (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouses')
        .insert(warehouse)
        .select()
        .single()

      if (err) throw err
      if (data) warehouses.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const index = warehouses.value.findIndex(w => w.id === id)
        if (index > -1) warehouses.value[index] = data
      }
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteWarehouse = async (id: string) => {
    try {
      loading.value = true
      const { error: err } = await supabase
        .from('warehouses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err
      warehouses.value = warehouses.value.filter(w => w.id !== id)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // CRUD Operations for Zones
  const fetchZones = async (companyId: string, warehouseId?: string) => {
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

  const createZone = async (zone: Omit<WarehouseZone, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_zones')
        .insert(zone)
        .select()
        .single()

      if (err) throw err
      if (data) zones.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateZone = async (id: string, updates: Partial<WarehouseZone>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const index = zones.value.findIndex(z => z.id === id)
        if (index > -1) zones.value[index] = data
      }
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteZone = async (id: string) => {
    try {
      loading.value = true
      const { error: err } = await supabase
        .from('warehouse_zones')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err
      zones.value = zones.value.filter(z => z.id !== id)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // CRUD Operations for Aisles
  const fetchAisles = async (companyId: string, zoneId?: string) => {
    try {
      loading.value = true
      let query = supabase
        .from('warehouse_aisles')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)

      if (zoneId) {
        query = query.eq('warehouse_zone_id', zoneId)
      }

      const { data, error: err } = await query.order('code')
      if (err) throw err
      aisles.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching aisles:', err)
    } finally {
      loading.value = false
    }
  }

  const createAisle = async (aisle: Omit<WarehouseAisle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_aisles')
        .insert(aisle)
        .select()
        .single()

      if (err) throw err
      if (data) aisles.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // CRUD Operations for Shelves
  const fetchShelves = async (companyId: string, aisleId?: string) => {
    try {
      loading.value = true
      let query = supabase
        .from('warehouse_shelves')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)

      if (aisleId) {
        query = query.eq('warehouse_aisle_id', aisleId)
      }

      const { data, error: err } = await query.order('code')
      if (err) throw err
      shelves.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching shelves:', err)
    } finally {
      loading.value = false
    }
  }

  const createShelf = async (shelf: Omit<WarehouseShelf, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_shelves')
        .insert(shelf)
        .select()
        .single()

      if (err) throw err
      if (data) shelves.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // CRUD Operations for Shelf Positions
  const fetchShelfPositions = async (companyId: string, shelfId?: string) => {
    try {
      loading.value = true
      let query = supabase
        .from('warehouse_shelf_positions')
        .select('*')
        .eq('company_id', companyId)

      if (shelfId) {
        query = query.eq('warehouse_shelf_id', shelfId)
      }

      const { data, error: err } = await query.order('level_number', { ascending: true }).order('position_number', { ascending: true })
      if (err) throw err
      shelfPositions.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching shelf positions:', err)
    } finally {
      loading.value = false
    }
  }

  const createShelfPosition = async (position: Omit<WarehouseShelfPosition, 'id' | 'location_code' | 'calculated_x' | 'calculated_y' | 'calculated_z' | 'created_at' | 'updated_at'>) => {
    try {
      loading.value = true
      const { data, error: err } = await supabase
        .from('warehouse_shelf_positions')
        .insert(position)
        .select()
        .single()

      if (err) throw err
      if (data) shelfPositions.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch detailed product locations using the view
  const fetchDetailedProductLocations = async (companyId: string, warehouseId?: string) => {
    try {
      loading.value = true
      let query = supabase
        .from('v_product_locations_detailed')
        .select('*')

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId)
      }

      const { data, error: err } = await query.order('warehouse_name').order('zone_code').order('aisle_code').order('shelf_code')
      if (err) throw err
      productLocations.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching detailed product locations:', err)
    } finally {
      loading.value = false
    }
  }

  // Initialize all data for a company
  const initializeWarehouseData = async (companyId: string) => {
    try {
      loading.value = true
      await Promise.all([
        fetchWarehouses(companyId),
        fetchZones(companyId),
        fetchAisles(companyId),
        fetchShelves(companyId),
        fetchShelfPositions(companyId),
        fetchDetailedProductLocations(companyId)
      ])
    } catch (err: any) {
      error.value = err.message
      console.error('Error initializing warehouse data:', err)
    } finally {
      loading.value = false
    }
  }

  // Selection methods
  const setSelectedWarehouse = (warehouseId: string | null) => {
    selectedWarehouse.value = warehouseId
    selectedZone.value = null
    selectedAisle.value = null
    selectedShelf.value = null
  }

  const setSelectedZone = (zoneId: string | null) => {
    selectedZone.value = zoneId
    selectedAisle.value = null
    selectedShelf.value = null
  }

  const setSelectedAisle = (aisleId: string | null) => {
    selectedAisle.value = aisleId
    selectedShelf.value = null
  }

  const setSelectedShelf = (shelfId: string | null) => {
    selectedShelf.value = shelfId
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    
    // Data
    warehouses: readonly(warehouses),
    zones: readonly(zones),
    aisles: readonly(aisles),
    shelves: readonly(shelves),
    shelfPositions: readonly(shelfPositions),
    productLocations: readonly(productLocations),
    
    // Selection
    selectedWarehouse: readonly(selectedWarehouse),
    selectedZone: readonly(selectedZone),
    selectedAisle: readonly(selectedAisle),
    selectedShelf: readonly(selectedShelf),
    
    // Computed
    activeWarehouses,
    filteredZones,
    filteredAisles,
    filteredShelves,
    filteredShelfPositions,
    currentWarehouse,
    warehouseBounds,
    
    // Methods
    initializeWarehouseData,
    
    // Warehouse CRUD
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    
    // Zone CRUD
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
    
    // Aisle CRUD
    fetchAisles,
    createAisle,
    
    // Shelf CRUD
    fetchShelves,
    createShelf,
    
    // Shelf Position CRUD
    fetchShelfPositions,
    createShelfPosition,
    
    // Product Locations
    fetchDetailedProductLocations,
    
    // Selection methods
    setSelectedWarehouse,
    setSelectedZone,
    setSelectedAisle,
    setSelectedShelf
  }
}

function readonly<T>(ref: Ref<T>) {
  return computed(() => ref.value)
}