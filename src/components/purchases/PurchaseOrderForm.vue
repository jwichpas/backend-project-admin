<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Basic Information -->
    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label class="text-sm font-medium">Proveedor *</label>
        <select
          v-model="form.supplier_id"
          class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
          :disabled="loading"
        >
          <option value="">Seleccionar proveedor</option>
          <option 
            v-for="supplier in purchasesStore.activeSuppliers" 
            :key="supplier.id" 
            :value="supplier.id"
          >
            {{ supplier.name }}
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
          :disabled="loading"
        />
      </div>

      <div>
        <label class="text-sm font-medium">Fecha Esperada de Entrega</label>
        <Input
          v-model="form.expected_delivery_date"
          type="date"
          class="mt-1"
          :disabled="loading"
        />
      </div>

      <div>
        <label class="text-sm font-medium">Moneda *</label>
        <select
          v-model="form.currency_code"
          class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
          :disabled="loading || currenciesLoading"
          @change="onCurrencyChange"
        >
          <option value="" disabled>
            {{ currenciesLoading ? 'Cargando monedas...' : 'Seleccionar moneda' }}
          </option>
          <option 
            v-for="option in currencyOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div v-if="form.currency_code && form.currency_code !== 'PEN'" class="md:col-span-2">
        <label class="text-sm font-medium">Tipo de Cambio</label>
        <Input
          v-model="exchangeRateInput"
          type="number"
          step="0.000001"
          min="0.000001"
          placeholder="Ejemplo: 3.750000"
          class="mt-1"
          :disabled="loading"
        />
        <p class="text-xs text-muted-foreground mt-1">
          Tipo de cambio de {{ form.currency_code }} a PEN
        </p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Productos</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          @click="showAddItemDialog = true"
          :disabled="loading"
        >
          <Plus class="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      <!-- Items Table -->
      <div class="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio Unit.</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead class="text-right">Total</TableHead>
              <TableHead class="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="form.items.length === 0">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                No hay productos agregados
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="(item, index) in form.items" :key="index">
              <TableCell>
                <div class="font-medium">{{ getProductName(item.product_id) }}</div>
                <div class="text-sm text-muted-foreground">{{ getProductSku(item.product_id) }}</div>
              </TableCell>
              <TableCell>
                <div class="text-sm">{{ item.description || '-' }}</div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <span class="font-medium">{{ item.quantity }}</span>
                  <span class="text-xs text-muted-foreground">{{ getUnitDescription(item.unit_code) }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="font-medium">
                  {{ formatCurrency(item.unit_price, form.currency_code) }}
                </div>
              </TableCell>
              <TableCell>
                <div v-if="item.discount_pct > 0" class="text-green-600">
                  {{ item.discount_pct }}%
                </div>
                <div v-else class="text-muted-foreground">-</div>
              </TableCell>
              <TableCell class="text-right">
                <div class="font-medium">
                  {{ formatCurrency(calculateItemTotal(item), form.currency_code) }}
                </div>
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  @click="removeItem(index)"
                  :disabled="loading"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Total Section -->
      <div class="flex justify-end">
        <div class="bg-muted p-4 rounded-lg min-w-64">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span class="font-medium">{{ formatCurrency(subtotal, form.currency_code) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(subtotal, form.currency_code) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="text-sm font-medium">Notas</label>
      <textarea
        v-model="form.notes"
        class="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        rows="3"
        placeholder="Notas adicionales..."
        :disabled="loading"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-4 border-t">
      <Button type="button" variant="outline" @click="$emit('cancel')" :disabled="loading">
        Cancelar
      </Button>
      <Button type="submit" :disabled="loading || !isFormValid">
        {{ loading ? 'Guardando...' : 'Guardar Orden' }}
      </Button>
    </div>

    <!-- Add Item Dialog -->
    <Dialog v-model:open="showAddItemDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Producto</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Producto *</label>
            <ProductSearchSelect
              v-model="newItem.product_id"
              :company-id="companyStore.selectedCompany?.id"
              placeholder="Buscar producto por nombre, SKU o código..."
              :show-stock="true"
              @product-selected="handleProductSelected"
            />
          </div>

          <div>
            <label class="text-sm font-medium">Descripción</label>
            <Input
              v-model="newItem.description"
              placeholder="Descripción opcional"
              class="mt-1"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Cantidad *</label>
              <Input
                v-model="newItemQuantity"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Precio Unitario *</label>
              <Input
                v-model="newItemUnitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                class="mt-1"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Descuento (%)</label>
            <Input
              v-model="newItemDiscountPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0"
              class="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="cancelAddItem">
            Cancelar
          </Button>
          <Button @click="addItem" :disabled="!isNewItemValid">
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { usePurchasesStore } from '@/stores/purchases'
import { useProductsStore } from '@/stores/products'
import { sunatCurrenciesService, type SunatCatalogItem } from '@/services/sunatService'
import { Plus, Trash2 } from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import ProductSearchSelect from '@/components/ui/ProductSearchSelect.vue'

const emit = defineEmits<{
  save: [data: any]
  cancel: []
}>()

const companyStore = useCompanyStore()
const purchasesStore = usePurchasesStore()
const productsStore = useProductsStore()

// State
const loading = ref(false)
const currenciesLoading = ref(false)
const currencies = ref<SunatCatalogItem[]>([])
const showAddItemDialog = ref(false)

const form = ref({
  supplier_id: '',
  order_date: new Date().toISOString().split('T')[0],
  expected_delivery_date: '',
  currency_code: 'PEN',
  exchange_rate: 1,
  notes: '',
  items: [] as Array<{
    product_id: string
    description: string
    unit_code: string
    quantity: number
    unit_price: number
    discount_pct: number
  }>
})

const newItem = ref({
  product_id: '',
  description: '',
  unit_code: 'NIU',
  quantity: 1,
  unit_price: 0,
  discount_pct: 0
})

// Computed
const currencyOptions = computed(() => {
  return currencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.descripcion}`
  }))
})

const exchangeRateInput = computed({
  get: () => form.value.exchange_rate.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.exchange_rate = isNaN(numericValue) ? 0 : numericValue
  }
})

const newItemQuantity = computed({
  get: () => newItem.value.quantity.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    newItem.value.quantity = isNaN(numericValue) ? 1 : numericValue
  }
})

const newItemUnitPrice = computed({
  get: () => newItem.value.unit_price.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    newItem.value.unit_price = isNaN(numericValue) ? 0 : numericValue
  }
})

const newItemDiscountPct = computed({
  get: () => newItem.value.discount_pct.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    newItem.value.discount_pct = isNaN(numericValue) ? 0 : numericValue
  }
})

const subtotal = computed(() => {
  return form.value.items.reduce((total, item) => {
    return total + calculateItemTotal(item)
  }, 0)
})

const isFormValid = computed(() => {
  return form.value.supplier_id && 
         form.value.order_date && 
         form.value.currency_code &&
         form.value.items.length > 0
})

const isNewItemValid = computed(() => {
  return newItem.value.product_id && 
         newItem.value.quantity > 0 && 
         newItem.value.unit_price >= 0
})

// Methods
const loadCurrencies = async () => {
  currenciesLoading.value = true
  try {
    const data = await sunatCurrenciesService.getAll()
    currencies.value = data
  } catch (error) {
    console.error('Error loading currencies:', error)
    currencies.value = [
      { code: 'PEN', descripcion: 'Sol Peruano' },
      { code: 'USD', descripcion: 'Dólar Americano' },
      { code: 'EUR', descripcion: 'Euro' }
    ]
  } finally {
    currenciesLoading.value = false
  }
}

const onCurrencyChange = () => {
  if (form.value.currency_code === 'PEN') {
    form.value.exchange_rate = 1
  } else {
    form.value.exchange_rate = 0
  }
}

const calculateItemTotal = (item: any) => {
  const base = item.quantity * item.unit_price
  const discount = base * (item.discount_pct / 100)
  return base - discount
}

const formatCurrency = (amount: number, currencyCode: string) => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  } else if (currencyCode === 'USD') {
    return `$ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  } else {
    return `${currencyCode} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  }
}

const getProductName = (productId: string) => {
  const product = productsStore.activeProducts.find(p => p.id === productId)
  return product?.name || 'Producto no encontrado'
}

const getProductSku = (productId: string) => {
  const product = productsStore.activeProducts.find(p => p.id === productId)
  return product?.sku || '-'
}

const getUnitDescription = (unitCode: string) => {
  // TODO: Get from SUNAT units
  return unitCode
}

const addItem = () => {
  if (!isNewItemValid.value) return

  // Get product unit code
  const product = productsStore.activeProducts.find(p => p.id === newItem.value.product_id)
  if (product) {
    newItem.value.unit_code = product.unit_code
  }

  form.value.items.push({ ...newItem.value })
  cancelAddItem()
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const cancelAddItem = () => {
  showAddItemDialog.value = false
  newItem.value = {
    product_id: '',
    description: '',
    unit_code: 'NIU',
    quantity: 1,
    unit_price: 0,
    discount_pct: 0
  }
}

const handleProductSelected = (product: any) => {
  if (product) {
    newItem.value.unit_code = product.unit_code
    newItem.value.description = product.name
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const orderData = {
      company_id: companyStore.selectedCompany?.id || '',
      supplier_id: form.value.supplier_id,
      order_date: form.value.order_date,
      expected_delivery_date: form.value.expected_delivery_date || undefined,
      currency_code: form.value.currency_code,
      exchange_rate: form.value.exchange_rate !== 1 ? form.value.exchange_rate : undefined,
      total_amount: subtotal.value,
      status: 'PENDING',
      notes: form.value.notes || undefined,
      items: form.value.items
    }

    emit('save', orderData)
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadCurrencies(),
    companyStore.selectedCompany ? productsStore.fetchProducts(companyStore.selectedCompany.id) : Promise.resolve()
  ])
})
</script>