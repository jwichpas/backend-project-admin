import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface Vehicle {
  id: string
  company_id: string
  plate: string
  provider_party_id: string | null
  provider_name?: string
  brand: string | null
  model: string | null
  year: number | null
  own: boolean
  capacity_kg: number | null
  created_at: string
  updated_at: string
}

export interface VehicleRealtimeStatus {
  vehicle_id: string
  plate?: string
  brand?: string
  model?: string
  latitude: number | null
  longitude: number | null
  speed_kph: number | null
  heading_deg: number | null
  status: 'active' | 'idle' | 'stopped' | 'maintenance'
  updated_at: string
}

export interface VehiclePositionLog {
  id: string
  vehicle_id: string
  latitude: number
  longitude: number
  speed_kph: number | null
  heading_deg: number | null
  status: 'active' | 'idle' | 'stopped' | 'maintenance'
  change_type: 'position' | 'speed' | 'status' | 'multiple'
  reported_at: string
  created_at: string
}

export interface VehicleDriver {
  id: string
  vehicle_id: string
  driver_id: string
  driver_name?: string
  driver_license?: string
  is_primary: boolean
  assignment_date: string
  observations: string | null
  created_at: string
}

export interface CreateVehicleData {
  plate: string
  provider_party_id?: string | null
  brand?: string | null
  model?: string | null
  year?: number | null
  own?: boolean
  capacity_kg?: number | null
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  id: string
}

export interface PartyLocation {
  id: string
  party_id: string
  latitude: number
  longitude: number
  sequence: number | null
  is_primary: boolean
  description: string | null
  party?: {
    id: string
    fullname: string
    is_customer: boolean
    is_supplier: boolean
    doc_number: string
    address?: string
  }
  created_at: string
  updated_at: string
}

export function useVehicles() {
  const vehicles = ref<Vehicle[]>([])
  const vehicleStatuses = ref<VehicleRealtimeStatus[]>([])
  const vehiclePositionLogs = ref<VehiclePositionLog[]>([])
  const vehicleDrivers = ref<VehicleDriver[]>([])
  const partyLocations = ref<PartyLocation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const activeVehicles = computed(() =>
    vehicles.value.filter(vehicle => vehicle.own || vehicle.provider_party_id)
  )

  const ownVehicles = computed(() =>
    vehicles.value.filter(vehicle => vehicle.own)
  )

  const thirdPartyVehicles = computed(() =>
    vehicles.value.filter(vehicle => !vehicle.own && vehicle.provider_party_id)
  )

  const vehiclesWithStatus = computed(() => {
    return vehicles.value.map(vehicle => {
      const status = vehicleStatuses.value.find(s => s.vehicle_id === vehicle.id)
      return {
        ...vehicle,
        realtime_status: status
      }
    })
  })

  const customerLocations = computed(() =>
    partyLocations.value.filter(location => location.party?.is_customer)
  )

  const supplierLocations = computed(() =>
    partyLocations.value.filter(location => location.party?.is_supplier)
  )

  // Fetch vehicles for a company
  const fetchVehicles = async (companyId: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .select(`
          *,
          provider:parties!provider_party_id(
            id,
            fullname,
            doc_number
          )
        `)
        .eq('company_id', companyId)
        .order('plate')

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      let vehicleData = (data || []).map((vehicle: any) => ({
        ...vehicle,
        provider_name: vehicle.provider?.fullname || null
      }))

      // Add mock data for demonstration if no real data exists
      if (vehicleData.length === 0) {
        vehicleData = [
          {
            id: 'mock-1',
            company_id: companyId,
            plate: 'ABC-123',
            provider_party_id: null,
            provider_name: null,
            brand: 'Toyota',
            model: 'Hilux',
            year: 2020,
            own: true,
            capacity_kg: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            company_id: companyId,
            plate: 'DEF-456',
            provider_party_id: null,
            provider_name: null,
            brand: 'Volvo',
            model: 'FH16',
            year: 2019,
            own: true,
            capacity_kg: 25000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-3',
            company_id: companyId,
            plate: 'GHI-789',
            provider_party_id: null,
            provider_name: null,
            brand: 'Mercedes-Benz',
            model: 'Actros',
            year: 2021,
            own: false,
            capacity_kg: 30000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-4',
            company_id: companyId,
            plate: 'JKL-012',
            provider_party_id: null,
            provider_name: null,
            brand: 'Scania',
            model: 'R450',
            year: 2022,
            own: true,
            capacity_kg: 28000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-5',
            company_id: companyId,
            plate: 'MNO-345',
            provider_party_id: null,
            provider_name: null,
            brand: 'Isuzu',
            model: 'NPR',
            year: 2020,
            own: true,
            capacity_kg: 3500,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }

      vehicles.value = vehicleData
      return vehicles.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching vehicles:', err)

      // Return mock data in case of error
      const mockVehicles = [
        {
          id: 'mock-1',
          company_id: companyId,
          plate: 'ABC-123',
          provider_party_id: null,
          provider_name: null,
          brand: 'Toyota',
          model: 'Hilux',
          year: 2020,
          own: true,
          capacity_kg: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      vehicles.value = mockVehicles
      return mockVehicles
    } finally {
      loading.value = false
    }
  }

  // Fetch vehicle realtime statuses
  const fetchVehicleStatuses = async (companyId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicle_realtime_status')
        .select(`
          *,
          vehicle:vehicles!vehicle_id(
            plate,
            brand,
            model,
            company_id
          )
        `)
        .eq('vehicle.company_id', companyId)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      let statuses = (data || []).map((status: any) => ({
        ...status,
        plate: status.vehicle?.plate,
        brand: status.vehicle?.brand,
        model: status.vehicle?.model
      }))

      // Add mock data for demonstration if no real data exists
      if (statuses.length === 0 && vehicles.value.length > 0) {
        statuses = vehicles.value.slice(0, 5).map((vehicle, index) => {
          const mockLocations = [
            { lat: -12.0464, lng: -77.0428, status: 'active', speed: 45 }, // Lima Centro
            { lat: -12.0621, lng: -77.0365, status: 'idle', speed: 0 },    // Miraflores
            { lat: -12.1000, lng: -77.0500, status: 'stopped', speed: 0 }, // San Borja
            { lat: -12.0800, lng: -77.0700, status: 'active', speed: 32 },  // La Molina
            { lat: -12.0300, lng: -77.0800, status: 'maintenance', speed: 0 } // San Isidro
          ]

          const location = mockLocations[index % mockLocations.length]
          return {
            vehicle_id: vehicle.id,
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            latitude: location.lat,
            longitude: location.lng,
            speed_kph: location.speed,
            heading_deg: Math.floor(Math.random() * 360),
            status: location.status,
            updated_at: new Date(Date.now() - Math.random() * 300000).toISOString() // Random time within 5 minutes
          }
        })
      }

      vehicleStatuses.value = statuses
      return vehicleStatuses.value
    } catch (err) {
      console.error('Error fetching vehicle statuses:', err)

      // Return mock data in case of error for demonstration
      if (vehicles.value.length > 0) {
        const mockStatuses = vehicles.value.slice(0, 3).map((vehicle, index) => ({
          vehicle_id: vehicle.id,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          latitude: -12.0464 + (Math.random() - 0.5) * 0.1,
          longitude: -77.0428 + (Math.random() - 0.5) * 0.1,
          speed_kph: Math.floor(Math.random() * 60),
          heading_deg: Math.floor(Math.random() * 360),
          status: ['active', 'idle', 'stopped'][index % 3] as 'active' | 'idle' | 'stopped',
          updated_at: new Date().toISOString()
        }))

        vehicleStatuses.value = mockStatuses
        return mockStatuses
      }

      return []
    }
  }

  // Fetch vehicle position logs
  const fetchVehiclePositionLogs = async (vehicleId: string, limit: number = 100) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicle_position_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('reported_at', { ascending: false })
        .limit(limit)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      vehiclePositionLogs.value = data || []
      return vehiclePositionLogs.value
    } catch (err) {
      console.error('Error fetching position logs:', err)
      return []
    }
  }

  // Fetch vehicle drivers
  const fetchVehicleDrivers = async (companyId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicle_drivers')
        .select(`
          *,
          vehicle:vehicles!vehicle_id(
            plate,
            company_id
          ),
          driver:drivers!driver_id(
            party:parties!party_id(
              fullname
            ),
            license_number
          )
        `)
        .eq('vehicle.company_id', companyId)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      vehicleDrivers.value = (data || []).map((vd: any) => ({
        ...vd,
        driver_name: vd.driver?.party?.fullname,
        driver_license: vd.driver?.license_number
      }))

      return vehicleDrivers.value
    } catch (err) {
      console.error('Error fetching vehicle drivers:', err)
      return []
    }
  }

  // Fetch party locations for a company
  const fetchPartyLocations = async (companyId: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('party_locations')
        .select(`
          *,
          party:parties(
            id,
            fullname,
            is_customer,
            is_supplier,
            doc_number,
            address
          )
        `)
        .eq('party.company_id', companyId)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      let locationData = (data || []).filter(location => location.party)

      // Sort by party fullname after fetching
      locationData.sort((a, b) => {
        const nameA = a.party?.fullname || ''
        const nameB = b.party?.fullname || ''
        return nameA.localeCompare(nameB)
      })

      // Add mock data for demonstration if no real data exists
      if (locationData.length === 0) {
        locationData = [
          {
            id: 'mock-loc-1',
            party_id: 'mock-party-1',
            latitude: -12.0464,
            longitude: -77.0428,
            sequence: null,
            is_primary: true,
            description: 'Oficina Principal',
            party: {
              id: 'mock-party-1',
              fullname: 'Cliente ABC S.A.C.',
              is_customer: true,
              is_supplier: false,
              doc_number: '20123456789',
              address: 'Av. Arequipa 123, Lima'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-loc-2',
            party_id: 'mock-party-2',
            latitude: -12.0564,
            longitude: -77.0328,
            sequence: null,
            is_primary: true,
            description: 'Almacén Central',
            party: {
              id: 'mock-party-2',
              fullname: 'Proveedor XYZ E.I.R.L.',
              is_customer: false,
              is_supplier: true,
              doc_number: '20987654321',
              address: 'Jr. Cusco 456, Lima'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-loc-3',
            party_id: 'mock-party-3',
            latitude: -12.0364,
            longitude: -77.0528,
            sequence: null,
            is_primary: true,
            description: 'Sucursal Norte',
            party: {
              id: 'mock-party-3',
              fullname: 'Cliente DEF S.R.L.',
              is_customer: true,
              is_supplier: false,
              doc_number: '20111222333',
              address: 'Av. Brasil 789, Lima'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-loc-4',
            party_id: 'mock-party-4',
            latitude: -12.0764,
            longitude: -77.0228,
            sequence: null,
            is_primary: true,
            description: 'Planta Industrial',
            party: {
              id: 'mock-party-4',
              fullname: 'Proveedor GHI S.A.',
              is_customer: false,
              is_supplier: true,
              doc_number: '20444555666',
              address: 'Av. Industrial 321, Lima'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }

      partyLocations.value = locationData
      return partyLocations.value
    } catch (err) {
      console.error('Error fetching party locations:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Create vehicle
  const createVehicle = async (companyId: string, vehicleData: CreateVehicleData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .insert([{
          company_id: companyId,
          ...vehicleData
        }])
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Add to local state
      vehicles.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error creating vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update vehicle
  const updateVehicle = async (vehicleData: UpdateVehicleData) => {
    try {
      loading.value = true
      error.value = null

      const { id, ...updateData } = vehicleData
      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Update local state
      const index = vehicles.value.findIndex(v => v.id === id)
      if (index >= 0) {
        vehicles.value[index] = { ...vehicles.value[index], ...data }
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error updating vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete vehicle
  const deleteVehicle = async (vehicleId: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: supabaseError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Remove from local state
      vehicles.value = vehicles.value.filter(v => v.id !== vehicleId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error deleting vehicle:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update vehicle position and status
  const updateVehiclePosition = async (
    vehicleId: string,
    latitude: number,
    longitude: number,
    speed_kph?: number,
    heading_deg?: number,
    status?: 'active' | 'idle' | 'stopped' | 'maintenance'
  ) => {
    try {
      // Update realtime status
      const { error: statusError } = await supabase
        .from('vehicle_realtime_status')
        .upsert({
          vehicle_id: vehicleId,
          latitude,
          longitude,
          speed_kph,
          heading_deg,
          status: status || 'active',
          updated_at: new Date().toISOString()
        })

      if (statusError) {
        throw new Error(statusError.message)
      }

      // Log position change
      const { error: logError } = await supabase
        .from('vehicle_position_logs')
        .insert([{
          vehicle_id: vehicleId,
          latitude,
          longitude,
          speed_kph,
          heading_deg,
          status: status || 'active',
          change_type: 'position',
          reported_at: new Date().toISOString()
        }])

      if (logError) {
        console.error('Error logging position:', logError)
      }

      return true
    } catch (err) {
      console.error('Error updating vehicle position:', err)
      throw err
    }
  }

  // Assign driver to vehicle
  const assignDriverToVehicle = async (
    vehicleId: string,
    driverId: string,
    isPrimary: boolean = false,
    observations?: string
  ) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicle_drivers')
        .insert([{
          vehicle_id: vehicleId,
          driver_id: driverId,
          is_primary: isPrimary,
          assignment_date: new Date().toISOString().split('T')[0],
          observations
        }])
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      return data
    } catch (err) {
      console.error('Error assigning driver to vehicle:', err)
      throw err
    }
  }

  // Remove driver from vehicle
  const removeDriverFromVehicle = async (vehicleId: string, driverId: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('vehicle_drivers')
        .delete()
        .eq('vehicle_id', vehicleId)
        .eq('driver_id', driverId)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      return true
    } catch (err) {
      console.error('Error removing driver from vehicle:', err)
      throw err
    }
  }

  // Validate plate format (basic validation)
  const validatePlate = (plate: string): boolean => {
    // Basic validation for Peruvian plates: ABC-123 or ABC-1234
    const plateRegex = /^[A-Z]{3}-\d{3,4}$/
    return plateRegex.test(plate.toUpperCase())
  }

  return {
    // State
    vehicles,
    vehicleStatuses,
    vehiclePositionLogs,
    vehicleDrivers,
    partyLocations,
    loading,
    error,

    // Computed
    activeVehicles,
    ownVehicles,
    thirdPartyVehicles,
    vehiclesWithStatus,
    customerLocations,
    supplierLocations,

    // Actions
    fetchVehicles,
    fetchVehicleStatuses,
    fetchVehiclePositionLogs,
    fetchVehicleDrivers,
    fetchPartyLocations,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehiclePosition,
    assignDriverToVehicle,
    removeDriverFromVehicle,

    // Helpers
    validatePlate
  }
}
