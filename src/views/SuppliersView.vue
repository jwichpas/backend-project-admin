<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Proveedores</h1>
        <p class="text-muted-foreground">
          Gestiona tus proveedores y su información comercial
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>
    </div>

    <!-- Supplier Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Proveedores</p>
              <p class="text-2xl font-bold">84</p>
            </div>
            <Truck class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Activos</p>
              <p class="text-2xl font-bold text-green-600">78</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Órdenes Pendientes</p>
              <p class="text-2xl font-bold text-amber-600">12</p>
            </div>
            <Clock class="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Compras (Mes)</p>
              <p class="text-2xl font-bold">S/ 89,250</p>
            </div>
            <TrendingUp class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input 
              v-model="searchTerm" 
              placeholder="Razón social, RUC..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Categoría</label>
            <select 
              v-model="selectedCategory"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="food">Alimentos</option>
              <option value="beverage">Bebidas</option>
              <option value="cleaning">Limpieza</option>
              <option value="office">Oficina</option>
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
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Ubicación</label>
            <select 
              v-model="selectedLocation"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="lima">Lima</option>
              <option value="callao">Callao</option>
              <option value="provinces">Provincias</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Suppliers Table -->
    <Card>
      <CardHeader>
        <CardTitle>Lista de Proveedores</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Compras (Año)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="supplier in suppliers" :key="supplier.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Building class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ supplier.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ supplier.trade_name }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-1 rounded text-sm">{{ supplier.ruc }}</code>
              </TableCell>
              <TableCell>
                <div>
                  <p class="text-sm">{{ supplier.email || '-' }}</p>
                  <p class="text-sm text-muted-foreground">{{ supplier.phone || '-' }}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{{ supplier.category }}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p class="font-medium">{{ formatCurrency(supplier.total_purchases) }}</p>
                  <p class="text-sm text-muted-foreground">{{ supplier.order_count }} órdenes</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(supplier.status) as any">
                  {{ getStatusName(supplier.status) }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Ver perfil">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Editar">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Historial">
                    <History class="h-4 w-4" />
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
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  Building,
  Eye,
  Edit,
  History,
  MoreVertical
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

interface Supplier {
  id: string
  name: string
  trade_name?: string
  ruc: string
  email?: string
  phone?: string
  category: string
  total_purchases: number
  order_count: number
  status: string
}

// Filters
const searchTerm = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedLocation = ref('')

// Mock data based on seed.sql
const suppliers = ref<Supplier[]>([
  {
    id: '1',
    name: 'GLORIA S.A.',
    trade_name: 'Grupo Gloria',
    ruc: '20100066671',
    email: 'ventas@gloria.com.pe',
    phone: '01-315-0000',
    category: 'Alimentos',
    total_purchases: 245800.50,
    order_count: 28,
    status: 'active'
  },
  {
    id: '2',
    name: 'ALICORP S.A.A.',
    trade_name: 'Alicorp',
    ruc: '20100055519',
    email: 'atencion@alicorp.com.pe',
    phone: '01-315-0900',
    category: 'Alimentos',
    total_purchases: 189450.30,
    order_count: 22,
    status: 'active'
  },
  {
    id: '3',
    name: 'DISTRIBUIDORA ABC S.R.L.',
    trade_name: 'ABC Distribuciones',
    ruc: '20987654321',
    email: 'ventas@abcdist.pe',
    phone: '01-456-7890',
    category: 'Bebidas',
    total_purchases: 45200.75,
    order_count: 12,
    status: 'inactive'
  }
])

const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    'active': 'success',
    'inactive': 'outline',
    'blocked': 'destructive'
  }
  return variants[status] || 'outline'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    'active': 'Activo',
    'inactive': 'Inactivo',
    'blocked': 'Bloqueado'
  }
  return names[status] || status
}

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>