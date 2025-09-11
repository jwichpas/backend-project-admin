<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- POS Header -->
    <div class="flex-shrink-0 bg-card border-b border-border p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <CreditCard class="h-6 w-6 text-primary" />
            <h1 class="text-xl font-bold">Punto de Venta</h1>
          </div>
          <Badge variant="outline" class="text-xs">
            {{ companiesStore.currentCompany?.legal_name }}
          </Badge>
        </div>
        <div class="flex items-center gap-3">
          <!-- Price List Selector -->
          <div v-if="salesStore.activePriceLists.length > 0" class="min-w-[180px]">
            <p class="text-xs text-muted-foreground mb-1">Lista de Precios</p>
            <select
              :value="salesStore.selectedPriceList?.id"
              @change="onPriceListChange"
              class="w-full px-2 py-1 text-xs border border-input rounded-md bg-background"
            >
              <option
                v-for="priceList in salesStore.activePriceLists"
                :key="priceList.id"
                :value="priceList.id"
              >
                {{ priceList.name }}
              </option>
            </select>
          </div>
          <div class="text-right">
            <p class="text-sm text-muted-foreground">Vendedor</p>
            <p class="font-medium">{{ currentUser?.name || 'Usuario' }}</p>
          </div>
          <Button variant="outline" size="sm" @click="showSettingsDialog = true">
            <Settings class="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>
    </div>

    <!-- Main POS Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel - Products and Cart -->
      <div class="flex-1 flex flex-col">
        <!-- Product Search and Categories -->
        <div class="p-4 border-b border-border">
          <div class="flex gap-4 mb-4">
            <div class="flex-1 relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="productSearch"
                placeholder="Buscar productos por nombre o código..."
                class="h-10 pl-10"
                @input="searchProducts"
              />
            </div>
            <Button variant="outline" @click="showProductDialog = true">
              <Plus class="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
          
          <!-- Categories -->
          <div class="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              :class="{ 'bg-primary text-primary-foreground': selectedCategory === null }"
              @click="selectedCategory = null"
            >
              Todos
            </Button>
            <Button
              v-for="category in categories"
              :key="category.id"
              variant="outline"
              size="sm"
              :class="{ 'bg-primary text-primary-foreground': selectedCategory === category.id }"
              @click="selectedCategory = category.id"
            >
              {{ category.name }}
            </Button>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div
              v-for="product in filteredProducts"
              :key="product.product_id"
              class="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary"
              @click="addToCart(product)"
            >
              <div class="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                <template v-if="product.main_image && !isImageError(product.product_id)">
                  <img 
                    :src="product.main_image" 
                    :alt="product.product_name"
                    class="w-full h-full object-cover"
                    @error="() => handleImageError(product.product_id)"
                  />
                </template>
                <Package v-else class="h-8 w-8 text-muted-foreground" />
              </div>
              <div class="space-y-1">
                <h3 class="font-medium text-sm line-clamp-2">{{ product.product_name }}</h3>
                <p class="text-xs text-muted-foreground">{{ product.sku }}</p>
                <div class="flex items-center justify-between">
                  <p class="font-bold text-primary">
                    {{ formatCurrency(product.unit_price || 0) }}
                  </p>
                  <Badge variant="outline" class="text-xs">
                    Stock: {{ product.available_stock || 0 }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="filteredProducts.length === 0" class="text-center py-12">
            <Package class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">No se encontraron productos</p>
            <Button variant="outline" class="mt-4" @click="productSearch = ''">
              Limpiar búsqueda
            </Button>
          </div>
        </div>
      </div>

      <!-- Right Panel - Cart and Customer -->
      <div class="w-96 bg-card border-l border-border flex flex-col">
        <!-- Customer Selection -->
        <div class="p-4 border-b border-border">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">Cliente</label>
              <Button variant="ghost" size="sm" @click="showCustomerDialog = true">
                <Plus class="h-3 w-3 mr-1" />
                Nuevo
              </Button>
            </div>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="customerSearch"
                placeholder="Buscar cliente por nombre o documento..."
                class="h-10 pl-10"
                @input="searchCustomers"
                @focus="showCustomerDropdown = true"
              />
              <!-- Customer Dropdown -->
              <div 
                v-if="showCustomerDropdown && (filteredCustomers.length > 0 || customerSearch)"
                class="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div 
                  class="px-3 py-2 cursor-pointer hover:bg-muted"
                  :class="{ 'bg-muted': !selectedCustomer }"
                  @click="selectCustomer(null)"
                >
                  <div class="font-medium">Cliente General</div>
                  <div class="text-xs text-muted-foreground">Sin identificación específica</div>
                </div>
                <div
                  v-for="customer in filteredCustomers"
                  :key="customer.id"
                  class="px-3 py-2 cursor-pointer hover:bg-muted"
                  :class="{ 'bg-muted': selectedCustomer === customer.id }"
                  @click="selectCustomer(customer)"
                >
                  <div class="font-medium">{{ customer.fullname || customer.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ customer.doc_number }} - {{ customer.email || 'Sin email' }}</div>
                </div>
                <div v-if="filteredCustomers.length === 0 && customerSearch" class="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron clientes
                </div>
              </div>
            </div>
            <!-- Selected Customer Display -->
            <div v-if="selectedCustomerData" class="p-2 bg-muted rounded-md">
              <div class="text-sm font-medium">{{ selectedCustomerData.fullname || selectedCustomerData.name }}</div>
              <div class="text-xs text-muted-foreground">{{ selectedCustomerData.doc_number }}</div>
            </div>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4">
            <h3 class="font-medium mb-3 flex items-center justify-between">
              <span>Carrito de Compras</span>
              <Badge variant="outline">{{ cartItems.length }} items</Badge>
            </h3>
            
            <div v-if="cartItems.length === 0" class="text-center py-8">
              <ShoppingCart class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p class="text-sm text-muted-foreground">Carrito vacío</p>
              <p class="text-xs text-muted-foreground">Agrega productos para comenzar</p>
            </div>
            
            <div v-else class="space-y-2">
              <div
                v-for="(item, index) in cartItems"
                :key="index"
                class="bg-background border border-border rounded-lg p-3"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-start gap-3 flex-1">
                    <!-- Product thumbnail -->
                    <div class="w-10 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                      <template v-if="item.product.main_image && !isImageError(item.product.product_id)">
                        <img 
                          :src="item.product.main_image" 
                          :alt="item.product.product_name"
                          class="w-full h-full object-cover"
                          @error="() => handleImageError(item.product.product_id)"
                        />
                      </template>
                      <Package v-else class="h-4 w-4 text-muted-foreground" />
                    </div>
                    <!-- Product info -->
                    <div class="flex-1">
                      <h4 class="font-medium text-sm">{{ item.product.product_name }}</h4>
                      <p class="text-xs text-muted-foreground">{{ item.product.sku }}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 w-6 p-0"
                    @click="removeFromCart(index)"
                  >
                    <X class="h-3 w-3" />
                  </Button>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-6 w-6 p-0"
                      @click="updateQuantity(index, item.quantity - 1)"
                      :disabled="item.quantity <= 1"
                    >
                      <Minus class="h-3 w-3" />
                    </Button>
                    
                    <!-- Quantity Display/Edit -->
                    <div v-if="editingQuantity[index]" class="flex items-center gap-1">
                      <input
                        type="number"
                        :value="item.quantity"
                        @blur="saveQuantity(index, Number($event.target.value))"
                        @keyup.enter="$event.target.blur()"
                        @keyup.escape="cancelQuantityEdit(index)"
                        class="w-12 h-6 text-sm text-center border border-input rounded px-1 bg-background"
                        min="1"
                        ref="quantityInput"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-4 w-4 p-0"
                        @click="saveQuantity(index, item.quantity)"
                      >
                        <Check class="h-3 w-3 text-green-600" />
                      </Button>
                    </div>
                    <div v-else class="flex items-center gap-1">
                      <span class="text-sm font-medium w-8 text-center">{{ item.quantity }}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                        @click="startQuantityEdit(index)"
                      >
                        <Pencil class="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-6 w-6 p-0"
                      @click="updateQuantity(index, item.quantity + 1)"
                    >
                      <Plus class="h-3 w-3" />
                    </Button>
                  </div>
                  <div class="text-right">
                    <!-- Unit Price Display/Edit -->
                    <div class="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                      <div v-if="editingPrice[index]" class="flex items-center gap-1">
                        <input
                          type="number"
                          :value="item.unit_price"
                          @blur="saveUnitPrice(index, Number($event.target.value))"
                          @keyup.enter="$event.target.blur()"
                          @keyup.escape="cancelPriceEdit(index)"
                          class="w-16 h-5 text-xs text-right border border-input rounded px-1 bg-background"
                          min="0"
                          step="0.01"
                          ref="priceInput"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-4 w-4 p-0"
                          @click="saveUnitPrice(index, item.unit_price)"
                        >
                          <Check class="h-3 w-3 text-green-600" />
                        </Button>
                      </div>
                      <div v-else class="flex items-center gap-1">
                        <span>{{ formatCurrency(item.unit_price) }}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                          @click="startPriceEdit(index)"
                        >
                          <Pencil class="h-3 w-3" />
                        </Button>
                      </div>
                      <span>c/u</span>
                    </div>
                    <p class="font-bold text-sm">
                      {{ formatCurrency(item.total) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Summary and Actions -->
        <div class="border-t border-border p-4 space-y-4">
          <!-- Document Type Selection -->
          <div>
            <label class="text-sm font-medium mb-2 block">Tipo de Comprobante</label>
            <select
              v-model="documentType"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="03">Boleta de Venta</option>
              <option value="01">Factura</option>
            </select>
          </div>

          <!-- Cart Totals -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(cartSubtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>IGV (18%):</span>
              <span>{{ formatCurrency(cartIgv) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t border-border pt-2">
              <span>Total:</span>
              <span class="text-primary">{{ formatCurrency(cartTotal) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <Button
              class="w-full h-12"
              :disabled="cartItems.length === 0 || processing"
              @click="processPayment"
            >
              <Loader2 v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
              <CreditCard v-else class="mr-2 h-4 w-4" />
              {{ processing ? 'Procesando...' : 'Procesar Venta' }}
            </Button>
            
            <div class="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                :disabled="cartItems.length === 0"
                @click="holdSale"
              >
                <Clock class="mr-2 h-4 w-4" />
                Retener
              </Button>
              <Button
                variant="outline"
                :disabled="cartItems.length === 0"
                @click="clearCart"
              >
                <Trash2 class="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Dialog -->
    <Dialog v-model:open="showSettingsDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del POS</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Caja/Terminal</label>
            <Input v-model="posSettings.terminal" placeholder="Terminal 01" class="mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium">Serie por Defecto - Boletas</label>
            <select 
              v-model="posSettings.boletaSeries" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option value="">Seleccionar serie</option>
              <option 
                v-for="serie in availableBoletaSeries" 
                :key="serie.series" 
                :value="serie.series"
              >
                {{ serie.series }} - {{ serie.document_type_name }} (Último: {{ serie.last_number }})
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Serie por Defecto - Facturas</label>
            <select 
              v-model="posSettings.facturaSeries" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option value="">Seleccionar serie</option>
              <option 
                v-for="serie in availableFacturaSeries" 
                :key="serie.series" 
                :value="serie.series"
              >
                {{ serie.series }} - {{ serie.document_type_name }} (Último: {{ serie.last_number }})
              </option>
            </select>
          </div>
          
          <div>
            <label class="text-sm font-medium">Tipo Operación Kardex</label>
            <select 
              v-model="posSettings.operationTypeKardex" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option 
                v-for="type in operationTypes" 
                :key="type.code" 
                :value="type.code"
              >
                {{ type.code }} - {{ type.descripcion }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="text-sm font-medium">Tipo Operación Venta</label>
            <select 
              v-model="posSettings.operationTypeVenta" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option 
                v-for="type in operationTypesV2" 
                :key="type.code" 
                :value="type.code"
              >
                {{ type.code }} - {{ type.descripcion }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <Button variant="outline" @click="showSettingsDialog = false">
            Cancelar
          </Button>
          <Button @click="saveSettings">
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'
import { useDocumentSeries } from '@/composables/useDocumentSeries'
// Removed: import { useProductsStore } from '@/stores/products' - using salesStore instead
import {
  CreditCard,
  Settings,
  Search,
  Plus,
  Package,
  ShoppingCart,
  X,
  Minus,
  Clock,
  Trash2,
  Loader2,
  Pencil,
  Check
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const authStore = useAuthStore()
const { 
  series, 
  operationTypes,
  operationTypesV2,
  loading: seriesLoading, 
  error: seriesError,
  fetchAvailableSeries,
  fetchOperationTypes,
  fetchOperationTypesV2,
  getNextDocumentNumber,
  formatFullDocumentNumber
} = useDocumentSeries()
// Removed productsStore - using salesStore for products

// State
const productSearch = ref('')
const selectedCategory = ref<string | null>(null)
const selectedCustomer = ref('')
const customerSearch = ref('')
const showCustomerDropdown = ref(false)
const documentType = ref('03') // Boleta by default
const processing = ref(false)
const showSettingsDialog = ref(false)
const showProductDialog = ref(false)
const showCustomerDialog = ref(false)
const failedImages = ref(new Set<string>())

// Edit states
const editingQuantity = ref<Record<number, boolean>>({})
const editingPrice = ref<Record<number, boolean>>({})

// Cart
const cartItems = ref<Array<{
  product: any
  quantity: number
  unit_price: number
  total: number
}>>([])

// POS Settings
const posSettings = ref({
  terminal: 'Terminal 01',
  boletaSeries: 'B001',
  facturaSeries: 'F001',
  operationTypeKardex: '01', // cat_12 - Default: VENTA INTERNA
  operationTypeVenta: '0101' // cat_17 - Default: VENTA INTERNA
})

// Load settings from localStorage
const loadSettingsFromStorage = () => {
  const stored = localStorage.getItem('pos_settings')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      posSettings.value = { ...posSettings.value, ...parsed }
    } catch (error) {
      console.error('Error parsing stored POS settings:', error)
    }
  }
}

// Save settings to localStorage
const saveSettingsToStorage = () => {
  localStorage.setItem('pos_settings', JSON.stringify(posSettings.value))
}

// Computed current user from auth store
const currentUser = computed(() => {
  if (authStore.user) {
    return {
      name: authStore.user.user_metadata?.name || 
            authStore.user.user_metadata?.full_name || 
            authStore.user.email?.split('@')[0] || 
            'Usuario'
    }
  }
  return { name: 'Usuario' }
})

// Computed
// Get unique categories from products
const categories = computed(() => {
  const uniqueCategories = new Set()
  const categoriesWithNames: Array<{id: string, name: string}> = []
  
  salesStore.activeProducts.forEach(product => {
    if (!uniqueCategories.has(product.category_id)) {
      uniqueCategories.add(product.category_id)
      categoriesWithNames.push({
        id: product.category_id,
        name: product.category_name
      })
    }
  })
  
  return categoriesWithNames
})

const customers = computed(() => salesStore.activeCustomers || [])

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return customers.value
  
  const search = customerSearch.value.toLowerCase()
  return customers.value.filter(customer => 
    (customer.fullname || customer.name || '').toLowerCase().includes(search) ||
    customer.doc_number?.toLowerCase().includes(search) ||
    customer.email?.toLowerCase().includes(search)
  )
})

const selectedCustomerData = computed(() => {
  if (!selectedCustomer.value) return null
  return customers.value.find(c => c.id === selectedCustomer.value)
})

const filteredProducts = computed(() => {
  let products = salesStore.availableProducts || []
  
  // Filter by category
  if (selectedCategory.value) {
    products = products.filter(p => p.category_id === selectedCategory.value)
  }
  
  // Filter by search
  if (productSearch.value) {
    const search = productSearch.value.toLowerCase()
    products = products.filter(p => 
      p.product_name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      (p.barcode && p.barcode.toLowerCase().includes(search))
    )
  }
  
  return products
})

const cartSubtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
})

const cartIgv = computed(() => {
  return cartSubtotal.value * 0.18
})

const cartTotal = computed(() => {
  return cartSubtotal.value + cartIgv.value
})

// Series computadas
const availableBoletaSeries = computed(() => {
  return series.value.filter(s => s.document_type_code === '03' && s.is_active)
})

const availableFacturaSeries = computed(() => {
  return series.value.filter(s => s.document_type_code === '01' && s.is_active)
})

// Serie actual seleccionada
const currentSeries = computed(() => {
  const seriesCode = documentType.value === '01' ? posSettings.value.facturaSeries : posSettings.value.boletaSeries
  return series.value.find(s => s.series === seriesCode && s.document_type_code === documentType.value)
})

// Methods
const searchProducts = () => {
  // Search is handled by computed property
}

const searchCustomers = () => {
  // Search is handled by computed property
  showCustomerDropdown.value = true
}

const selectCustomer = (customer: any) => {
  if (customer) {
    selectedCustomer.value = customer.id
    customerSearch.value = customer.fullname || customer.name
  } else {
    selectedCustomer.value = ''
    customerSearch.value = 'Cliente General'
  }
  showCustomerDropdown.value = false
}

// Close dropdown when clicking outside
document.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showCustomerDropdown.value = false
  }
})

const onPriceListChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const priceListId = target.value
  
  if (priceListId && companiesStore.currentCompany) {
    // Find and select the price list
    const priceList = salesStore.activePriceLists.find(pl => pl.id === priceListId)
    if (priceList) {
      salesStore.selectPriceList(priceList)
      
      // Reload products with the new price list
      await salesStore.fetchProducts(companiesStore.currentCompany.id, priceListId)
    }
  }
}

const addToCart = (product: any) => {
  const existingIndex = cartItems.value.findIndex(item => item.product.product_id === product.product_id)
  
  if (existingIndex >= 0) {
    updateQuantity(existingIndex, cartItems.value[existingIndex].quantity + 1)
  } else {
    cartItems.value.push({
      product,
      quantity: 1,
      unit_price: product.unit_price || 0,
      total: product.unit_price || 0
    })
  }
}

const removeFromCart = (index: number) => {
  cartItems.value.splice(index, 1)
}

const updateQuantity = (index: number, newQuantity: number) => {
  if (newQuantity < 1) return
  
  cartItems.value[index].quantity = newQuantity
  cartItems.value[index].total = cartItems.value[index].unit_price * newQuantity
}

const updateUnitPrice = (index: number, newPrice: number) => {
  if (newPrice < 0) return
  
  cartItems.value[index].unit_price = newPrice
  cartItems.value[index].total = newPrice * cartItems.value[index].quantity
}

// Inline editing functions
const startQuantityEdit = (index: number) => {
  editingQuantity.value[index] = true
  // Focus the input after DOM update
  nextTick(() => {
    const inputs = document.querySelectorAll('input[ref="quantityInput"]')
    if (inputs[index]) {
      (inputs[index] as HTMLInputElement).focus()
      ;(inputs[index] as HTMLInputElement).select()
    }
  })
}

const saveQuantity = (index: number, newQuantity: number) => {
  if (newQuantity >= 1) {
    updateQuantity(index, newQuantity)
  }
  editingQuantity.value[index] = false
}

const cancelQuantityEdit = (index: number) => {
  editingQuantity.value[index] = false
}

const startPriceEdit = (index: number) => {
  editingPrice.value[index] = true
  // Focus the input after DOM update
  nextTick(() => {
    const inputs = document.querySelectorAll('input[ref="priceInput"]')
    if (inputs[index]) {
      (inputs[index] as HTMLInputElement).focus()
      ;(inputs[index] as HTMLInputElement).select()
    }
  })
}

const saveUnitPrice = (index: number, newPrice: number) => {
  if (newPrice >= 0) {
    updateUnitPrice(index, newPrice)
  }
  editingPrice.value[index] = false
}

const cancelPriceEdit = (index: number) => {
  editingPrice.value[index] = false
}

const clearCart = () => {
  cartItems.value = []
  selectedCustomer.value = ''
  // Clear editing states
  editingQuantity.value = {}
  editingPrice.value = {}
}

const holdSale = () => {
  // TODO: Implement hold sale functionality
  console.log('Hold sale:', cartItems.value)
}

const processPayment = async () => {
  if (cartItems.value.length === 0) return
  
  processing.value = true
  
  try {
    // Validar que la empresa y serie estén definidas
    if (!companiesStore.currentCompany?.id) {
      throw new Error('No hay empresa seleccionada')
    }

    const seriesCode = documentType.value === '01' ? posSettings.value.facturaSeries : posSettings.value.boletaSeries
    if (!seriesCode) {
      throw new Error('No se ha configurado una serie para este tipo de documento')
    }

    // Obtener el siguiente número usando la función de la base de datos
    const nextNumber = await getNextDocumentNumber(
      companiesStore.currentCompany.id,
      documentType.value,
      seriesCode
    )

    if (!nextNumber) {
      throw new Error('No se pudo generar el número de documento')
    }

    // Create sales document
    const salesDocData = {
      company_id: companiesStore.currentCompany.id,
      customer_id: selectedCustomer.value || null,
      doc_type: documentType.value,
      series: seriesCode,
      number: nextNumber, // Usar número generado automáticamente
      issue_date: new Date().toISOString().split('T')[0],
      currency_code: 'PEN',
      exchange_rate: 1,
      op_type_venta: posSettings.value.operationTypeVenta, // Tipo operación venta (cat_17)
      op_type_kardex: posSettings.value.operationTypeKardex, // Tipo operación kardex (cat_12)
      total_ope_gravadas: cartSubtotal.value,
      total_ope_gravadas_local: cartSubtotal.value,
      total_igv: cartIgv.value,
      total_igv_local: cartIgv.value,
      total: cartTotal.value,
      total_local: cartTotal.value,
      igv_affectation: '10',
      items: cartItems.value.map(item => ({
        product_id: item.product.product_id,
        description: item.product.product_name,
        unit_code: item.product.unit_code || 'NIU',
        quantity: item.quantity,
        unit_price: item.unit_price,
        igv_affectation: '10',
        total_line: item.total
      }))
    }
    
    await salesStore.createSalesDoc(salesDocData)
    
    // Clear cart after successful sale
    clearCart()
    
    // Show success message with document number
    const fullDocNumber = formatFullDocumentNumber(seriesCode, nextNumber)
    console.log(`Venta procesada exitosamente! Documento: ${fullDocNumber}`)
    
    // TODO: Show success toast and print receipt
    
  } catch (error) {
    console.error('Error processing sale:', error)
    // TODO: Show error toast with specific message
  } finally {
    processing.value = false
  }
}

const saveSettings = () => {
  saveSettingsToStorage()
  showSettingsDialog.value = false
  console.log('Settings saved:', posSettings.value)
}

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const handleImageError = (productId: string) => {
  failedImages.value.add(productId)
}

const isImageError = (productId: string) => {
  return failedImages.value.has(productId)
}

// Lifecycle
onMounted(async () => {
  // Load settings from localStorage first
  loadSettingsFromStorage()
  
  if (companiesStore.currentCompany) {
    // Load all necessary data for POS
    await Promise.all([
      // Load price lists
      salesStore.fetchPriceLists(companiesStore.currentCompany.id),
      // Load customers
      salesStore.fetchCustomers(companiesStore.currentCompany.id),
      // Load available series for documents
      fetchAvailableSeries(companiesStore.currentCompany.id),
      // Load SUNAT operation types
      fetchOperationTypes(),
      fetchOperationTypesV2()
    ])
    
    // Then load products with selected price list
    await salesStore.fetchProducts(companiesStore.currentCompany.id, salesStore.selectedPriceList?.id)
    
    // Set default series if available and not already set
    if (availableBoletaSeries.value.length > 0 && !posSettings.value.boletaSeries) {
      posSettings.value.boletaSeries = availableBoletaSeries.value[0].series
    }
    if (availableFacturaSeries.value.length > 0 && !posSettings.value.facturaSeries) {
      posSettings.value.facturaSeries = availableFacturaSeries.value[0].series
    }
    
    // Save updated settings
    saveSettingsToStorage()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>