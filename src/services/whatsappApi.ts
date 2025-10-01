import { supabase } from '@/lib/supabase'

const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001'

interface LoginResponse {
  success: boolean
  user?: any
  session?: any
  accessToken?: string
  error?: string
}

interface SessionResponse {
  success: boolean
  session?: any
  sessions?: any[]
  isNew?: boolean
  error?: string
}

interface MessageResponse {
  success: boolean
  messages?: any[]
  stats?: any
  error?: string
}

class WhatsAppApiService {
  private accessToken: string | null = null

  /**
   * Obtiene el token de acceso de la sesión actual de Supabase
   */
  private async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    this.accessToken = session?.access_token || null
    return this.accessToken
  }

  /**
   * Realiza peticiones HTTP al API del bot
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken()

    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${WHATSAPP_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición')
    }

    return data
  }

  // ===== SESIONES =====

  /**
   * Crear nueva sesión de WhatsApp
   */
  async createSession(sessionName: string, userId: string): Promise<SessionResponse> {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ sessionName, userId })
    })
  }

  /**
   * Obtener sesiones del usuario
   */
  async getUserSessions(userId: string): Promise<SessionResponse> {
    return this.request(`/api/sessions?userId=${userId}`)
  }

  /**
   * Iniciar sesión de WhatsApp
   */
  async startSession(sessionId: string, userId: string, sessionName: string): Promise<any> {
    return this.request(`/api/sessions/${sessionId}/start`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionName })
    })
  }

  /**
   * Detener sesión de WhatsApp
   */
  async stopSession(sessionId: string): Promise<any> {
    return this.request(`/api/sessions/${sessionId}/stop`, {
      method: 'POST'
    })
  }

  /**
   * Reiniciar sesión de WhatsApp (genera nuevo QR)
   */
  async restartSession(sessionId: string, userId: string, sessionName: string): Promise<any> {
    return this.request(`/api/sessions/${sessionId}/restart`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionName })
    })
  }

  /**
   * Eliminar sesión
   */
  async deleteSession(sessionId: string): Promise<any> {
    return this.request(`/api/sessions/${sessionId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Obtener sesiones activas
   */
  async getActiveSessions(): Promise<any> {
    return this.request('/api/sessions/active')
  }

  // ===== MENSAJES =====

  /**
   * Obtener mensajes de un contacto
   */
  async getMessages(userId: string, phoneNumber: string): Promise<MessageResponse> {
    return this.request(`/api/messages?userId=${userId}&phoneNumber=${phoneNumber}`)
  }

  /**
   * Obtener estadísticas de mensajes
   */
  async getMessageStats(userId: string): Promise<MessageResponse> {
    return this.request(`/api/messages/stats?userId=${userId}`)
  }

  /**
   * Enviar mensaje
   */
  async sendMessage(sessionId: string, to: string, message: string): Promise<any> {
    return this.request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ sessionId, to, message })
    })
  }

  /**
   * Enviar archivo
   */
  async sendFile(sessionId: string, to: string, file: File, caption?: string): Promise<any> {
    const token = await this.getAccessToken()

    const formData = new FormData()
    formData.append('sessionId', sessionId)
    formData.append('to', to)
    formData.append('file', file)
    if (caption) {
      formData.append('caption', caption)
    }

    const response = await fetch(`${WHATSAPP_API_URL}/api/messages/send-file`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al enviar archivo')
    }

    return response.json()
  }

  // ===== ESTADOS =====

  /**
   * Obtener estados de un contacto
   */
  async getContactStatus(userId: string, phoneNumber: string): Promise<any> {
    return this.request(`/api/status/contact?userId=${userId}&phoneNumber=${phoneNumber}`)
  }

  /**
   * Obtener estadísticas de estados
   */
  async getStatusStats(userId: string): Promise<any> {
    return this.request(`/api/status/stats?userId=${userId}`)
  }

  // ===== HEALTH CHECK =====

  /**
   * Verificar estado del servidor
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${WHATSAPP_API_URL}/health`)
    return response.json()
  }
}

export const whatsappApi = new WhatsAppApiService()
