import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export interface GeolocationPosition {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
  timestamp: number
}

export interface DeviceInfo {
  device_id: string
  device_name: string
  device_type: string
  user_agent: string
  platform: string
  browser: string
  os: string
  screen_resolution: string
}

export function useGeolocation() {
  const authStore = useAuthStore()
  
  // State
  const currentPosition = ref<GeolocationPosition | null>(null)
  const isTracking = ref(false)
  const trackingEnabled = ref(false)
  const trackingInterval = ref(30) // seconds
  const highAccuracy = ref(true)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref<string | null>(null)
  const permissionStatus = ref<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  
  // Device info
  const deviceInfo = ref<DeviceInfo | null>(null)
  const deviceRegistered = ref(false)
  
  // Internal tracking
  let watchId: number | null = null
  let updateIntervalId: NodeJS.Timeout | null = null

  // Computed
  const isLocationAvailable = computed(() => currentPosition.value !== null)
  const canStartTracking = computed(() => 
    permissionStatus.value === 'granted' && authStore.user && !isTracking.value
  )

  // Generate unique device ID
  const generateDeviceId = (): string => {
    const stored = localStorage.getItem('device_id')
    if (stored) return stored
    
    const newId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('device_id', newId)
    return newId
  }

  // Get device information
  const getDeviceInfo = (): DeviceInfo => {
    const nav = navigator as any
    
    return {
      device_id: generateDeviceId(),
      device_name: `${nav.userAgentData?.platform || nav.platform} Browser`,
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'MOBILE' : 
                   /Tablet|iPad/i.test(navigator.userAgent) ? 'TABLET' : 'DESKTOP',
      user_agent: navigator.userAgent,
      platform: nav.userAgentData?.platform || nav.platform || 'Unknown',
      browser: getBrowserName(),
      os: getOSName(),
      screen_resolution: `${screen.width}x${screen.height}`
    }
  }

  const getBrowserName = (): string => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  const getOSName = (): string => {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  // Register device with backend
  const registerDevice = async (): Promise<boolean> => {
    if (!authStore.user || deviceRegistered.value) return true

    try {
      const device = getDeviceInfo()
      deviceInfo.value = device

      const { error: supabaseError } = await supabase
        .from('registered_devices')
        .upsert({
          device_id: device.device_id,
          user_id: authStore.user.id,
          device_name: device.device_name,
          device_type: device.device_type,
          user_agent: device.user_agent,
          platform: device.platform,
          browser: device.browser,
          os: device.os,
          screen_resolution: device.screen_resolution,
          tracking_enabled: trackingEnabled.value,
          tracking_interval_seconds: trackingInterval.value,
          high_accuracy_enabled: highAccuracy.value,
          updated_at: new Date().toISOString()
        })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      deviceRegistered.value = true
      return true
    } catch (err) {
      console.error('Error registering device:', err)
      error.value = err instanceof Error ? err.message : 'Error registering device'
      return false
    }
  }

  // Update location in database
  const updateLocationInDB = async (position: GeolocationPosition): Promise<boolean> => {
    if (!authStore.user || !deviceInfo.value) return false

    try {
      // Detect activity type based on speed (using correct enum values from DB)
      let activity = 'STATIONARY'
      
      if (position.speed !== null && position.speed !== undefined) {
        if (position.speed > 1) activity = 'WALKING'
        if (position.speed > 8) activity = 'DRIVING'  
        if (position.speed > 25) activity = 'DRIVING'
      }

      const locationData = {
        user_id: authStore.user.id,
        device_id: deviceInfo.value.device_id,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy_meters: position.accuracy,
        altitude_meters: position.altitude,
        altitude_accuracy_meters: position.altitudeAccuracy,
        heading_degrees: position.heading,
        speed_mps: position.speed, // Keep as m/s as per DB schema
        device_info: {
          browser: deviceInfo.value.browser,
          os: deviceInfo.value.os,
          screen_resolution: deviceInfo.value.screen_resolution
        },
        user_agent: deviceInfo.value.user_agent,
        platform: deviceInfo.value.platform,
        battery_level: (navigator as any).getBattery ? await getBatteryLevel() : null,
        is_online: true,
        source: 'GPS',
        context: 'WORK', // Could be made configurable
        activity: activity,
        session_id: null, // Could be implemented for session tracking
        app_version: '1.0.0', // Could be made dynamic
        device_timestamp: new Date(position.timestamp).toISOString()
        // server_timestamp is automatically set by the database
      }

      const { error: supabaseError } = await supabase
        .from('device_locations')
        .insert([locationData])

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      lastUpdateTime.value = new Date().toISOString()
      return true
    } catch (err) {
      console.error('Error updating location in DB:', err)
      return false
    }
  }

  const getBatteryLevel = async (): Promise<number | null> => {
    try {
      const battery = await (navigator as any).getBattery()
      return Math.round(battery.level * 100)
    } catch {
      return null
    }
  }

  const getNetworkType = (): string | null => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    return connection?.effectiveType || connection?.type || null
  }

  // Check geolocation permissions
  const checkPermissions = async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (!navigator.geolocation) {
      permissionStatus.value = 'denied'
      return 'denied'
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      permissionStatus.value = permission.state as 'granted' | 'denied' | 'prompt'
      return permission.state as 'granted' | 'denied' | 'prompt'
    } catch {
      // Fallback: try to get current position to test permissions
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            permissionStatus.value = 'granted'
            resolve('granted')
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              permissionStatus.value = 'denied'
              resolve('denied')
            } else {
              permissionStatus.value = 'prompt'
              resolve('prompt')
            }
          },
          { timeout: 1000 }
        )
      })
    }
  }

  // Get current position
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          }
          
          currentPosition.value = pos
          resolve(pos)
        },
        (error) => {
          let message = 'Error getting location: '
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message += 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              message += 'Location information unavailable'
              break
            case error.TIMEOUT:
              message += 'Location request timed out'
              break
            default:
              message += 'Unknown error occurred'
              break
          }
          reject(new Error(message))
        },
        {
          enableHighAccuracy: highAccuracy.value,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  // Start tracking
  const startTracking = async (): Promise<boolean> => {
    if (isTracking.value) return true

    try {
      error.value = null
      console.log('Starting geolocation tracking...')
      
      // Check permissions
      const permission = await checkPermissions()
      console.log('Permission status:', permission)
      if (permission !== 'granted') {
        throw new Error('Geolocation permission not granted')
      }

      // Register device (but don't fail if it doesn't work)
      try {
        await registerDevice()
        console.log('Device registered successfully')
      } catch (regError) {
        console.warn('Device registration failed, but continuing with tracking:', regError)
      }

      // Get initial position
      console.log('Getting initial position...')
      await getCurrentPosition()
      console.log('Initial position obtained:', currentPosition.value)
      
      // Try to update in database, but don't fail if it doesn't work
      if (trackingEnabled.value) {
        try {
          await updateLocationInDB(currentPosition.value!)
          console.log('Location updated in database')
        } catch (dbError) {
          console.warn('Database update failed, but continuing with tracking:', dbError)
        }
      }

      // Start watching position
      console.log('Starting position watch...')
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          console.log('New position received:', position.coords)
          const pos: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          }
          
          currentPosition.value = pos
          
          // Update in database if tracking is enabled (but don't fail tracking if DB fails)
          if (trackingEnabled.value) {
            try {
              await updateLocationInDB(pos)
            } catch (dbError) {
              console.warn('Database update failed:', dbError)
            }
          }
        },
        (geoError) => {
          console.error('Geolocation error:', geoError)
          // Don't stop tracking completely on single error
        },
        {
          enableHighAccuracy: highAccuracy.value,
          timeout: 15000,
          maximumAge: 30000
        }
      )

      // Set up interval updates if tracking is enabled
      if (trackingEnabled.value && trackingInterval.value > 0) {
        updateIntervalId = setInterval(async () => {
          if (currentPosition.value && trackingEnabled.value) {
            try {
              await updateLocationInDB(currentPosition.value)
            } catch (dbError) {
              console.warn('Interval database update failed:', dbError)
            }
          }
        }, trackingInterval.value * 1000)
      }

      isTracking.value = true
      console.log('Tracking started successfully')
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start tracking'
      console.error('Error starting tracking:', err)
      return false
    }
  }

  // Stop tracking
  const stopTracking = (): void => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }

    if (updateIntervalId !== null) {
      clearInterval(updateIntervalId)
      updateIntervalId = null
    }

    isTracking.value = false
  }

  // Enable/disable tracking in database
  const setTrackingEnabled = async (enabled: boolean): Promise<boolean> => {
    trackingEnabled.value = enabled
    
    if (deviceInfo.value && authStore.user) {
      try {
        const { error: supabaseError } = await supabase
          .from('registered_devices')
          .update({ 
            tracking_enabled: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('device_id', deviceInfo.value.device_id)
          .eq('user_id', authStore.user.id)

        if (supabaseError) {
          throw new Error(supabaseError.message)
        }

        return true
      } catch (err) {
        console.error('Error updating tracking settings:', err)
        return false
      }
    }

    return false
  }

  // Lifecycle
  onMounted(async () => {
    await checkPermissions()
  })

  onUnmounted(() => {
    stopTracking()
  })

  return {
    // State
    currentPosition,
    isTracking,
    trackingEnabled,
    trackingInterval,
    highAccuracy,
    error,
    lastUpdateTime,
    permissionStatus,
    deviceInfo,
    deviceRegistered,

    // Computed
    isLocationAvailable,
    canStartTracking,

    // Methods
    checkPermissions,
    getCurrentPosition,
    startTracking,
    stopTracking,
    setTrackingEnabled,
    registerDevice
  }
}