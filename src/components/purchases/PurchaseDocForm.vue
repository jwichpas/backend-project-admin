<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Load from Purchase Order -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-blue-900">Cargar desde Orden de Compra</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          @click="clearForm"
          :disabled="loading"
        >
          Limpiar
        </Button>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-sm font-medium text-blue-900">Orden de Compra Pendiente</label>
          <select
            v-model="selectedPurchaseOrderId"
            class="mt-1 flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            :disabled="loading"
            @change="loadFromPurchaseOrder"
          >
            <option value="">Seleccionar orden de compra...</option>
            <option 
              v-for="order in pendingPurchaseOrders" 
              :key="order.id" 
              :value="order.id"
            >
              {{ order.supplier_name || 'Proveedor' }} - {{ formatCurrency(order.total_amount, order.currency_code) }} ({{ formatDate(order.order_date) }})
            </option>
          </select>
        </div>
        <div v-if="selectedPurchaseOrderId" class="flex items-end">
          <Button 
            type="button" 
            @click="loadPurchaseOrderItems"
            :disabled="loading || loadingOrderItems"
            class="bg-blue-600 hover:bg-blue-700"
          >
            {{ loadingOrderItems ? 'Cargando...' : 'Cargar Items' }}
          </Button>
        </div>
      </div>
      <div v-if="selectedPurchaseOrder" class="mt-3 p-3 bg-blue-100 rounded-lg">
        <div class="grid gap-2 md:grid-cols-3 text-sm text-blue-800">
          <div><strong>Orden:</strong> {{ selectedPurchaseOrder.supplier_name }}</div>
          <div><strong>Fecha:</strong> {{ formatDate(selectedPurchaseOrder.order_date) }}</div>
          <div><strong>Total:</strong> {{ formatCurrency(selectedPurchaseOrder.total_amount, selectedPurchaseOrder.currency_code) }}</div>
        </div>
        <div v-if="form.items.length > 0" class="mt-2 flex items-center gap-2 text-sm text-green-700">
          <div class="h-2 w-2 bg-green-500 rounded-full"></div>
          <span>{{ form.items.length }} items cargados desde la orden de compra</span>
        </div>
      </div>
    </div>

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
        <label class="text-sm font-medium">Tipo de Documento *</label>
        <select
          v-model="form.doc_type"
          class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
          :disabled="loading || documentTypesLoading"
        >
          <option value="" disabled>
            {{ documentTypesLoading ? 'Cargando tipos...' : 'Seleccionar tipo' }}
          </option>
          <option 
            v-for="option in documentTypeOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="text-sm font-medium">Serie *</label>
        <Input
          v-model="form.series"
          placeholder="Ej: F001"
          required
          class="mt-1"
          :disabled="loading"
        />
      </div>

      <div>
        <label class="text-sm font-medium">Número *</label>
        <Input
          v-model="form.number"
          placeholder="Ej: 123456"
          required
          class="mt-1"
          :disabled="loading"
        />
      </div>

      <div>
        <label class="text-sm font-medium">Fecha de Emisión *</label>
        <Input
          v-model="form.issue_date"
          type="date"
          required
          class="mt-1"
          :disabled="loading"
        />
      </div>

      <div>
        <label class="text-sm font-medium">Fecha de Llegada</label>
        <Input
          v-model="form.arrival_date"
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

      <div v-if="form.currency_code && form.currency_code !== 'PEN'">
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

    <!-- Financial Totals -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Totales del Documento</h3>
        <div v-if="selectedPurchaseOrderId && form.items.length > 0" class="text-sm text-green-600 flex items-center gap-2">
          <div class="h-2 w-2 bg-green-500 rounded-full"></div>
          <span>Totales calculados automáticamente</span>
        </div>
      </div>
      
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <label class="text-sm font-medium">Total Operaciones Gravadas *</label>
          <Input
            v-model="totalGravadas"
            type="number"
            step="0.01"
            min="0"
            required
            class="mt-1"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="text-sm font-medium">Total Operaciones Exoneradas</label>
          <Input
            v-model="totalExoneradas"
            type="number"
            step="0.01"
            min="0"
            class="mt-1"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="text-sm font-medium">Total Operaciones Inafectas</label>
          <Input
            v-model="totalInafectas"
            type="number"
            step="0.01"
            min="0"
            class="mt-1"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="text-sm font-medium">Total IGV</label>
          <Input
            v-model="totalIgv"
            type="number"
            step="0.01"
            min="0"
            class="mt-1"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="text-sm font-medium">Total ISC</label>
          <Input
            v-model="totalIsc"
            type="number"
            step="0.01"
            min="0"
            class="mt-1"
            :disabled="loading"
          />
        </div>

        <div>
          <label class="text-sm font-medium">Total Descuentos</label>
          <Input
            v-model="totalDescuentos"
            type="number"
            step="0.01"
            min="0"
            class="mt-1"
            :disabled="loading"
          />
        </div>
      </div>

      <div class="pt-4 border-t">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-medium text-lg">Total General *</label>
            <div class="mt-1 p-3 bg-muted rounded-lg">
              <span class="text-xl font-bold">{{ formatCurrency(calculateTotal(), form.currency_code) }}</span>
            </div>
          </div>
          <div v-if="form.currency_code !== 'PEN'">
            <label class="text-sm font-medium text-lg">Total en PEN</label>
            <div class="mt-1 p-3 bg-muted rounded-lg">
              <span class="text-xl font-bold">{{ formatCurrency(calculateTotalLocal(), 'PEN') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Items Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Items del Documento</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          @click="showAddItemDialog = true"
          :disabled="loading"
        >
          <Plus class="mr-2 h-4 w-4" />
          Agregar Item
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
              <TableHead>Costo Unit.</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead class="text-right">Total</TableHead>
              <TableHead class="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="form.items.length === 0">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                No hay items agregados
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
                  {{ formatCurrency(item.unit_cost, form.currency_code) }}
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
        {{ loading ? 'Guardando...' : 'Guardar Documento' }}
      </Button>
    </div>

    <!-- Add Item Dialog -->
    <Dialog v-model:open="showAddItemDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Item</DialogTitle>
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
              <label class="text-sm font-medium">Costo Unitario *</label>
              <Input
                v-model="newItemUnitCost"
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

          <div>
            <label class="text-sm font-medium">Afectación IGV</label>
            <select
              v-model="newItem.igv_affectation"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="10">Gravado - Operación Onerosa</option>
              <option value="20">Exonerado - Operación Onerosa</option>
              <option value="30">Inafecto - Operación Onerosa</option>
            </select>
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
import { sunatCurrenciesService, sunatDocumentTypesService, type SunatCatalogItem } from '@/services/sunatService'
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
const documentTypesLoading = ref(false)
const loadingOrderItems = ref(false)
const currencies = ref<SunatCatalogItem[]>([])
const documentTypes = ref<SunatCatalogItem[]>([])
const showAddItemDialog = ref(false)
const selectedPurchaseOrderId = ref('')
const selectedPurchaseOrder = ref(null)

const form = ref({
  supplier_id: '',
  doc_type: '',
  series: '',
  number: '',
  issue_date: new Date().toISOString().split('T')[0],
  arrival_date: '',
  currency_code: 'PEN',
  exchange_rate: 1,
  op_type_kardex: '',
  total_ope_gravadas: 0,
  total_ope_exoneradas: 0,
  total_ope_inafectas: 0,
  total_igv: 0,
  total_isc: 0,
  total_descuentos: 0,
  notes: '',
  items: [] as Array<{
    product_id: string
    description: string
    unit_code: string
    quantity: number
    unit_cost: number
    discount_pct: number
    igv_affectation: string
  }>
})

const newItem = ref({
  product_id: '',
  description: '',
  unit_code: 'NIU',
  quantity: 1,
  unit_cost: 0,
  discount_pct: 0,
  igv_affectation: '10'
})

// Computed properties for string/number conversion
const exchangeRateInput = computed({
  get: () => form.value.exchange_rate.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.exchange_rate = isNaN(numericValue) ? 0 : numericValue
  }
})

const totalGravadas = computed({
  get: () => form.value.total_ope_gravadas.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.total_ope_gravadas = isNaN(numericValue) ? 0 : numericValue
  }
})

const totalExoneradas = computed({
  get: () => form.value.total_ope_exoneradas.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.total_ope_exoneradas = isNaN(numericValue) ? 0 : numericValue
  }
})

const totalInafectas = computed({
  get: () => form.value.total_ope_inafectas.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.total_ope_inafectas = isNaN(numericValue) ? 0 : numericValue
  }
})

const totalIgv = computed({
  get: () => form.value.total_igv.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.total_igv = isNaN(numericValue) ? 0 : numericValue
  }
})

const totalIsc = computed({
  get: () => form.value.total_isc.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.total_isc = isNaN(numericValue) ? 0 : numericValue
  }
})

const totalDescuentos = computed({
  get: () => form.value.total_descuentos.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    form.value.total_descuentos = isNaN(numericValue) ? 0 : numericValue
  }
})

const newItemQuantity = computed({
  get: () => newItem.value.quantity.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    newItem.value.quantity = isNaN(numericValue) ? 1 : numericValue
  }
})

const newItemUnitCost = computed({
  get: () => newItem.value.unit_cost.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    newItem.value.unit_cost = isNaN(numericValue) ? 0 : numericValue
  }
})

const newItemDiscountPct = computed({
  get: () => newItem.value.discount_pct.toString(),
  set: (value: string) => {
    const numericValue = parseFloat(value)
    newItem.value.discount_pct = isNaN(numericValue) ? 0 : numericValue
  }
})

// Other computed properties
const currencyOptions = computed(() => {
  return currencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.descripcion}`
  }))
})

const pendingPurchaseOrders = computed(() => {
  return purchasesStore.getPendingPurchaseOrders()
})

const documentTypeOptions = computed(() => {
  return documentTypes.value.map(docType => ({
    value: docType.code,
    label: `${docType.code} - ${docType.descripcion}`
  }))
})

const isFormValid = computed(() => {
  return form.value.supplier_id && 
         form.value.doc_type && 
         form.value.series &&
         form.value.number &&
         form.value.issue_date && 
         form.value.currency_code &&
         form.value.total_ope_gravadas >= 0
})

const isNewItemValid = computed(() => {
  return newItem.value.product_id && 
         newItem.value.quantity > 0 && 
         newItem.value.unit_cost >= 0
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

const loadDocumentTypes = async () => {
  documentTypesLoading.value = true
  try {
    const data = await sunatDocumentTypesService.getAll()
    documentTypes.value = data
  } catch (error) {
    console.error('Error loading document types:', error)
    documentTypes.value = [
      { code: '01', descripcion: 'FACTURA' },
      { code: '03', descripcion: 'BOLETA DE VENTA' },
      { code: '07', descripcion: 'NOTA DE CREDITO' },
      { code: '08', descripcion: 'NOTA DE DEBITO' }
    ]
  } finally {
    documentTypesLoading.value = false
  }
}

const onCurrencyChange = () => {
  if (form.value.currency_code === 'PEN') {
    form.value.exchange_rate = 1
  } else {
    form.value.exchange_rate = 0
  }
}

const calculateTotal = () => {
  return form.value.total_ope_gravadas + 
         form.value.total_ope_exoneradas + 
         form.value.total_ope_inafectas + 
         form.value.total_igv + 
         form.value.total_isc - 
         form.value.total_descuentos
}

const calculateTotalLocal = () => {
  return calculateTotal() * form.value.exchange_rate
}

const calculateItemTotal = (item: any) => {
  const base = item.quantity * item.unit_cost
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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
    unit_cost: 0,
    discount_pct: 0,
    igv_affectation: '10'
  }
}

const handleProductSelected = (product: any) => {
  if (product) {
    newItem.value.unit_code = product.unit_code
    newItem.value.description = product.name
  }
}

const loadFromPurchaseOrder = () => {
  if (!selectedPurchaseOrderId.value) {
    selectedPurchaseOrder.value = null
    return
  }

  const order = pendingPurchaseOrders.value.find(po => po.id === selectedPurchaseOrderId.value)
  if (!order) return

  selectedPurchaseOrder.value = order

  // Load basic data from purchase order
  form.value.supplier_id = order.supplier_id
  form.value.currency_code = order.currency_code
  form.value.exchange_rate = order.exchange_rate || 1
  form.value.issue_date = new Date().toISOString().split('T')[0]
  
  // Clear previous items when loading a new order
  form.value.items = []
}

const loadPurchaseOrderItems = async () => {
  if (!selectedPurchaseOrderId.value) return

  loadingOrderItems.value = true
  try {
    // Fetch items for the selected purchase order
    await purchasesStore.fetchPurchaseOrderItems(selectedPurchaseOrderId.value)
    const orderItems = purchasesStore.purchaseOrderItems.filter(item => item.purchase_order_id === selectedPurchaseOrderId.value)

    // Convert purchase order items to document items
    form.value.items = orderItems.map(item => ({
      product_id: item.product_id,
      description: item.description || '',
      unit_code: item.unit_code,
      quantity: item.quantity,
      unit_cost: item.unit_price, // Convert unit_price to unit_cost
      discount_pct: item.discount_pct || 0,
      igv_affectation: '10' // Default IGV affectation
    }))

    // Calculate totals based on items
    const subtotal = form.value.items.reduce((total, item) => {
      const itemTotal = calculateItemTotal(item)
      return total + itemTotal
    }, 0)

    // Assume 18% IGV for gravadas operations
    form.value.total_ope_gravadas = subtotal
    form.value.total_igv = subtotal * 0.18
    form.value.total_ope_exoneradas = 0
    form.value.total_ope_inafectas = 0
    form.value.total_isc = 0
    form.value.total_descuentos = 0

  } catch (error) {
    console.error('Error loading purchase order items:', error)
  } finally {
    loadingOrderItems.value = false
  }
}

const clearForm = () => {
  selectedPurchaseOrderId.value = ''
  selectedPurchaseOrder.value = null
  
  // Reset form to initial state
  form.value = {
    supplier_id: '',
    doc_type: '',
    series: '',
    number: '',
    issue_date: new Date().toISOString().split('T')[0],
    arrival_date: '',
    currency_code: 'PEN',
    exchange_rate: 1,
    op_type_kardex: '',
    total_ope_gravadas: 0,
    total_ope_exoneradas: 0,
    total_ope_inafectas: 0,
    total_igv: 0,
    total_isc: 0,
    total_descuentos: 0,
    notes: '',
    items: []
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const total = calculateTotal()
    const totalLocal = calculateTotalLocal()
    
    const docData = {
      company_id: companyStore.selectedCompany?.id || '',
      supplier_id: form.value.supplier_id,
      doc_type: form.value.doc_type,
      series: form.value.series,
      number: form.value.number,
      issue_date: form.value.issue_date,
      arrival_date: form.value.arrival_date || undefined,
      currency_code: form.value.currency_code,
      exchange_rate: form.value.exchange_rate !== 1 ? form.value.exchange_rate : undefined,
      op_type_kardex: form.value.op_type_kardex || undefined,
      total_ope_gravadas: form.value.total_ope_gravadas,
      total_ope_gravadas_local: form.value.currency_code !== 'PEN' ? form.value.total_ope_gravadas * form.value.exchange_rate : form.value.total_ope_gravadas,
      total_ope_exoneradas: form.value.total_ope_exoneradas,
      total_ope_exoneradas_local: form.value.currency_code !== 'PEN' ? form.value.total_ope_exoneradas * form.value.exchange_rate : form.value.total_ope_exoneradas,
      total_ope_inafectas: form.value.total_ope_inafectas,
      total_igv: form.value.total_igv,
      total_isc: form.value.total_isc,
      total_descuentos: form.value.total_descuentos,
      total: total,
      total_local: form.value.currency_code !== 'PEN' ? totalLocal : undefined,
      status: 'PENDING',
      notes: form.value.notes || undefined,
      items: form.value.items,
      // Include purchase order reference if loaded from an order
      purchase_order_id: selectedPurchaseOrderId.value || undefined
    }

    emit('save', docData)
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
    loadDocumentTypes(),
    companyStore.selectedCompany ? productsStore.fetchProducts(companyStore.selectedCompany.id) : Promise.resolve(),
    companyStore.selectedCompany ? purchasesStore.fetchPurchaseOrders(companyStore.selectedCompany.id) : Promise.resolve()
  ])
})
</script>