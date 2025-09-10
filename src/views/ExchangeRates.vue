<template>
  <div class="container mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Tipos de Cambio</h1>
      <Button @click="openCreateDialog">
        <Plus class="w-4 h-4 mr-2" />
        Nuevo Tipo de Cambio
      </Button>
    </div>

    <!-- Filtros -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label for="date-from">Fecha Desde</Label>
            <Input 
              id="date-from"
              type="date" 
              v-model="filters.dateFrom"
              @input="loadExchangeRates"
            />
          </div>
          <div>
            <Label for="date-to">Fecha Hasta</Label>
            <Input 
              id="date-to"
              type="date" 
              v-model="filters.dateTo"
              @input="loadExchangeRates"
            />
          </div>
          <div>
            <Label for="from-currency">Moneda Origen</Label>
            <Select 
              v-model="filters.fromCurrency" 
              :options="currencyOptions"
              value-key="value"
              label-key="label"
              placeholder="Seleccionar moneda"
              @update:model-value="loadExchangeRates"
            />
          </div>
          <div>
            <Label for="to-currency">Moneda Destino</Label>
            <Select 
              v-model="filters.toCurrency" 
              :options="currencyOptions"
              value-key="value"
              label-key="label"
              placeholder="Seleccionar moneda"
              @update:model-value="loadExchangeRates"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Tabla de tipos de cambio -->
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Cambio Registrados</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Moneda Origen</TableHead>
                <TableHead>Moneda Destino</TableHead>
                <TableHead class="text-right">Tasa</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead class="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="rate in exchangeRates" :key="rate.id">
                <TableCell>{{ formatDate(rate.rate_date) }}</TableCell>
                <TableCell class="font-mono">{{ rate.from_currency_code }}</TableCell>
                <TableCell class="font-mono">{{ rate.to_currency_code }}</TableCell>
                <TableCell class="text-right font-mono">{{ formatNumber(rate.rate, 6) }}</TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDateTime(rate.created_at) }}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDateTime(rate.updated_at) }}
                </TableCell>
                <TableCell class="text-center">
                  <div class="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      @click="editRate(rate)"
                    >
                      <Edit class="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      @click="deleteRate(rate)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="loading">
                <TableCell colspan="7" class="text-center py-8">
                  <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span class="ml-2">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="!loading && exchangeRates.length === 0">
                <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                  No se encontraron tipos de cambio
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Dialog para crear/editar tipo de cambio -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ editingRate ? 'Editar Tipo de Cambio' : 'Nuevo Tipo de Cambio' }}
          </DialogTitle>
          <div v-if="!editingRate" class="text-sm text-muted-foreground mt-2">
            💡 Opcionalmente se puede crear la conversión inversa automáticamente
          </div>
        </DialogHeader>
        <form @submit.prevent="saveRate" class="space-y-4">
          <div>
            <Label for="rate-date">Fecha *</Label>
            <Input
              id="rate-date"
              type="date"
              v-model="form.rate_date"
              required
            />
          </div>
          <div>
            <Label for="from-currency-select">Moneda Origen *</Label>
            <Select 
              v-model="form.from_currency_code" 
              :options="currencySelectOptions"
              value-key="value"
              label-key="label"
              placeholder="Seleccionar moneda origen"
              required
            />
          </div>
          <div>
            <Label for="to-currency-select">Moneda Destino *</Label>
            <Select 
              v-model="form.to_currency_code" 
              :options="currencySelectOptions"
              value-key="value"
              label-key="label"
              placeholder="Seleccionar moneda destino"
              required
            />
          </div>
          <div>
            <Label for="rate-input">Tasa de Cambio *</Label>
            <Input
              id="rate-input"
              type="number"
              step="0.000001"
              min="0.000001"
              v-model="form.rate"
              placeholder="Ej: 3.725000"
              required
            />
          </div>
          <div v-if="!editingRate">
            <Checkbox 
              v-model="form.create_inverse"
              id="create-inverse"
            >
              Crear conversión inversa automáticamente
            </Checkbox>
            <p class="text-xs text-muted-foreground mt-1">
              Ejemplo: {{ form.from_currency_code && form.to_currency_code && form.rate && parseFloat(form.rate) > 0 
                ? `${form.from_currency_code} → ${form.to_currency_code} (${parseFloat(form.rate).toFixed(6)}) y ${form.to_currency_code} → ${form.from_currency_code} (${(1/parseFloat(form.rate)).toFixed(6)})` 
                : 'Si ingresas USD → PEN (3.750000) también se creará PEN → USD (0.266667)' 
              }}
            </p>
          </div>
          <div v-if="editingRate">
            <Checkbox 
              v-model="form.create_inverse"
              id="update-inverse"
            >
              Actualizar conversión inversa si existe
            </Checkbox>
            <p class="text-xs text-muted-foreground mt-1">
              Si existe la conversión inversa para la misma fecha, también será actualizada
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="saving">
              {{ saving ? 'Guardando...' : (editingRate ? 'Actualizar' : 'Crear') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import Select from '@/components/ui/Select.vue'
import Table from '@/components/ui/Table.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
import { useExchangeRates } from '@/composables/useExchangeRates'
import { useToast } from '@/composables/useToast'

interface ExchangeRate {
  id: number
  rate_date: string
  from_currency_code: string
  to_currency_code: string
  rate: number
  created_at: string
  updated_at: string
}

interface Currency {
  code: string
  descripcion: string
}

const { toast } = useToast()
const { 
  exchangeRates, 
  currencies, 
  loading, 
  fetchExchangeRates, 
  fetchCurrencies,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate
} = useExchangeRates()

// Estados reactivos
const dialogOpen = ref(false)
const editingRate = ref<ExchangeRate | null>(null)
const saving = ref(false)

// Filtros
const filters = ref({
  dateFrom: '',
  dateTo: '',
  fromCurrency: '',
  toCurrency: ''
})

// Formulario
const form = ref({
  rate_date: '',
  from_currency_code: '',
  to_currency_code: '',
  rate: '0',
  create_inverse: true
})

// Computed properties para las opciones del Select
const currencyOptions = computed(() => [
  { value: '', label: 'Todas' },
  ...currencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.descripcion}`
  }))
])

const currencySelectOptions = computed(() =>
  currencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.descripcion}`
  }))
)

// Funciones de formateo
const formatDate = (dateString: string) => {
  // Para fechas que vienen solo como "YYYY-MM-DD", las parseamos manualmente
  // para evitar problemas de zona horaria
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month es 0-indexado en JS
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  // Para fechas con timestamp, usar el método normal
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (value: number, decimals: number = 6) => {
  return value.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Funciones principales
const loadExchangeRates = async () => {
  try {
    await fetchExchangeRates(filters.value)
  } catch (error) {
    toast({
      title: 'Error',
      description: 'No se pudieron cargar los tipos de cambio',
      variant: 'destructive'
    })
  }
}

const openCreateDialog = () => {
  editingRate.value = null
  form.value = {
    rate_date: new Date().toISOString().split('T')[0],
    from_currency_code: '',
    to_currency_code: '',
    rate: '0',
    create_inverse: true
  }
  dialogOpen.value = true
}

const editRate = (rate: ExchangeRate) => {
  editingRate.value = rate
  form.value = {
    rate_date: rate.rate_date,
    from_currency_code: rate.from_currency_code,
    to_currency_code: rate.to_currency_code,
    rate: rate.rate.toString(),
    create_inverse: false // En edición, por defecto no crear/actualizar la inversa
  }
  dialogOpen.value = true
}

const saveRate = async () => {
  if (form.value.from_currency_code === form.value.to_currency_code) {
    toast({
      title: 'Error',
      description: 'Las monedas origen y destino deben ser diferentes',
      variant: 'destructive'
    })
    return
  }

  saving.value = true
  try {
    // Preparar datos excluyendo create_inverse del payload DB
    const { create_inverse, ...dbData } = form.value
    const formData = {
      ...dbData,
      rate: parseFloat(form.value.rate),
      create_inverse: create_inverse // Pasamos como parámetro separado
    }

    if (editingRate.value) {
      await updateExchangeRate(editingRate.value.id, formData)
      toast({
        title: 'Éxito',
        description: 'Tipo de cambio actualizado correctamente'
      })
    } else {
      await createExchangeRate(formData)
      toast({
        title: 'Éxito',
        description: 'Tipo de cambio creado correctamente'
      })
    }
    
    dialogOpen.value = false
    await loadExchangeRates()
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Error al guardar el tipo de cambio',
      variant: 'destructive'
    })
  } finally {
    saving.value = false
  }
}

const deleteRate = async (rate: ExchangeRate) => {
  if (!confirm(`¿Está seguro de eliminar el tipo de cambio ${rate.from_currency_code}/${rate.to_currency_code} del ${formatDate(rate.rate_date)}?`)) {
    return
  }

  try {
    await deleteExchangeRate(rate.id)
    toast({
      title: 'Éxito',
      description: 'Tipo de cambio eliminado correctamente'
    })
    await loadExchangeRates()
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Error al eliminar el tipo de cambio',
      variant: 'destructive'
    })
  }
}

// Inicialización
onMounted(async () => {
  // Establecer fechas por defecto (último mes)
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  
  filters.value.dateFrom = lastMonth.toISOString().split('T')[0]
  filters.value.dateTo = today.toISOString().split('T')[0]
  
  await fetchCurrencies()
  await loadExchangeRates()
})
</script>