<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div v-if="error" class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ error }}
    </div>

    <!-- Información básica -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium">Información Básica</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="ruc" class="block text-sm font-medium mb-2">RUC *</label>
          <Input
            id="ruc"
            v-model="form.ruc"
            type="text"
            maxlength="11"
            placeholder="20123456789"
            :disabled="loading || mode === 'edit'"
            required
          />
          <p class="text-xs text-gray-500 mt-1">Registro Único de Contribuyente (11 dígitos)</p>
        </div>
        
        <div>
          <label for="legal_name" class="block text-sm font-medium mb-2">Razón Social *</label>
          <Input
            id="legal_name"
            v-model="form.legal_name"
            type="text"
            placeholder="EMPRESA EJEMPLO S.A.C."
            :disabled="loading"
            required
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="trade_name" class="block text-sm font-medium mb-2">Nombre Comercial</label>
          <Input
            id="trade_name"
            v-model="form.trade_name"
            type="text"
            placeholder="Empresa Ejemplo"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="currency_code" class="block text-sm font-medium mb-2">Moneda Base *</label>
          <select
            id="currency_code"
            v-model="form.currency_code"
            class="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            :disabled="loading"
            required
          >
            <option value="PEN">Soles (PEN)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Información de contacto -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium">Información de Contacto</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-2">Email</label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="contacto@empresa.com"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="phone" class="block text-sm font-medium mb-2">Teléfono</label>
          <Input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="+51 999 999 999"
            :disabled="loading"
          />
        </div>
      </div>

      <div>
        <label for="address" class="block text-sm font-medium mb-2">Dirección</label>
        <textarea
          id="address"
          v-model="form.address"
          class="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px]"
          placeholder="Dirección completa de la empresa"
          :disabled="loading"
        ></textarea>
      </div>

      <div>
        <label for="website" class="block text-sm font-medium mb-2">Sitio Web</label>
        <Input
          id="website"
          v-model="form.website"
          type="url"
          placeholder="https://www.empresa.com"
          :disabled="loading"
        />
      </div>
    </div>

    <!-- Configuración -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium">Configuración</h3>
      
      <div>
        <label for="valuation_method" class="block text-sm font-medium mb-2">Método de Valuación *</label>
        <select
          id="valuation_method"
          v-model="form.valuation_method"
          class="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          :disabled="loading"
          required
        >
          <option value="PROMEDIO_MOVIL">Promedio Móvil</option>
          <option value="FIFO">FIFO (Primero en Entrar, Primero en Salir)</option>
          <option value="LIFO">LIFO (Último en Entrar, Primero en Salir)</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">Método para calcular el costo de inventarios</p>
      </div>
    </div>

    <!-- Configuración de Facturación Electrónica -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium">Facturación Electrónica (SUNAT)</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="sol_user" class="block text-sm font-medium mb-2">Usuario SOL</label>
          <Input
            id="sol_user"
            v-model="form.sol_user"
            type="text"
            placeholder="Usuario SUNAT"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label for="sol_pass" class="block text-sm font-medium mb-2">Clave SOL</label>
          <Input
            id="sol_pass"
            v-model="form.sol_pass"
            type="password"
            placeholder="Contraseña SUNAT"
            :disabled="loading"
          />
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <input
          id="production"
          v-model="form.production"
          type="checkbox"
          class="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          :disabled="loading"
        />
        <label for="production" class="text-sm font-medium">Entorno de Producción</label>
        <p class="text-xs text-gray-500">(Desmarcar para pruebas)</p>
      </div>
    </div>

    <!-- Botones -->
    <div class="flex justify-end space-x-3 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        :disabled="loading"
      >
        <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        {{ loading ? 'Guardando...' : (mode === 'edit' ? 'Actualizar' : 'Crear') }} Empresa
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

interface CompanyFormData {
  ruc: string
  legal_name: string
  trade_name: string
  email: string
  phone: string
  address: string
  website: string
  currency_code: string
  valuation_method: string
  sol_user: string
  sol_pass: string
  production: boolean
}

const props = defineProps<{
  initialData?: Partial<CompanyFormData>
  mode?: 'create' | 'edit'
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: CompanyFormData]
  cancel: []
}>()

const error = ref<string | null>(null)

const defaultForm: CompanyFormData = {
  ruc: '',
  legal_name: '',
  trade_name: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  currency_code: 'PEN',
  valuation_method: 'PROMEDIO_MOVIL',
  sol_user: '',
  sol_pass: '',
  production: false
}

const form = reactive<CompanyFormData>({ ...defaultForm })

watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.assign(form, { ...defaultForm, ...newData })
  }
}, { immediate: true, deep: true })

const onSubmit = () => {
  error.value = null
  
  if (!form.ruc || form.ruc.length !== 11) {
    error.value = 'El RUC debe tener exactamente 11 dígitos'
    return
  }
  
  if (!form.legal_name.trim()) {
    error.value = 'La razón social es requerida'
    return
  }

  emit('submit', { ...form })
}

const resetForm = () => {
  Object.assign(form, defaultForm)
  error.value = null
}

defineExpose({
  resetForm
})
</script>