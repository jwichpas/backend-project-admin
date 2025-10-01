<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import QRCode from 'qrcode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-vue-next'

interface Props {
  qrCode?: string
  sessionName?: string
  loading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refresh: []
}>()

const qrImageUrl = ref<string>('')
const generating = ref(false)

const hasQRCode = computed(() => {
  return !!props.qrCode && props.qrCode.trim() !== ''
})

async function generateQRImage() {
  if (!props.qrCode) {
    qrImageUrl.value = ''
    console.log('❌ No QR code provided')
    return
  }

  generating.value = true
  console.log('🔄 Generating QR image from:', props.qrCode.substring(0, 50) + '...')

  try {
    // El QR viene en base64, podemos usarlo directamente
    if (props.qrCode.startsWith('data:image')) {
      qrImageUrl.value = props.qrCode
      console.log('✅ Using base64 image directly')
    } else {
      // Si es solo texto, generar imagen QR
      qrImageUrl.value = await QRCode.toDataURL(props.qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      console.log('✅ Generated QR code from text')
    }
  } catch (error) {
    console.error('❌ Error generating QR code:', error)
  } finally {
    generating.value = false
  }
}

watch(() => props.qrCode, async (newValue, oldValue) => {
  console.log('👀 QR Code prop changed:', {
    hasNew: !!newValue,
    hasOld: !!oldValue,
    newLength: newValue?.length,
    oldLength: oldValue?.length
  })

  if (newValue !== oldValue) {
    await generateQRImage()
  }
}, { immediate: true })
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Escanea el código QR</CardTitle>
      <CardDescription v-if="sessionName">
        Sesión: {{ sessionName }}
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col items-center space-y-4">
      <!-- Loading state -->
      <div v-if="loading || generating" class="flex items-center justify-center w-[300px] h-[300px] bg-muted rounded-lg">
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
      </div>

      <!-- QR Image -->
      <div v-else-if="qrImageUrl && qrImageUrl.length > 0" class="relative">
        <img :src="qrImageUrl" alt="QR Code" class="w-[300px] h-[300px] rounded-lg border-2 border-border" />
      </div>

      <!-- No QR state -->
      <div v-else class="flex flex-col items-center justify-center w-[300px] h-[300px] bg-muted rounded-lg">
        <p class="text-muted-foreground text-sm mb-2">No hay código QR disponible</p>
        <p class="text-xs text-muted-foreground">Haz clic en "Actualizar QR"</p>
      </div>

      <div class="text-center space-y-2">
        <p class="text-sm text-muted-foreground">
          Abre WhatsApp en tu teléfono
        </p>
        <p class="text-xs text-muted-foreground">
          Ve a <span class="font-semibold">Ajustes</span> > <span class="font-semibold">Dispositivos vinculados</span> > <span class="font-semibold">Vincular un dispositivo</span>
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        @click="emit('refresh')"
        :disabled="loading"
        class="w-full"
      >
        <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
        Actualizar QR
      </Button>
    </CardContent>
  </Card>
</template>
