<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Inventario</h1>
        <p class="text-muted-foreground">
          Control de stock y movimientos de almacén
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Ajuste de Stock
        </Button>
      </div>
    </div>

    <!-- Warehouse Selector -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select 
              v-model="selectedWarehouse"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los almacenes</option>
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Categoría</label>
            <select 
              v-model="selectedCategory"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las categorías</option>
              <option 
                v-for="category in productsStore.activeCategories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select 
              v-model="selectedStatus"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="low">Stock bajo</option>
              <option value="out">Sin stock</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Inventory Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Valor Total</p>
              <div class="text-2xl font-bold">
                <span v-if="inventoryCurrency.loading.value">
                  <Loader2 class="inline h-5 w-5 animate-spin mr-2" />
                  Calculando...
                </span>
                <span v-else>
                  {{ formatCurrency(inventoryCurrency.getTotalValue.value, companyCurrency) }}
                </span>
              </div>
            </div>
            <TrendingUp class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Productos</p>
              <p class="text-2xl font-bold">{{ totalProducts }}</p>
            </div>
            <Package class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Stock Bajo</p>
              <p class="text-2xl font-bold text-amber-600">{{ lowStockCount }}</p>
            </div>
            <AlertTriangle class="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Sin Stock</p>
              <p class="text-2xl font-bold text-red-600">{{ noStockCount }}</p>
            </div>
            <AlertCircle class="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Inventory Table -->
    <Card>
      <CardHeader>
        <CardTitle>Stock de Productos</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Almacén</TableHead>
              <TableHead>Stock Actual</TableHead>
              <TableHead>Reservado</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead>Costo Promedio</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="productsStore.loading">
              <TableCell colspan="8" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando inventario...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="inventoryItems.length === 0">
              <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
                No se encontraron elementos en el inventario
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="item in inventoryItems" :key="`${item.product_id}-${item.warehouse_id}`">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Package class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ item.product_name }}</p>
                    <p class="text-sm text-muted-foreground">{{ item.product_sku }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{{ item.warehouse_name }}</Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ item.balance_qty }}</span>
                  <Badge 
                    v-if="item.balance_qty < 20" 
                    variant="warning" 
                    class="text-xs"
                  >
                    Bajo
                  </Badge>
                  <Badge 
                    v-if="item.balance_qty === 0" 
                    variant="destructive" 
                    class="text-xs"
                  >
                    Sin stock
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span class="text-amber-600">{{ item.reserved_qty }}</span>
              </TableCell>
              <TableCell>
                <span class="font-medium text-green-600">{{ item.available_qty }}</span>
              </TableCell>
              <TableCell>
                <CostDisplay 
                  :cost="item.average_cost" 
                  :currency="item.original_currency || 'PEN'"
                />
              </TableCell>
              <TableCell>
                <CostDisplay 
                  :cost="item.balance_qty * item.average_cost" 
                  :currency="item.original_currency || 'PEN'"
                />
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Ver movimientos">
                    <History class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Ajustar stock">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useProductsStore } from '@/stores/products'
import { useInventoryCurrency } from '@/composables/useInventoryCurrency'
import {
  Download,
  Plus,
  TrendingUp,
  Package,
  AlertTriangle,
  AlertCircle,
  History,
  Edit,
  MoreVertical,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Badge from '@/components/ui/Badge.vue'
import CostDisplay from '@/components/inventory/CostDisplay.vue'

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

// Currency conversion
const inventoryCurrency = useInventoryCurrency(productsStore.inventoryItems)
const companyCurrency = computed(() => companyStore.selectedCompany?.currency_code || 'PEN')

// Filters
const selectedWarehouse = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')

// Computed
const filteredInventoryItems = computed(() => {
  let items = productsStore.inventoryItems

  if (selectedWarehouse.value) {
    items = items.filter(item => item.warehouse_id === selectedWarehouse.value)
  }

  if (selectedCategory.value) {
    // Note: Would need to add category filtering if available in inventory data
    // For now, we'll skip this filter
  }

  if (selectedStatus.value === 'low') {
    items = items.filter(item => 
      item.balance_qty > 0 && item.balance_qty <= (item.min_stock || 20)
    )
  } else if (selectedStatus.value === 'out') {
    items = items.filter(item => item.balance_qty <= 0)
  }

  return items
})

const totalValue = computed(() => {
  return filteredInventoryItems.value.reduce((total, item) => 
    total + (item.balance_qty * item.average_cost), 0
  )
})

const totalProducts = computed(() => {
  return filteredInventoryItems.value.filter(item => item.balance_qty > 0).length
})

const lowStockCount = computed(() => {
  return filteredInventoryItems.value.filter(item => 
    item.balance_qty > 0 && item.balance_qty <= (item.min_stock || 20)
  ).length
})

const noStockCount = computed(() => {
  return filteredInventoryItems.value.filter(item => item.balance_qty <= 0).length
})

const inventoryItems = computed(() => filteredInventoryItems.value)
const warehouses = computed(() => productsStore.warehouses)

const formatCurrency = (amount: number, currencyCode: string = 'PEN') => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (currencyCode === 'USD') {
    return `$ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else {
    return `${currencyCode} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

onMounted(async () => {
  try {
    // Ensure companies are loaded
    if (companyStore.companies.length === 0) {
      await companyStore.fetchCompanies()
    }

    // Auto-select first company if none selected
    if (!companyStore.selectedCompany && companyStore.companies.length > 0) {
      companyStore.selectCompany(companyStore.companies[0])
    }

    // Load inventory data if company is available
    if (companyStore.selectedCompany) {
      console.log('Loading inventory for company:', companyStore.selectedCompany.legal_name)
      
      await Promise.all([
        productsStore.fetchInventoryItems(companyStore.selectedCompany.id),
        productsStore.fetchWarehouses(companyStore.selectedCompany.id),
        productsStore.fetchCategories(companyStore.selectedCompany.id)
      ])
      
      console.log('Inventory items loaded:', productsStore.inventoryItems.length)
      
      // Convert inventory currencies after loading
      await inventoryCurrency.convertAllItems(productsStore.inventoryItems)
    } else {
      console.warn('No company available to load inventory')
    }
  } catch (error) {
    console.error('Error loading inventory data:', error)
  }
})

// Watch for changes in inventory items and reconvert
watch(
  () => productsStore.inventoryItems,
  async (newItems) => {
    if (newItems.length > 0) {
      await inventoryCurrency.convertAllItems(newItems)
    }
  }
)
</script>