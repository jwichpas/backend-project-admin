<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Productos</h1>
        <p class="text-muted-foreground">
          Gestiona el catálogo de productos de tu empresa
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input 
              v-model="searchTerm" 
              placeholder="Nombre, SKU o código de barras..."
              class="mt-1"
            />
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
            <label class="text-sm font-medium">Marca</label>
            <select 
              v-model="selectedBrand"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las marcas</option>
              <option 
                v-for="brand in productsStore.activeBrands" 
                :key="brand.id" 
                :value="brand.id"
              >
                {{ brand.name }}
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
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Products Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Lista de Productos ({{ filteredProducts.length }})</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter class="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="productsStore.loading">
              <TableCell colspan="8" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando productos...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredProducts.length === 0">
              <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
                No se encontraron productos
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="product in filteredProducts" :key="product.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Package class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ product.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ product.description }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-1 rounded text-sm">{{ product.sku }}</code>
              </TableCell>
              <TableCell>
                <span v-if="product.brand_id">
                  {{ productsStore.brands.find(b => b.id === product.brand_id)?.name || '-' }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <span v-if="product.category_id">
                  {{ productsStore.categories.find(c => c.id === product.category_id)?.name || '-' }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <span>{{ getProductTotalStock(product.id) }}</span>
                  <Badge 
                    v-if="getProductTotalStock(product.id) < 20" 
                    variant="warning" 
                    class="text-xs"
                  >
                    Bajo
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span class="font-medium">S/ 15.00</span>
              </TableCell>
              <TableCell>
                <Badge :variant="product.is_active ? 'success' : 'outline'">
                  {{ product.is_active ? 'Activo' : 'Inactivo' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
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
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useProductsStore } from '@/stores/products'
import {
  Download,
  Plus,
  Filter,
  Package,
  Eye,
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
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Badge from '@/components/ui/Badge.vue'

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

// Filters
const searchTerm = ref('')
const selectedCategory = ref('')
const selectedBrand = ref('')
const selectedStatus = ref('')

// Computed
const filteredProducts = computed(() => {
  let products = productsStore.products

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    products = products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      (product.barcode && product.barcode.toLowerCase().includes(term))
    )
  }

  if (selectedCategory.value) {
    products = products.filter(product => product.category_id === selectedCategory.value)
  }

  if (selectedBrand.value) {
    products = products.filter(product => product.brand_id === selectedBrand.value)
  }

  if (selectedStatus.value === 'active') {
    products = products.filter(product => product.is_active)
  } else if (selectedStatus.value === 'inactive') {
    products = products.filter(product => !product.is_active)
  }

  return products
})

// Methods
const getProductTotalStock = (productId: string) => {
  const stock = productsStore.getProductStock(productId)
  return stock.reduce((total, s) => total + s.available_qty, 0)
}

onMounted(async () => {
  if (companyStore.selectedCompany) {
    await Promise.all([
      productsStore.fetchProducts(companyStore.selectedCompany.id),
      productsStore.fetchBrands(companyStore.selectedCompany.id),
      productsStore.fetchCategories(companyStore.selectedCompany.id),
      productsStore.fetchWarehouses(companyStore.selectedCompany.id),
      productsStore.fetchWarehouseStock()
    ])
  }
})
</script>