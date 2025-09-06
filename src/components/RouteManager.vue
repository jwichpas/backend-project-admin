<template>
  <div class="space-y-4">
    <!-- Header del Route Manager -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Route class="h-5 w-5 text-blue-500" />
            <CardTitle>Gestión de Rutas</CardTitle>
            <Badge variant="outline" :class="isConnected ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'">
              {{ isConnected ? 'Conectado' : 'Desconectado' }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="createNewRoute">
              <Plus class="mr-2 h-4 w-4" />
              Nueva Ruta
            </Button>
            <Button variant="outline" size="sm" @click="createMultiStopRoute">
              <Users class="mr-2 h-4 w-4" />
              Multi-Parada
            </Button>
            <Button variant="outline" size="sm" @click="openFleetOptimizer">
              <Target class="mr-2 h-4 w-4" />
              Optimizar Flota
            </Button>
            <Button variant="outline" size="sm" @click="clearAllRoutes">
              <X class="mr-2 h-4 w-4" />
              Limpiar Todo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Form para crear nueva ruta -->
        <div v-if="showNewRouteForm" class="bg-muted/50 p-4 rounded-lg border-2 border-dashed border-border">
          <h4 class="font-medium mb-3">Crear Nueva Ruta</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Vehículo</label>
              <select 
                v-model="newRoute.vehicleId" 
                class="w-full p-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Seleccionar vehículo</option>
                <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">
                  {{ vehicle.brand }} {{ vehicle.model }} - {{ vehicle.plate }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Destino</label>
              <select 
                v-model="newRoute.destinationId" 
                class="w-full p-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Seleccionar destino</option>
                <option v-for="party in availableDestinations" :key="party.id" :value="party.id">
                  {{ party.razon_social }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Tipo de Ruta</label>
              <select 
                v-model="newRoute.routeType" 
                class="w-full p-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="fastest">Más Rápida</option>
                <option value="shortest">Más Corta</option>
                <option value="recommended">Recomendada</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button size="sm" @click="calculateAndCreateRoute" :disabled="!canCreateRoute">
              <Navigation class="mr-2 h-4 w-4" />
              Calcular Ruta
            </Button>
            <Button variant="outline" size="sm" @click="cancelNewRoute">
              Cancelar
            </Button>
          </div>
        </div>

        <!-- Lista de rutas activas -->
        <div class="space-y-3">
          <div v-if="activeRoutes.length === 0" class="text-center py-6 text-muted-foreground">
            <Route class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay rutas activas</p>
            <p class="text-sm">Crea una nueva ruta para comenzar</p>
          </div>
          
          <div 
            v-for="route in activeRoutes" 
            :key="route.id" 
            class="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 class="font-medium">{{ route.vehicleName }}</h4>
                  <p class="text-sm text-muted-foreground">→ {{ route.destinationName }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge 
                  :variant="getRouteStatusVariant(route.status)"
                  :class="getRouteStatusColor(route.status)"
                >
                  {{ getRouteStatusText(route.status) }}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  @click="centerOnRoute(route)"
                  class="p-2"
                >
                  <Eye class="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  @click="cancelRoute(route.id)"
                  class="p-2 text-red-600 hover:text-red-700"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- Barra de progreso -->
            <div class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span>Progreso</span>
                <span>{{ Math.round(route.progress) }}%</span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div 
                  class="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: `${route.progress}%` }"
                ></div>
              </div>
            </div>

            <!-- Métricas de la ruta -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-muted-foreground" />
                <div>
                  <p class="text-muted-foreground">ETA</p>
                  <p class="font-medium">{{ formatTime(route.estimatedArrival) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-muted-foreground" />
                <div>
                  <p class="text-muted-foreground">Distancia</p>
                  <p class="font-medium">{{ formatDistance(route.remainingDistance || route.distance) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Timer class="h-4 w-4 text-muted-foreground" />
                <div>
                  <p class="text-muted-foreground">Tiempo Rest.</p>
                  <p class="font-medium">{{ formatDuration(route.remainingTime || route.duration) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Gauge class="h-4 w-4 text-muted-foreground" />
                <div>
                  <p class="text-muted-foreground">Velocidad</p>
                  <p class="font-medium">{{ getCurrentSpeed(route.vehicleId) }} km/h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Alertas de Tráfico -->
    <Card v-if="trafficAlerts.length > 0">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-orange-500" />
          Alertas de Tráfico ({{ trafficAlerts.length }})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div
            v-for="alert in trafficAlerts"
            :key="alert.id"
            class="p-3 rounded-lg border"
            :class="{
              'border-red-200 bg-red-50': alert.severity === 'critical',
              'border-orange-200 bg-orange-50': alert.severity === 'high',
              'border-yellow-200 bg-yellow-50': alert.severity === 'medium',
              'border-blue-200 bg-blue-50': alert.severity === 'low'
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <Badge
                    :class="{
                      'bg-red-600 text-white': alert.severity === 'critical',
                      'bg-orange-600 text-white': alert.severity === 'high',
                      'bg-yellow-600 text-white': alert.severity === 'medium',
                      'bg-blue-600 text-white': alert.severity === 'low'
                    }"
                  >
                    {{ alert.type }}
                  </Badge>
                  <Badge variant="outline">
                    {{ alert.severity }}
                  </Badge>
                </div>
                <p class="text-sm font-medium text-gray-900">{{ alert.description }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  Radio afectado: {{ alert.affectedArea.radius }}m
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Notificaciones -->
    <div v-if="notifications.length > 0" class="space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
      >
        <div class="flex items-center gap-2">
          <Bell class="h-4 w-4 text-blue-600" />
          <span class="text-sm text-blue-800">{{ notification.message }}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="dismissNotification(notification.id)"
          class="p-1 h-auto text-blue-600"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Route, 
  Plus, 
  X, 
  Navigation, 
  Truck, 
  Eye, 
  Clock, 
  MapPin, 
  Timer, 
  Gauge,
  Bell,
  AlertTriangle,
  Users,
  Target
} from 'lucide-vue-next'
import routeService, { type Route as RouteType, type Coordinate, type MultiStopRoute, type TrafficAlert } from '@/services/RouteService'
import webSocketService, { type VehicleUpdate, type RouteUpdate } from '@/services/WebSocketService'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  latitude: number
  longitude: number
  speed_kph: number
  status: string
}

interface Destination {
  id: string
  razon_social: string
  latitude: number
  longitude: number
}

interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
}

interface NewRouteForm {
  vehicleId: string
  destinationId: string
  routeType: 'fastest' | 'shortest' | 'recommended'
}

interface MultiStopForm {
  vehicleId: string
  stops: Array<{
    name: string
    destinationId: string
    type: 'pickup' | 'delivery' | 'waypoint'
    serviceTime: number
    priority: number
  }>
}

interface FleetOptimizerForm {
  vehicleIds: string[]
  destinationIds: string[]
}

const props = defineProps<{
  vehicles: Vehicle[]
  destinations: Destination[]
  onRouteCreated: (route: RouteType) => void
  onRouteCancelled: (routeId: string) => void
  onCenterOnRoute: (route: RouteType) => void
}>()

const activeRoutes = ref<RouteType[]>([])
const multiStopRoutes = ref<MultiStopRoute[]>([])
const trafficAlerts = ref<TrafficAlert[]>([])
const showNewRouteForm = ref(false)
const showMultiStopForm = ref(false)
const showFleetOptimizer = ref(false)
const isConnected = ref(false)
const notifications = ref<Notification[]>([])
const vehicleUpdates = ref<Map<string, VehicleUpdate>>(new Map())

const newRoute = ref<NewRouteForm>({
  vehicleId: '',
  destinationId: '',
  routeType: 'fastest'
})

const multiStopForm = ref<MultiStopForm>({
  vehicleId: '',
  stops: []
})

const fleetOptimizerForm = ref<FleetOptimizerForm>({
  vehicleIds: [],
  destinationIds: []
})

const availableVehicles = computed(() => 
  props.vehicles.filter(v => !activeRoutes.value.some(r => r.vehicleId === v.id))
)

const availableDestinations = computed(() => props.destinations)

const canCreateRoute = computed(() => 
  newRoute.value.vehicleId && newRoute.value.destinationId
)

onMounted(() => {
  setupWebSocketListeners()
  loadTrafficAlerts()
})

onUnmounted(() => {
  webSocketService.disconnect()
})

const setupWebSocketListeners = () => {
  webSocketService.on('connected', () => {
    isConnected.value = true
    addNotification('Conectado al servidor de tiempo real', 'success')
  })

  webSocketService.on('disconnected', () => {
    isConnected.value = false
    addNotification('Desconectado del servidor', 'warning')
  })

  webSocketService.on('vehicleUpdate', (update: VehicleUpdate) => {
    vehicleUpdates.value.set(update.vehicleId, update)
    updateRouteVehiclePosition(update)
  })

  webSocketService.on('routeUpdate', (update: RouteUpdate) => {
    updateRouteProgress(update)
  })

  webSocketService.on('routeCompleted', (data: { routeId: string; vehicleId: string }) => {
    completeRoute(data.routeId)
    addNotification(`Ruta completada para vehículo ${data.vehicleId}`, 'success')
  })

  webSocketService.on('routeDeviation', (data: { routeId: string; vehicleId: string; deviation: number }) => {
    addNotification(`Desviación detectada en ruta (${data.deviation}m)`, 'warning')
  })
}

const createNewRoute = () => {
  showNewRouteForm.value = true
}

const cancelNewRoute = () => {
  showNewRouteForm.value = false
  newRoute.value = {
    vehicleId: '',
    destinationId: '',
    routeType: 'fastest'
  }
}

const calculateAndCreateRoute = async () => {
  try {
    const vehicle = props.vehicles.find(v => v.id === newRoute.value.vehicleId)
    const destination = props.destinations.find(d => d.id === newRoute.value.destinationId)
    
    if (!vehicle || !destination) {
      addNotification('Error: Vehículo o destino no encontrado', 'error')
      return
    }

    const startCoord: Coordinate = { latitude: vehicle.latitude, longitude: vehicle.longitude }
    const endCoord: Coordinate = { latitude: destination.latitude, longitude: destination.longitude }

    addNotification('Calculando ruta...', 'info')

    const routeResponse = await routeService.calculateRoute(startCoord, endCoord, {
      profile: 'driving-car',
      preference: newRoute.value.routeType === 'fastest' ? 'fastest' : 
                 newRoute.value.routeType === 'shortest' ? 'shortest' : 'recommended'
    })

    if (!routeResponse.routes?.[0]?.geometry?.coordinates) {
      addNotification('Error: No se pudo obtener la geometría de la ruta', 'error')
      return
    }

    const route: RouteType = {
      id: `route-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
      destinationId: destination.id,
      destinationName: destination.razon_social,
      startCoordinate: startCoord,
      endCoordinate: endCoord,
      geometry: routeResponse.routes[0].geometry.coordinates,
      distance: routeResponse.routes[0].summary.distance,
      duration: routeResponse.routes[0].summary.duration,
      estimatedArrival: routeService.calculateETA(
        routeResponse.routes[0].summary.distance, 
        vehicle.speed_kph || 40
      ),
      status: 'planned',
      progress: 0,
      currentPosition: startCoord,
      remainingDistance: routeResponse.routes[0].summary.distance,
      remainingTime: routeResponse.routes[0].summary.duration,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    activeRoutes.value.push(route)
    props.onRouteCreated(route)
    
    // Suscribirse a actualizaciones de este vehículo y ruta
    webSocketService.subscribeToVehicle(vehicle.id)
    webSocketService.subscribeToRoute(route.id)

    cancelNewRoute()
    addNotification('Ruta creada exitosamente', 'success')

  } catch (error) {
    console.error('Error creating route:', error)
    addNotification('Error al calcular la ruta', 'error')
  }
}

const cancelRoute = (routeId: string) => {
  const routeIndex = activeRoutes.value.findIndex(r => r.id === routeId)
  if (routeIndex > -1) {
    const route = activeRoutes.value[routeIndex]
    
    // Desuscribirse de actualizaciones
    webSocketService.unsubscribeFromVehicle(route.vehicleId)
    webSocketService.unsubscribeFromRoute(routeId)
    
    activeRoutes.value.splice(routeIndex, 1)
    props.onRouteCancelled(routeId)
    addNotification('Ruta cancelada', 'info')
  }
}

const clearAllRoutes = () => {
  activeRoutes.value.forEach(route => {
    webSocketService.unsubscribeFromVehicle(route.vehicleId)
    webSocketService.unsubscribeFromRoute(route.id)
    props.onRouteCancelled(route.id)
  })
  
  activeRoutes.value = []
  addNotification('Todas las rutas eliminadas', 'info')
}

const centerOnRoute = (route: RouteType) => {
  props.onCenterOnRoute(route)
}

const updateRouteVehiclePosition = (update: VehicleUpdate) => {
  const route = activeRoutes.value.find(r => r.vehicleId === update.vehicleId)
  if (route && route.status === 'active') {
    route.currentPosition = { latitude: update.latitude, longitude: update.longitude }
    route.updatedAt = new Date()
    
    // Calcular progreso basado en la posición actual (simplificado)
    const totalDistance = route.distance
    const distanceFromStart = routeService['calculateDistance'](
      route.startCoordinate,
      route.currentPosition
    )
    
    route.progress = Math.min((distanceFromStart / totalDistance) * 100, 100)
    
    // Actualizar tiempo estimado
    if (update.speed_kph > 0) {
      route.remainingDistance = Math.max(0, totalDistance - distanceFromStart)
      route.estimatedArrival = routeService.calculateETA(route.remainingDistance, update.speed_kph)
      route.remainingTime = (route.remainingDistance / 1000) / update.speed_kph * 3600
    }
  }
}

const updateRouteProgress = (update: RouteUpdate) => {
  const route = activeRoutes.value.find(r => r.id === update.routeId)
  if (route) {
    route.progress = update.progress
    route.currentPosition = update.currentPosition
    route.remainingDistance = update.remainingDistance
    route.remainingTime = update.remainingTime
    route.estimatedArrival = new Date(update.estimatedArrival)
    route.status = update.status
    route.updatedAt = new Date()
  }
}

const completeRoute = (routeId: string) => {
  const route = activeRoutes.value.find(r => r.id === routeId)
  if (route) {
    route.status = 'completed'
    route.progress = 100
    route.remainingDistance = 0
    route.remainingTime = 0
    route.updatedAt = new Date()
    
    // Remover la ruta después de 30 segundos
    setTimeout(() => {
      cancelRoute(routeId)
    }, 30000)
  }
}

const getCurrentSpeed = (vehicleId: string): number => {
  const update = vehicleUpdates.value.get(vehicleId)
  return update ? Math.round(update.speed_kph) : 0
}

const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const notification: Notification = {
    id: `notif-${Date.now()}`,
    message,
    type,
    timestamp: new Date()
  }
  
  notifications.value.unshift(notification)
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    dismissNotification(notification.id)
  }, 5000)
  
  // Limitar a 5 notificaciones
  if (notifications.value.length > 5) {
    notifications.value = notifications.value.slice(0, 5)
  }
}

const dismissNotification = (notificationId: string) => {
  const index = notifications.value.findIndex(n => n.id === notificationId)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const getRouteStatusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default'
    case 'planned': return 'outline'
    case 'completed': return 'success'
    case 'cancelled': return 'destructive'
    default: return 'outline'
  }
}

const getRouteStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-blue-700 bg-blue-100 border-blue-300'
    case 'planned': return 'text-gray-700 bg-gray-100 border-gray-300'
    case 'completed': return 'text-green-700 bg-green-100 border-green-300'
    case 'cancelled': return 'text-red-700 bg-red-100 border-red-300'
    default: return 'text-gray-700 bg-gray-100 border-gray-300'
  }
}

const getRouteStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'En Ruta'
    case 'planned': return 'Planificada'
    case 'completed': return 'Completada'
    case 'cancelled': return 'Cancelada'
    default: return 'Desconocido'
  }
}

const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const formatDistance = (meters: number) => {
  return routeService.formatDistance(meters)
}

const formatDuration = (seconds: number) => {
  return routeService.formatDuration(seconds)
}

// Multi-stop route functions
const createMultiStopRoute = () => {
  showMultiStopForm.value = true
}

const addStop = () => {
  multiStopForm.value.stops.push({
    name: '',
    destinationId: '',
    type: 'delivery',
    serviceTime: 300,
    priority: 1
  })
}

const removeStop = (index: number) => {
  multiStopForm.value.stops.splice(index, 1)
}

const cancelMultiStopRoute = () => {
  showMultiStopForm.value = false
  multiStopForm.value = {
    vehicleId: '',
    stops: []
  }
}

const createMultiStopRouteFromForm = async () => {
  try {
    if (!multiStopForm.value.vehicleId || multiStopForm.value.stops.length < 2) {
      addNotification('Se requiere un vehículo y al menos 2 paradas', 'error')
      return
    }

    const vehicle = props.vehicles.find(v => v.id === multiStopForm.value.vehicleId)
    if (!vehicle) {
      addNotification('Vehículo no encontrado', 'error')
      return
    }

    const stops = multiStopForm.value.stops.map(stop => {
      const destination = props.destinations.find(d => d.id === stop.destinationId)
      return {
        coordinate: { latitude: destination!.latitude, longitude: destination!.longitude },
        name: stop.name || destination!.razon_social,
        type: stop.type,
        serviceTime: stop.serviceTime,
        priority: stop.priority
      }
    })

    // Agregar ubicación actual del vehículo como primer punto
    stops.unshift({
      coordinate: { latitude: vehicle.latitude, longitude: vehicle.longitude },
      name: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
      type: 'waypoint',
      serviceTime: 0,
      priority: 0
    })

    addNotification('Creando ruta multi-parada...', 'info')
    const route = await routeService.createMultiStopRoute(vehicle.id, stops)
    multiStopRoutes.value.push(route)
    
    addNotification('Ruta multi-parada creada exitosamente', 'success')
    cancelMultiStopRoute()
  } catch (error) {
    console.error('Error creating multi-stop route:', error)
    addNotification('Error al crear la ruta multi-parada', 'error')
  }
}

// Fleet optimization functions
const openFleetOptimizer = () => {
  showFleetOptimizer.value = true
}

const cancelFleetOptimization = () => {
  showFleetOptimizer.value = false
  fleetOptimizerForm.value = {
    vehicleIds: [],
    destinationIds: []
  }
}

const optimizeFleetRoutes = async () => {
  try {
    if (fleetOptimizerForm.value.vehicleIds.length === 0 || fleetOptimizerForm.value.destinationIds.length === 0) {
      addNotification('Seleccione vehículos y destinos para optimizar', 'error')
      return
    }

    const vehicles = fleetOptimizerForm.value.vehicleIds.map(id => {
      const vehicle = props.vehicles.find(v => v.id === id)
      return {
        id: vehicle!.id,
        location: { latitude: vehicle!.latitude, longitude: vehicle!.longitude },
        capacity: 1000 // Capacidad por defecto
      }
    })

    const destinations = fleetOptimizerForm.value.destinationIds.map((id, index) => {
      const destination = props.destinations.find(d => d.id === id)
      return {
        coordinate: { latitude: destination!.latitude, longitude: destination!.longitude },
        demand: 100, // Demanda por defecto
        priority: index + 1
      }
    })

    addNotification('Optimizando rutas de flota...', 'info')
    const optimizedRoutes = await routeService.optimizeFleetRoutes(vehicles, destinations)
    
    // Agregar las rutas optimizadas a la lista de multi-stop routes
    optimizedRoutes.forEach(result => {
      multiStopRoutes.value.push(result.route)
    })

    addNotification(`${optimizedRoutes.length} rutas optimizadas creadas`, 'success')
    cancelFleetOptimization()
  } catch (error) {
    console.error('Error optimizing fleet routes:', error)
    addNotification('Error al optimizar las rutas de flota', 'error')
  }
}

const loadTrafficAlerts = async () => {
  try {
    trafficAlerts.value = routeService.getActiveTrafficAlerts()
  } catch (error) {
    console.error('Error loading traffic alerts:', error)
  }
}
</script>