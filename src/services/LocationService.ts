export interface DeviceLocation {
  id: string
  userId: string
  deviceId: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: Date
  source: 'GPS' | 'NETWORK' | 'MANUAL'
  batteryLevel?: number
  isOnline: boolean
}

export interface LocationPermissionStatus {
  granted: boolean
  denied: boolean
  prompt: boolean
  error?: string
}

export interface LocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  trackingInterval?: number
}

export interface LocationSubscriber {
  id: string
  callback: (location: DeviceLocation) => void
  options?: LocationOptions
}

class LocationService {
  private watchId: number | null = null
  private isTracking: boolean = false
  private currentLocation: DeviceLocation | null = null
  private subscribers: Map<string, LocationSubscriber> = new Map()
  private trackingInterval: number = 5000 // 5 segundos por defecto
  private lastLocationTime: number = 0
  private deviceId: string
  private userId: string | null = null

  constructor() {
    this.deviceId = this.generateDeviceId()
    this.initializeService()
  }

  /**
   * Genera un ID único para el dispositivo
   */
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  /**
   * Inicializa el servicio de ubicación
   */
  private async initializeService(): Promise<void> {
    // Cargar ID de usuario si está disponible
    this.loadUserId()
    
    // Verificar soporte de geolocalización
    if (!this.isGeolocationSupported()) {
      console.warn('Geolocation is not supported by this browser')
      return
    }

    // Verificar permisos
    const permission = await this.checkPermissions()
    if (permission.granted) {
      console.log('Location permissions granted')
    }

    // Cargar última ubicación conocida
    this.loadLastKnownLocation()
  }

  /**
   * Verifica si la API de geolocalización está soportada
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator
  }

  /**
   * Verifica el estado de los permisos de ubicación
   */
  async checkPermissions(): Promise<LocationPermissionStatus> {
    if (!this.isGeolocationSupported()) {
      return { granted: false, denied: true, prompt: false, error: 'Geolocation not supported' }
    }

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        return {
          granted: permission.state === 'granted',
          denied: permission.state === 'denied',
          prompt: permission.state === 'prompt'
        }
      }
      
      // Fallback para navegadores que no soportan permissions API
      return { granted: false, denied: false, prompt: true }
    } catch (error) {
      console.error('Error checking location permissions:', error)
      return { granted: false, denied: false, prompt: true, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Solicita permisos de ubicación al usuario
   */
  async requestPermissions(): Promise<LocationPermissionStatus> {
    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            resolve({ granted: true, denied: false, prompt: false })
          },
          (error) => {
            const status: LocationPermissionStatus = {
              granted: false,
              denied: error.code === error.PERMISSION_DENIED,
              prompt: false,
              error: error.message
            }
            resolve(status)
          },
          { timeout: 5000 }
        )
      })
    } catch (error) {
      return {
        granted: false,
        denied: true,
        prompt: false,
        error: error instanceof Error ? error.message : 'Permission request failed'
      }
    }
  }

  /**
   * Obtiene la ubicación actual del dispositivo
   */
  async getCurrentLocation(options?: LocationOptions): Promise<DeviceLocation> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = this.createLocationFromPosition(position)
          this.currentLocation = location
          this.saveLastKnownLocation(location)
          resolve(location)
        },
        (error) => {
          console.error('Error getting current location:', error)
          reject(new Error(`Location error: ${error.message}`))
        },
        defaultOptions
      )
    })
  }

  /**
   * Inicia el tracking continuo de ubicación
   */
  async startTracking(options?: LocationOptions): Promise<boolean> {
    if (this.isTracking) {
      console.log('Location tracking is already active')
      return true
    }

    if (!this.isGeolocationSupported()) {
      throw new Error('Geolocation is not supported')
    }

    const permission = await this.checkPermissions()
    if (!permission.granted) {
      const requestResult = await this.requestPermissions()
      if (!requestResult.granted) {
        throw new Error('Location permission denied')
      }
    }

    const trackingOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 0
    }

    this.trackingInterval = options?.trackingInterval ?? 5000

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdate(position)
          if (!this.isTracking) {
            this.isTracking = true
            resolve(true)
          }
        },
        (error) => {
          console.error('Location tracking error:', error)
          this.isTracking = false
          reject(new Error(`Tracking error: ${error.message}`))
        },
        trackingOptions
      )
    })
  }

  /**
   * Detiene el tracking de ubicación
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.isTracking = false
    console.log('Location tracking stopped')
  }

  /**
   * Maneja las actualizaciones de ubicación
   */
  private handleLocationUpdate(position: GeolocationPosition): void {
    const now = Date.now()
    
    // Evitar actualizaciones muy frecuentes
    if (now - this.lastLocationTime < this.trackingInterval) {
      return
    }

    const location = this.createLocationFromPosition(position)
    this.currentLocation = location
    this.lastLocationTime = now
    
    // Guardar en localStorage
    this.saveLastKnownLocation(location)
    
    // Notificar a los subscribers
    this.notifySubscribers(location)
    
    // Enviar al servidor (si está configurado)
    this.sendLocationToServer(location)
  }

  /**
   * Crea un objeto DeviceLocation desde GeolocationPosition
   */
  private createLocationFromPosition(position: GeolocationPosition): DeviceLocation {
    return {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId || 'anonymous',
      deviceId: this.deviceId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: new Date(position.timestamp),
      source: 'GPS',
      batteryLevel: this.getBatteryLevel(),
      isOnline: navigator.onLine
    }
  }

  /**
   * Obtiene el nivel de batería si está disponible
   */
  private getBatteryLevel(): number | undefined {
    // @ts-ignore - Battery API might not be available in all browsers
    if ('getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then((battery) => {
        return Math.round(battery.level * 100)
      }).catch(() => undefined)
    }
    return undefined
  }

  /**
   * Suscribe a actualizaciones de ubicación
   */
  subscribe(id: string, callback: (location: DeviceLocation) => void, options?: LocationOptions): void {
    this.subscribers.set(id, { id, callback, options })
    
    // Si ya tenemos una ubicación, notificar inmediatamente
    if (this.currentLocation) {
      callback(this.currentLocation)
    }
  }

  /**
   * Desuscribe de actualizaciones de ubicación
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id)
  }

  /**
   * Notifica a todos los subscribers
   */
  private notifySubscribers(location: DeviceLocation): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber.callback(location)
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriber.id}:`, error)
      }
    })
  }

  /**
   * Envía la ubicación al servidor
   */
  private async sendLocationToServer(location: DeviceLocation): Promise<void> {
    try {
      // Enviar vía WebSocket si está disponible
      const { webSocketService } = await import('@/services/WebSocketService')
      
      if (webSocketService && webSocketService.connected) {
        const deviceLocationUpdate = {
          deviceId: location.deviceId,
          userId: location.userId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp.toISOString(),
          source: location.source,
          batteryLevel: location.batteryLevel,
          isOnline: location.isOnline
        }
        
        webSocketService.sendDeviceLocation(deviceLocationUpdate)
        console.log('Location sent via WebSocket:', deviceLocationUpdate)
      } else {
        // Fallback a HTTP POST si WebSocket no está conectado
        // await fetch('/api/device-locations', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(location)
        // })
        console.log('WebSocket not connected, location not sent:', location)
      }
    } catch (error) {
      console.error('Error sending location to server:', error)
    }
  }

  /**
   * Carga el ID de usuario
   */
  private loadUserId(): void {
    this.userId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id')
  }

  /**
   * Establece el ID de usuario
   */
  setUserId(userId: string): void {
    this.userId = userId
    localStorage.setItem('user_id', userId)
  }

  /**
   * Guarda la última ubicación conocida
   */
  private saveLastKnownLocation(location: DeviceLocation): void {
    try {
      localStorage.setItem('last_known_location', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        accuracy: location.accuracy
      }))
    } catch (error) {
      console.error('Error saving last known location:', error)
    }
  }

  /**
   * Carga la última ubicación conocida
   */
  private loadLastKnownLocation(): void {
    try {
      const saved = localStorage.getItem('last_known_location')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Solo usar si no es muy antigua (menos de 1 hora)
        const age = Date.now() - new Date(parsed.timestamp).getTime()
        if (age < 3600000) { // 1 hora
          console.log('Loaded last known location:', parsed)
        }
      }
    } catch (error) {
      console.error('Error loading last known location:', error)
    }
  }

  /**
   * Obtiene la ubicación actual (cached o nueva)
   */
  get location(): DeviceLocation | null {
    return this.currentLocation
  }

  /**
   * Verifica si el tracking está activo
   */
  get isLocationTracking(): boolean {
    return this.isTracking
  }

  /**
   * Obtiene el ID del dispositivo
   */
  get device(): string {
    return this.deviceId
  }

  /**
   * Calcula la distancia entre dos puntos
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Verifica si el dispositivo se ha movido significativamente
   */
  hasMovedSignificantly(newLocation: DeviceLocation, threshold: number = 10): boolean {
    if (!this.currentLocation) return true
    
    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    )
    
    return distance > threshold
  }

  /**
   * Obtiene información del dispositivo
   */
  getDeviceInfo(): any {
    return {
      deviceId: this.deviceId,
      userId: this.userId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      geolocationSupported: this.isGeolocationSupported(),
      isTracking: this.isTracking,
      lastLocation: this.currentLocation
    }
  }
}

export const locationService = new LocationService()
export default locationService