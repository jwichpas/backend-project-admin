<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useWhatsAppStore } from '@/stores/whatsapp'
import { whatsappApi } from '@/services/whatsappApi'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Send, Loader2, User, Phone, MessageSquare, Paperclip, X, Plus, File as FileIcon } from 'lucide-vue-next'
import { countryCodes, formatPhoneNumber } from '@/lib/countryCodes'

const whatsappStore = useWhatsAppStore()
const router = useRouter()

const selectedContact = ref<string | null>(null)
const newMessage = ref('')
const sendingMessage = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)
const showNewMessageDialog = ref(false)
const newContactDialCode = ref('+51')
const newContactPhone = ref('')
const newContactName = ref('')
const activeTab = ref<'messages' | 'status'>('messages')

const currentSession = computed(() => whatsappStore.currentSession)

const contactList = computed(() => {
  // Agrupar mensajes por número de teléfono
  const contactsMap = new Map<string, any>()

  for (const contact of whatsappStore.contacts) {
    if (!contactsMap.has(contact.phone_number)) {
      contactsMap.set(contact.phone_number, {
        phone_number: contact.phone_number,
        contact_name: contact.contact_name,
        last_message_at: contact.last_message_at,
        message_count: contact.message_count,
        is_blocked: contact.is_blocked
      })
    }
  }

  return Array.from(contactsMap.values()).sort((a, b) => {
    const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return dateB - dateA
  })
})

const currentMessages = computed(() => {
  if (!selectedContact.value) return []
  return whatsappStore.messages
    .filter(m => m.phone_number === selectedContact.value)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
})

onMounted(async () => {
  if (!currentSession.value) {
    router.push('/whatsapp')
    return
  }

  await whatsappStore.loadContacts()
  await whatsappStore.loadStatusStats()

  // Suscribirse a mensajes en tiempo real
  whatsappStore.subscribeToMessages()
})

watch(selectedContact, async (newContact) => {
  if (newContact) {
    await whatsappStore.loadMessages(newContact)
    scrollToBottom()
  }
})

watch(() => whatsappStore.messages.length, () => {
  nextTick(() => scrollToBottom())
})

function selectContact(phoneNumber: string) {
  selectedContact.value = phoneNumber
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    selectedFile.value = file

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreview.value = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      filePreview.value = null
    }
  }
}

function removeFile() {
  selectedFile.value = null
  filePreview.value = null
}

async function handleSendMessage() {
  if ((!newMessage.value.trim() && !selectedFile.value) || !selectedContact.value || !currentSession.value) return

  sendingMessage.value = true

  try {
    if (selectedFile.value) {
      // Enviar archivo
      await whatsappApi.sendFile(
        currentSession.value.id,
        selectedContact.value,
        selectedFile.value,
        newMessage.value.trim() || undefined
      )

      console.log('✅ Archivo enviado correctamente')
      removeFile()
    } else {
      // Enviar mensaje de texto
      await whatsappStore.sendMessage(
        currentSession.value.id,
        selectedContact.value,
        newMessage.value.trim()
      )
    }

    newMessage.value = ''
    scrollToBottom()
  } catch (error: any) {
    console.error('Error sending message:', error)
    alert(error.message || 'Error al enviar mensaje')
  } finally {
    sendingMessage.value = false
  }
}

function handleNewContact() {
  if (!newContactPhone.value.trim()) return

  const formattedNumber = formatPhoneNumber(newContactDialCode.value, newContactPhone.value)
  selectedContact.value = formattedNumber

  // Guardar el nombre del contacto si se proporcionó
  if (newContactName.value.trim()) {
    // Aquí podrías guardar el nombre en localStorage o en una store
    // Por ahora solo lo usaremos para mostrar
  }

  showNewMessageDialog.value = false
  newContactPhone.value = ''
  newContactName.value = ''
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer'
  } else {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function getContactDisplayName(phoneNumber: string) {
  const contact = contactList.value.find(c => c.phone_number === phoneNumber)
  return contact?.contact_name || phoneNumber
}

function openFile(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <div class="border-b bg-background p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="router.push('/whatsapp')">
            <ArrowLeft class="w-5 h-5" />
          </Button>
          <div>
            <h1 class="text-xl font-bold">
              {{ currentSession?.session_name || 'Mensajes' }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ currentSession?.phone_number || 'WhatsApp Business' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button size="sm" @click="showNewMessageDialog = true">
            <Plus class="w-4 h-4 mr-2" />
            Nuevo Mensaje
          </Button>

          <Badge v-if="currentSession?.status === 'connected'" variant="default">
            Conectado
          </Badge>
        </div>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Contacts Sidebar -->
      <Card class="w-80 rounded-none border-y-0 border-l-0">
        <CardHeader class="pb-3">
          <div class="flex gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              class="flex-1"
              :class="{ 'bg-accent': activeTab === 'messages' }"
              @click="activeTab = 'messages'"
            >
              Mensajes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="flex-1"
              :class="{ 'bg-accent': activeTab === 'status' }"
              @click="activeTab = 'status'"
            >
              Estados
            </Button>
          </div>
          <CardTitle class="text-base">
            {{ activeTab === 'messages' ? 'Conversaciones' : 'Estados de WhatsApp' }}
          </CardTitle>
          <CardDescription>
            {{ activeTab === 'messages' ? `${contactList.length} contactos` : `${whatsappStore.statusStats?.total || 0} estados` }}
          </CardDescription>
        </CardHeader>
        <CardContent class="p-0">
          <ScrollArea class="h-[calc(100vh-240px)]">
            <div v-if="whatsappStore.loading" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
            </div>

            <!-- Tab: Mensajes -->
            <div v-else-if="activeTab === 'messages'">
              <div v-if="contactList.length === 0" class="text-center py-8 px-4">
                <MessageSquare class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p class="text-sm text-muted-foreground">No hay conversaciones</p>
              </div>

              <div v-else>
                <button
                  v-for="contact in contactList"
                  :key="contact.phone_number"
                  @click="selectContact(contact.phone_number)"
                  class="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b"
                  :class="{ 'bg-accent': selectedContact === contact.phone_number }"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User class="w-5 h-5 text-primary" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <p class="font-medium truncate">
                          {{ contact.contact_name || contact.phone_number }}
                        </p>
                        <span v-if="contact.last_message_at" class="text-xs text-muted-foreground">
                          {{ formatDate(contact.last_message_at) }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <p class="text-sm text-muted-foreground truncate">
                          {{ contact.phone_number }}
                        </p>
                        <Badge v-if="contact.message_count" variant="secondary" class="text-xs">
                          {{ contact.message_count }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Tab: Estados -->
            <div v-else-if="activeTab === 'status'">
              <div v-if="!whatsappStore.statusStats?.by_contact || whatsappStore.statusStats.by_contact.length === 0" class="text-center py-8 px-4">
                <MessageSquare class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p class="text-sm text-muted-foreground">No hay estados recientes</p>
              </div>

              <div v-else>
                <div
                  v-for="contact in whatsappStore.statusStats.by_contact"
                  :key="contact.phone_number"
                  class="px-4 py-3 hover:bg-accent transition-colors border-b"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center ring-2 ring-green-500">
                      <User class="w-5 h-5 text-green-600" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <p class="font-medium truncate">
                          {{ contact.contact_name || contact.phone_number }}
                        </p>
                        <span v-if="contact.last_status" class="text-xs text-muted-foreground">
                          {{ formatDate(contact.last_status) }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <p class="text-sm text-muted-foreground truncate">
                          {{ contact.phone_number.replace('@c.us', '') }}
                        </p>
                        <Badge variant="secondary" class="text-xs">
                          {{ contact.count }} estado{{ contact.count > 1 ? 's' : '' }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <!-- Chat Area -->
      <div class="flex-1 flex flex-col">
        <div v-if="!selectedContact" class="flex-1 flex items-center justify-center bg-muted/20">
          <div class="text-center">
            <MessageSquare class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold mb-2">Selecciona una conversación</h3>
            <p class="text-muted-foreground">Elige un contacto para ver los mensajes</p>
          </div>
        </div>

        <template v-else>
          <!-- Chat Header -->
          <div class="border-b p-4 bg-background">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 class="font-semibold">{{ getContactDisplayName(selectedContact) }}</h2>
                <p class="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone class="w-3 h-3" />
                  {{ selectedContact }}
                </p>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <ScrollArea ref="messagesContainer" class="flex-1 p-4 bg-muted/20">
            <div v-if="whatsappStore.loading" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
            </div>

            <div v-else-if="currentMessages.length === 0" class="text-center py-8">
              <p class="text-muted-foreground">No hay mensajes en esta conversación</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="message in currentMessages"
                :key="message.id"
                class="flex"
                :class="message.is_incoming ? 'justify-start' : 'justify-end'"
              >
                <div
                  class="max-w-[70%] rounded-lg px-4 py-2"
                  :class="
                    message.is_incoming
                      ? 'bg-background border'
                      : 'bg-primary text-primary-foreground'
                  "
                >
                  <!-- File Preview (if has file) -->
                  <div v-if="message.file_url" class="mb-2">
                    <!-- Image -->
                    <div v-if="message.message_type === 'image'" class="mb-2">
                      <img
                        :src="message.file_url"
                        :alt="message.file_name"
                        class="max-w-full rounded-md cursor-pointer hover:opacity-90"
                        style="max-height: 300px"
                        @click="openFile(message.file_url)"
                      />
                    </div>

                    <!-- Document/File -->
                    <div v-else class="flex items-center gap-2 p-2 bg-muted/20 rounded">
                      <FileIcon class="w-5 h-5" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ message.file_name }}</p>
                        <p class="text-xs opacity-70">
                          {{ formatFileSize(message.file_size) }}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        @click="openFile(message.file_url)"
                        class="flex-shrink-0"
                      >
                        Ver
                      </Button>
                    </div>
                  </div>

                  <!-- Message Body -->
                  <p v-if="message.message_body" class="text-sm whitespace-pre-wrap break-words">
                    {{ message.message_body }}
                  </p>

                  <!-- Timestamp -->
                  <p
                    class="text-xs mt-1"
                    :class="message.is_incoming ? 'text-muted-foreground' : 'text-primary-foreground/70'"
                  >
                    {{ formatTime(message.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <!-- Message Input -->
          <div class="border-t p-4 bg-background space-y-2">
            <!-- File Preview -->
            <div v-if="selectedFile" class="flex items-center gap-2 p-2 bg-muted rounded-md">
              <div v-if="filePreview" class="flex-shrink-0">
                <img :src="filePreview" alt="Preview" class="w-16 h-16 object-cover rounded" />
              </div>
              <div v-else class="flex-shrink-0 w-16 h-16 bg-muted-foreground/10 rounded flex items-center justify-center">
                <FileIcon class="w-8 h-8 text-muted-foreground" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ selectedFile.name }}</p>
                <p class="text-xs text-muted-foreground">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
              </div>
              <Button variant="ghost" size="icon" @click="removeFile">
                <X class="w-4 h-4" />
              </Button>
            </div>

            <!-- Input Form -->
            <form @submit.prevent="handleSendMessage" class="flex gap-2">
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                @change="handleFileSelect"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                @click="$refs.fileInput?.click()"
                :disabled="sendingMessage || currentSession?.status !== 'connected'"
              >
                <Paperclip class="w-4 h-4" />
              </Button>

              <Input
                v-model="newMessage"
                placeholder="Escribe un mensaje..."
                class="flex-1"
                :disabled="sendingMessage || currentSession?.status !== 'connected'"
              />

              <Button
                type="submit"
                :disabled="(!newMessage.trim() && !selectedFile) || sendingMessage || currentSession?.status !== 'connected'"
              >
                <Loader2 v-if="sendingMessage" class="w-4 h-4 animate-spin" />
                <Send v-else class="w-4 h-4" />
              </Button>
            </form>

            <p v-if="currentSession?.status !== 'connected'" class="text-xs text-muted-foreground">
              La sesión no está conectada
            </p>
            <p v-else class="text-xs text-green-600">
              ✅ Sesión conectada - Espera 10-15 segundos antes de enviar el primer mensaje
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- New Message Modal -->
    <div
      v-if="showNewMessageDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showNewMessageDialog = false"
    >
      <div class="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
        <div>
          <h2 class="text-lg font-semibold">Nuevo Mensaje</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Ingresa el número de teléfono del contacto
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Nombre del Contacto (Opcional)</Label>
            <Input
              v-model="newContactName"
              placeholder="Ej: Juan Pérez"
              type="text"
            />
          </div>

          <div class="space-y-2">
            <Label>Código de País</Label>
            <select
              v-model="newContactDialCode"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option v-for="country in countryCodes" :key="country.code" :value="country.dial_code">
                {{ country.flag }} {{ country.name }} ({{ country.dial_code }})
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <Label>Número de Teléfono</Label>
            <Input
              v-model="newContactPhone"
              placeholder="987654321"
              type="tel"
              @keyup.enter="handleNewContact"
            />
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showNewMessageDialog = false">
            Cancelar
          </Button>
          <Button @click="handleNewContact" :disabled="!newContactPhone.trim()">
            Iniciar Chat
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
