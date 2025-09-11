<template>
  <div class="max-h-[90vh] overflow-hidden flex flex-col">
    <div class="flex-shrink-0">
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold">
          {{ props.initialOrder ? 'Editar Orden de Venta' : 'Nueva Orden de Venta' }}
        </h3>
        <p class="text-muted-foreground text-sm mt-1">
          {{ props.initialOrder ? 'Modifica los detalles de la orden de venta' : 'Crea una orden de venta para gestionar las solicitudes de productos' }}
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 -mr-2">
      <form @submit.prevent="handleSave" class="space-y-6">
        <!-- Customer and Order Details -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <User class="h-4 w-4" />
              Detalles de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-sm font-medium">Cliente *</label>
                <select
                  v-model="form.customer_id"
                  required
                  class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccionar cliente...</option>
                  <option
                    v-for="customer in salesStore.activeCustomers"
                    :key="customer.id"
                    :value="customer.id"
                  >
                    {{ customer.name }} - {{ customer.doc_number }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Fecha de Orden *</label>
                <Input
                  v-model="form.order_date"
                  type="date"
                  required
                  class="mt-1"
                />
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-sm font-medium">Fecha de Entrega Esperada</label>
                <Input
                  v-model="form.expected_delivery_date"
                  type="date"
                  class="mt-1"
                />
              </div>
              <div>
                <label class="text-sm font-medium">Moneda</label>
                <select
                  v-model="form.currency_code"
                  class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="PEN">PEN - Soles</option>
                  <option value="USD">USD - Dólares</option>
                </select>
              </div>
            </div>

            <div v-if="form.currency_code !== 'PEN'" class="grid gap-4 md:grid-cols-1">
              <div>
                <label class="text-sm font-medium">Tipo de Cambio</label>
                <Input
                  :model-value="exchangeRateInput"
                  @update:model-value="(value: string) => exchangeRateInput = value"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="3.7500"
                  class="mt-1"
                />
              </div>
            </div>

            <div>
              <label class="text-sm font-medium">Observaciones</label>
              <textarea
                v-model="form.notes"
                rows="3"
                placeholder="Observaciones adicionales sobre la orden..."
                class="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <!-- Products -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ShoppingCart class="h-4 w-4" />
                Productos
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="addItem"
              >
                <Plus class="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="form.items.length === 0" class="text-center py-8 text-muted-foreground">
              <Package class="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay productos agregados</p>
              <p class="text-xs">Agrega productos para completar la orden</p>
            </div>
            
            <div v-else class="space-y-4">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="border rounded-lg p-4 space-y-4"
              >
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-sm">Producto {{ index + 1 }}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 text-red-500 hover:text-red-700"
                    @click="removeItem(index)"
                  >
                    <X class="h-3 w-3" />
                  </Button>
                </div>
                
                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label class="text-sm font-medium">Producto *</label>
                    <select
                      v-model="item.product_id"
                      required
                      class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar producto...</option>
                      <option
                        v-for="product in productsStore.activeProducts"
                        :key="product.id"
                        :value="product.id"
                      >
                        {{ product.name }} ({{ product.sku }})
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="text-sm font-medium">Cantidad *</label>
                    <Input
                      :model-value="item.quantity.toString()"
                      @update:model-value="(value: string) => updateItemQuantity(index, parseFloat(value) || 0)"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      class="mt-1"
                    />
                  </div>
                </div>
                
                <div class="grid gap-4 md:grid-cols-3">
                  <div>
                    <label class="text-sm font-medium">Precio Unitario *</label>
                    <Input
                      :model-value="item.unit_price.toString()"
                      @update:model-value="(value: string) => updateItemPrice(index, parseFloat(value) || 0)"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Descuento (%)</label>
                    <Input
                      :model-value="item.discount_pct.toString()"
                      @update:model-value="(value: string) => updateItemDiscount(index, parseFloat(value) || 0)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Total</label>
                    <div class="mt-1 h-10 rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium text-center flex items-center justify-center">
                      {{ formatCurrency(item.total_line) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Order Summary -->
        <Card v-if="form.items.length > 0">
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <Calculator class="h-4 w-4" />
              Resumen de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{{ formatCurrency(orderSubtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm text-green-600">
                <span>Descuentos:</span>
                <span>-{{ formatCurrency(orderDiscounts) }}</span>
              </div>
              <div class="flex justify-between font-bold text-lg border-t border-border pt-2">
                <span>Total:</span>
                <span class="text-primary">{{ formatCurrency(orderTotal) }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>

    <!-- Actions Footer -->
    <div class="flex-shrink-0 pt-6 border-t">
      <div class="flex justify-end gap-3">
        <Button type="button" variant="outline" @click="$emit('cancel')">
          Cancelar
        </Button>
        <Button 
          type="button" 
          @click="handleSave"
          :disabled="!isFormValid || loading"
          class="min-w-24"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? 'Guardando...' : 'Crear Orden' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore, type SalesOrder } from '@/stores/sales'
import { useProductsStore } from '@/stores/products'

// Props
interface Props {
  initialOrder?: any
}

const props = withDefaults(defineProps<Props>(), {
  initialOrder: null
})
import {
  User,
  ShoppingCart,
  Plus,
  X,
  Package,
  Calculator,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'

const emit = defineEmits<{
  save: [data: any]
  cancel: []
}>()

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const productsStore = useProductsStore()

// Loading state
const loading = ref(false)

// Form data
const form = ref({
  company_id: '',
  customer_id: '',
  order_date: new Date().toISOString().split('T')[0],
  expected_delivery_date: '',
  currency_code: 'PEN',
  exchange_rate: 1,
  status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'CANCELLED',
  notes: '',
  items: [] as Array<{
    product_id: string
    quantity: number
    unit_price: number
    discount_pct: number
    total_line: number
  }>
})

// Computed for exchange rate input
const exchangeRateInput = computed({
  get: () => form.value.exchange_rate.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.exchange_rate = isNaN(numericValue) ? 1 : numericValue
  }
})

// Computed
const isFormValid = computed(() => {
  return form.value.customer_id && 
         form.value.order_date &&
         form.value.items.length > 0 &&
         form.value.items.every(item => 
           item.product_id && 
           item.quantity > 0 &&
           item.unit_price >= 0
         )
})

const orderSubtotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
})

const orderDiscounts = computed(() => {
  return form.value.items.reduce((sum, item) => 
    sum + ((item.quantity * item.unit_price) * (item.discount_pct / 100)), 0
  )
})

const orderTotal = computed(() => {
  return orderSubtotal.value - orderDiscounts.value
})

// Methods
const addItem = () => {
  form.value.items.push({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    discount_pct: 0,
    total_line: 0
  })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const updateItemQuantity = (index: number, quantity: number) => {
  form.value.items[index].quantity = quantity
  calculateItemTotal(index)
}

const updateItemPrice = (index: number, price: number) => {
  form.value.items[index].unit_price = price
  calculateItemTotal(index)
}

const updateItemDiscount = (index: number, discount: number) => {
  form.value.items[index].discount_pct = discount
  calculateItemTotal(index)
}

const calculateItemTotal = (index: number) => {
  const item = form.value.items[index]
  const subtotal = item.quantity * item.unit_price
  const discount = subtotal * (item.discount_pct / 100)
  item.total_line = subtotal - discount
}

const formatCurrency = (amount: number) => {
  const symbol = form.value.currency_code === 'PEN' ? 'S/' : '$'
  return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Initialize form with existing order data
const initializeForm = () => {
  if (props.initialOrder) {
    form.value = {
      company_id: props.initialOrder.company_id,
      customer_id: props.initialOrder.customer_id,
      order_date: props.initialOrder.order_date,
      expected_delivery_date: props.initialOrder.expected_delivery_date || '',
      currency_code: props.initialOrder.currency_code,
      exchange_rate: props.initialOrder.exchange_rate,
      status: props.initialOrder.status,
      notes: props.initialOrder.notes || '',
      items: props.initialOrder.items?.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct || 0,
        total_line: item.total_line,
        product_name: item.product_name
      })) || []
    }
  }
}

const handleSave = async () => {
  if (!isFormValid.value || !companiesStore.currentCompany) return
  
  loading.value = true
  
  try {
    const orderData = {
      ...form.value,
      company_id: companiesStore.currentCompany.id,
      total_amount: orderTotal.value
    }
    
    let result
    if (props.initialOrder) {
      // Update existing order
      result = await salesStore.updateSalesOrder(props.initialOrder.id, orderData)
    } else {
      // Create new order
      result = await salesStore.createSalesOrder(orderData)
    }
    
    if (result) {
      emit('save', result)
    }
  } catch (error) {
    console.error('Error saving sales order:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (companiesStore.currentCompany) {
    form.value.company_id = companiesStore.currentCompany.id
    
    // Load necessary data
    await Promise.all([
      productsStore.fetchProducts(companiesStore.currentCompany.id),
      salesStore.fetchCustomers(companiesStore.currentCompany.id)
    ])
  }
  
  // Initialize form with initial order data if provided
  initializeForm()
})

// Watch for changes in initialOrder prop
watch(() => props.initialOrder, () => {
  initializeForm()
}, { deep: true })
</script>