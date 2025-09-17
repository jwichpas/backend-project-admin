<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          @click="$router.go(-1)"
        >
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div>
          <h1 class="text-2xl font-bold">Nuevo Documento de Compra</h1>
          <p class="text-muted-foreground">
            Los totales se calculan automáticamente basándose en los items agregados
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="$router.go(-1)" :disabled="loading">
          Cancelar
        </Button>
        <Button @click="handleSave" :disabled="loading || !isFormValid">
          {{ loading ? 'Guardando...' : 'Guardar Documento' }}
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-6xl mx-auto p-6 space-y-8">
        <!-- Load from Purchase Order Section -->
        <Card v-if="pendingPurchaseOrders.length > 0">
          <CardHeader class="pb-4">
            <div class="flex items-center justify-between">
              <CardTitle class="text-lg">Cargar desde Orden de Compra</CardTitle>
              <Button
                variant="outline"
                size="sm"
                @click="clearForm"
                :disabled="loading"
              >
                <RotateCcw class="h-4 w-4 mr-2" />
                Limpiar Todo
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label>Orden de Compra Pendiente</Label>
                <Select
                  v-model="selectedPurchaseOrderId"
                  :options="[
                    { value: '', label: 'Seleccionar orden de compra...', disabled: true },
                    ...pendingPurchaseOrders.map(order => ({
                      value: order.id,
                      label: `${order.supplier_name || 'Proveedor'} - ${formatCurrency(order.total_amount, order.currency_code)} (${formatDate(order.order_date)})`
                    }))
                  ]"
                  placeholder="Seleccionar orden de compra..."
                  :disabled="loading"
                  @update:model-value="loadFromPurchaseOrder"
                />
              </div>
              <div v-if="selectedPurchaseOrderId" class="flex items-end">
                <Button
                  @click="loadPurchaseOrderItems"
                  :disabled="loading || loadingOrderItems"
                >
                  <Download class="h-4 w-4 mr-2" />
                  {{ loadingOrderItems ? 'Cargando...' : 'Cargar Items' }}
                </Button>
              </div>
            </div>

            <div v-if="selectedPurchaseOrder" class="bg-muted/50 rounded-lg p-4">
              <div class="grid gap-2 md:grid-cols-3 text-sm">
                <div><strong>Proveedor:</strong> {{ selectedPurchaseOrder.supplier_name }}</div>
                <div><strong>Fecha:</strong> {{ formatDate(selectedPurchaseOrder.order_date) }}</div>
                <div><strong>Total:</strong> {{ formatCurrency(selectedPurchaseOrder.total_amount, selectedPurchaseOrder.currency_code) }}</div>
              </div>
              <div v-if="form.items.length > 0" class="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle class="h-4 w-4" />
                <span>{{ form.items.length }} items cargados desde la orden de compra</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Basic Information -->
        <Card>
          <CardHeader>
            <CardTitle>Información Básica del Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="supplier">Proveedor *</Label>
                <Select
                  v-model="form.supplier_id"
                  :options="purchasesStore.suppliers.filter(s => s.is_active).map(supplier => ({
                    value: supplier.id,
                    label: supplier.name
                  }))"
                  placeholder="Seleccionar proveedor"
                  :disabled="loading"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="doc_type">Tipo de Documento *</Label>
                <Select
                  v-model="form.doc_type"
                  :options="documentTypeOptions"
                  placeholder="Seleccionar tipo de documento"
                  :disabled="loading || documentTypesLoading"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="series">Serie *</Label>
                <Input
                  id="series"
                  v-model="form.series"
                  placeholder="Ej: F001"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="space-y-2">
                <Label for="number">Número *</Label>
                <Input
                  id="number"
                  v-model="form.number"
                  placeholder="Ej: 123456"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="space-y-2">
                <Label for="issue_date">Fecha de Emisión *</Label>
                <Input
                  id="issue_date"
                  v-model="form.issue_date"
                  type="date"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="space-y-2">
                <Label for="arrival_date">Fecha de Llegada</Label>
                <Input
                  id="arrival_date"
                  v-model="form.arrival_date"
                  type="date"
                  :disabled="loading"
                />
              </div>

              <div class="space-y-2">
                <Label for="currency">Moneda *</Label>
                <Select
                  v-model="form.currency_code"
                  :options="currencyOptions"
                  placeholder="Seleccionar moneda"
                  :disabled="loading || currenciesLoading"
                  required
                  @update:model-value="onCurrencyChange"
                />
              </div>

              <div v-if="form.currency_code && form.currency_code !== 'PEN'" class="space-y-2">
                <Label for="exchange_rate">Tipo de Cambio *</Label>
                <Input
                  id="exchange_rate"
                  v-model="exchangeRateInput"
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  placeholder="Ejemplo: 3.750000"
                  :disabled="loading"
                  required
                />
                <p class="text-xs text-muted-foreground">
                  Tipo de cambio de {{ form.currency_code }} a PEN
                </p>
              </div>

              <div class="space-y-2">
                <Label for="op_type_kardex">Tipo de Operación Kardex *</Label>
                <Select
                  id="op_type_kardex"
                  v-model="form.op_type_kardex"
                  :options="operationTypeOptions"
                  placeholder="Seleccionar tipo de operación"
                  :disabled="loading || operationTypesLoading"
                  required
                />
                <p class="text-xs text-muted-foreground">
                  Tipo de operación para el control kardex (por defecto: 02 - Compras)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Items Section -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Items del Documento</CardTitle>
                <p class="text-sm text-muted-foreground mt-1">
                  Los totales se calculan automáticamente basándose en estos items
                </p>
              </div>
              <Button
                @click="showAddItemDialog = true"
                :disabled="loading"
              >
                <Plus class="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Unit.</TableHead>
                    <TableHead>Desc.</TableHead>
                    <TableHead>Afectación</TableHead>
                    <TableHead class="text-right">Subtotal</TableHead>
                    <TableHead class="text-right">IGV</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                    <TableHead class="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="form.items.length === 0">
                    <TableCell colspan="9" class="text-center py-8 text-muted-foreground">
                      <div class="flex flex-col items-center gap-2">
                        <ShoppingCart class="h-8 w-8 text-muted-foreground/50" />
                        <span>No hay items agregados</span>
                        <Button
                          variant="outline"
                          size="sm"
                          @click="showAddItemDialog = true"
                        >
                          <Plus class="h-4 w-4 mr-2" />
                          Agregar primer item
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow v-else v-for="(item, index) in form.items" :key="index">
                    <TableCell>
                      <div class="space-y-1">
                        <div class="font-medium">{{ getProductName(item.product_id) }}</div>
                        <div class="text-xs text-muted-foreground">{{ getProductSku(item.product_id) }}</div>
                        <div v-if="item.description" class="text-xs text-muted-foreground">{{ item.description }}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <span class="font-medium">{{ formatNumber(item.quantity) }}</span>
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
                        {{ formatNumber(item.discount_pct) }}%
                      </div>
                      <div v-else class="text-muted-foreground">-</div>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="getIgvAffectationVariant(item.igv_affectation)">
                        {{ getIgvAffectationLabel(item.igv_affectation) }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="font-medium">
                        {{ formatCurrency(calculateItemSubtotal(item), form.currency_code) }}
                      </div>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="font-medium" :class="{ 'text-muted-foreground': calculateItemIGV(item) === 0 }">
                        {{ formatCurrency(calculateItemIGV(item), form.currency_code) }}
                      </div>
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
          </CardContent>
        </Card>

        <!-- Calculated Totals -->
        <Card v-if="form.items.length > 0">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Calculator class="h-5 w-5" />
              Totales Calculados Automáticamente
            </CardTitle>
            <p class="text-sm text-muted-foreground">
              Estos totales se calculan automáticamente basándose en los items y sus afectaciones de IGV
            </p>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div class="space-y-2">
                <Label class="text-sm text-muted-foreground">Operaciones Gravadas</Label>
                <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="text-lg font-bold text-green-700">
                    {{ formatCurrency(calculatedTotals.gravadas, form.currency_code) }}
                  </div>
                  <div class="text-xs text-green-600">Con IGV 18%</div>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-sm text-muted-foreground">Operaciones Exoneradas</Label>
                <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-lg font-bold text-blue-700">
                    {{ formatCurrency(calculatedTotals.exoneradas, form.currency_code) }}
                  </div>
                  <div class="text-xs text-blue-600">Sin IGV</div>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-sm text-muted-foreground">Operaciones Inafectas</Label>
                <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div class="text-lg font-bold text-gray-700">
                    {{ formatCurrency(calculatedTotals.inafectas, form.currency_code) }}
                  </div>
                  <div class="text-xs text-gray-600">Sin IGV</div>
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-sm text-muted-foreground">Total IGV (18%)</Label>
                <div class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div class="text-lg font-bold text-orange-700">
                    {{ formatCurrency(calculatedTotals.igv, form.currency_code) }}
                  </div>
                  <div class="text-xs text-orange-600">Solo operaciones gravadas</div>
                </div>
              </div>
            </div>

            <Separator class="my-6" />

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label class="text-lg font-medium">Total General</Label>
                <div class="p-4 bg-primary text-primary-foreground rounded-lg">
                  <div class="text-2xl font-bold">
                    {{ formatCurrency(calculatedTotals.total, form.currency_code) }}
                  </div>
                  <div class="text-sm opacity-90">
                    {{ form.currency_code === 'PEN' ? 'Soles Peruanos' : currencyName }}
                  </div>
                </div>
              </div>

              <div v-if="form.currency_code !== 'PEN'" class="space-y-2">
                <Label class="text-lg font-medium">Total en PEN</Label>
                <div class="p-4 bg-secondary text-secondary-foreground rounded-lg">
                  <div class="text-2xl font-bold">
                    {{ formatCurrency(calculatedTotals.totalLocal, 'PEN') }}
                  </div>
                  <div class="text-sm opacity-75">
                    Tipo de cambio: {{ formatNumber(form.exchange_rate, 6) }}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Notes -->
        <Card>
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              v-model="form.notes"
              placeholder="Notas adicionales sobre el documento de compra..."
              rows="3"
              :disabled="loading"
            />
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Add Item Dialog -->
    <Dialog v-model:open="showAddItemDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Item al Documento</DialogTitle>
          <DialogDescription>
            Complete los datos del producto que desea agregar al documento de compra
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="product">Producto *</Label>
            <ProductSearchSelect
              v-model="newItem.product_id"
              :company-id="companiesStore.currentCompany?.id"
              placeholder="Buscar producto por nombre, SKU o código..."
              :show-stock="true"
              required
              @product-selected="handleProductSelected"
            />
          </div>

          <div class="space-y-2">
            <Label for="description">Descripción</Label>
            <Input
              id="description"
              v-model="newItem.description"
              placeholder="Descripción adicional del producto"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                v-model="newItemQuantity"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="unit_cost">Costo Unitario *</Label>
              <Input
                id="unit_cost"
                v-model="newItemUnitCost"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="discount">Descuento (%)</Label>
            <Input
              id="discount"
              v-model="newItemDiscountPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0"
            />
          </div>

          <div class="space-y-2">
            <Label for="igv_affectation">Afectación IGV *</Label>
            <Select
              v-model="newItem.igv_affectation"
              :options="[
                { value: '10', label: 'Gravado - Operación Onerosa (con IGV 18%)' },
                { value: '20', label: 'Exonerado - Operación Onerosa (sin IGV)' },
                { value: '30', label: 'Inafecto - Operación Onerosa (sin IGV)' }
              ]"
              required
            />
          </div>

          <div v-if="isNewItemValid" class="p-4 bg-muted rounded-lg">
            <div class="text-sm font-medium mb-2">Preview del Item:</div>
            <div class="grid gap-2 text-sm">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span class="font-medium">{{ formatCurrency(calculateItemSubtotal(newItem), form.currency_code) }}</span>
              </div>
              <div class="flex justify-between">
                <span>IGV (18%):</span>
                <span class="font-medium">{{ formatCurrency(calculateItemIGV(newItem), form.currency_code) }}</span>
              </div>
              <Separator />
              <div class="flex justify-between font-bold">
                <span>Total:</span>
                <span>{{ formatCurrency(calculateItemTotal(newItem), form.currency_code) }}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="cancelAddItem">
            Cancelar
          </Button>
          <Button @click="addItem" :disabled="!isNewItemValid">
            <Plus class="h-4 w-4 mr-2" />
            Agregar Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { usePurchasesStore } from '@/stores/purchases'
import { useProductsStore } from '@/stores/products'
import { sunatCurrenciesService, sunatDocumentTypesService, sunatOperationTypesService, type SunatCatalogItem } from '@/services/sunatService'

// Icons
import {
  ArrowLeft, Plus, Trash2, Calculator, ShoppingCart,
  Download, RotateCcw, CheckCircle
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Select from '@/components/ui/Select.vue'
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
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Badge from '@/components/ui/Badge.vue'
import Separator from '@/components/ui/Separator.vue'
import ProductSearchSelect from '@/components/ui/ProductSearchSelect.vue'

const router = useRouter()
const companiesStore = useCompaniesStore()
const purchasesStore = usePurchasesStore()
const productsStore = useProductsStore()

// State
const loading = ref(false)
const currenciesLoading = ref(false)
const documentTypesLoading = ref(false)
const operationTypesLoading = ref(false)
const loadingOrderItems = ref(false)
const currencies = ref<SunatCatalogItem[]>([])
const documentTypes = ref<SunatCatalogItem[]>([])
const operationTypes = ref<SunatCatalogItem[]>([])
const showAddItemDialog = ref(false)
const selectedPurchaseOrderId = ref('')
const selectedPurchaseOrder = ref<any>(null)

const form = ref({
  supplier_id: '',
  doc_type: '',
  series: '',
  number: '',
  issue_date: new Date().toISOString().split('T')[0],
  arrival_date: '',
  currency_code: 'PEN',
  exchange_rate: 1,
  op_type_kardex: '02',
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
    form.value.exchange_rate = isNaN(numericValue) ? 1 : numericValue
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

// Options
const currencyOptions = computed(() => {
  return currencies.value.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.descripcion}`
  }))
})

const documentTypeOptions = computed(() => {
  return documentTypes.value.map(docType => ({
    value: docType.code,
    label: `${docType.code} - ${docType.descripcion}`
  }))
})

const operationTypeOptions = computed(() => {
  return operationTypes.value.map(opType => ({
    value: opType.code,
    label: `${opType.code} - ${opType.descripcion}`
  }))
})

const pendingPurchaseOrders = computed(() => {
  return purchasesStore.purchaseOrders.filter(order =>
    order.status === 'APPROVED' || order.status === 'PENDING'
  )
})

const currencyName = computed(() => {
  const currency = currencies.value.find(c => c.code === form.value.currency_code)
  return currency?.descripcion || form.value.currency_code
})

// Calculations
const calculatedTotals = computed(() => {
  const gravadas = form.value.items
    .filter(item => item.igv_affectation === '10')
    .reduce((sum, item) => sum + calculateItemSubtotal(item), 0)

  const exoneradas = form.value.items
    .filter(item => item.igv_affectation === '20')
    .reduce((sum, item) => sum + calculateItemSubtotal(item), 0)

  const inafectas = form.value.items
    .filter(item => item.igv_affectation === '30')
    .reduce((sum, item) => sum + calculateItemSubtotal(item), 0)

  const igv = gravadas * 0.18 // 18% IGV only on gravadas

  const total = gravadas + exoneradas + inafectas + igv
  const totalLocal = total * form.value.exchange_rate

  return {
    gravadas,
    exoneradas,
    inafectas,
    igv,
    total,
    totalLocal
  }
})

// Validation
const isFormValid = computed(() => {
  return form.value.supplier_id &&
         form.value.doc_type &&
         form.value.series &&
         form.value.number &&
         form.value.issue_date &&
         form.value.currency_code &&
         form.value.items.length > 0 &&
         (form.value.currency_code === 'PEN' || form.value.exchange_rate > 0)
})

const isNewItemValid = computed(() => {
  return newItem.value.product_id &&
         newItem.value.quantity > 0 &&
         newItem.value.unit_cost >= 0
})

// Item calculations
const calculateItemSubtotal = (item: any) => {
  const base = item.quantity * item.unit_cost
  const discount = base * (item.discount_pct / 100)
  return base - discount
}

const calculateItemIGV = (item: any) => {
  if (item.igv_affectation === '10') { // Gravado
    return calculateItemSubtotal(item) * 0.18
  }
  return 0 // Exonerado or Inafecto
}

const calculateItemTotal = (item: any) => {
  return calculateItemSubtotal(item) + calculateItemIGV(item)
}

// Helper functions
const formatCurrency = (amount: number, currencyCode: string) => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (currencyCode === 'USD') {
    return `$ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else {
    return `${currencyCode} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

const formatNumber = (value: number, decimals: number = 2) => {
  return value.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
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
  return unitCode // TODO: Get from SUNAT units catalog
}

const getIgvAffectationLabel = (code: string) => {
  switch (code) {
    case '10': return 'Gravado'
    case '20': return 'Exonerado'
    case '30': return 'Inafecto'
    default: return code
  }
}

const getIgvAffectationVariant = (code: string) => {
  switch (code) {
    case '10': return 'default'
    case '20': return 'secondary'
    case '30': return 'outline'
    default: return 'outline'
  }
}

// Actions
const handleProductSelected = (product: any) => {
  if (product) {
    // Auto-fill unit code when product is selected
    newItem.value.unit_code = product.unit_code

    // Auto-fill description if empty
    if (!newItem.value.description) {
      newItem.value.description = product.name
    }
  }
}

const addItem = () => {
  if (!isNewItemValid.value) return

  // Get product unit code (fallback if not set by handleProductSelected)
  const product = productsStore.activeProducts.find(p => p.id === newItem.value.product_id)
  if (product && !newItem.value.unit_code) {
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
      unit_cost: item.unit_price,
      discount_pct: item.discount_pct || 0,
      igv_affectation: '10' // Default IGV affectation
    }))

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
    notes: '',
    items: []
  }
}

const onCurrencyChange = () => {
  if (form.value.currency_code === 'PEN') {
    form.value.exchange_rate = 1
  } else {
    form.value.exchange_rate = 0
  }
}

const handleSave = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const docData = {
      company_id: companiesStore.currentCompany?.id || '',
      supplier_id: form.value.supplier_id,
      doc_type: form.value.doc_type,
      series: form.value.series,
      number: form.value.number,
      issue_date: form.value.issue_date,
      arrival_date: form.value.arrival_date || null,
      currency_code: form.value.currency_code,
      exchange_rate: form.value.exchange_rate !== 1 ? form.value.exchange_rate : null,
      op_type_kardex: form.value.op_type_kardex,

      // Calculated totals
      total_ope_gravadas: calculatedTotals.value.gravadas,
      total_ope_gravadas_local: form.value.currency_code !== 'PEN' ? calculatedTotals.value.gravadas * form.value.exchange_rate : calculatedTotals.value.gravadas,
      total_ope_exoneradas: calculatedTotals.value.exoneradas,
      total_ope_exoneradas_local: form.value.currency_code !== 'PEN' ? calculatedTotals.value.exoneradas * form.value.exchange_rate : calculatedTotals.value.exoneradas,
      total_ope_inafectas: calculatedTotals.value.inafectas,
      total_ope_inafectas_local: form.value.currency_code !== 'PEN' ? calculatedTotals.value.inafectas * form.value.exchange_rate : calculatedTotals.value.inafectas,
      total_igv: calculatedTotals.value.igv,
      total_igv_local: form.value.currency_code !== 'PEN' ? calculatedTotals.value.igv * form.value.exchange_rate : calculatedTotals.value.igv,
      total_isc: 0,
      total_descuentos: 0,
      total: calculatedTotals.value.total,
      total_local: form.value.currency_code !== 'PEN' ? calculatedTotals.value.totalLocal : null,

      status: 'PENDING',
      notes: form.value.notes || null,
      items: form.value.items,
      purchase_order_id: selectedPurchaseOrderId.value || null
    }

    await purchasesStore.createPurchaseDoc(docData)
    router.push('/purchases/docs')
  } catch (error) {
    console.error('Error saving purchase document:', error)
  } finally {
    loading.value = false
  }
}

// Data loading
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

const loadOperationTypes = async () => {
  operationTypesLoading.value = true
  try {
    const data = await sunatOperationTypesService.getAll()
    operationTypes.value = data
  } catch (error) {
    console.error('Error loading operation types:', error)
    operationTypes.value = [
      { code: '01', descripcion: 'VENTA' },
      { code: '02', descripcion: 'COMPRAS' },
      { code: '03', descripcion: 'CONSIGNACIÓN RECIBIDA' },
      { code: '04', descripcion: 'CONSIGNACIÓN ENTREGADA' }
    ]
  } finally {
    operationTypesLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadCurrencies(),
    loadDocumentTypes(),
    loadOperationTypes(),
    companiesStore.currentCompany ? productsStore.fetchProducts(companiesStore.currentCompany.id) : Promise.resolve(),
    companiesStore.currentCompany ? purchasesStore.fetchPurchaseOrders(companiesStore.currentCompany.id) : Promise.resolve(),
    companiesStore.currentCompany ? purchasesStore.fetchSuppliers(companiesStore.currentCompany.id) : Promise.resolve()
  ])
})
</script>