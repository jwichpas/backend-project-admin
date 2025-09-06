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
              <option value="LACTEOS">Lácteos</option>
              <option value="ABARROTES">Abarrotes</option>
              <option value="BEBIDAS">Bebidas</option>
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
              <p class="text-2xl font-bold">S/ 125,840</p>
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
              <p class="text-2xl font-bold">1,247</p>
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
              <p class="text-2xl font-bold text-amber-600">23</p>
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
              <p class="text-2xl font-bold text-red-600">8</p>
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
            <TableRow v-for="item in inventoryItems" :key="`${item.product_id}-${item.warehouse_id}`">
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
                {{ formatCurrency(item.average_cost) }}
              </TableCell>
              <TableCell>
                <span class="font-medium">{{ formatCurrency(item.balance_qty * item.average_cost) }}</span>
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
import { ref } from 'vue'
import {
  Download,
  Plus,
  TrendingUp,
  Package,
  AlertTriangle,
  AlertCircle,
  History,
  Edit,
  MoreVertical
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

interface InventoryItem {
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  warehouse_name: string
  balance_qty: number
  reserved_qty: number
  available_qty: number
  average_cost: number
}

interface Warehouse {
  id: string
  name: string
}

// Filters
const selectedWarehouse = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')

// Mock data
const warehouses = ref<Warehouse[]>([
  { id: '1', name: 'Almacén Principal' },
  { id: '2', name: 'Almacén Ate' }
])

const inventoryItems = ref<InventoryItem[]>([
  {
    product_id: '1',
    product_name: 'Leche Gloria Entera 1L',
    product_sku: 'LECHE-GLORIA-1L',
    warehouse_id: '1',
    warehouse_name: 'Almacén Principal',
    balance_qty: 100,
    reserved_qty: 0,
    available_qty: 100,
    average_cost: 12.50
  },
  {
    product_id: '2',
    product_name: 'Aceite Primor 1L',
    product_sku: 'ACEITE-PRIMOR-1L',
    warehouse_id: '1',
    warehouse_name: 'Almacén Principal',
    balance_qty: 15,
    reserved_qty: 5,
    available_qty: 10,
    average_cost: 8.50
  }
])

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>