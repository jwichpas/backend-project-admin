import axios, { type AxiosInstance } from 'axios'

export interface Coordinate {
  longitude: number
  latitude: number
}

export interface RouteOptions {
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking'
  preference?: 'fastest' | 'shortest' | 'recommended'
  units?: 'km' | 'mi'
  language?: 'es' | 'en'
  instructions?: boolean
  elevation?: boolean
  avoid_features?: string[]
  avoid_polygons?: Array<[number, number][]>
}

export interface TrafficAlert {
  id: string
  type: 'accident' | 'construction' | 'congestion' | 'closure' | 'weather'
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: Coordinate
  description: string
  affectedArea: {
    radius: number
    polygon?: Array<[number, number]>
  }
  startTime: Date
  endTime?: Date
  isActive: boolean
  detourSuggested: boolean
}

export interface MultiStopRoute {
  id: string
  vehicleId: string
  stops: Array<{
    id: string
    coordinate: Coordinate
    name: string
    type: 'pickup' | 'delivery' | 'waypoint'
    timeWindow?: {
      earliest: Date
      latest: Date
    }
    serviceTime: number
    priority: number
    completed: boolean
  }>
  optimized: boolean
  totalDistance: number
  totalDuration: number
  estimatedCost: number
  createdAt: Date
}

export interface RouteSegment {
  distance: number // en metros
  duration: number // en segundos
  steps: RouteStep[]
}

export interface RouteStep {
  distance: number
  duration: number
  instruction: string
  name: string
  way_points: [number, number]
}

export interface RouteResponse {
  routes: Array<{
    summary: {
      distance: number // metros
      duration: number // segundos
    }
    segments: RouteSegment[]
    geometry: {
      coordinates: Array<[number, number]> // [lon, lat]
      type: 'LineString'
    }
    way_points: number[]
    bbox: [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
  }>
  bbox: [number, number, number, number]
  info: {
    attribution: string
    service: string
    timestamp: number
    query: {
      coordinates: Array<[number, number]>
      profile: string
      format: string
    }
  }
}

export interface Route {
  id: string
  vehicleId: string
  vehicleName: string
  destinationId: string
  destinationName: string
  startCoordinate: Coordinate
  endCoordinate: Coordinate
  geometry: Array<[number, number]>
  distance: number // metros
  duration: number // segundos
  estimatedArrival: Date
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  progress: number // 0-100%
  currentPosition?: Coordinate
  remainingDistance?: number
  remainingTime?: number
  createdAt: Date
  updatedAt: Date
}

class RouteService {
  private api: AxiosInstance
  private readonly API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY

  private trafficAlerts: Map<string, TrafficAlert> = new Map()
  private multiStopRoutes: Map<string, MultiStopRoute> = new Map()

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.openrouteservice.org/v2',
      headers: {
        'Authorization': this.API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    this.initializeTrafficAlerts()
  }

  private initializeTrafficAlerts(): void {
    const mockAlerts: TrafficAlert[] = [
      {
        id: 'alert-1',
        type: 'construction',
        severity: 'medium',
        location: { latitude: -12.0464, longitude: -77.0428 },
        description: 'Obras en construcción en Av. Arequipa',
        affectedArea: { radius: 500 },
        startTime: new Date('2024-12-06T08:00:00'),
        endTime: new Date('2024-12-06T18:00:00'),
        isActive: true,
        detourSuggested: true
      },
      {
        id: 'alert-2',
        type: 'congestion',
        severity: 'high',
        location: { latitude: -12.0724, longitude: -77.0370 },
        description: 'Congestión vehicular en Av. Javier Prado',
        affectedArea: { radius: 1000 },
        startTime: new Date('2024-12-06T07:30:00'),
        endTime: new Date('2024-12-06T09:30:00'),
        isActive: true,
        detourSuggested: true
      }
    ]

    mockAlerts.forEach(alert => {
      this.trafficAlerts.set(alert.id, alert)
    })
  }

  /**
   * Calcula una ruta entre dos puntos
   */
  async calculateRoute(
    start: Coordinate,
    end: Coordinate,
    options: RouteOptions = {}
  ): Promise<RouteResponse> {
    const defaultOptions: RouteOptions = {
      profile: 'driving-car',
      preference: 'fastest',
      units: 'km',
      language: 'es',
      instructions: true,
      elevation: false,
      ...options
    }

    try {
      const response = await this.api.post(`/directions/${defaultOptions.profile}`, {
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ],
        format: 'json',
        preference: defaultOptions.preference,
        units: defaultOptions.units,
        language: defaultOptions.language,
        instructions: defaultOptions.instructions,
        elevation: defaultOptions.elevation,
        geometry: 'true'
      })

      return response.data as RouteResponse
    } catch (error) {
      console.error('Error calculating route:', error)
      throw new Error('Failed to calculate route')
    }
  }

  /**
   * Calcula una ruta optimizada para múltiples destinos
   */
  async calculateOptimizedRoute(
    start: Coordinate,
    waypoints: Coordinate[],
    options: RouteOptions = {}
  ): Promise<RouteResponse> {
    const coordinates = [
      [start.longitude, start.latitude],
      ...waypoints.map(wp => [wp.longitude, wp.latitude])
    ]

    try {
      const response = await this.api.post(`/directions/${options.profile || 'driving-car'}`, {
        coordinates,
        format: 'json',
        preference: options.preference || 'fastest',
        optimize_waypoints: true,
        instructions: true,
        geometry: 'true'
      })

      return response.data as RouteResponse
    } catch (error) {
      console.error('Error calculating optimized route:', error)
      throw new Error('Failed to calculate optimized route')
    }
  }

  /**
   * Calcula matriz de distancias entre múltiples puntos
   */
  async calculateDistanceMatrix(
    sources: Coordinate[],
    destinations: Coordinate[],
    profile: string = 'driving-car'
  ) {
    try {
      const response = await this.api.post(`/matrix/${profile}`, {
        locations: [
          ...sources.map(s => [s.longitude, s.latitude]),
          ...destinations.map(d => [d.longitude, d.latitude])
        ],
        sources: sources.map((_, index) => index),
        destinations: sources.map((_, index, arr) => arr.length + index),
        metrics: ['distance', 'duration'],
        units: 'km'
      })

      return response.data
    } catch (error) {
      console.error('Error calculating distance matrix:', error)
      throw new Error('Failed to calculate distance matrix')
    }
  }

  /**
   * Convierte duración en segundos a formato legible
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  /**
   * Convierte distancia en metros a formato legible
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  /**
   * Calcula la posición estimada en una ruta basada en el progreso
   */
  getPositionOnRoute(geometry: Array<[number, number]>, progress: number): Coordinate {
    if (progress <= 0) return { longitude: geometry[0][0], latitude: geometry[0][1] }
    if (progress >= 100) return {
      longitude: geometry[geometry.length - 1][0],
      latitude: geometry[geometry.length - 1][1]
    }

    const targetDistance = (progress / 100) * this.calculateGeometryDistance(geometry)
    let accDistance = 0

    for (let i = 0; i < geometry.length - 1; i++) {
      const segmentDistance = this.calculateDistance(
        { longitude: geometry[i][0], latitude: geometry[i][1] },
        { longitude: geometry[i + 1][0], latitude: geometry[i + 1][1] }
      )

      if (accDistance + segmentDistance >= targetDistance) {
        // Interpolación lineal en este segmento
        const ratio = (targetDistance - accDistance) / segmentDistance
        return {
          longitude: geometry[i][0] + (geometry[i + 1][0] - geometry[i][0]) * ratio,
          latitude: geometry[i][1] + (geometry[i + 1][1] - geometry[i][1]) * ratio
        }
      }

      accDistance += segmentDistance
    }

    return { longitude: geometry[0][0], latitude: geometry[0][1] }
  }

  /**
   * Calcula distancia entre dos coordenadas (Haversine)
   */
  private calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371e3 // Radio de la Tierra en metros
    const φ1 = coord1.latitude * Math.PI / 180
    const φ2 = coord2.latitude * Math.PI / 180
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Calcula la distancia total de una geometría de ruta
   */
  private calculateGeometryDistance(geometry: Array<[number, number]>): number {
    let totalDistance = 0
    for (let i = 0; i < geometry.length - 1; i++) {
      totalDistance += this.calculateDistance(
        { longitude: geometry[i][0], latitude: geometry[i][1] },
        { longitude: geometry[i + 1][0], latitude: geometry[i + 1][1] }
      )
    }
    return totalDistance
  }

  /**
   * Calcula ETA basado en velocidad actual y distancia restante
   */
  calculateETA(remainingDistance: number, currentSpeed: number): Date {
    if (currentSpeed <= 0) currentSpeed = 40 // Velocidad promedio por defecto

    const remainingTimeHours = remainingDistance / 1000 / currentSpeed
    const remainingTimeMs = remainingTimeHours * 60 * 60 * 1000

    return new Date(Date.now() + remainingTimeMs)
  }

  /**
   * Obtiene todas las alertas de tráfico activas
   */
  getActiveTrafficAlerts(): TrafficAlert[] {
    const now = new Date()
    return Array.from(this.trafficAlerts.values()).filter(alert => 
      alert.isActive && 
      alert.startTime <= now && 
      (!alert.endTime || alert.endTime >= now)
    )
  }

  /**
   * Obtiene alertas de tráfico que afectan una ruta específica
   */
  getAlertsForRoute(geometry: Array<[number, number]>): TrafficAlert[] {
    const alerts = this.getActiveTrafficAlerts()
    return alerts.filter(alert => 
      this.isRouteAffectedByAlert(geometry, alert)
    )
  }

  /**
   * Verifica si una ruta está afectada por una alerta de tráfico
   */
  private isRouteAffectedByAlert(geometry: Array<[number, number]>, alert: TrafficAlert): boolean {
    return geometry.some(coord => {
      const distance = this.calculateDistance(
        { latitude: coord[1], longitude: coord[0] },
        alert.location
      )
      return distance <= alert.affectedArea.radius
    })
  }

  /**
   * Calcula una ruta con múltiples paradas optimizada
   */
  async createMultiStopRoute(
    vehicleId: string,
    stops: Array<{
      coordinate: Coordinate
      name: string
      type: 'pickup' | 'delivery' | 'waypoint'
      timeWindow?: { earliest: Date; latest: Date }
      serviceTime?: number
      priority?: number
    }>
  ): Promise<MultiStopRoute> {
    if (stops.length < 2) {
      throw new Error('Se requieren al menos 2 paradas')
    }

    const optimizedStops = stops.map((stop, index) => ({
      ...stop,
      id: `stop-${index}`,
      serviceTime: stop.serviceTime || 300,
      priority: stop.priority || 1,
      completed: false
    }))

    // Calcular distancia total estimada
    let totalDistance = 0
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += this.calculateDistance(stops[i].coordinate, stops[i + 1].coordinate)
    }

    const route: MultiStopRoute = {
      id: `multi-route-${Date.now()}`,
      vehicleId,
      stops: optimizedStops,
      optimized: false,
      totalDistance,
      totalDuration: totalDistance / 1000 * 60, // Estimado: 1 min por km
      estimatedCost: this.calculateRouteCost(totalDistance),
      createdAt: new Date()
    }

    this.multiStopRoutes.set(route.id, route)
    return route
  }

  /**
   * Calcula el costo estimado de una ruta
   */
  private calculateRouteCost(distance: number): number {
    const costPerKm = 2.5 // Soles por kilómetro
    return (distance / 1000) * costPerKm
  }

  /**
   * Obtiene una ruta multi-parada por ID
   */
  getMultiStopRoute(routeId: string): MultiStopRoute | undefined {
    return this.multiStopRoutes.get(routeId)
  }

  /**
   * Actualiza el estado de una parada
   */
  updateStopStatus(routeId: string, stopId: string, completed: boolean): void {
    const route = this.multiStopRoutes.get(routeId)
    if (route) {
      const stop = route.stops.find(s => s.id === stopId)
      if (stop) {
        stop.completed = completed
      }
    }
  }

  /**
   * Optimiza ruta para flota completa
   */
  async optimizeFleetRoutes(
    vehicles: Array<{ id: string; location: Coordinate; capacity: number }>,
    destinations: Array<{ coordinate: Coordinate; demand: number; priority: number }>
  ): Promise<Array<{ vehicleId: string; route: MultiStopRoute }>> {
    const results: Array<{ vehicleId: string; route: MultiStopRoute }> = []
    
    // Algoritmo simple de asignación por proximidad y capacidad
    const assignedDestinations = new Set<number>()
    
    for (const vehicle of vehicles) {
      let remainingCapacity = vehicle.capacity
      const vehicleStops: Array<{
        coordinate: Coordinate
        name: string
        type: 'pickup' | 'delivery' | 'waypoint'
        priority: number
      }> = []

      // Agregar punto de inicio (ubicación del vehículo)
      vehicleStops.push({
        coordinate: vehicle.location,
        name: `Vehículo ${vehicle.id}`,
        type: 'waypoint',
        priority: 0
      })

      // Asignar destinos por proximidad y prioridad
      const availableDestinations = destinations
        .map((dest, index) => ({ ...dest, index }))
        .filter(dest => !assignedDestinations.has(dest.index))
        .sort((a, b) => {
          const distA = this.calculateDistance(vehicle.location, a.coordinate)
          const distB = this.calculateDistance(vehicle.location, b.coordinate)
          return (distA * (1 / a.priority)) - (distB * (1 / b.priority))
        })

      for (const dest of availableDestinations) {
        if (dest.demand <= remainingCapacity) {
          vehicleStops.push({
            coordinate: dest.coordinate,
            name: `Destino ${dest.index + 1}`,
            type: 'delivery',
            priority: dest.priority
          })
          
          remainingCapacity -= dest.demand
          assignedDestinations.add(dest.index)
        }
      }

      if (vehicleStops.length > 1) {
        try {
          const route = await this.createMultiStopRoute(vehicle.id, vehicleStops)
          results.push({ vehicleId: vehicle.id, route })
        } catch (error) {
          console.error(`Error creating route for vehicle ${vehicle.id}:`, error)
        }
      }
    }

    return results
  }
}

export const routeService = new RouteService()
export default routeService
