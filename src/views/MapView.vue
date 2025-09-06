<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Mapa Logístico</h1>
        <p class="text-muted-foreground">
          Visualización de almacenes, clientes, proveedores y vehículos en tiempo real
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Filter Buttons -->
        <div class="flex items-center gap-2">
          <Button 
            :variant="activeLayers.includes('warehouses') ? 'default' : 'outline'" 
            size="sm" 
            @click="toggleLayer('warehouses')"
            :class="activeLayers.includes('warehouses') ? 'bg-blue-600 hover:bg-blue-700' : ''"
          >
            <Warehouse class="mr-2 h-4 w-4" />
            Almacenes
          </Button>
          <Button 
            :variant="activeLayers.includes('parties') ? 'default' : 'outline'" 
            size="sm" 
            @click="toggleLayer('parties')"
            :class="activeLayers.includes('parties') ? 'bg-green-600 hover:bg-green-700' : ''"
          >
            <Users class="mr-2 h-4 w-4" />
            Clientes/Proveedores
          </Button>
          <Button 
            :variant="activeLayers.includes('vehicles') ? 'default' : 'outline'" 
            size="sm" 
            @click="toggleLayer('vehicles')"
            :class="activeLayers.includes('vehicles') ? 'bg-amber-600 hover:bg-amber-700' : ''"
          >
            <Truck class="mr-2 h-4 w-4" />
            Vehículos
          </Button>
        </div>
        
        <!-- Search Bar -->
        <div class="relative search-container">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar almacenes, clientes o vehículos..."
              class="pl-10 pr-4 py-2 w-80 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              @input="onSearchInput"
              @focus="showSearchResults = true"
            />
          </div>
          
          <!-- Search Results Dropdown -->
          <div 
            v-if="showSearchResults && filteredSearchResults.length > 0" 
            class="absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            <div 
              v-for="result in filteredSearchResults" 
              :key="result.id"
              class="px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
              @click="selectSearchResult(result)"
            >
              <div class="flex items-center gap-2">
                <component 
                  :is="getResultIcon(result.type)" 
                  class="h-4 w-4" 
                  :class="getResultIconColor(result.type)"
                />
                <div>
                  <div class="text-sm font-medium">{{ result.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ result.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Route Manager -->
    <RouteManager 
      :vehicles="vehicles"
      :destinations="parties"
      @route-created="onRouteCreated"
      @route-cancelled="onRouteCancelled"
      @center-on-route="onCenterOnRoute"
    />

    <!-- Location Tracker -->
    <LocationTracker 
      :auto-start="true"
      :show-in-map="true"
      @location-update="onUserLocationUpdate"
      @tracking-started="onTrackingStarted"
      @tracking-stopped="onTrackingStopped"
      @error="onLocationError"
    />

    <!-- Map Container -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center">
            <MapPin class="mr-2 h-5 w-5" />
            Mapa de Operaciones
            <Badge variant="outline" class="ml-2">
              {{ activeCompany.legal_name }}
            </Badge>
          </CardTitle>
          <div class="flex items-center gap-2">
            <Button 
              v-if="userLocation && userTrackingActive"
              variant="outline" 
              size="sm" 
              @click="centerMapOnUserLocation"
              class="flex items-center gap-2"
            >
              <Globe class="h-4 w-4 text-blue-500" />
              Mi Ubicación
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          id="map" 
          ref="mapContainer"
          class="w-full h-[600px] border rounded-lg"
        ></div>
      </CardContent>
    </Card>

    <!-- Statistics Cards -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Almacenes</CardTitle>
          <Warehouse class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ warehouses.length }}</div>
          <p class="text-xs text-muted-foreground">
            <span class="text-green-600">{{ operationalWarehouses }}</span> operativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Clientes/Proveedores</CardTitle>
          <Users class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ parties.length }}</div>
          <p class="text-xs text-muted-foreground">
            {{ customers }} clientes, {{ suppliers }} proveedores
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Vehículos</CardTitle>
          <Truck class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ vehicles.length }}</div>
          <p class="text-xs text-muted-foreground">
            <span class="text-green-600">{{ activeVehicles }}</span> activos ahora
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Cobertura</CardTitle>
          <Globe class="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ coverage }}</div>
          <p class="text-xs text-muted-foreground">
            Rango operativo en km²
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { fromLonLat } from 'ol/proj'
import { Style, Icon, Fill, Stroke, Circle, Text } from 'ol/style'
import type { Route } from '@/services/RouteService'
import webSocketService, { type VehicleUpdate } from '@/services/WebSocketService'
import { 
  MapPin, 
  Warehouse, 
  Users, 
  Truck, 
  Globe,
  Search
} from 'lucide-vue-next'

import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import RouteManager from '@/components/RouteManager.vue'
import LocationTracker from '@/components/LocationTracker.vue'
import type { DeviceLocation } from '@/services/LocationService'

// Datos sembrados basados en el esquema de la base de datos
const activeCompany = ref({
  id: 'company-1',
  legal_name: 'Distribuidora Comercial SAC',
  ruc: '20123456789',
  trade_name: 'DistriCom'
})

const warehouses = ref([
  {
    id: 'wh-1',
    company_id: 'company-1',
    code: 'ALM001',
    name: 'Almacén Central Lima',
    latitude: -12.0464,
    longitude: -77.0428,
    operational_status: 'OPERATIONAL',
    warehouse_type: 'GENERAL',
    capacity_kg: 50000,
    current_capacity_kg: 32000
  },
  {
    id: 'wh-2', 
    company_id: 'company-1',
    code: 'ALM002',
    name: 'Almacén Norte Trujillo',
    latitude: -8.1116,
    longitude: -79.0287,
    operational_status: 'OPERATIONAL',
    warehouse_type: 'COLD_STORAGE',
    capacity_kg: 25000,
    current_capacity_kg: 18500
  },
  {
    id: 'wh-3',
    company_id: 'company-1', 
    code: 'ALM003',
    name: 'Almacén Sur Arequipa',
    latitude: -16.4090,
    longitude: -71.5375,
    operational_status: 'MAINTENANCE',
    warehouse_type: 'GENERAL',
    capacity_kg: 30000,
    current_capacity_kg: 5000
  }
])

const parties = ref([
  {
    id: 'party-1',
    company_id: 'company-1',
    is_customer: true,
    is_supplier: false,
    razon_social: 'Supermercados Metro SAC',
    latitude: -12.0724,
    longitude: -77.0826,
    description: 'Cliente Principal - Lima'
  },
  {
    id: 'party-2',
    company_id: 'company-1',
    is_customer: true,
    is_supplier: false,
    razon_social: 'Tottus Perú SAC',
    latitude: -12.1015,
    longitude: -76.9739,
    description: 'Cliente VIP - Lima Este'
  },
  {
    id: 'party-3',
    company_id: 'company-1',
    is_customer: false,
    is_supplier: true,
    razon_social: 'Proveedor Gloria SAC',
    latitude: -12.0897,
    longitude: -77.0089,
    description: 'Proveedor Principal - Lácteos'
  },
  {
    id: 'party-4',
    company_id: 'company-1',
    is_customer: true,
    is_supplier: false,
    razon_social: 'Wong Supermercados',
    latitude: -8.1051,
    longitude: -79.0204,
    description: 'Cliente - Trujillo'
  }
])

const vehicles = ref([
  {
    id: 'vh-1',
    company_id: 'company-1',
    plate: 'ABC-123',
    brand: 'Volvo',
    model: 'FH 460',
    latitude: -12.0580,
    longitude: -77.0352,
    speed_kph: 45,
    status: 'active',
    heading_deg: 135,
    capacity_kg: 25000,
    own: true
  },
  {
    id: 'vh-2',
    company_id: 'company-1', 
    plate: 'DEF-456',
    brand: 'Mercedes',
    model: 'Actros',
    latitude: -8.1200,
    longitude: -79.0350,
    speed_kph: 0,
    status: 'idle',
    heading_deg: 0,
    capacity_kg: 30000,
    own: true
  },
  {
    id: 'vh-3',
    company_id: 'company-1',
    plate: 'GHI-789', 
    brand: 'Scania',
    model: 'R 450',
    latitude: -16.4020,
    longitude: -71.5300,
    speed_kph: 65,
    status: 'active',
    heading_deg: 270,
    capacity_kg: 28000,
    own: false
  }
])

const mapContainer = ref<HTMLElement>()
const map = ref<Map>()
const activeLayers = ref(['warehouses', 'parties', 'vehicles'])
const searchQuery = ref('')
const showSearchResults = ref(false)
const filteredSearchResults = ref<SearchResult[]>([])
const activeRoutes = ref<Route[]>([])
const vehicleTrackingIntervals = ref<Map<string, NodeJS.Timeout>>(new Map())

// User location tracking
const userLocation = ref<DeviceLocation | null>(null)
const userLocationLayer = ref<VectorLayer<VectorSource> | null>(null)
const userTrackingActive = ref(false)

// Search result interface
interface SearchResult {
  id: string
  name: string
  description: string
  type: 'warehouse' | 'party' | 'vehicle'
  latitude: number
  longitude: number
  data: any
}

// Computed properties para estadísticas
const operationalWarehouses = computed(() => 
  warehouses.value.filter(w => w.operational_status === 'OPERATIONAL').length
)

const customers = computed(() => 
  parties.value.filter(p => p.is_customer).length
)

const suppliers = computed(() => 
  parties.value.filter(p => p.is_supplier).length
)

const activeVehicles = computed(() => 
  vehicles.value.filter(v => v.status === 'active').length
)

const coverage = computed(() => '2,500') // Simulado

// Create search results from all data
const allSearchResults = computed(() => {
  const results: SearchResult[] = []
  
  // Add warehouses
  warehouses.value.forEach(warehouse => {
    results.push({
      id: warehouse.id,
      name: warehouse.name,
      description: `Almacén • ${warehouse.code} • ${warehouse.operational_status}`,
      type: 'warehouse',
      latitude: warehouse.latitude,
      longitude: warehouse.longitude,
      data: warehouse
    })
  })
  
  // Add parties
  parties.value.forEach(party => {
    results.push({
      id: party.id,
      name: party.razon_social,
      description: party.description,
      type: 'party',
      latitude: party.latitude,
      longitude: party.longitude,
      data: party
    })
  })
  
  // Add vehicles
  vehicles.value.forEach(vehicle => {
    results.push({
      id: vehicle.id,
      name: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
      description: `Vehículo • ${vehicle.status} • ${vehicle.speed_kph} km/h`,
      type: 'vehicle',
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      data: vehicle
    })
  })
  
  return results
})

const initializeMap = () => {
  if (!mapContainer.value) return

  // Crear el mapa
  map.value = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: fromLonLat([-77.0428, -12.0464]), // Lima, Perú
      zoom: 6
    })
  })

  // Agregar capas de datos
  addWarehousesLayer()
  addPartiesLayer()
  addVehiclesLayer()
}

const addWarehousesLayer = () => {
  const warehouseFeatures = warehouses.value.map(warehouse => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([warehouse.longitude, warehouse.latitude])),
      warehouse
    })

    feature.setStyle(new Style({
      image: new Circle({
        radius: 10,
        fill: new Fill({ 
          color: warehouse.operational_status === 'OPERATIONAL' ? '#3b82f6' : '#ef4444' 
        }),
        stroke: new Stroke({ 
          color: '#ffffff', 
          width: 2 
        })
      }),
      text: new Text({
        text: warehouse.code,
        offsetY: -25,
        fill: new Fill({ color: '#000' }),
        font: '12px sans-serif'
      })
    }))

    return feature
  })

  const warehouseSource = new VectorSource({
    features: warehouseFeatures
  })

  const warehouseLayer = new VectorLayer({
    source: warehouseSource,
    properties: { name: 'warehouses' }
  })

  map.value?.addLayer(warehouseLayer)
}

const addPartiesLayer = () => {
  const partyFeatures = parties.value.map(party => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([party.longitude, party.latitude])),
      party
    })

    feature.setStyle(new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ 
          color: party.is_customer ? '#10b981' : '#f59e0b'
        }),
        stroke: new Stroke({ 
          color: '#ffffff', 
          width: 2 
        })
      }),
      text: new Text({
        text: party.is_customer ? 'C' : 'P',
        fill: new Fill({ color: '#ffffff' }),
        font: 'bold 10px sans-serif'
      })
    }))

    return feature
  })

  const partySource = new VectorSource({
    features: partyFeatures
  })

  const partyLayer = new VectorLayer({
    source: partySource,
    properties: { name: 'parties' }
  })

  map.value?.addLayer(partyLayer)
}

const addVehiclesLayer = () => {
  const vehicleFeatures = vehicles.value.map(vehicle => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([vehicle.longitude, vehicle.latitude])),
      vehicle
    })

    const getVehicleColor = (status: string) => {
      switch (status) {
        case 'active': return '#10b981'
        case 'idle': return '#f59e0b'
        case 'maintenance': return '#ef4444'
        default: return '#6b7280'
      }
    }

    feature.setStyle(new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ 
          color: getVehicleColor(vehicle.status)
        }),
        stroke: new Stroke({ 
          color: '#ffffff', 
          width: 2 
        })
      }),
      text: new Text({
        text: vehicle.plate,
        offsetY: 20,
        fill: new Fill({ color: '#000' }),
        font: '10px sans-serif'
      })
    }))

    return feature
  })

  const vehicleSource = new VectorSource({
    features: vehicleFeatures
  })

  const vehicleLayer = new VectorLayer({
    source: vehicleSource,
    properties: { name: 'vehicles' }
  })

  map.value?.addLayer(vehicleLayer)
}

// Setup WebSocket connection for real-time updates
const setupWebSocketConnection = () => {
  webSocketService.on('vehicleUpdate', (update: VehicleUpdate) => {
    updateVehiclePosition(update)
  })
  
  // Start simulated vehicle tracking for demo
  startVehicleTracking()
}

// Real-time vehicle position updates
const updateVehiclePosition = (update: VehicleUpdate) => {
  const vehicle = vehicles.value.find(v => v.id === update.vehicleId)
  if (vehicle) {
    vehicle.latitude = update.latitude
    vehicle.longitude = update.longitude
    vehicle.speed_kph = update.speed_kph
    vehicle.status = update.status
    
    // Update vehicle layer on map
    updateVehicleOnMap(vehicle)
  }
}

// Update vehicle position on map
const updateVehicleOnMap = (vehicle: any) => {
  const layers = map.value?.getLayers().getArray() || []
  const vehicleLayer = layers.find(l => l.get('name') === 'vehicles') as VectorLayer<VectorSource>
  
  if (vehicleLayer) {
    const source = vehicleLayer.getSource()
    const features = source?.getFeatures() || []
    
    const vehicleFeature = features.find(f => f.get('vehicle')?.id === vehicle.id)
    if (vehicleFeature) {
      // Update position
      const newCoord = fromLonLat([vehicle.longitude, vehicle.latitude])
      vehicleFeature.getGeometry()?.setCoordinates(newCoord)
      
      // Update style based on status
      const getVehicleColor = (status: string) => {
        switch (status) {
          case 'active': return '#10b981'
          case 'idle': return '#f59e0b'
          case 'maintenance': return '#ef4444'
          default: return '#6b7280'
        }
      }
      
      vehicleFeature.setStyle(new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: getVehicleColor(vehicle.status) }),
          stroke: new Stroke({ color: '#ffffff', width: 2 })
        }),
        text: new Text({
          text: vehicle.plate,
          offsetY: 20,
          fill: new Fill({ color: '#000' }),
          font: '10px sans-serif'
        })
      }))
    }
  }
}

// Start vehicle tracking simulation
const startVehicleTracking = () => {
  vehicles.value.forEach(vehicle => {
    if (vehicle.status === 'active') {
      webSocketService.subscribeToVehicle(vehicle.id)
      
      // Simulate movement for demo purposes
      const interval = setInterval(() => {
        simulateVehicleMovement(vehicle)
      }, 5000) // Update every 5 seconds
      
      vehicleTrackingIntervals.value.set(vehicle.id, interval)
    }
  })
}

// Simulate vehicle movement for demo
const simulateVehicleMovement = (vehicle: any) => {
  // Small random movement
  const latOffset = (Math.random() - 0.5) * 0.001
  const lonOffset = (Math.random() - 0.5) * 0.001
  
  vehicle.latitude += latOffset
  vehicle.longitude += lonOffset
  vehicle.speed_kph = 30 + Math.random() * 40
  
  updateVehicleOnMap(vehicle)
}

// Route management functions
const onRouteCreated = (route: Route) => {
  activeRoutes.value.push(route)
  addRouteToMap(route)
}

const onRouteCancelled = (routeId: string) => {
  const routeIndex = activeRoutes.value.findIndex(r => r.id === routeId)
  if (routeIndex > -1) {
    activeRoutes.value.splice(routeIndex, 1)
    removeRouteFromMap(routeId)
  }
}

const onCenterOnRoute = (route: Route) => {
  const view = map.value?.getView()
  if (view && route.geometry.length > 0) {
    // Calculate route bounds
    const coords = route.geometry.map(coord => fromLonLat([coord[0], coord[1]]))
    const extent = [Infinity, Infinity, -Infinity, -Infinity]
    
    coords.forEach(coord => {
      extent[0] = Math.min(extent[0], coord[0])
      extent[1] = Math.min(extent[1], coord[1])
      extent[2] = Math.max(extent[2], coord[0])
      extent[3] = Math.max(extent[3], coord[1])
    })
    
    view.fit(extent, {
      padding: [50, 50, 50, 50],
      duration: 1000
    })
  }
}

// User location tracking functions
const onUserLocationUpdate = (location: DeviceLocation) => {
  console.log('User location update received:', location)
  userLocation.value = location
  
  // Ensure tracking is marked as active
  if (!userTrackingActive.value) {
    console.log('Setting user tracking as active')
    userTrackingActive.value = true
  }
  
  // Ensure the layer is initialized before updating
  if (!userLocationLayer.value) {
    console.log('User location layer not initialized, initializing now...')
    initializeUserLocationLayer()
  }
  
  updateUserLocationOnMap(location)
}

const onTrackingStarted = (deviceId: string) => {
  userTrackingActive.value = true
  initializeUserLocationLayer()
  console.log('User tracking started for device:', deviceId)
}

const onTrackingStopped = (deviceId: string) => {
  userTrackingActive.value = false
  if (userLocationLayer.value) {
    map.value?.removeLayer(userLocationLayer.value)
    userLocationLayer.value = null
  }
  console.log('User tracking stopped for device:', deviceId)
}

const onLocationError = (error: string) => {
  console.error('Location tracking error:', error)
}

// Initialize user location layer
const initializeUserLocationLayer = () => {
  console.log('Attempting to initialize user location layer...')
  console.log('Map exists:', !!map.value, 'Layer already exists:', !!userLocationLayer.value)
  
  if (!map.value || userLocationLayer.value) {
    console.log('Skipping layer initialization - map missing or layer exists')
    return
  }
  
  console.log('Creating user location layer...')
  const source = new VectorSource()
  const layer = new VectorLayer({
    source: source,
    style: new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.8)' }), // Blue color
        stroke: new Stroke({ color: 'white', width: 3 })
      })
    }),
    zIndex: 1000 // High z-index to appear on top
  })
  
  userLocationLayer.value = layer
  map.value.addLayer(layer)
  console.log('User location layer initialized and added to map')
}

// Update user location on map
const updateUserLocationOnMap = (location: DeviceLocation) => {
  console.log('Updating user location on map:', location)
  console.log('Layer exists:', !!userLocationLayer.value, 'Location exists:', !!location)
  
  if (!userLocationLayer.value || !location) {
    console.log('Cannot update location - missing layer or location data')
    return
  }
  
  const source = userLocationLayer.value.getSource()
  if (!source) {
    console.log('Cannot update location - no vector source')
    return
  }
  
  console.log('Clearing existing features and adding new location...')
  // Clear existing features
  source.clear()
  
  // Create user location feature
  const coordinate = fromLonLat([location.longitude, location.latitude])
  console.log('User coordinate:', coordinate, 'from lat/lng:', location.latitude, location.longitude)
  
  const feature = new Feature({
    geometry: new Point(coordinate),
    type: 'user-location',
    deviceId: location.deviceId,
    userId: location.userId,
    accuracy: location.accuracy,
    timestamp: location.timestamp
  })
  
  // Create accuracy circle if accuracy is available
  if (location.accuracy && location.accuracy > 0) {
    console.log('Adding accuracy circle with radius:', location.accuracy)
    const accuracyFeature = new Feature({
      geometry: new Point(coordinate),
      type: 'user-location-accuracy'
    })
    
    accuracyFeature.setStyle(new Style({
      image: new Circle({
        radius: Math.max(location.accuracy / 10, 5), // Scale accuracy to reasonable size
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.1)' }),
        stroke: new Stroke({ color: 'rgba(59, 130, 246, 0.3)', width: 1 })
      })
    }))
    
    source.addFeature(accuracyFeature)
  }
  
  source.addFeature(feature)
  console.log('User location feature added to map. Total features in source:', source.getFeatures().length)
}

// Center map on user location
const centerMapOnUserLocation = () => {
  if (!userLocation.value || !map.value) return
  
  const view = map.value.getView()
  const coordinate = fromLonLat([userLocation.value.longitude, userLocation.value.latitude])
  
  view.animate({
    center: coordinate,
    zoom: 16,
    duration: 1000
  })
}

// Add route visualization to map
const addRouteToMap = (route: Route) => {
  if (!route.geometry || !Array.isArray(route.geometry)) {
    console.error('Route geometry is missing or invalid:', route)
    return
  }
  
  const routeCoords = route.geometry.map(coord => fromLonLat([coord[0], coord[1]]))
  
  const routeFeature = new Feature({
    geometry: new LineString(routeCoords),
    route
  })
  
  const getRouteColor = (status: string) => {
    switch (status) {
      case 'active': return '#3b82f6'
      case 'planned': return '#8b5cf6'
      case 'completed': return '#10b981'
      default: return '#6b7280'
    }
  }
  
  routeFeature.setStyle(new Style({
    stroke: new Stroke({
      color: getRouteColor(route.status),
      width: 4,
      lineDash: route.status === 'planned' ? [10, 5] : undefined
    })
  }))
  
  // Check if routes layer exists, create if not
  let routeLayer = map.value?.getLayers().getArray().find(l => l.get('name') === 'routes') as VectorLayer<VectorSource>
  
  if (!routeLayer) {
    const routeSource = new VectorSource()
    routeLayer = new VectorLayer({
      source: routeSource,
      properties: { name: 'routes' }
    })
    map.value?.addLayer(routeLayer)
  }
  
  routeLayer.getSource()?.addFeature(routeFeature)
}

// Remove route from map
const removeRouteFromMap = (routeId: string) => {
  const layers = map.value?.getLayers().getArray() || []
  const routeLayer = layers.find(l => l.get('name') === 'routes') as VectorLayer<VectorSource>
  
  if (routeLayer) {
    const source = routeLayer.getSource()
    const features = source?.getFeatures() || []
    
    const routeFeature = features.find(f => f.get('route')?.id === routeId)
    if (routeFeature) {
      source?.removeFeature(routeFeature)
    }
  }
}

// Search functionality
const onSearchInput = () => {
  if (searchQuery.value.trim() === '') {
    filteredSearchResults.value = []
    showSearchResults.value = false
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  filteredSearchResults.value = allSearchResults.value.filter(result => 
    result.name.toLowerCase().includes(query) ||
    result.description.toLowerCase().includes(query)
  ).slice(0, 10) // Limit to 10 results
  
  showSearchResults.value = true
}

const selectSearchResult = (result: SearchResult) => {
  // Center map on selected result
  const view = map.value?.getView()
  if (view) {
    view.animate({
      center: fromLonLat([result.longitude, result.latitude]),
      zoom: 12,
      duration: 1000
    })
  }
  
  // Close search results
  showSearchResults.value = false
  searchQuery.value = result.name
  
  // Ensure the layer is visible
  const layerName = getLayerNameFromType(result.type)
  if (!activeLayers.value.includes(layerName)) {
    toggleLayer(layerName)
  }
}

const getLayerNameFromType = (type: string): string => {
  switch (type) {
    case 'warehouse': return 'warehouses'
    case 'party': return 'parties'
    case 'vehicle': return 'vehicles'
    default: return 'warehouses'
  }
}

const getResultIcon = (type: string) => {
  switch (type) {
    case 'warehouse': return Warehouse
    case 'party': return Users
    case 'vehicle': return Truck
    default: return MapPin
  }
}

const getResultIconColor = (type: string): string => {
  switch (type) {
    case 'warehouse': return 'text-blue-500'
    case 'party': return 'text-green-500'
    case 'vehicle': return 'text-amber-500'
    default: return 'text-gray-500'
  }
}

// Close search results when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSearchResults.value = false
  }
}

onMounted(() => {
  initializeMap()
  setupWebSocketConnection()
  document.addEventListener('click', handleClickOutside)
})

// Cleanup event listener
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  
  // Limpiar intervalos de seguimiento de forma segura
  if (vehicleTrackingIntervals.value && typeof vehicleTrackingIntervals.value.forEach === 'function') {
    vehicleTrackingIntervals.value.forEach((interval) => clearInterval(interval))
    vehicleTrackingIntervals.value.clear()
  }
  
  // Desconectar WebSocket
  if (webSocketService && typeof webSocketService.disconnect === 'function') {
    webSocketService.disconnect()
  }
})

const toggleLayer = (layerName: string) => {
  const layers = map.value?.getLayers().getArray() || []
  const layer = layers.find(l => l.get('name') === layerName)
  
  if (layer) {
    const currentVisibility = layer.getVisible()
    layer.setVisible(!currentVisibility)
    
    if (!currentVisibility) {
      if (!activeLayers.value.includes(layerName)) {
        activeLayers.value.push(layerName)
      }
    } else {
      activeLayers.value = activeLayers.value.filter(l => l !== layerName)
    }
  }
  
  // Also handle routes layer if it's the special case
  if (layerName === 'routes') {
    const routeLayer = layers.find(l => l.get('name') === 'routes')
    if (routeLayer) {
      const isVisible = activeLayers.value.includes('routes')
      routeLayer.setVisible(isVisible)
    }
  }
}
</script>

<style>
/* Estilos específicos para OpenLayers */
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 200px;
}

.ol-popup:after, .ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}

.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

/* Controles del mapa */
.ol-control button {
  background-color: rgba(255,255,255,.4) !important;
  color: #666 !important;
  border: none !important;
}

.ol-control button:hover {
  background-color: rgba(255,255,255,.6) !important;
}

.ol-attribution {
  bottom: 0.5em !important;
  right: 0.5em !important;
  max-width: 50% !important;
}

.ol-attribution ul {
  font-size: 0.7rem !important;
}
</style>