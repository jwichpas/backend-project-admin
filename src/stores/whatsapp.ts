import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { whatsappApi } from '@/services/whatsappApi'
import { useAuthStore } from './auth'
import { supabase } from '@/lib/supabase'

interface WhatsAppSession {
  id: string
  user_id: string
  session_name: string
  phone_number?: string
  status: 'disconnected' | 'qr_code' | 'connecting' | 'connected' | 'error'
  qr_code?: string
  qr_code_updated_at?: string
  last_connected_at?: string
  last_disconnected_at?: string
  session_data?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WhatsAppMessage {
  id: string
  user_id: string
  phone_number: string
  contact_name?: string
  message_body: string
  message_type: string
  is_group: boolean
  is_incoming: boolean
  timestamp: string
  created_at: string
}

interface WhatsAppContact {
  id: string
  user_id: string
  phone_number: string
  contact_name?: string
  last_message_at?: string
  message_count: number
  is_blocked: boolean
  notes?: string
  created_at: string
}

interface WhatsAppStatus {
  id: string
  user_id: string
  phone_number: string
  contact_name?: string
  status_type: string
  media_url?: string
  caption?: string
  timestamp: string
  created_at: string
}

export const useWhatsAppStore = defineStore('whatsapp', () => {
  const authStore = useAuthStore()

  // State
  const sessions = ref<WhatsAppSession[]>([])
  const activeSessions = ref<any[]>([])
  const currentSession = ref<WhatsAppSession | null>(null)
  const messages = ref<WhatsAppMessage[]>([])
  const contacts = ref<WhatsAppContact[]>([])
  const statuses = ref<WhatsAppStatus[]>([])
  const statusStats = ref<any>(null)
  const messageStats = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const connectedSessions = computed(() =>
    sessions.value.filter(s => s.status === 'connected')
  )

  const disconnectedSessions = computed(() =>
    sessions.value.filter(s => s.status === 'disconnected' || s.status === 'error')
  )

  const sessionsWithQR = computed(() =>
    sessions.value.filter(s => s.status === 'qr_code' && s.qr_code)
  )

  // Actions

  /**
   * Cargar sesiones del usuario
   */
  async function loadUserSessions() {
    if (!authStore.user?.id) {
      error.value = 'Usuario no autenticado'
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.getUserSessions(authStore.user.id)

      if (response.success && response.sessions) {
        sessions.value = response.sessions
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar sesiones'
      console.error('Error loading sessions:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear nueva sesión
   */
  async function createSession(sessionName: string) {
    if (!authStore.user?.id) {
      throw new Error('Usuario no autenticado')
    }

    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.createSession(sessionName, authStore.user.id)

      if (response.success && response.session) {
        sessions.value.push(response.session)
        return response.session
      }

      throw new Error(response.error || 'Error al crear sesión')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Iniciar sesión de WhatsApp
   */
  async function startSession(session: WhatsAppSession) {
    if (!authStore.user?.id) {
      throw new Error('Usuario no autenticado')
    }

    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.startSession(
        session.id,
        authStore.user.id,
        session.session_name
      )

      if (response.success) {
        // Actualizar estado de la sesión
        await loadUserSessions()

        // Iniciar escucha de cambios en tiempo real
        subscribeToSessionChanges(session.id)

        return response
      }

      throw new Error(response.error || 'Error al iniciar sesión')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Detener sesión de WhatsApp
   */
  async function stopSession(sessionId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.stopSession(sessionId)

      if (response.success) {
        await loadUserSessions()
        return response
      }

      throw new Error(response.error || 'Error al detener sesión')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar sesión
   */
  async function deleteSession(sessionId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.deleteSession(sessionId)

      if (response.success) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
        if (currentSession.value?.id === sessionId) {
          currentSession.value = null
        }
        return response
      }

      throw new Error(response.error || 'Error al eliminar sesión')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar sesiones activas
   */
  async function loadActiveSessions() {
    try {
      const response = await whatsappApi.getActiveSessions()

      if (response.success) {
        activeSessions.value = response.sessions || []
      }
    } catch (err: any) {
      console.error('Error loading active sessions:', err)
    }
  }

  /**
   * Cargar mensajes de un contacto
   */
  async function loadMessages(phoneNumber: string) {
    if (!authStore.user?.id) {
      throw new Error('Usuario no autenticado')
    }

    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.getMessages(authStore.user.id, phoneNumber)

      if (response.success && response.messages) {
        messages.value = response.messages
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading messages:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cargar estadísticas de mensajes
   */
  async function loadMessageStats() {
    if (!authStore.user?.id) {
      return
    }

    try {
      const response = await whatsappApi.getMessageStats(authStore.user.id)

      if (response.success && response.stats) {
        messageStats.value = response.stats
      }
    } catch (err: any) {
      console.error('Error loading message stats:', err)
    }
  }

  /**
   * Cargar estados de un contacto
   */
  async function loadContactStatus(phoneNumber: string) {
    if (!authStore.user?.id) {
      return
    }

    try {
      const response = await whatsappApi.getContactStatus(authStore.user.id, phoneNumber)

      if (response.success && response.statuses) {
        statuses.value = response.statuses
      }
    } catch (err: any) {
      console.error('Error loading contact status:', err)
    }
  }

  /**
   * Cargar estadísticas de estados
   */
  async function loadStatusStats() {
    if (!authStore.user?.id) {
      return
    }

    try {
      const response = await whatsappApi.getStatusStats(authStore.user.id)

      if (response.success && response.stats) {
        statusStats.value = response.stats
      }
    } catch (err: any) {
      console.error('Error loading status stats:', err)
    }
  }

  /**
   * Enviar mensaje
   */
  async function sendMessage(sessionId: string, to: string, message: string) {
    loading.value = true
    error.value = null

    try {
      const response = await whatsappApi.sendMessage(sessionId, to, message)

      if (response.success) {
        return response
      }

      throw new Error(response.error || 'Error al enviar mensaje')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Guardar mensaje enviado en la base de datos local
   */
  async function saveOutgoingMessage(phoneNumber: string, messageBody: string) {
    if (!authStore.user?.id) {
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('whatsapp_messages')
        .insert([
          {
            user_id: authStore.user.id,
            phone_number: phoneNumber,
            message_body: messageBody,
            message_type: 'text',
            is_group: false,
            is_incoming: false,
            timestamp: new Date().toISOString()
          }
        ])
        .select()

      if (err) throw err

      // Agregar mensaje a la lista local
      if (data && data.length > 0) {
        messages.value.push(data[0])
      }
    } catch (err: any) {
      console.error('Error saving outgoing message:', err)
    }
  }

  /**
   * Cargar contactos
   */
  async function loadContacts() {
    if (!authStore.user?.id) {
      return
    }

    try {
      const { data, error: err } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('last_message_at', { ascending: false })

      if (err) throw err

      contacts.value = data || []
    } catch (err: any) {
      console.error('Error loading contacts:', err)
    }
  }

  /**
   * Suscribirse a cambios de sesión en tiempo real
   */
  function subscribeToSessionChanges(sessionId: string) {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session updated:', payload)

          // Actualizar sesión en el array
          const index = sessions.value.findIndex(s => s.id === sessionId)
          if (index !== -1) {
            sessions.value[index] = payload.new as WhatsAppSession
          }

          // Actualizar sesión actual si es la misma
          if (currentSession.value?.id === sessionId) {
            currentSession.value = payload.new as WhatsAppSession
          }
        }
      )
      .subscribe()

    return channel
  }

  // Canal de mensajes (singleton para evitar múltiples subscriptions)
  let messagesChannel: any = null
  let lastStatsUpdate = 0

  /**
   * Suscribirse a nuevos mensajes en tiempo real
   */
  function subscribeToMessages() {
    if (!authStore.user?.id) {
      console.warn('⚠️ No se puede suscribir a mensajes: usuario no autenticado')
      return null
    }

    // Si ya existe una suscripción, verificar su estado
    if (messagesChannel) {
      const channelState = messagesChannel.state

      // Si el canal está cerrado, limpiarlo y crear uno nuevo
      if (channelState === 'closed') {
        console.log('🔄 Canal cerrado detectado, recreando...')
        supabase.removeChannel(messagesChannel)
        messagesChannel = null
      } else {
        console.log('✅ Reutilizando canal activo de mensajes')
        return messagesChannel
      }
    }

    console.log('📡 Creando nueva suscripción Realtime para mensajes...')

    messagesChannel = supabase
      .channel(`whatsapp-messages-${authStore.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage

          // Verificar que el mensaje no exista ya (evitar duplicados)
          const exists = messages.value.some(m => m.id === newMessage.id)

          if (!exists) {
            // Agregar mensaje al array
            messages.value.push(newMessage)

            // Actualizar estadísticas y contactos de forma optimizada (debounced)
            const now = Date.now()
            if (!lastStatsUpdate || now - lastStatsUpdate > 2000) {
              lastStatsUpdate = now
              loadMessageStats()
              loadContacts()
            }
          }
        }
      )
      .subscribe()

    return messagesChannel
  }

  /**
   * Desuscribirse de mensajes
   */
  function unsubscribeFromMessages() {
    if (messagesChannel) {
      supabase.removeChannel(messagesChannel)
      messagesChannel = null
      console.log('🔌 Desuscrito de mensajes Realtime')
    }
  }

  /**
   * Seleccionar sesión actual
   */
  function setCurrentSession(session: WhatsAppSession | null) {
    currentSession.value = session
  }

  /**
   * Limpiar errores
   */
  function clearError() {
    error.value = null
  }

  /**
   * Resetear store
   */
  function $reset() {
    // Limpiar canal de mensajes
    unsubscribeFromMessages()

    sessions.value = []
    activeSessions.value = []
    currentSession.value = null
    messages.value = []
    contacts.value = []
    messageStats.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    sessions,
    activeSessions,
    currentSession,
    messages,
    contacts,
    messageStats,
    statuses,
    statusStats,
    loading,
    error,

    // Computed
    connectedSessions,
    disconnectedSessions,
    sessionsWithQR,

    // Actions
    loadUserSessions,
    createSession,
    startSession,
    stopSession,
    deleteSession,
    loadActiveSessions,
    loadMessages,
    loadMessageStats,
    loadContactStatus,
    loadStatusStats,
    sendMessage,
    saveOutgoingMessage,
    loadContacts,
    subscribeToSessionChanges,
    subscribeToMessages,
    unsubscribeFromMessages,
    setCurrentSession,
    clearError,
    $reset
  }
})
