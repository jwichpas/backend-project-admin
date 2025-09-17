<template>
  <div class="max-h-[90vh] overflow-hidden flex flex-col">
    <div class="flex-shrink-0">
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold">Nueva Recepción de Mercancías</h3>
        <p class="text-muted-foreground text-sm mt-1">
          Registra la recepción de productos y actualiza el inventario
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 -mr-2">
      <form @submit.prevent="handleSave" class="space-y-6">
        <!-- Source Document Selection -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <FileText class="h-4 w-4" />
              Documento Origen
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-3">
                <Info class="h-4 w-4 text-blue-600" />
                <span class="text-sm font-medium text-blue-800">Cargar desde documento existente</span>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-sm font-medium">Documento de Compra</label>
                  <select
                    v-model="selectedPurchaseDocId"
                    @change="loadFromPurchaseDoc"
                    class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Seleccionar documento...</option>
                    <option
                      v-for="doc in availablePurchaseDocs"
                      :key="doc.id"
                      :value="doc.id"
                    >
                      {{ doc.series }}-{{ doc.number }} - {{ doc.supplier_name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="text-sm font-medium">Orden de Compra</label>
                  <select
                    v-model="selectedPurchaseOrderId"
                    @change="loadFromPurchaseOrder"
                    class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Seleccionar orden...</option>
                    <option
                      v-for="order in availablePurchaseOrders"
                      :key="order.id"
                      :value="order.id"
                    >
                      Orden {{ formatDate(order.order_date) }} - {{ order.supplier_name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Reception Details -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <Package class="h-4 w-4" />
              Detalles de Recepción
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="text-sm font-medium">Almacén *</label>
                <select
                  v-model="form.warehouse_id"
                  required
                  class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccionar almacén...</option>
                  <option
                    v-for="warehouse in productsStore.activeWarehouses"
                    :key="warehouse.id"
                    :value="warehouse.id"
                  >
                    {{ warehouse.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Fecha de Recepción *</label>
                <Input
                  v-model="form.reception_date"
                  type="date"
                  required
                  class="mt-1"
                />
              </div>
            </div>

            <div>
              <label class="text-sm font-medium">Estado de Recepción</label>
              <select
                v-model="form.status"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="PARTIAL">Recepción Parcial</option>
                <option value="COMPLETE">Recepción Completa</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Observaciones</label>
              <textarea
                v-model="form.notes"
                rows="3"
                placeholder="Observaciones sobre la recepción..."
                class="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <!-- Products to Receive -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ShoppingCart class="h-4 w-4" />
                Productos a Recibir
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
              <p class="text-xs">Carga desde un documento o agrega productos manualmente</p>
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
                    <label class="text-sm font-medium">Cantidad Recibida *</label>
                    <Input
                      :model-value="item.quantity_received.toString()"
                      @update:model-value="(value: string) => item.quantity_received = parseFloat(value) || 0"
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
                    <label class="text-sm font-medium">Costo Unitario</label>
                    <Input
                      :model-value="item.unit_cost.toString()"
                      @update:model-value="(value: string) => item.unit_cost = parseFloat(value) || 0"
                      type="number"
                      step="0.01"
                      min="0"
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Número de Lote</label>
                    <Input
                      v-model="item.batch_number"
                      placeholder="Opcional"
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <label class="text-sm font-medium">Número de Serie</label>
                    <Input
                      v-model="item.serial_number"
                      placeholder="Opcional"
                      class="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label class="text-sm font-medium">Observaciones del Producto</label>
                  <Input
                    v-model="item.notes"
                    placeholder="Observaciones específicas del producto..."
                    class="mt-1"
                  />
                </div>
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
          {{ loading ? 'Guardando...' : 'Crear Recepción' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { usePurchasesStore, type Reception, type ReceptionItem } from '@/stores/purchases'
import { useProductsStore } from '@/stores/products'
import {
  Package,
  FileText,
  Info,
  Plus,
  X,
  ShoppingCart,
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

const companyStore = useCompanyStore()
const purchasesStore = usePurchasesStore()
const productsStore = useProductsStore()

// Loading state
const loading = ref(false)

// Source document selection
const selectedPurchaseDocId = ref('')
const selectedPurchaseOrderId = ref('')

// Form data
const form = ref({
  company_id: '',
  warehouse_id: '',
  purchase_doc_id: '',
  purchase_order_id: '',
  reception_date: new Date().toISOString().split('T')[0],
  status: 'COMPLETE' as 'PARTIAL' | 'COMPLETE',
  notes: '',
  items: [] as {
    product_id: string
    quantity_received: number
    unit_cost: number
    batch_number?: string
    serial_number?: string
    notes?: string
  }[]
})

// Computed
const availablePurchaseDocs = computed(() => {
  return purchasesStore.activePurchaseDocs.filter(doc => {
    // Only show docs that don't already have complete receptions
    return !purchasesStore.activeReceptions.some(reception => 
      reception.purchase_doc_id === doc.id && reception.status === 'COMPLETE'
    )
  })
})

const availablePurchaseOrders = computed(() => {
  return purchasesStore.getPendingPurchaseOrders()
})

const isFormValid = computed(() => {
  return form.value.warehouse_id && 
         form.value.reception_date &&
         form.value.items.length > 0 &&
         form.value.items.every(item => 
           item.product_id && 
           item.quantity_received > 0
         )
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const addItem = () => {
  form.value.items.push({
    product_id: '',
    quantity_received: 0,
    unit_cost: 0,
    batch_number: '',
    serial_number: '',
    notes: ''
  })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const loadFromPurchaseDoc = async () => {
  if (!selectedPurchaseDocId.value) return
  
  const doc = purchasesStore.activePurchaseDocs.find(d => d.id === selectedPurchaseDocId.value)
  if (!doc) return
  
  try {
    // Load document items
    await purchasesStore.fetchPurchaseDocItems(selectedPurchaseDocId.value)
    const docItems = purchasesStore.getPurchaseDocItems(selectedPurchaseDocId.value)
    
    // Set form data
    form.value.purchase_doc_id = doc.id
    form.value.purchase_order_id = ''
    selectedPurchaseOrderId.value = ''
    
    // Load items
    form.value.items = docItems.map(item => ({
      product_id: item.product_id,
      quantity_received: item.quantity,
      unit_cost: item.unit_cost,
      batch_number: '',
      serial_number: '',
      notes: ''
    }))
    
  } catch (error) {
    console.error('Error loading purchase document items:', error)
  }
}

const loadFromPurchaseOrder = async () => {
  if (!selectedPurchaseOrderId.value) return
  
  const order = purchasesStore.activePurchaseOrders.find(o => o.id === selectedPurchaseOrderId.value)
  if (!order) return
  
  try {
    // Load order items
    await purchasesStore.fetchPurchaseOrderItems(selectedPurchaseOrderId.value)
    const orderItems = purchasesStore.purchaseOrderItems.filter(item => item.purchase_order_id === selectedPurchaseOrderId.value)
    
    // Set form data
    form.value.purchase_order_id = order.id
    form.value.purchase_doc_id = ''
    selectedPurchaseDocId.value = ''
    
    // Load items
    form.value.items = orderItems.map(item => ({
      product_id: item.product_id,
      quantity_received: item.quantity,
      unit_cost: item.unit_price,
      batch_number: '',
      serial_number: '',
      notes: ''
    }))
    
  } catch (error) {
    console.error('Error loading purchase order items:', error)
  }
}

const handleSave = async () => {
  if (!isFormValid.value || !companyStore.selectedCompany) return
  
  loading.value = true
  
  try {
    const receptionData = {
      ...form.value,
      company_id: companyStore.selectedCompany.id,
      purchase_doc_id: form.value.purchase_doc_id || null,
      purchase_order_id: form.value.purchase_order_id || null
    }
    
    const result = await purchasesStore.createReception(receptionData)
    
    if (result) {
      emit('save', result)
    }
  } catch (error) {
    console.error('Error creating reception:', error)
    // Could add toast notification here
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (companyStore.selectedCompany) {
    form.value.company_id = companyStore.selectedCompany.id
    
    // Load necessary data
    await Promise.all([
      productsStore.fetchProducts(companyStore.selectedCompany.id),
      productsStore.fetchWarehouses(companyStore.selectedCompany.id),
      purchasesStore.fetchPurchaseDocs(companyStore.selectedCompany.id),
      purchasesStore.fetchPurchaseOrders(companyStore.selectedCompany.id)
    ])
  }
})
</script>