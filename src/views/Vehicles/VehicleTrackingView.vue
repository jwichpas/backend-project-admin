<template>
  <div class="container mx-auto p-6 max-w-7xl">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Seguimiento de Vehículos</h1>
        <p class="text-muted-foreground">
          Monitoreo en tiempo real de la flota vehicular
        </p>
      </div>
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          @click="toggleUserTracking"
          :disabled="geolocationPermission === 'denied'"
        >
          <MapPin :class="{ 'animate-pulse text-blue-500': isUserTracking }" class="mr-2 h-4 w-4" />
          {{ isUserTracking ? 'Detener' : 'Ubicar' }} Mi Posición
        </Button>
        <Button variant="outline" @click="toggleRealtimeTracking">
          <Radio :class="{ 'animate-pulse text-green-500': realtimeEnabled }" class="mr-2 h-4 w-4" />
          {{ realtimeEnabled ? 'Detener' : 'Iniciar' }} Seguimiento
        </Button>
        <Button variant="outline" @click="refreshData">
          <RefreshCw :class="{ 'animate-spin': loading }" class="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </div>

    <!-- Real-time Stats -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total</p>
            <p class="text-2xl font-bold">{{ vehiclesWithStatus.length }}</p>
          </div>
          <Truck class="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Activos</p>
            <p class="text-2xl font-bold text-green-600">{{ getStatusCount('active') }}</p>
          </div>
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Inactivos</p>
            <p class="text-2xl font-bold text-yellow-600">{{ getStatusCount('idle') }}</p>
          </div>
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Detenidos</p>
            <p class="text-2xl font-bold text-red-600">{{ getStatusCount('stopped') }}</p>
          </div>
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Mantenimiento</p>
            <p class="text-2xl font-bold text-orange-600">{{ getStatusCount('maintenance') }}</p>
          </div>
          <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Map and Vehicle List Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Map Section -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-lg">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Mapa de Ubicaciones</h3>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="centerMap">
                  <MapPin class="mr-2 h-4 w-4" />
                  Centrar Todo
                </Button>
                <Button 
                  v-if="userLocation" 
                  variant="outline" 
                  size="sm" 
                  @click="centerMapOnUser"
                  class="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <MapPin class="mr-2 h-4 w-4 text-blue-600" />
                  Mi Ubicación
                </Button>
                <Button variant="outline" size="sm" @click="toggleMapType">
                  <Layers class="mr-2 h-4 w-4" />
                  {{ mapType === 'roadmap' ? 'Satélite' : 'Mapa' }}
                </Button>
              </div>
            </div>
          </div>

          <div class="relative h-[500px]">
            <!-- Map Container -->
            <div 
              ref="mapContainer" 
              id="tracking-map"
              class="w-full h-full rounded-b-lg z-10"
            >
              <div v-if="!mapInitialized" class="absolute inset-0 flex items-center justify-center bg-muted rounded-b-lg z-20">
                <div class="text-center">
                  <Loader2 class="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                  <p class="text-muted-foreground">Inicializando mapa...</p>
                </div>
              </div>
            </div>

            <!-- Map Legend with Filters -->
            <div class="absolute top-4 right-4 bg-background border border-border rounded-lg p-3 shadow-lg max-w-[220px]">
              <h4 class="font-semibold text-sm mb-2">Filtros de Mapa</h4>
              <div class="space-y-2">
                <!-- Vehículos Toggle -->
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground">Vehículos</span>
                  <input 
                    type="checkbox" 
                    v-model="showVehicles" 
                    @change="updateMapMarkers"
                    class="rounded border border-input"
                  />
                </div>
                <div v-if="showVehicles" class="ml-2 space-y-1">
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Activo</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Inactivo</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Detenido</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Mantenimiento</span>
                  </div>
                </div>
                
                <!-- Clientes Toggle -->
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground">Clientes</span>
                  <input 
                    type="checkbox" 
                    v-model="showCustomers" 
                    @change="updateMapMarkers"
                    class="rounded border border-input"
                  />
                </div>
                <div v-if="showCustomers" class="ml-2">
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>{{ customerLocations.length }} ubicaciones</span>
                  </div>
                </div>
                
                <!-- Proveedores Toggle -->
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground">Proveedores</span>
                  <input 
                    type="checkbox" 
                    v-model="showSuppliers" 
                    @change="updateMapMarkers"
                    class="rounded border border-input"
                  />
                </div>
                <div v-if="showSuppliers" class="ml-2">
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>{{ supplierLocations.length }} ubicaciones</span>
                  </div>
                </div>

                <!-- Conductores Toggle -->
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground">Conductores</span>
                  <input 
                    type="checkbox" 
                    v-model="showDrivers" 
                    @change="updateMapMarkers"
                    class="rounded border border-input"
                  />
                </div>
                <div v-if="showDrivers" class="ml-2">
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>{{ driversWithLocations.length }} en línea</span>
                  </div>
                </div>

                <!-- Mi Ubicación Toggle -->
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground">Mi Ubicación</span>
                  <input 
                    type="checkbox" 
                    v-model="showUserLocation" 
                    @change="updateMapMarkers"
                    class="rounded border border-input"
                    :disabled="!userLocation"
                  />
                </div>
                <div v-if="showUserLocation && userLocation" class="ml-2">
                  <div class="flex items-center gap-2 text-xs">
                    <div class="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Tu posición actual</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle List Section -->
      <div class="lg:col-span-1">
        <div class="bg-card border border-border rounded-lg">
          <div class="p-4 border-b border-border">
            <h3 class="text-lg font-semibold">Vehículos en Línea</h3>
            <p class="text-sm text-muted-foreground">
              Última actualización: {{ lastUpdateTime }}
            </p>
          </div>

          <div class="p-4">
            <!-- Search Filter -->
            <div class="relative mb-4">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="vehicleSearchQuery"
                placeholder="Buscar vehículo..."
                class="pl-10"
              />
            </div>

            <!-- Status Filter -->
            <select
              v-model="statusFilter"
              class="w-full mb-4 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="idle">Solo inactivos</option>
              <option value="stopped">Solo detenidos</option>
              <option value="maintenance">En mantenimiento</option>
            </select>

            <!-- Vehicle List -->
            <div class="space-y-2 max-h-[400px] overflow-y-auto">
              <div
                v-for="vehicle in filteredTrackingVehicles"
                :key="vehicle.id"
                class="border border-border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                :class="{ 'ring-2 ring-primary': selectedVehicleId === vehicle.id }"
                @click="selectVehicle(vehicle)"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div
                      :class="getStatusColor(vehicle.realtime_status?.status)"
                      class="w-3 h-3 rounded-full flex-shrink-0"
                    ></div>
                    <div>
                      <p class="font-medium">{{ vehicle.plate }}</p>
                      <p class="text-xs text-muted-foreground">
                        {{ vehicle.brand }} {{ vehicle.model }}
                      </p>
                    </div>
                  </div>
                  <Badge :variant="vehicle.own ? 'default' : 'secondary'" class="text-xs">
                    {{ vehicle.own ? 'Propio' : 'Tercero' }}
                  </Badge>
                </div>

                <div v-if="vehicle.realtime_status" class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Estado:</span>
                    <span>{{ getStatusLabel(vehicle.realtime_status.status) }}</span>
                  </div>
                  <div v-if="vehicle.realtime_status.speed_kph" class="flex justify-between">
                    <span class="text-muted-foreground">Velocidad:</span>
                    <span class="font-medium">{{ vehicle.realtime_status.speed_kph }} km/h</span>
                  </div>
                  <div v-if="vehicle.realtime_status.latitude" class="flex justify-between">
                    <span class="text-muted-foreground">Coordenadas:</span>
                    <span class="font-mono text-xs">
                      {{ vehicle.realtime_status.latitude.toFixed(4) }}, {{ vehicle.realtime_status.longitude.toFixed(4) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Actualización:</span>
                    <span>{{ getTimeAgo(vehicle.realtime_status.updated_at) }}</span>
                  </div>
                </div>

                <div v-else class="text-xs text-muted-foreground">
                  Sin datos de ubicación
                </div>
              </div>

              <div v-if="filteredTrackingVehicles.length === 0" class="text-center py-8">
                <MapPin class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p class="text-sm text-muted-foreground">No hay vehículos en línea</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vehicle Detail Panel -->
    <div v-if="selectedVehicleDetails" class="mt-6">
      <div class="bg-card border border-border rounded-lg">
        <div class="p-4 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Detalles de {{ selectedVehicleDetails.plate }}</h3>
            <Button variant="outline" size="sm" @click="viewPositionHistory">
              <History class="mr-2 h-4 w-4" />
              Ver Historial
            </Button>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Current Status -->
            <div>
              <h4 class="font-semibold mb-3">Estado Actual</h4>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div
                    :class="getStatusColor(selectedVehicleDetails.realtime_status?.status)"
                    class="w-3 h-3 rounded-full"
                  ></div>
                  <span class="font-medium">{{ getStatusLabel(selectedVehicleDetails.realtime_status?.status) }}</span>
                </div>
                <p class="text-sm text-muted-foreground">
                  Velocidad: {{ selectedVehicleDetails.realtime_status?.speed_kph || 0 }} km/h
                </p>
                <p class="text-sm text-muted-foreground">
                  Rumbo: {{ selectedVehicleDetails.realtime_status?.heading_deg || 0 }}°
                </p>
                <p class="text-sm text-muted-foreground">
                  Última actualización: {{ selectedVehicleDetails.realtime_status?.updated_at ? formatDateTime(selectedVehicleDetails.realtime_status.updated_at) : 'N/A' }}
                </p>
              </div>
            </div>

            <!-- Vehicle Info -->
            <div>
              <h4 class="font-semibold mb-3">Información del Vehículo</h4>
              <div class="space-y-2">
                <p class="text-sm">
                  <span class="text-muted-foreground">Marca:</span> {{ selectedVehicleDetails.brand || 'N/A' }}
                </p>
                <p class="text-sm">
                  <span class="text-muted-foreground">Modelo:</span> {{ selectedVehicleDetails.model || 'N/A' }}
                </p>
                <p class="text-sm">
                  <span class="text-muted-foreground">Año:</span> {{ selectedVehicleDetails.year || 'N/A' }}
                </p>
                <p class="text-sm">
                  <span class="text-muted-foreground">Capacidad:</span> 
                  {{ selectedVehicleDetails.capacity_kg ? `${formatNumber(selectedVehicleDetails.capacity_kg)} kg` : 'N/A' }}
                </p>
                <p class="text-sm">
                  <span class="text-muted-foreground">Tipo:</span>
                  <Badge :variant="selectedVehicleDetails.own ? 'default' : 'secondary'" class="ml-2">
                    {{ selectedVehicleDetails.own ? 'Propio' : 'Tercero' }}
                  </Badge>
                </p>
              </div>
            </div>

            <!-- Location Info -->
            <div>
              <h4 class="font-semibold mb-3">Ubicación</h4>
              <div class="space-y-2">
                <p class="text-sm">
                  <span class="text-muted-foreground">Latitud:</span> 
                  {{ selectedVehicleDetails.realtime_status?.latitude || 'N/A' }}
                </p>
                <p class="text-sm">
                  <span class="text-muted-foreground">Longitud:</span> 
                  {{ selectedVehicleDetails.realtime_status?.longitude || 'N/A' }}
                </p>
                <Button 
                  v-if="selectedVehicleDetails.realtime_status?.latitude" 
                  variant="outline" 
                  size="sm" 
                  @click="centerMapOnVehicle"
                  class="mt-2"
                >
                  <MapPin class="mr-2 h-4 w-4" />
                  Centrar en Mapa
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/auth'
import { useVehicles, type Vehicle } from '@/composables/useVehicles'
import {
  Radio,
  RefreshCw,
  Truck,
  MapPin,
  Layers,
  Map as MapIcon,
  Search,
  History,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'

// Stores and composables
const companiesStore = useCompaniesStore()
const authStore = useAuthStore()
const {
  vehicles,
  vehiclesWithStatus,
  partyLocations,
  customerLocations,
  supplierLocations,
  loading,
  fetchVehicles,
  fetchVehicleStatuses,
  fetchVehiclePositionLogs,
  fetchPartyLocations
} = useVehicles()

// Import drivers composable for real-time location tracking
import { useDrivers } from '@/composables/useDrivers'
const { 
  getDriversWithLocations,
  getDriverCurrentVehicle
} = useDrivers()

// Import geolocation composable for current user tracking
import { useGeolocation } from '@/composables/useGeolocation'
const {
  currentPosition: userLocation,
  isTracking: isUserTracking,
  trackingEnabled: userTrackingEnabled,
  startTracking: startUserTracking,
  stopTracking: stopUserTracking,
  setTrackingEnabled: setUserTrackingEnabled,
  permissionStatus: geolocationPermission,
  error: geolocationError
} = useGeolocation()

// State
const realtimeEnabled = ref(false)
const realtimeInterval = ref<NodeJS.Timeout | null>(null)
const mapContainer = ref<HTMLElement>()
const mapInitialized = ref(false)
const mapType = ref<'roadmap' | 'satellite'>('roadmap')
const vehicleSearchQuery = ref('')
const statusFilter = ref('')
const selectedVehicleId = ref<string | null>(null)
const lastUpdateTime = ref<string>('')
const showVehicles = ref(true)
const showCustomers = ref(true)
const showSuppliers = ref(true)
const showDrivers = ref(true)
const showUserLocation = ref(true)

// Leaflet map instance
let mapInstance: any = null
let L: any = null
const vehicleMarkers = ref<Map<string, any>>(new Map<string, any>())
const partyLocationMarkers = ref<Map<string, any>>(new Map<string, any>())
const driverMarkers = ref<Map<string, any>>(new Map<string, any>())
const userLocationMarker = ref<any>(null)
const driversWithLocations = ref<any[]>([])
const mapLoaded = ref(false)

// Computed properties
const getStatusCount = (status: string) => {
  return vehiclesWithStatus.value.filter(v => v.realtime_status?.status === status).length
}

const filteredTrackingVehicles = computed(() => {
  let filtered = vehiclesWithStatus.value.filter(v => v.realtime_status)

  // Search filter
  if (vehicleSearchQuery.value) {
    const query = vehicleSearchQuery.value.toLowerCase()
    filtered = filtered.filter(vehicle =>
      vehicle.plate.toLowerCase().includes(query) ||
      vehicle.brand?.toLowerCase().includes(query) ||
      vehicle.model?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(vehicle => vehicle.realtime_status?.status === statusFilter.value)
  }

  return filtered.sort((a, b) => a.plate.localeCompare(b.plate))
})

const selectedVehicleDetails = computed(() => {
  if (!selectedVehicleId.value) return null
  return vehiclesWithStatus.value.find(v => v.id === selectedVehicleId.value) || null
})

// Methods
const refreshData = async () => {
  if (!companiesStore.currentCompany) return

  const [, , , drivers] = await Promise.all([
    fetchVehicles(companiesStore.currentCompany.id),
    fetchVehicleStatuses(companiesStore.currentCompany.id),
    fetchPartyLocations(companiesStore.currentCompany.id),
    getDriversWithLocations(companiesStore.currentCompany.id)
  ])
  
  driversWithLocations.value = drivers || []
  lastUpdateTime.value = new Date().toLocaleTimeString('es-PE')
  updateMapMarkers()
}

const toggleRealtimeTracking = () => {
  if (realtimeEnabled.value) {
    // Stop realtime tracking
    if (realtimeInterval.value) {
      clearInterval(realtimeInterval.value)
      realtimeInterval.value = null
    }
    realtimeEnabled.value = false
  } else {
    // Start realtime tracking
    realtimeEnabled.value = true
    if (companiesStore.currentCompany) {
      realtimeInterval.value = setInterval(async () => {
        await fetchVehicleStatuses(companiesStore.currentCompany!.id)
        lastUpdateTime.value = new Date().toLocaleTimeString('es-PE')
        updateMapMarkers()
      }, 30000) // Update every 30 seconds
    }
  }
}

const toggleUserTracking = async () => {
  if (isUserTracking.value) {
    // Stop user location tracking
    stopUserTracking()
    updateMapMarkers()
  } else {
    // Start user location tracking
    console.log('Starting user tracking...')
    const success = await startUserTracking()
    console.log('User tracking started:', success)
    
    if (success) {
      // Enable tracking in database
      await setUserTrackingEnabled(true)
      console.log('User location:', userLocation.value)
      // Update map markers to show user location
      updateMapMarkers()
    } else if (geolocationError.value) {
      console.error('Failed to start user tracking:', geolocationError.value)
      // Show user-friendly error
      alert('Error al obtener la ubicación: ' + geolocationError.value)
    }
  }
}

const selectVehicle = (vehicle: Vehicle) => {
  selectedVehicleId.value = vehicle.id
  
  // Center map on selected vehicle if it has location
  if (vehicle.realtime_status?.latitude && vehicle.realtime_status?.longitude) {
    centerMapOnVehicle()
  }
}

const loadLeaflet = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (mapLoaded.value || (window as any).L) {
      L = (window as any).L
      mapLoaded.value = true
      resolve()
      return
    }

    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    document.head.appendChild(link)

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    
    script.onload = () => {
      L = (window as any).L
      mapLoaded.value = true
      resolve()
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load Leaflet'))
    }
    
    document.head.appendChild(script)
  })
}

const initializeMap = async () => {
  try {
    await loadLeaflet()
    await nextTick()
    
    if (mapContainer.value && L) {
      // Initialize Leaflet map
      mapInstance = L.map('tracking-map').setView([-12.0464, -77.0428], 12) // Lima, Peru
      
      // Add tile layer
      const tileLayerUrl = mapType.value === 'satellite' 
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      
      const attribution = mapType.value === 'satellite'
        ? '&copy; <a href="https://www.esri.com/en-us/home">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      
      L.tileLayer(tileLayerUrl, {
        maxZoom: 18,
        attribution: attribution
      }).addTo(mapInstance)
      
      mapInitialized.value = true
      updateMapMarkers()
    }
  } catch (error) {
    console.error('Error initializing map:', error)
    mapInitialized.value = true // Show error state
  }
}

const updateMapMarkers = () => {
  if (!mapInitialized.value || !mapInstance || !L) return

  // Clear existing vehicle markers
  vehicleMarkers.value.forEach(marker => {
    mapInstance.removeLayer(marker)
  })
  vehicleMarkers.value.clear()

  // Clear existing party location markers
  partyLocationMarkers.value.forEach(marker => {
    mapInstance.removeLayer(marker)
  })
  partyLocationMarkers.value.clear()

  // Clear existing driver markers
  driverMarkers.value.forEach(marker => {
    mapInstance.removeLayer(marker)
  })
  driverMarkers.value.clear()

  // Clear existing user location marker
  if (userLocationMarker.value) {
    console.log('Removing existing user location marker')
    mapInstance.removeLayer(userLocationMarker.value)
    userLocationMarker.value = null
  }

  // Add new markers for vehicles with location (if enabled)
  if (showVehicles.value) {
    filteredTrackingVehicles.value.forEach(vehicle => {
    if (vehicle.realtime_status?.latitude && vehicle.realtime_status?.longitude) {
      // Create custom icon
      const iconColor = getStatusColorHex(vehicle.realtime_status.status)
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${iconColor};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
          ">
            🚛
          </div>
        `,
        className: 'custom-vehicle-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      })
      
      // Create marker
      const marker = L.marker(
        [vehicle.realtime_status.latitude, vehicle.realtime_status.longitude],
        { icon: customIcon }
      ).addTo(mapInstance)
      
      // Add popup with vehicle info
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">${vehicle.plate}</h3>
          <p class="text-sm">${vehicle.brand} ${vehicle.model}</p>
          <p class="text-sm">Estado: ${getStatusLabel(vehicle.realtime_status.status)}</p>
          <p class="text-sm">Velocidad: ${vehicle.realtime_status.speed_kph || 0} km/h</p>
          <p class="text-xs text-gray-500">
            Actualizado: ${getTimeAgo(vehicle.realtime_status.updated_at)}
          </p>
        </div>
      `)
      
      // Add click event to select vehicle
      marker.on('click', () => {
        selectVehicle(vehicle)
      })
      
      vehicleMarkers.value.set(vehicle.id, marker)
    }
    })
  }

  // Add markers for customer locations (if enabled)
  if (showCustomers.value) {
    customerLocations.value.forEach(location => {
    if (location.latitude && location.longitude && location.party) {
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: #3b82f6;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: white;
          ">
            👤
          </div>
        `,
        className: 'custom-customer-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
      
      const marker = L.marker(
        [location.latitude, location.longitude],
        { icon: customIcon }
      ).addTo(mapInstance)
      
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-blue-600">📍 Cliente</h3>
          <p class="text-sm font-medium">${location.party.fullname}</p>
          <p class="text-xs text-gray-600">RUC: ${location.party.doc_number}</p>
          ${location.description ? `<p class="text-xs">${location.description}</p>` : ''}
          ${location.party.address ? `<p class="text-xs text-gray-500">${location.party.address}</p>` : ''}
        </div>
      `)
      
      partyLocationMarkers.value.set(location.id, marker)
    }
    })
  }

  // Add markers for supplier locations (if enabled)
  if (showSuppliers.value) {
    supplierLocations.value.forEach(location => {
    if (location.latitude && location.longitude && location.party) {
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: #8b5cf6;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: white;
          ">
            🏭
          </div>
        `,
        className: 'custom-supplier-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
      
      const marker = L.marker(
        [location.latitude, location.longitude],
        { icon: customIcon }
      ).addTo(mapInstance)
      
      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-purple-600">🏭 Proveedor</h3>
          <p class="text-sm font-medium">${location.party.fullname}</p>
          <p class="text-xs text-gray-600">RUC: ${location.party.doc_number}</p>
          ${location.description ? `<p class="text-xs">${location.description}</p>` : ''}
          ${location.party.address ? `<p class="text-xs text-gray-500">${location.party.address}</p>` : ''}
        </div>
      `)
      
      partyLocationMarkers.value.set(location.id, marker)
    }
    })
  }

  // Add markers for drivers with real-time locations (if enabled)
  if (showDrivers.value) {
    driversWithLocations.value.forEach(driver => {
      if (driver.current_location && driver.current_location.latitude && driver.current_location.longitude) {
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: #f97316;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: white;
            ">
              👨‍💼
            </div>
          `,
          className: 'custom-driver-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
        
        const marker = L.marker(
          [driver.current_location.latitude, driver.current_location.longitude],
          { icon: customIcon }
        ).addTo(mapInstance)
        
        const driverName = driver.nombre_completo || driver.user?.full_name || driver.user?.email || 'Conductor'
        const vehicleInfo = driver.current_vehicle?.vehicle ? 
          `Vehículo: ${driver.current_vehicle.vehicle.plate}` : 
          'Sin vehículo asignado'
        
        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-orange-600">👨‍💼 ${driverName}</h3>
            <p class="text-sm">${vehicleInfo}</p>
            <p class="text-sm">Licencia: ${driver.license_number}</p>
            ${driver.current_location.speed_kph ? `<p class="text-sm">Velocidad: ${driver.current_location.speed_kph} km/h</p>` : ''}
            ${driver.current_location.accuracy_meters ? `<p class="text-xs text-gray-500">Precisión: ${driver.current_location.accuracy_meters}m</p>` : ''}
            <p class="text-xs text-gray-500">
              Actualizado: ${getTimeAgo(driver.current_location.created_at)}
            </p>
          </div>
        `)
        
        driverMarkers.value.set(driver.id, marker)
      }
    })
  }

  // Add marker for current user location (if enabled and available)
  console.log('Checking user location:', {
    showUserLocation: showUserLocation.value,
    userLocation: userLocation.value,
    hasLatLng: userLocation.value?.latitude && userLocation.value?.longitude
  })
  
  if (showUserLocation.value && userLocation.value && userLocation.value.latitude && userLocation.value.longitude) {
    console.log('Adding user location marker at:', userLocation.value.latitude, userLocation.value.longitude)
    
    try {
      // Stop any ongoing map animations first
      if (mapInstance._animatingZoom) {
        mapInstance._animatingZoom = false
      }
      
      // Create a feature group to manage all user location elements
      const userLocationGroup = L.featureGroup()
      
      // Create the main location marker
      const circleMarker = L.circleMarker(
        [userLocation.value.latitude, userLocation.value.longitude],
        {
          radius: 12,
          fillColor: '#1d4ed8',
          color: 'white',
          weight: 4,
          opacity: 1,
          fillOpacity: 0.9
        }
      )
      
      // Add accuracy circle if available
      if (userLocation.value.accuracy && userLocation.value.accuracy > 0) {
        const accuracyCircle = L.circle(
          [userLocation.value.latitude, userLocation.value.longitude],
          {
            radius: Math.min(userLocation.value.accuracy, 5000), // Limit to 5km max
            fillColor: '#1d4ed8',
            color: '#1d4ed8',
            weight: 1,
            opacity: 0.2,
            fillOpacity: 0.05
          }
        )
        userLocationGroup.addLayer(accuracyCircle)
        console.log('Accuracy circle added with radius:', userLocation.value.accuracy, 'meters')
      }
      
      // Add the circle marker to the group
      userLocationGroup.addLayer(circleMarker)
      
      // Add the entire group to the map in one operation
      userLocationGroup.addTo(mapInstance)
      userLocationMarker.value = userLocationGroup
      
      console.log('User location group created and added successfully')
      
    } catch (iconError) {
      console.error('Error creating user location marker:', iconError)
      
      try {
        // Ultra-simple fallback
        userLocationMarker.value = L.circle(
          [userLocation.value.latitude, userLocation.value.longitude],
          {
            radius: 50,
            fillColor: '#1d4ed8',
            color: '#1d4ed8',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
          }
        ).addTo(mapInstance)
        
        console.log('Fallback circle marker created')
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError)
        return // Give up on this marker
      }
    }
    
    console.log('User location marker process completed')
    
    // Center map without animation to avoid conflicts
    setTimeout(() => {
      try {
        if (mapInstance && userLocation.value && mapInstance.setView) {
          // Use flyTo with minimal animation instead of setView
          mapInstance.flyTo(
            [userLocation.value.latitude, userLocation.value.longitude], 
            15,
            {
              duration: 0.5,
              easeLinearity: 0.1
            }
          )
          console.log('Map centered on user location using flyTo')
        }
      } catch (centerError) {
        console.error('Error centering map:', centerError)
        // Try without animation as last resort
        try {
          mapInstance.setView([userLocation.value.latitude, userLocation.value.longitude], 15)
        } catch (fallbackCenterError) {
          console.error('Fallback centering also failed:', fallbackCenterError)
        }
      }
    }, 200)
    
    const accuracyText = userLocation.value.accuracy ? 
      `Precisión: ±${Math.round(userLocation.value.accuracy)}m` : 
      'Precisión: No disponible'
      
    const speedText = userLocation.value.speed !== null && userLocation.value.speed !== undefined ? 
      `Velocidad: ${Math.round(userLocation.value.speed * 3.6)} km/h` : 
      'Velocidad: 0 km/h'
    
    userLocationMarker.value.bindPopup(`
      <div class="p-3">
        <h3 class="font-bold text-blue-600">📍 Tu Ubicación</h3>
        <p class="text-sm">Esta es tu posición actual</p>
        <p class="text-sm">${accuracyText}</p>
        <p class="text-sm">${speedText}</p>
        <p class="text-xs text-gray-500 mt-2">
          Lat: ${userLocation.value.latitude.toFixed(6)}<br>
          Lng: ${userLocation.value.longitude.toFixed(6)}
        </p>
        <p class="text-xs text-gray-500">
          Actualizado: ${isUserTracking.value ? 'En tiempo real' : 'Estático'}
        </p>
      </div>
    `)
  }
}

const centerMap = () => {
  if (!mapInstance || !L) return
  
  // Get bounds of all markers (vehicles + party locations + drivers + user location)
  const allMarkers = [
    ...Array.from(vehicleMarkers.value.values()),
    ...Array.from(partyLocationMarkers.value.values()),
    ...Array.from(driverMarkers.value.values())
  ]
  
  // Add user location marker if it exists
  if (userLocationMarker.value) {
    allMarkers.push(userLocationMarker.value)
  }
  
  if (allMarkers.length > 0) {
    const group = L.featureGroup(allMarkers)
    mapInstance.fitBounds(group.getBounds(), { padding: [20, 20] })
  } else {
    mapInstance.setView([-12.0464, -77.0428], 12)
  }
}

const centerMapOnVehicle = () => {
  if (!mapInstance || !selectedVehicleDetails.value?.realtime_status) return
  
  const location = selectedVehicleDetails.value.realtime_status
  if (location.latitude && location.longitude) {
    mapInstance.setView([location.latitude, location.longitude], 15)
    
    // Open popup for selected vehicle
    const marker = vehicleMarkers.value.get(selectedVehicleDetails.value.id)
    if (marker) {
      marker.openPopup()
    }
  }
}

const centerMapOnUser = () => {
  if (!mapInstance || !userLocation.value) return
  
  if (userLocation.value.latitude && userLocation.value.longitude) {
    mapInstance.setView([userLocation.value.latitude, userLocation.value.longitude], 16, {
      animate: true,
      duration: 1.0
    })
    
    // Open popup for user location
    setTimeout(() => {
      if (userLocationMarker.value && userLocationMarker.value.openPopup) {
        userLocationMarker.value.openPopup()
      }
    }, 100)
  }
}

const toggleMapType = () => {
  mapType.value = mapType.value === 'roadmap' ? 'satellite' : 'roadmap'
  if (mapInstance && L) {
    // Remove current tile layer
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapInstance.removeLayer(layer)
      }
    })
    
    // Add new tile layer
    const tileLayerUrl = mapType.value === 'satellite' 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    
    const attribution = mapType.value === 'satellite'
      ? '&copy; <a href="https://www.esri.com/en-us/home">Esri</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    
    L.tileLayer(tileLayerUrl, {
      maxZoom: 18,
      attribution: attribution
    }).addTo(mapInstance)
  }
}

const viewPositionHistory = async () => {
  if (!selectedVehicleDetails.value) return
  
  await fetchVehiclePositionLogs(selectedVehicleDetails.value.id, 100)
  // TODO: Open position history dialog or navigate to history view
}

// Helper functions
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'idle':
      return 'bg-yellow-500'
    case 'stopped':
      return 'bg-red-500'
    case 'maintenance':
      return 'bg-orange-500'
    default:
      return 'bg-gray-400'
  }
}

const getStatusColorHex = (status?: string) => {
  switch (status) {
    case 'active':
      return '#10b981'
    case 'idle':
      return '#f59e0b'
    case 'stopped':
      return '#ef4444'
    case 'maintenance':
      return '#f97316'
    default:
      return '#6b7280'
  }
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'idle':
      return 'Inactivo'
    case 'stopped':
      return 'Detenido'
    case 'maintenance':
      return 'Mantenimiento'
    default:
      return 'Sin datos'
  }
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-PE').format(value)
}

const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(dateString))
}

const getTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins}m`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

// Watchers
watch(userLocation, (newLocation) => {
  console.log('User location changed:', newLocation)
  if (mapInitialized.value && newLocation) {
    updateMapMarkers()
  }
}, { deep: true })

watch(isUserTracking, (newTracking) => {
  console.log('User tracking status changed:', newTracking)
})

// Watch for company changes
watch(
  () => companiesStore.currentCompany,
  async (newCompany, oldCompany) => {
    if (newCompany && oldCompany && newCompany.id !== oldCompany.id) {
      console.log('Company changed in VehicleTrackingView, reloading data...', {
        from: oldCompany.id,
        to: newCompany.id
      })
      await refreshData()
      await nextTick(() => {
        updateMapMarkers()
      })

      // Restart realtime tracking if it was enabled
      if (realtimeEnabled.value) {
        toggleRealtimeTracking() // Disable
        setTimeout(() => {
          toggleRealtimeTracking() // Re-enable with new company
        }, 100)
      }
    }
  }, { deep: true }
)

// Lifecycle
onMounted(async () => {
  await refreshData()
  await initializeMap()
})

onUnmounted(() => {
  if (realtimeInterval.value) {
    clearInterval(realtimeInterval.value)
  }
  // Stop user tracking when component unmounts
  if (isUserTracking.value) {
    stopUserTracking()
  }
})
</script>