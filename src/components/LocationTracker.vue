<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <MapPin class="h-5 w-5 text-blue-500" />
          <CardTitle>Tracking de Ubicación</CardTitle>
          <Badge 
            variant="outline" 
            :class="trackingStatusClass"
          >
            {{ trackingStatusText }}
          </Badge>
        </div>
        <div class="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            @click="toggleTracking"
            :disabled="isLoading || !isSupported"
          >
            <component :is="trackingButtonIcon" class="mr-2 h-4 w-4" />
            {{ trackingButtonText }}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            @click="showSettings = !showSettings"
          >
            <Settings class="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            @click="isMinimized = !isMinimized"
            class="ml-2"
          >
            <component :is="isMinimized ? ChevronDown : ChevronUp" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent v-if="!isMinimized">
      <!-- Información del estado actual -->
      <div class="space-y-4">
        <!-- Estado de permisos -->
        <div v-if="!permissions.granted" class="p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <div class="flex items-start gap-3">
            <AlertTriangle class="h-5 w-5 text-orange-600 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-medium text-orange-900">Permisos de Ubicación Requeridos</h4>
              <p class="text-sm text-orange-700 mt-1">
                Para usar el tracking de ubicación, necesitamos acceso a tu ubicación.
              </p>
              <Button 
                size="sm" 
                class="mt-2"
                @click="requestLocationPermissions"
                :disabled="isLoading"
              >
                <Shield class="mr-2 h-4 w-4" />
                Conceder Permisos
              </Button>
            </div>
          </div>
        </div>

        <!-- Información de ubicación actual -->
        <div v-if="hasValidLocation" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-700">Ubicación Actual</label>
              <p class="text-sm text-gray-900 font-mono">
                {{ formatCoordinates() }}
              </p>
            </div>
            
            <div v-if="locationAccuracy">
              <label class="text-sm font-medium text-gray-700">Precisión</label>
              <div class="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  :class="accuracyBadgeClass"
                >
                  {{ getAccuracyText() }}
                </Badge>
                <span class="text-sm text-gray-600">
                  (±{{ Math.round(locationAccuracy) }}m)
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div v-if="currentLocation?.speed">
              <label class="text-sm font-medium text-gray-700">Velocidad</label>
              <p class="text-sm text-gray-900">
                {{ Math.round((currentLocation.speed || 0) * 3.6) }} km/h
              </p>
            </div>
            
            <div v-if="locationAge">
              <label class="text-sm font-medium text-gray-700">Última Actualización</label>
              <p class="text-sm text-gray-600">
                {{ formatLocationAge(locationAge) }}
              </p>
            </div>
            
            <div v-if="currentLocation?.batteryLevel">
              <label class="text-sm font-medium text-gray-700">Batería</label>
              <p class="text-sm text-gray-900">
                {{ currentLocation.batteryLevel }}%
              </p>
            </div>
          </div>
        </div>

        <!-- Información del dispositivo -->
        <div class="border-t pt-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label class="font-medium text-gray-700">Dispositivo</label>
              <p class="text-gray-600">{{ deviceInfo.deviceId }}</p>
            </div>
            <div>
              <label class="font-medium text-gray-700">Plataforma</label>
              <p class="text-gray-600">{{ deviceInfo.platform }}</p>
            </div>
            <div>
              <label class="font-medium text-gray-700">Conexión</label>
              <div class="flex items-center gap-1">
                <div 
                  class="w-2 h-2 rounded-full"
                  :class="deviceInfo.onLine ? 'bg-green-500' : 'bg-red-500'"
                ></div>
                <span class="text-gray-600">
                  {{ deviceInfo.onLine ? 'En línea' : 'Sin conexión' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de configuraciones -->
        <div v-if="showSettings" class="border-t pt-4 space-y-4">
          <h4 class="font-medium text-gray-900">Configuraciones de Tracking</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700">Intervalo de Tracking</label>
              <select 
                v-model="localTrackingInterval"
                @change="updateTrackingInterval"
                class="mt-1 block w-full rounded-md border-gray-300 text-sm"
              >
                <option :value="5000">5 segundos</option>
                <option :value="10000">10 segundos</option>
                <option :value="30000">30 segundos</option>
                <option :value="60000">1 minuto</option>
                <option :value="300000">5 minutos</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Alta Precisión</label>
              <input 
                type="checkbox" 
                v-model="highAccuracyEnabled"
                @change="updateHighAccuracy"
                class="rounded border-gray-300"
              >
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              @click="refreshLocation"
              :disabled="isLoading"
            >
              <RotateCw class="mr-2 h-4 w-4" />
              Actualizar Ubicación
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              @click="showDeviceInfo = !showDeviceInfo"
            >
              <Info class="mr-2 h-4 w-4" />
              Info del Dispositivo
            </Button>
          </div>
        </div>

        <!-- Información detallada del dispositivo -->
        <div v-if="showDeviceInfo" class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-3">Información del Dispositivo</h4>
          <div class="bg-gray-50 p-3 rounded-lg">
            <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(deviceInfo, null, 2) }}</pre>
          </div>
        </div>

        <!-- Mensajes de error -->
        <div v-if="error" class="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div class="flex items-start gap-3">
            <AlertCircle class="h-5 w-5 text-red-600 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-medium text-red-900">Error de Geolocalización</h4>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              @click="error = null"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Estado sin soporte -->
        <div v-if="!isSupported" class="p-4 border border-gray-200 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-3">
            <AlertTriangle class="h-5 w-5 text-gray-600" />
            <div>
              <h4 class="font-medium text-gray-900">Geolocalización no disponible</h4>
              <p class="text-sm text-gray-600">
                Tu dispositivo o navegador no soporta geolocalización.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocation } from '@/composables/useLocation'
import { 
  MapPin, 
  Play, 
  Pause, 
  Settings, 
  AlertTriangle, 
  Shield, 
  AlertCircle,
  X,
  RotateCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

// Props
const props = defineProps<{
  autoStart?: boolean
  showInMap?: boolean
}>()

// Emits
const emit = defineEmits<{
  locationUpdate: [location: any]
  trackingStarted: [deviceId: string]
  trackingStopped: [deviceId: string]
  error: [error: string]
}>()

// Composable de ubicación
const {
  currentLocation,
  isTracking,
  isLoading,
  error,
  permissions,
  isSupported,
  hasValidLocation,
  locationAge,
  locationAccuracy,
  isHighAccuracy,
  trackingOptions,
  requestPermissions,
  getCurrentLocation,
  startTracking,
  stopTracking,
  refresh,
  formatCoordinates,
  getAccuracyText,
  getDeviceInfo,
  updateOptions
} = useLocation()

// Estado local del componente
const showSettings = ref(false)
const showDeviceInfo = ref(false)
const isMinimized = ref(false)
const localTrackingInterval = ref(trackingOptions.value.trackingInterval || 5000)
const highAccuracyEnabled = ref(trackingOptions.value.enableHighAccuracy ?? true)

// Computed properties
const trackingStatusClass = computed(() => {
  if (!isSupported.value) return 'text-gray-600 border-gray-600'
  if (isTracking.value) return 'text-green-600 border-green-600'
  if (permissions.value.granted) return 'text-blue-600 border-blue-600'
  return 'text-orange-600 border-orange-600'
})

const trackingStatusText = computed(() => {
  if (!isSupported.value) return 'No soportado'
  if (isTracking.value) return 'Tracking activo'
  if (permissions.value.granted) return 'Permisos concedidos'
  if (permissions.value.denied) return 'Permisos denegados'
  return 'Permisos pendientes'
})

const trackingButtonIcon = computed(() => {
  return isTracking.value ? Pause : Play
})

const trackingButtonText = computed(() => {
  if (isLoading.value) return 'Cargando...'
  return isTracking.value ? 'Detener Tracking' : 'Iniciar Tracking'
})

const accuracyBadgeClass = computed(() => {
  if (!locationAccuracy.value) return 'border-gray-300 text-gray-600'
  if (isHighAccuracy.value) return 'border-green-300 text-green-700 bg-green-50'
  if (locationAccuracy.value < 100) return 'border-yellow-300 text-yellow-700 bg-yellow-50'
  return 'border-red-300 text-red-700 bg-red-50'
})

const deviceInfo = computed(() => getDeviceInfo())

// Métodos
const requestLocationPermissions = async () => {
  try {
    const granted = await requestPermissions()
    if (granted && props.autoStart) {
      await startTracking()
    }
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error solicitando permisos')
  }
}

const toggleTracking = async () => {
  try {
    if (isTracking.value) {
      stopTracking()
      emit('trackingStopped', deviceInfo.value.deviceId)
    } else {
      const started = await startTracking()
      if (started) {
        emit('trackingStarted', deviceInfo.value.deviceId)
      }
    }
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error cambiando estado de tracking')
  }
}

const refreshLocation = async () => {
  try {
    await refresh()
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error actualizando ubicación')
  }
}

const updateTrackingInterval = () => {
  updateOptions({ trackingInterval: localTrackingInterval.value })
}

const updateHighAccuracy = () => {
  updateOptions({ enableHighAccuracy: highAccuracyEnabled.value })
}

const formatLocationAge = (age: number): string => {
  if (age < 60000) return `${Math.round(age / 1000)}s atrás`
  if (age < 3600000) return `${Math.round(age / 60000)}min atrás`
  return `${Math.round(age / 3600000)}h atrás`
}

// Watchers
watch(currentLocation, (newLocation) => {
  if (newLocation) {
    emit('locationUpdate', newLocation)
  }
}, { deep: true })

watch(error, (newError) => {
  if (newError) {
    emit('error', newError)
  }
})

// Auto-start si está configurado y hay permisos
watch(permissions, async (newPermissions) => {
  if (newPermissions.granted && props.autoStart && !isTracking.value) {
    await startTracking()
  }
}, { immediate: true })
</script>

<style scoped>
/* Animaciones para los badges de estado */
.tracking-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>