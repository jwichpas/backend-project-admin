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
            <select
              v-model="selectedCustomer"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Cliente General</option>
              <option
                v-for="customer in customers"
                :key="customer.id"
                :value="customer.id"
              >
                {{ customer.name }} - {{ customer.doc_number }}
              </option>
            </select>
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
                    <span class="text-sm font-medium w-8 text-center">{{ item.quantity }}</span>
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
                    <p class="text-xs text-muted-foreground">
                      {{ formatCurrency(item.unit_price) }} c/u
                    </p>
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
            <Input v-model="posSettings.boletaSeries" placeholder="B001" class="mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium">Serie por Defecto - Facturas</label>
            <Input v-model="posSettings.facturaSeries" placeholder="F001" class="mt-1" />
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
import { ref, computed, onMounted } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
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
  Loader2
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
// Removed productsStore - using salesStore for products

// State
const productSearch = ref('')
const selectedCategory = ref<string | null>(null)
const selectedCustomer = ref('')
const documentType = ref('03') // Boleta by default
const processing = ref(false)
const showSettingsDialog = ref(false)
const showProductDialog = ref(false)
const showCustomerDialog = ref(false)
const failedImages = ref(new Set<string>())

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
  facturaSeries: 'F001'
})

// Mock current user
const currentUser = ref({
  name: 'Usuario Vendedor'
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

// Methods
const searchProducts = () => {
  // Search is handled by computed property
}

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

const clearCart = () => {
  cartItems.value = []
  selectedCustomer.value = ''
}

const holdSale = () => {
  // TODO: Implement hold sale functionality
  console.log('Hold sale:', cartItems.value)
}

const processPayment = async () => {
  if (cartItems.value.length === 0) return
  
  processing.value = true
  
  try {
    // Create sales document
    const salesDocData = {
      company_id: companiesStore.currentCompany?.id,
      customer_id: selectedCustomer.value || null,
      doc_type: documentType.value,
      series: documentType.value === '01' ? posSettings.value.facturaSeries : posSettings.value.boletaSeries,
      number: Date.now(), // Mock number generation
      issue_date: new Date().toISOString().split('T')[0],
      currency_code: 'PEN',
      exchange_rate: 1,
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
    
    // TODO: Show success message and print receipt
    console.log('Sale processed successfully!')
    
  } catch (error) {
    console.error('Error processing sale:', error)
    // TODO: Show error message
  } finally {
    processing.value = false
  }
}

const saveSettings = () => {
  // TODO: Save POS settings to localStorage or backend
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
  if (companiesStore.currentCompany) {
    // First load price lists
    await salesStore.fetchPriceLists(companiesStore.currentCompany.id)
    
    // Then load products with selected price list and customers
    await Promise.all([
      salesStore.fetchProducts(companiesStore.currentCompany.id, salesStore.selectedPriceList?.id),
      salesStore.fetchCustomers(companiesStore.currentCompany.id)
    ])
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