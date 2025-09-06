import { ref, computed, onMounted, onUnmounted, watch, readonly } from 'vue'
import locationService, { type DeviceLocation, type LocationPermissionStatus, type LocationOptions } from '@/services/LocationService'

export function useLocation(options?: LocationOptions) {
  // Estado reactivo
  const currentLocation = ref<DeviceLocation | null>(null)
  const isTracking = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const permissions = ref<LocationPermissionStatus>({ granted: false, denied: false, prompt: true })
  const isSupported = ref(false)

  // Configuración
  const trackingOptions = ref<LocationOptions>({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    trackingInterval: 5000,
    ...options
  })

  // Computed properties
  const hasValidLocation = computed(() => {
    return currentLocation.value !== null && 
           currentLocation.value.latitude !== 0 && 
           currentLocation.value.longitude !== 0
  })

  const locationAge = computed(() => {
    if (!currentLocation.value) return null
    return Date.now() - currentLocation.value.timestamp.getTime()
  })

  const isLocationFresh = computed(() => {
    if (!locationAge.value) return false
    return locationAge.value < (trackingOptions.value.maximumAge || 60000)
  })

  const locationAccuracy = computed(() => {
    return currentLocation.value?.accuracy || null
  })

  const isHighAccuracy = computed(() => {
    return (locationAccuracy.value && locationAccuracy.value < 20) || false
  })

  // ID único para este composable
  const subscriberId = `composable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  /**
   * Inicializa el servicio de ubicación
   */
  const initialize = async () => {
    try {
      isSupported.value = locationService.isGeolocationSupported()
      
      if (!isSupported.value) {
        error.value = 'La geolocalización no está soportada en este dispositivo'
        return
      }

      // Verificar permisos
      permissions.value = await locationService.checkPermissions()
      
      // Obtener ubicación actual si hay permisos
      if (permissions.value.granted) {
        await getCurrentLocation()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error inicializando geolocalización'
      console.error('Error initializing location service:', err)
    }
  }

  /**
   * Solicita permisos de ubicación
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null
      
      permissions.value = await locationService.requestPermissions()
      
      if (permissions.value.granted) {
        await getCurrentLocation()
        return true
      } else {
        error.value = permissions.value.error || 'Permisos de ubicación denegados'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error solicitando permisos'
      console.error('Error requesting permissions:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Obtiene la ubicación actual
   */
  const getCurrentLocation = async (): Promise<DeviceLocation | null> => {
    try {
      isLoading.value = true
      error.value = null
      
      const location = await locationService.getCurrentLocation(trackingOptions.value)
      currentLocation.value = location
      return location
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error obteniendo ubicación'
      console.error('Error getting current location:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Inicia el tracking continuo
   */
  const startTracking = async (): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null
      
      // Verificar permisos primero
      if (!permissions.value.granted) {
        const granted = await requestPermissions()
        if (!granted) return false
      }
      
      // Suscribirse a actualizaciones
      locationService.subscribe(subscriberId, handleLocationUpdate, trackingOptions.value)
      
      // Iniciar tracking
      const started = await locationService.startTracking(trackingOptions.value)
      isTracking.value = started
      
      return started
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error iniciando tracking'
      console.error('Error starting tracking:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Detiene el tracking
   */
  const stopTracking = (): void => {
    locationService.stopTracking()
    locationService.unsubscribe(subscriberId)
    isTracking.value = false
  }

  /**
   * Maneja las actualizaciones de ubicación
   */
  const handleLocationUpdate = (location: DeviceLocation) => {
    currentLocation.value = location
    error.value = null
  }

  /**
   * Calcula la distancia a un punto
   */
  const distanceTo = (latitude: number, longitude: number): number | null => {
    if (!hasValidLocation.value) return null
    
    return locationService.calculateDistance(
      currentLocation.value!.latitude,
      currentLocation.value!.longitude,
      latitude,
      longitude
    )
  }

  /**
   * Verifica si está dentro de un radio
   */
  const isWithinRadius = (latitude: number, longitude: number, radiusMeters: number): boolean => {
    const distance = distanceTo(latitude, longitude)
    return distance !== null && distance <= radiusMeters
  }

  /**
   * Formatea las coordenadas
   */
  const formatCoordinates = (decimals: number = 6): string => {
    if (!hasValidLocation.value) return 'No disponible'
    
    const lat = currentLocation.value!.latitude.toFixed(decimals)
    const lng = currentLocation.value!.longitude.toFixed(decimals)
    return `${lat}, ${lng}`
  }

  /**
   * Obtiene la precisión de la ubicación en texto
   */
  const getAccuracyText = (): string => {
    if (!locationAccuracy.value) return 'Desconocida'
    
    const accuracy = locationAccuracy.value
    if (accuracy < 5) return 'Muy alta'
    if (accuracy < 20) return 'Alta'
    if (accuracy < 100) return 'Media'
    return 'Baja'
  }

  /**
   * Actualiza las opciones de tracking
   */
  const updateOptions = (newOptions: Partial<LocationOptions>) => {
    trackingOptions.value = { ...trackingOptions.value, ...newOptions }
  }

  /**
   * Refresca la ubicación actual
   */
  const refresh = async (): Promise<boolean> => {
    if (!permissions.value.granted) {
      const granted = await requestPermissions()
      if (!granted) return false
    }
    
    const location = await getCurrentLocation()
    return location !== null
  }

  /**
   * Obtiene información del dispositivo
   */
  const getDeviceInfo = () => {
    return locationService.getDeviceInfo()
  }

  // Watchers
  watch(
    () => trackingOptions.value.trackingInterval,
    (newInterval) => {
      if (isTracking.value && newInterval) {
        // Reiniciar tracking con nuevo intervalo
        stopTracking()
        setTimeout(() => startTracking(), 100)
      }
    }
  )

  // Lifecycle hooks
  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    stopTracking()
  })

  return {
    // Estado
    currentLocation: readonly(currentLocation),
    isTracking: readonly(isTracking),
    isLoading: readonly(isLoading),
    error: readonly(error),
    permissions: readonly(permissions),
    isSupported: readonly(isSupported),
    
    // Computed
    hasValidLocation,
    locationAge,
    isLocationFresh,
    locationAccuracy,
    isHighAccuracy,
    
    // Configuración
    trackingOptions,
    updateOptions,
    
    // Métodos
    initialize,
    requestPermissions,
    getCurrentLocation,
    startTracking,
    stopTracking,
    refresh,
    
    // Utilidades
    distanceTo,
    isWithinRadius,
    formatCoordinates,
    getAccuracyText,
    getDeviceInfo
  }
}