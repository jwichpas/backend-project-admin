export interface VehicleUpdate {
  vehicleId: string
  latitude: number
  longitude: number
  speed_kph: number
  heading_deg: number
  status: 'active' | 'idle' | 'stopped' | 'maintenance'
  timestamp: string
}

export interface RouteUpdate {
  routeId: string
  vehicleId: string
  progress: number // 0-100
  currentPosition: {
    latitude: number
    longitude: number
  }
  remainingDistance: number // metros
  remainingTime: number // segundos
  estimatedArrival: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
}

export interface TrafficAlert {
  id: string
  type: 'accident' | 'construction' | 'congestion' | 'closure' | 'weather'
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: { latitude: number; longitude: number }
  description: string
  affectedArea: { radius: number }
  isActive: boolean
}

export interface DeviceLocationUpdate {
  deviceId: string
  userId?: string
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  timestamp: string
  source: 'GPS' | 'NETWORK' | 'MANUAL'
  batteryLevel?: number
  isOnline: boolean
  sessionId?: string
}

export type WebSocketMessage = 
  | { type: 'vehicle_update'; data: VehicleUpdate }
  | { type: 'route_update'; data: RouteUpdate }
  | { type: 'route_completed'; data: { routeId: string; vehicleId: string } }
  | { type: 'route_deviation'; data: { routeId: string; vehicleId: string; deviation: number } }
  | { type: 'traffic_alert'; data: TrafficAlert }
  | { type: 'traffic_alert_resolved'; data: { alertId: string } }
  | { type: 'device_location_update'; data: DeviceLocationUpdate }
  | { type: 'tracking_session_started'; data: { deviceId: string; sessionId: string } }
  | { type: 'tracking_session_ended'; data: { deviceId: string; sessionId: string } }

export type EventCallback<T = any> = (data: T) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventListeners: Map<string, EventCallback[]> = new Map()
  private isConnected = false
  private url: string

  constructor(url: string = 'ws://localhost:8080/ws') {
    this.url = url
    this.connect()
  }

  /**
   * Establece conexión WebSocket
   */
  private connect(): void {
    try {
      this.ws = new WebSocket(this.url)
      this.setupEventListeners()
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      this.handleReconnect()
    }
  }

  /**
   * Configura los event listeners del WebSocket
   */
  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected', null)
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.isConnected = false
      this.emit('disconnected', null)
      this.handleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
  }

  /**
   * Maneja los mensajes recibidos del WebSocket
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'vehicle_update':
        this.emit('vehicleUpdate', message.data)
        break
      case 'route_update':
        this.emit('routeUpdate', message.data)
        break
      case 'route_completed':
        this.emit('routeCompleted', message.data)
        break
      case 'route_deviation':
        this.emit('routeDeviation', message.data)
        break
      case 'traffic_alert':
        this.emit('trafficAlert', message.data)
        break
      case 'traffic_alert_resolved':
        this.emit('trafficAlertResolved', message.data)
        break
      case 'device_location_update':
        this.emit('deviceLocationUpdate', message.data)
        break
      case 'tracking_session_started':
        this.emit('trackingSessionStarted', message.data)
        break
      case 'tracking_session_ended':
        this.emit('trackingSessionEnded', message.data)
        break
      default:
        console.warn('Unknown message type:', message)
    }
  }

  /**
   * Maneja la reconexión automática
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached', null)
    }
  }

  /**
   * Suscribe a un evento
   */
  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  /**
   * Desuscribe de un evento
   */
  off<T>(event: string, callback: EventCallback<T>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Emite un evento a todos los listeners
   */
  private emit<T>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  /**
   * Envía un mensaje al servidor
   */
  send(message: any): void {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending message:', error)
      }
    } else {
      console.warn('WebSocket not connected. Message not sent:', message)
    }
  }

  /**
   * Suscribe a actualizaciones de un vehículo específico
   */
  subscribeToVehicle(vehicleId: string): void {
    this.send({
      type: 'subscribe_vehicle',
      vehicleId
    })
  }

  /**
   * Desuscribe de actualizaciones de un vehículo específico
   */
  unsubscribeFromVehicle(vehicleId: string): void {
    this.send({
      type: 'unsubscribe_vehicle',
      vehicleId
    })
  }

  /**
   * Suscribe a actualizaciones de una ruta específica
   */
  subscribeToRoute(routeId: string): void {
    this.send({
      type: 'subscribe_route',
      routeId
    })
  }

  /**
   * Desuscribe de actualizaciones de una ruta específica
   */
  unsubscribeFromRoute(routeId: string): void {
    this.send({
      type: 'unsubscribe_route',
      routeId
    })
  }

  /**
   * Solicita el estado actual de todos los vehículos
   */
  requestVehiclesStatus(): void {
    this.send({
      type: 'get_vehicles_status'
    })
  }

  /**
   * Solicita el estado actual de todas las rutas activas
   */
  requestActiveRoutes(): void {
    this.send({
      type: 'get_active_routes'
    })
  }

  /**
   * Cierra la conexión WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }

  /**
   * Verifica si la conexión está activa
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Cambia la URL del WebSocket
   */
  setUrl(url: string): void {
    this.url = url
    if (this.isConnected) {
      this.disconnect()
      this.connect()
    }
  }

  /**
   * Envía ubicación del dispositivo
   */
  sendDeviceLocation(deviceLocation: DeviceLocationUpdate): void {
    this.send({
      type: 'device_location_update',
      data: deviceLocation
    })
  }

  /**
   * Inicia sesión de tracking para un dispositivo
   */
  startTrackingSession(deviceId: string, sessionId: string): void {
    this.send({
      type: 'tracking_session_started',
      data: { deviceId, sessionId }
    })
  }

  /**
   * Termina sesión de tracking para un dispositivo
   */
  endTrackingSession(deviceId: string, sessionId: string): void {
    this.send({
      type: 'tracking_session_ended',
      data: { deviceId, sessionId }
    })
  }
}

// Simulador de WebSocket para desarrollo (cuando no hay servidor real)
class WebSocketSimulator {
  private eventListeners: Map<string, EventCallback[]> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private simulatedVehicles: string[] = []
  private simulatedRoutes: string[] = []

  constructor() {
    // Simular conexión inmediata
    setTimeout(() => {
      this.emit('connected', null)
    }, 100)
  }

  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit<T>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  send(message: any): void {
    console.log('WebSocket Simulator - Message sent:', message)
  }

  subscribeToVehicle(vehicleId: string): void {
    if (this.simulatedVehicles.includes(vehicleId)) return
    
    this.simulatedVehicles.push(vehicleId)
    
    // Simular actualizaciones cada 5 segundos
    const interval = setInterval(() => {
      const mockUpdate: VehicleUpdate = {
        vehicleId,
        latitude: -12.0464 + (Math.random() - 0.5) * 0.1,
        longitude: -77.0428 + (Math.random() - 0.5) * 0.1,
        speed_kph: 30 + Math.random() * 40,
        heading_deg: Math.random() * 360,
        status: Math.random() > 0.8 ? 'idle' : 'active',
        timestamp: new Date().toISOString()
      }
      
      this.emit('vehicleUpdate', mockUpdate)
    }, 5000)
    
    this.intervals.set(vehicleId, interval)
  }

  unsubscribeFromVehicle(vehicleId: string): void {
    const interval = this.intervals.get(vehicleId)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(vehicleId)
    }
    
    const index = this.simulatedVehicles.indexOf(vehicleId)
    if (index > -1) {
      this.simulatedVehicles.splice(index, 1)
    }
  }

  subscribeToRoute(routeId: string): void {
    if (this.simulatedRoutes.includes(routeId)) return
    
    this.simulatedRoutes.push(routeId)
    
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 5 // Progreso aleatorio
      
      if (progress >= 100) {
        progress = 100
        this.emit('routeCompleted', { routeId, vehicleId: 'vh-1' })
        clearInterval(interval)
        this.intervals.delete(routeId)
        return
      }
      
      const mockRouteUpdate: RouteUpdate = {
        routeId,
        vehicleId: 'vh-1',
        progress,
        currentPosition: {
          latitude: -12.0464 + (Math.random() - 0.5) * 0.1,
          longitude: -77.0428 + (Math.random() - 0.5) * 0.1
        },
        remainingDistance: Math.max(0, 15000 - (progress * 150)),
        remainingTime: Math.max(0, 1800 - (progress * 18)),
        estimatedArrival: new Date(Date.now() + (1800 - progress * 18) * 1000).toISOString(),
        status: progress < 100 ? 'active' : 'completed'
      }
      
      this.emit('routeUpdate', mockRouteUpdate)
    }, 3000)
    
    this.intervals.set(routeId, interval)
  }

  unsubscribeFromRoute(routeId: string): void {
    const interval = this.intervals.get(routeId)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(routeId)
    }
    
    const index = this.simulatedRoutes.indexOf(routeId)
    if (index > -1) {
      this.simulatedRoutes.splice(index, 1)
    }
  }

  requestVehiclesStatus(): void {
    // Simular respuesta inmediata
    setTimeout(() => {
      this.emit('vehiclesStatus', {
        vehicles: [
          { vehicleId: 'vh-1', status: 'active', lastUpdate: new Date().toISOString() },
          { vehicleId: 'vh-2', status: 'idle', lastUpdate: new Date().toISOString() },
          { vehicleId: 'vh-3', status: 'active', lastUpdate: new Date().toISOString() }
        ]
      })
    }, 100)
  }

  requestActiveRoutes(): void {
    // Simular respuesta inmediata
    setTimeout(() => {
      this.emit('activeRoutes', {
        routes: [
          { routeId: 'route-1', vehicleId: 'vh-1', status: 'active', progress: 45 },
          { routeId: 'route-2', vehicleId: 'vh-3', status: 'active', progress: 78 }
        ]
      })
    }, 100)
  }

  disconnect(): void {
    // Limpiar todos los intervalos
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    this.simulatedVehicles = []
    this.simulatedRoutes = []
  }

  get connected(): boolean {
    return true
  }

  setUrl(url: string): void {
    console.log('WebSocket Simulator - URL changed to:', url)
  }

  /**
   * Envía ubicación del dispositivo (simulador)
   */
  sendDeviceLocation(deviceLocation: any): void {
    console.log('WebSocket Simulator - Device location sent:', deviceLocation)
  }

  /**
   * Inicia sesión de tracking para un dispositivo (simulador)
   */
  startTrackingSession(deviceId: string, sessionId: string): void {
    console.log('WebSocket Simulator - Tracking session started:', { deviceId, sessionId })
  }

  /**
   * Termina sesión de tracking para un dispositivo (simulador)
   */
  endTrackingSession(deviceId: string, sessionId: string): void {
    console.log('WebSocket Simulator - Tracking session ended:', { deviceId, sessionId })
  }
}

// Exportar servicio según el entorno
const isProduction = import.meta.env.PROD
const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws'

export const webSocketService = isProduction 
  ? new WebSocketService(webSocketUrl) 
  : new WebSocketSimulator()

export default webSocketService