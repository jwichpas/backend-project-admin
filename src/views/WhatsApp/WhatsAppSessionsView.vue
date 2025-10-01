<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useWhatsAppStore } from '@/stores/whatsapp'
import { useAuthStore } from '@/stores/auth'
import { whatsappApi } from '@/services/whatsappApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Smartphone, Plus, Play, Square, Trash2, Loader2, QrCode, MessageSquare } from 'lucide-vue-next'
import QRCodeDisplay from '@/components/whatsapp/QRCodeDisplay.vue'
import { useRouter } from 'vue-router'

const whatsappStore = useWhatsAppStore()
const authStore = useAuthStore()
const router = useRouter()

const newSessionName = ref('')
const showCreateDialog = ref(false)
const showQRDialog = ref(false)
const selectedSession = ref<any>(null)
const actionLoading = ref<Record<string, boolean>>({})
const qrRefreshKey = ref(0)

const stats = computed(() => {
  return {
    total: whatsappStore.sessions.length,
    connected: whatsappStore.connectedSessions.length,
    disconnected: whatsappStore.disconnectedSessions.length,
    withQR: whatsappStore.sessionsWithQR.length
  }
})

let sessionSubscription: any = null

onMounted(async () => {
  await whatsappStore.loadUserSessions()
  await whatsappStore.loadMessageStats()
  whatsappStore.subscribeToMessages()

  // Suscribirse a cambios en las sesiones en tiempo real usando Supabase Realtime
  if (authStore.user?.id) {
    const { supabase } = await import('@/lib/supabase')

    console.log('🔔 Subscribing to realtime updates for user:', authStore.user.id)

    sessionSubscription = supabase
      .channel('whatsapp_sessions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_sessions',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          console.log('🔔 Session updated via realtime:', payload)

          // Actualizar en el store
          const index = whatsappStore.sessions.findIndex(s => s.id === payload.new.id)
          if (index !== -1) {
            whatsappStore.sessions[index] = payload.new as any
            console.log('✅ Store updated for session:', payload.new.session_name)
          }

          // Actualizar sesión seleccionada si es la misma
          if (selectedSession.value && selectedSession.value.id === payload.new.id) {
            const oldStatus = selectedSession.value.status
            selectedSession.value = { ...payload.new as any }
            qrRefreshKey.value++

            console.log('🔄 Selected session status changed:', oldStatus, '->', payload.new.status)

            // Si se conectó, cerrar el diálogo QR y mostrar notificación
            if (payload.new.status === 'connected' && oldStatus !== 'connected') {
              showQRDialog.value = false
              console.log('🎉 WhatsApp connected! Closing dialog...')

              // Usar setTimeout para asegurar que la UI se actualice
              setTimeout(() => {
                alert('¡WhatsApp conectado exitosamente! ✅')
              }, 100)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })
  }
})

onUnmounted(() => {
  if (sessionSubscription) {
    console.log('🔌 Unsubscribing from realtime updates')
    sessionSubscription.unsubscribe()
  }
})

async function handleCreateSession() {
  if (!newSessionName.value.trim()) return

  try {
    const session = await whatsappStore.createSession(newSessionName.value.trim())
    newSessionName.value = ''
    showCreateDialog.value = false

    // Iniciar automáticamente la sesión
    await handleStartSession(session)
  } catch (error: any) {
    console.error('Error creating session:', error)
    alert(error.message)
  }
}

async function handleStartSession(session: any) {
  actionLoading.value[session.id] = true

  try {
    await whatsappStore.startSession(session)

    // Limpiar el loading antes de mostrar el QR
    actionLoading.value[session.id] = false

    // Mostrar QR si está disponible
    setTimeout(() => {
      const updatedSession = whatsappStore.sessions.find(s => s.id === session.id)
      if (updatedSession && updatedSession.status === 'qr_code') {
        selectedSession.value = updatedSession
        showQRDialog.value = true
      }
    }, 2000)
  } catch (error: any) {
    console.error('Error starting session:', error)
    alert(error.message)
    actionLoading.value[session.id] = false
  }
}

async function handleStopSession(sessionId: string) {
  actionLoading.value[sessionId] = true

  try {
    await whatsappStore.stopSession(sessionId)
  } catch (error: any) {
    console.error('Error stopping session:', error)
    alert(error.message)
  } finally {
    actionLoading.value[sessionId] = false
  }
}

async function handleDeleteSession(sessionId: string) {
  actionLoading.value[sessionId] = true

  try {
    await whatsappStore.deleteSession(sessionId)
  } catch (error: any) {
    console.error('Error deleting session:', error)
    alert(error.message)
  } finally {
    actionLoading.value[sessionId] = false
  }
}

function handleShowQR(session: any) {
  selectedSession.value = session
  showQRDialog.value = true
}

async function handleRefreshQR() {
  if (!selectedSession.value || !authStore.user?.id) return

  console.log('Restarting session to generate new QR...')

  actionLoading.value[selectedSession.value.id] = true

  try {
    // Reiniciar la sesión (esto genera un nuevo QR)
    await whatsappApi.restartSession(
      selectedSession.value.id,
      authStore.user.id,
      selectedSession.value.session_name
    )

    // Esperar un momento para que se genere el QR
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Recargar sesiones desde el servidor
    await whatsappStore.loadUserSessions()

    // Buscar la sesión actualizada
    const updated = whatsappStore.sessions.find(s => s.id === selectedSession.value.id)

    if (updated) {
      console.log('Updated session:', updated)
      console.log('New QR Code:', updated.qr_code?.substring(0, 50) + '...')

      // Forzar actualización creando un nuevo objeto
      selectedSession.value = { ...updated }

      // Incrementar key para forzar re-render
      qrRefreshKey.value++
    }
  } catch (error: any) {
    console.error('Error refreshing QR:', error)
    alert('Error al generar nuevo QR: ' + error.message)
  } finally {
    if (selectedSession.value) {
      actionLoading.value[selectedSession.value.id] = false
    }
  }
}

function handleViewMessages(session: any) {
  whatsappStore.setCurrentSession(session)
  router.push('/whatsapp/messages')
}

function getStatusBadge(status: string) {
  const badges: Record<string, { variant: any; label: string }> = {
    connected: { variant: 'default', label: 'Conectado' },
    connecting: { variant: 'secondary', label: 'Conectando...' },
    qr_code: { variant: 'outline', label: 'Escanear QR' },
    disconnected: { variant: 'secondary', label: 'Desconectado' },
    error: { variant: 'destructive', label: 'Error' }
  }

  return badges[status] || { variant: 'secondary', label: status }
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Nunca'
  const date = new Date(dateString)
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">WhatsApp Business</h1>
        <p class="text-muted-foreground">Gestiona tus sesiones de WhatsApp</p>
      </div>

      <Dialog v-model:open="showCreateDialog">
        <DialogTrigger as-child>
          <Button>
            <Plus class="w-4 h-4 mr-2" />
            Nueva Sesión
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Sesión de WhatsApp</DialogTitle>
            <DialogDescription>
              Ingresa un nombre único para identificar esta sesión
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="session-name">Nombre de la sesión</Label>
              <Input
                id="session-name"
                v-model="newSessionName"
                placeholder="Ej: Ventas, Soporte, Principal"
                @keyup.enter="handleCreateSession"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showCreateDialog = false">Cancelar</Button>
            <Button
              @click="handleCreateSession"
              :disabled="!newSessionName.trim() || whatsappStore.loading"
            >
              <Loader2 v-if="whatsappStore.loading" class="w-4 h-4 mr-2 animate-spin" />
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Sesiones</CardTitle>
          <Smartphone class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.total }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Conectadas</CardTitle>
          <Smartphone class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-600">{{ stats.connected }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Desconectadas</CardTitle>
          <Smartphone class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.disconnected }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Mensajes Hoy</CardTitle>
          <MessageSquare class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ whatsappStore.messageStats?.today || 0 }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Sessions List -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Sesiones Activas</h2>

      <div v-if="whatsappStore.loading && whatsappStore.sessions.length === 0" class="flex justify-center py-8">
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="whatsappStore.sessions.length === 0" class="text-center py-12">
        <Smartphone class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">No hay sesiones</h3>
        <p class="text-muted-foreground mb-4">Crea tu primera sesión de WhatsApp para comenzar</p>
        <Button @click="showCreateDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Crear Primera Sesión
        </Button>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="session in whatsappStore.sessions" :key="session.id">
          <CardHeader>
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <CardTitle class="text-base">{{ session.session_name }}</CardTitle>
                <CardDescription v-if="session.phone_number">
                  {{ session.phone_number }}
                </CardDescription>
              </div>
              <Badge :variant="getStatusBadge(session.status).variant">
                {{ getStatusBadge(session.status).label }}
              </Badge>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="text-sm space-y-1">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Creada:</span>
                <span>{{ formatDate(session.created_at) }}</span>
              </div>
              <div v-if="session.last_connected_at" class="flex justify-between">
                <span class="text-muted-foreground">Última conexión:</span>
                <span>{{ formatDate(session.last_connected_at) }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <!-- Start/Stop Button -->
              <Button
                v-if="session.status === 'disconnected' || session.status === 'error'"
                size="sm"
                @click="handleStartSession(session)"
                :disabled="actionLoading[session.id]"
                class="flex-1"
              >
                <Loader2 v-if="actionLoading[session.id]" class="w-4 h-4 mr-2 animate-spin" />
                <Play v-else class="w-4 h-4 mr-2" />
                Iniciar
              </Button>

              <Button
                v-else-if="session.status === 'connected'"
                size="sm"
                variant="outline"
                @click="handleStopSession(session.id)"
                :disabled="actionLoading[session.id]"
                class="flex-1"
              >
                <Loader2 v-if="actionLoading[session.id]" class="w-4 h-4 mr-2 animate-spin" />
                <Square v-else class="w-4 h-4 mr-2" />
                Detener
              </Button>

              <!-- Show QR Button -->
              <Button
                v-if="session.status === 'qr_code' && session.qr_code"
                size="sm"
                variant="secondary"
                @click="handleShowQR(session)"
                class="flex-1"
              >
                <QrCode class="w-4 h-4 mr-2" />
                Ver QR
              </Button>

              <!-- Messages Button -->
              <Button
                v-if="session.status === 'connected'"
                size="sm"
                variant="outline"
                @click="handleViewMessages(session)"
              >
                <MessageSquare class="w-4 h-4" />
              </Button>

              <!-- Delete Button -->
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button size="sm" variant="destructive">
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los datos de la sesión "{{ session.session_name }}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      @click="handleDeleteSession(session.id)"
                      class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- QR Code Dialog -->
    <Dialog v-model:open="showQRDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escanea el código QR con tu dispositivo móvil
          </DialogDescription>
        </DialogHeader>

        <QRCodeDisplay
          v-if="selectedSession"
          :key="`qr-${selectedSession.id}-${qrRefreshKey}`"
          :qr-code="selectedSession.qr_code"
          :session-name="selectedSession.session_name"
          :loading="actionLoading[selectedSession.id]"
          @refresh="handleRefreshQR"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>
