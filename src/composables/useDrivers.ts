import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface Driver {
  id: string
  company_id: string
  user_id: string
  license_number: string
  license_class: string | null
  valid_until: string | null
  numero_documento: string | null
  nombre_completo: string | null
  created_at: string
  updated_at: string
  // From user relation
  user?: {
    id: string
    email: string
    phone?: string | null
    full_name?: string | null
  }
  // Device and location information
  device?: {
    id: string
    device_name: string | null
    device_type: string
    tracking_enabled: boolean
  }
  current_location?: {
    id: string
    latitude: number
    longitude: number
    accuracy_meters: number | null
    speed_kph: number | null
    heading_degrees: number | null
    updated_at: string
  }
}

export interface CreateDriverData {
  user_id: string
  license_number: string
  license_class?: string | null
  valid_until?: string | null
  numero_documento?: string | null
  nombre_completo?: string | null
}

export interface UpdateDriverData extends Partial<CreateDriverData> {
  id: string
}

export interface RegisteredDevice {
  id: string
  device_id: string
  user_id: string | null
  device_name: string | null
  device_type: string
  user_agent: string | null
  platform: string | null
  browser: string | null
  os: string | null
  tracking_enabled: boolean
  tracking_interval_seconds: number
  high_accuracy_enabled: boolean
  created_at: string
  updated_at: string
}

export interface DeviceLocation {
  id: string
  user_id: string
  device_id: string
  latitude: number
  longitude: number
  accuracy_meters: number | null
  altitude_meters: number | null
  speed_kph: number | null
  heading_degrees: number | null
  battery_level: number | null
  network_type: string | null
  signal_strength: number | null
  is_mock_location: boolean
  activity_type: string | null
  activity_confidence: number | null
  created_at: string
}

export interface DriverWithVehicles extends Driver {
  assigned_vehicles?: {
    id: string
    vehicle_id: string
    vehicle_plate: string
    vehicle_brand: string | null
    vehicle_model: string | null
    is_primary: boolean
    assignment_date: string
    observations: string | null
  }[]
}

export function useDrivers() {
  const drivers = ref<Driver[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const activeDrivers = computed(() => 
    drivers.value.filter(driver => {
      // Consider active if license is valid (not expired)
      if (!driver.valid_until) return true
      return new Date(driver.valid_until) > new Date()
    })
  )

  const expiredLicenses = computed(() =>
    drivers.value.filter(driver => 
      driver.valid_until && new Date(driver.valid_until) <= new Date()
    )
  )

  const driversWithVehicles = computed(() => {
    // This will be populated when fetching drivers with their vehicle assignments
    return drivers.value as DriverWithVehicles[]
  })

  // Fetch drivers for a company
  const fetchDrivers = async (companyId: string, includeVehicles: boolean = false) => {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('drivers')
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email,
            phone,
            full_name
          ),
          device:registered_devices!user_id(
            id,
            device_name,
            device_type,
            tracking_enabled
          ),
          current_location:device_locations!user_id(
            id,
            latitude,
            longitude,
            accuracy_meters,
            speed_kph,
            heading_degrees,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .order('nombre_completo')

      if (includeVehicles) {
        query = supabase
          .from('drivers')
          .select(`
            *,
            user:auth.users!user_id(
              id,
              email,
              phone,
              full_name
            ),
            device:registered_devices!user_id(
              id,
              device_name,
              device_type,
              tracking_enabled
            ),
            current_location:device_locations!user_id(
              id,
              latitude,
              longitude,
              accuracy_meters,
              speed_kph,
              heading_degrees,
              created_at
            ),
            assigned_vehicles:vehicle_drivers(
              id,
              vehicle_id,
              is_primary,
              assignment_date,
              observations,
              vehicle:vehicles!vehicle_id(
                plate,
                brand,
                model
              )
            )
          `)
          .eq('company_id', companyId)
          .order('nombre_completo')
      }

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      drivers.value = (data || []).map((driver: any) => ({
        ...driver,
        assigned_vehicles: includeVehicles ? (driver.assigned_vehicles || []).map((av: any) => ({
          ...av,
          vehicle_plate: av.vehicle?.plate,
          vehicle_brand: av.vehicle?.brand,
          vehicle_model: av.vehicle?.model
        })) : undefined
      }))

      return drivers.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching drivers:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Create driver
  const createDriver = async (companyId: string, driverData: CreateDriverData) => {
    try {
      loading.value = true
      error.value = null

      // Validate license number uniqueness
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id')
        .eq('company_id', companyId)
        .eq('license_number', driverData.license_number)
        .single()

      if (existingDriver) {
        throw new Error('Ya existe un conductor con este número de licencia')
      }

      const { data, error: supabaseError } = await supabase
        .from('drivers')
        .insert([{
          company_id: companyId,
          ...driverData
        }])
        .select(`
          *,
          party:parties!party_id(
            id,
            doc_type,
            doc_number,
            fullname,
            email,
            phone,
            address
          )
        `)
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Add to local state
      drivers.value.push(data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error creating driver:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update driver
  const updateDriver = async (driverData: UpdateDriverData) => {
    try {
      loading.value = true
      error.value = null

      const { id, ...updateData } = driverData

      // Validate license number uniqueness if being updated
      if (updateData.license_number) {
        const { data: existingDriver } = await supabase
          .from('drivers')
          .select('id, company_id')
          .eq('license_number', updateData.license_number)
          .neq('id', id)
          .single()

        if (existingDriver) {
          throw new Error('Ya existe un conductor con este número de licencia')
        }
      }

      const { data, error: supabaseError } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          party:parties!party_id(
            id,
            doc_type,
            doc_number,
            fullname,
            email,
            phone,
            address
          )
        `)
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Update local state
      const index = drivers.value.findIndex(d => d.id === id)
      if (index >= 0) {
        drivers.value[index] = { ...drivers.value[index], ...data }
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error updating driver:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete driver
  const deleteDriver = async (driverId: string) => {
    try {
      loading.value = true
      error.value = null

      // Check if driver is assigned to any vehicles
      const { data: assignedVehicles } = await supabase
        .from('vehicle_drivers')
        .select('id')
        .eq('driver_id', driverId)

      if (assignedVehicles && assignedVehicles.length > 0) {
        throw new Error('No se puede eliminar el conductor porque está asignado a vehículos')
      }

      const { error: supabaseError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Remove from local state
      drivers.value = drivers.value.filter(d => d.id !== driverId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error deleting driver:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get available drivers (not assigned to a specific vehicle or can be assigned to multiple)
  const getAvailableDrivers = async (companyId: string, excludeVehicleId?: string) => {
    try {
      let query = `
        *,
        party:parties!party_id(
          fullname,
          doc_number
        ),
        vehicle_assignments:vehicle_drivers(
          vehicle_id,
          is_primary,
          vehicle:vehicles!vehicle_id(
            plate
          )
        )
      `

      const { data, error: supabaseError } = await supabase
        .from('drivers')
        .select(query)
        .eq('company_id', companyId)
        .order('nombre_completo')

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Filter out drivers assigned to the excluded vehicle if specified
      let availableDrivers = data || []
      if (excludeVehicleId) {
        availableDrivers = availableDrivers.filter((driver: any) => 
          !driver.vehicle_assignments?.some((va: any) => va.vehicle_id === excludeVehicleId)
        )
      }

      return availableDrivers
    } catch (err) {
      console.error('Error getting available drivers:', err)
      return []
    }
  }

  // Check if license is valid
  const isLicenseValid = (driver: Driver): boolean => {
    if (!driver.valid_until) return true
    return new Date(driver.valid_until) > new Date()
  }

  // Get days until license expires
  const getDaysUntilExpiration = (driver: Driver): number | null => {
    if (!driver.valid_until) return null
    
    const expirationDate = new Date(driver.valid_until)
    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // Validate license number format
  const validateLicenseNumber = (licenseNumber: string): boolean => {
    // Basic validation for license number format
    // Adjust regex based on local license format requirements
    const licenseRegex = /^[A-Z]\d{8}$/ // Example: A12345678
    return licenseRegex.test(licenseNumber.toUpperCase())
  }

  // Get current user's device location
  const getCurrentUserLocation = async (userId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('device_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw new Error(supabaseError.message)
      }

      return data || null
    } catch (err) {
      console.error('Error fetching current user location:', err)
      return null
    }
  }

  // Update device location
  const updateDeviceLocation = async (locationData: {
    user_id: string
    device_id: string
    latitude: number
    longitude: number
    accuracy_meters?: number | null
    altitude_meters?: number | null
    speed_kph?: number | null
    heading_degrees?: number | null
    battery_level?: number | null
    network_type?: string | null
    signal_strength?: number | null
    is_mock_location?: boolean
    activity_type?: string | null
    activity_confidence?: number | null
  }) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('device_locations')
        .insert([locationData])
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      return data
    } catch (err) {
      console.error('Error updating device location:', err)
      throw err
    }
  }

  // Register device for user
  const registerDevice = async (deviceData: {
    device_id: string
    user_id: string
    device_name?: string | null
    device_type?: string
    user_agent?: string | null
    platform?: string | null
    browser?: string | null
    os?: string | null
    tracking_enabled?: boolean
    tracking_interval_seconds?: number
    high_accuracy_enabled?: boolean
  }) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('registered_devices')
        .upsert([{
          ...deviceData,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      return data
    } catch (err) {
      console.error('Error registering device:', err)
      throw err
    }
  }

  // Get driver's current vehicle assignment
  const getDriverCurrentVehicle = async (driverId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicle_drivers')
        .select(`
          *,
          vehicle:vehicles!vehicle_id(
            id,
            plate,
            brand,
            model,
            own
          )
        `)
        .eq('driver_id', driverId)
        .eq('is_primary', true)
        .single()

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw new Error(supabaseError.message)
      }

      return data || null
    } catch (err) {
      console.error('Error fetching driver current vehicle:', err)
      return null
    }
  }

  // Get drivers with real-time locations (for tracking)
  const getDriversWithLocations = async (companyId: string) => {
    try {
      // First get drivers with their basic info
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('company_id', companyId)

      if (driversError) {
        throw new Error(driversError.message)
      }

      if (!driversData || driversData.length === 0) {
        // Return mock data for demonstration
        return [
          {
            id: 'mock-driver-1',
            company_id: companyId,
            user_id: 'mock-user-1',
            license_number: 'A12345678',
            license_class: 'A-IIa',
            valid_until: '2025-12-31',
            numero_documento: '12345678',
            nombre_completo: 'Juan Pérez García',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: {
              id: 'mock-user-1',
              email: 'juan.perez@empresa.com',
              phone: '+51987654321',
              full_name: 'Juan Pérez García'
            },
            device: {
              id: 'mock-device-1',
              device_name: 'iPhone 14 Pro',
              device_type: 'MOBILE',
              tracking_enabled: true
            },
            current_location: {
              id: 'mock-location-1',
              latitude: -12.0464 + (Math.random() - 0.5) * 0.02,
              longitude: -77.0428 + (Math.random() - 0.5) * 0.02,
              accuracy_meters: 5,
              speed_kph: Math.floor(Math.random() * 50),
              heading_degrees: Math.floor(Math.random() * 360),
              created_at: new Date(Date.now() - Math.random() * 300000).toISOString() // Random time within 5 minutes
            },
            current_vehicle: {
              vehicle: {
                id: 'mock-1',
                plate: 'ABC-123',
                brand: 'Toyota',
                model: 'Hilux'
              }
            }
          },
          {
            id: 'mock-driver-2',
            company_id: companyId,
            user_id: 'mock-user-2',
            license_number: 'B87654321',
            license_class: 'A-IIb',
            valid_until: '2025-06-30',
            numero_documento: '87654321',
            nombre_completo: 'María González López',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: {
              id: 'mock-user-2',
              email: 'maria.gonzalez@empresa.com',
              phone: '+51912345678',
              full_name: 'María González López'
            },
            device: {
              id: 'mock-device-2',
              device_name: 'Samsung Galaxy S23',
              device_type: 'MOBILE',
              tracking_enabled: true
            },
            current_location: {
              id: 'mock-location-2',
              latitude: -12.0564 + (Math.random() - 0.5) * 0.02,
              longitude: -77.0328 + (Math.random() - 0.5) * 0.02,
              accuracy_meters: 8,
              speed_kph: Math.floor(Math.random() * 40),
              heading_degrees: Math.floor(Math.random() * 360),
              created_at: new Date(Date.now() - Math.random() * 180000).toISOString() // Random time within 3 minutes
            },
            current_vehicle: {
              vehicle: {
                id: 'mock-2',
                plate: 'DEF-456',
                brand: 'Volvo',
                model: 'FH16'
              }
            }
          }
        ]
      }

      // For now, return empty array since we need to implement proper relations
      // In a real implementation, you would need to:
      // 1. Get registered devices for each driver's user_id
      // 2. Get latest device location for each user_id
      // 3. Get current vehicle assignment for each driver
      return []
    } catch (err) {
      console.error('Error fetching drivers with locations:', err)
      
      // Return mock data in case of error
      return [
        {
          id: 'mock-driver-1',
          company_id: companyId,
          user_id: 'mock-user-1',
          license_number: 'A12345678',
          license_class: 'A-IIa',
          valid_until: '2025-12-31',
          numero_documento: '12345678',
          nombre_completo: 'Carlos Mendoza Rivera',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'mock-user-1',
            email: 'carlos.mendoza@empresa.com',
            phone: '+51998877665',
            full_name: 'Carlos Mendoza Rivera'
          },
          device: {
            id: 'mock-device-1',
            device_name: 'iPhone 14',
            device_type: 'MOBILE',
            tracking_enabled: true
          },
          current_location: {
            id: 'mock-location-1',
            latitude: -12.0364 + (Math.random() - 0.5) * 0.01,
            longitude: -77.0528 + (Math.random() - 0.5) * 0.01,
            accuracy_meters: 3,
            speed_kph: Math.floor(Math.random() * 60),
            heading_degrees: Math.floor(Math.random() * 360),
            created_at: new Date(Date.now() - Math.random() * 120000).toISOString()
          },
          current_vehicle: {
            vehicle: {
              id: 'mock-1',
              plate: 'ABC-123',
              brand: 'Toyota',
              model: 'Hilux'
            }
          }
        }
      ]
    }
  }

  // Get driver statistics
  const getDriverStatistics = computed(() => {
    const total = drivers.value.length
    const active = activeDrivers.value.length
    const expired = expiredLicenses.value.length
    const expiringSoon = drivers.value.filter(driver => {
      const days = getDaysUntilExpiration(driver)
      return days !== null && days <= 30 && days > 0
    }).length

    return {
      total,
      active,
      expired,
      expiringSoon
    }
  })

  return {
    // State
    drivers,
    loading,
    error,

    // Computed
    activeDrivers,
    expiredLicenses,
    driversWithVehicles,
    getDriverStatistics,

    // Actions
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    getAvailableDrivers,

    // Location & Device Functions
    getCurrentUserLocation,
    updateDeviceLocation,
    registerDevice,
    getDriverCurrentVehicle,
    getDriversWithLocations,

    // Helpers
    isLicenseValid,
    getDaysUntilExpiration,
    validateLicenseNumber
  }
}