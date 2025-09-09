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
          <label for="code" class="block text-sm font-medium mb-2">Código *</label>
          <Input
            id="code"
            v-model="form.code"
            type="text"
            placeholder="SUC001"
            :disabled="loading"
            required
            @blur="validateCode"
          />
          <p class="text-xs text-gray-500 mt-1">Código único de la sucursal</p>
          <p v-if="codeError" class="text-xs text-red-500 mt-1">{{ codeError }}</p>
        </div>
        
        <div>
          <label for="name" class="block text-sm font-medium mb-2">Nombre *</label>
          <Input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Sucursal Principal"
            :disabled="loading"
            required
          />
        </div>
      </div>

      <div>
        <label for="address" class="block text-sm font-medium mb-2">Dirección</label>
        <textarea
          id="address"
          v-model="form.address"
          class="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px]"
          placeholder="Dirección completa de la sucursal"
          :disabled="loading"
        ></textarea>
      </div>
    </div>

    <!-- Ubicación -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium">Ubicación Geográfica</h3>
      
      <div>
        <label for="ubigeo" class="block text-sm font-medium mb-2">Ubigeo</label>
        <div class="relative">
          <Input
            id="ubigeo"
            v-model="ubigeoSearch"
            type="text"
            placeholder="Buscar departamento, provincia, distrito..."
            :disabled="loading"
            @input="searchUbigeo"
          />
          
          <!-- Dropdown de resultados -->
          <div
            v-if="ubigeoResults.length > 0"
            class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            <div
              v-for="ubigeo in ubigeoResults"
              :key="ubigeo.code"
              class="px-4 py-2 cursor-pointer hover:bg-gray-50"
              @click="selectUbigeo(ubigeo)"
            >
              <div class="text-sm font-medium">
                {{ ubigeo.distrito }}, {{ ubigeo.provincia }}
              </div>
              <div class="text-xs text-gray-500">
                {{ ubigeo.departamento }} ({{ ubigeo.code }})
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="selectedUbigeo" class="mt-2 p-2 bg-blue-50 rounded-md">
          <p class="text-sm">
            <span class="font-medium">Seleccionado:</span>
            {{ selectedUbigeo.distrito }}, {{ selectedUbigeo.provincia }}, {{ selectedUbigeo.departamento }}
            ({{ selectedUbigeo.code }})
          </p>
        </div>
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
        :disabled="loading || !!codeError"
      >
        <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        {{ loading ? 'Guardando...' : (mode === 'edit' ? 'Actualizar' : 'Crear') }} Sucursal
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useBranchesStore } from '@/stores/branches'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

interface BranchFormData {
  id?: string
  company_id: string
  code: string
  name: string
  address: string
  ubigeo_code: string | null
}

const props = defineProps<{
  companyId: string
  initialData?: Partial<BranchFormData>
  mode?: 'create' | 'edit'
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: BranchFormData]
  cancel: []
}>()

const branchesStore = useBranchesStore()

const error = ref<string | null>(null)
const codeError = ref<string | null>(null)
const ubigeoSearch = ref('')
const ubigeoResults = ref<any[]>([])
const selectedUbigeo = ref<any | null>(null)

const defaultForm: BranchFormData = {
  company_id: props.companyId,
  code: '',
  name: '',
  address: '',
  ubigeo_code: null
}

const form = reactive<BranchFormData>({ ...defaultForm })

const findUbigeoByCode = async (code: string) => {
  try {
    if (branchesStore.ubigeoData.length === 0) {
      await branchesStore.fetchUbigeoData()
    }
    
    const ubigeo = branchesStore.ubigeoData.find(u => u.code === code)
    if (ubigeo) {
      selectedUbigeo.value = ubigeo
      ubigeoSearch.value = `${ubigeo.distrito}, ${ubigeo.provincia}, ${ubigeo.departamento}`
    }
  } catch (err) {
    console.error('Error finding ubigeo:', err)
  }
}

watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.assign(form, { ...defaultForm, ...newData })
    
    // Si hay ubigeo_code, buscar el ubigeo seleccionado
    if (newData.ubigeo_code) {
      findUbigeoByCode(newData.ubigeo_code)
    }
  }
}, { immediate: true, deep: true })

const validateCode = async () => {
  codeError.value = null
  
  if (!form.code.trim()) {
    return
  }

  const isUnique = await branchesStore.validateUniqueCode(
    props.companyId,
    form.code,
    props.mode === 'edit' ? form.id : undefined
  )

  if (!isUnique) {
    codeError.value = 'Este código ya está en uso'
  }
}

const searchUbigeo = async () => {
  if (ubigeoSearch.value.length < 3) {
    ubigeoResults.value = []
    return
  }

  try {
    ubigeoResults.value = await branchesStore.searchUbigeo(ubigeoSearch.value)
  } catch (err) {
    console.error('Error searching ubigeo:', err)
    ubigeoResults.value = []
  }
}

const selectUbigeo = (ubigeo: any) => {
  selectedUbigeo.value = ubigeo
  form.ubigeo_code = ubigeo.code
  ubigeoSearch.value = `${ubigeo.distrito}, ${ubigeo.provincia}, ${ubigeo.departamento}`
  ubigeoResults.value = []
}


const onSubmit = () => {
  error.value = null
  
  if (!form.code.trim()) {
    error.value = 'El código es requerido'
    return
  }
  
  if (!form.name.trim()) {
    error.value = 'El nombre es requerido'
    return
  }

  if (codeError.value) {
    error.value = 'Por favor corrige los errores antes de continuar'
    return
  }

  emit('submit', { ...form })
}

const resetForm = () => {
  Object.assign(form, defaultForm)
  error.value = null
  codeError.value = null
  ubigeoSearch.value = ''
  selectedUbigeo.value = null
  ubigeoResults.value = []
}

onMounted(() => {
  if (branchesStore.ubigeoData.length === 0) {
    branchesStore.fetchUbigeoData()
  }
})

defineExpose({
  resetForm
})
</script>