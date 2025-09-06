<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Clientes</h1>
        <p class="text-muted-foreground">
          Gestiona tu base de clientes y su información
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>
    </div>

    <!-- Customer Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Clientes</p>
              <p class="text-2xl font-bold">1,247</p>
            </div>
            <Users class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Activos</p>
              <p class="text-2xl font-bold text-green-600">1,198</p>
            </div>
            <UserCheck class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Nuevos (Mes)</p>
              <p class="text-2xl font-bold">28</p>
            </div>
            <UserPlus class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">VIP</p>
              <p class="text-2xl font-bold text-amber-600">45</p>
            </div>
            <Crown class="h-8 w-8 text-amber-500" />
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
              placeholder="Nombre, RUC, DNI..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Tipo</label>
            <select 
              v-model="selectedType"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="business">Empresa</option>
              <option value="person">Persona</option>
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
          <div>
            <label class="text-sm font-medium">Segmento</label>
            <select 
              v-model="selectedSegment"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="vip">VIP</option>
              <option value="regular">Regular</option>
              <option value="new">Nuevo</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Customers Table -->
    <Card>
      <CardHeader>
        <CardTitle>Lista de Clientes</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ventas</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="customer in customers" :key="customer.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ customer.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ customer.segment }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <Badge :variant="customer.doc_type === '6' ? 'default' : 'secondary'">
                    {{ customer.doc_type === '6' ? 'RUC' : 'DNI' }}
                  </Badge>
                  <p class="text-sm mt-1">{{ customer.doc_number }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p class="text-sm">{{ customer.email || '-' }}</p>
                  <p class="text-sm text-muted-foreground">{{ customer.phone || '-' }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p class="font-medium">{{ formatCurrency(customer.total_sales) }}</p>
                  <p class="text-sm text-muted-foreground">{{ customer.purchase_count }} compras</p>
                </div>
              </TableCell>
              <TableCell>
                {{ customer.last_purchase ? formatDate(customer.last_purchase) : 'Nunca' }}
              </TableCell>
              <TableCell>
                <Badge :variant="customer.is_active ? 'success' : 'outline'">
                  {{ customer.is_active ? 'Activo' : 'Inactivo' }}
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
  Users,
  UserCheck,
  UserPlus,
  Crown,
  User,
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

interface Customer {
  id: string
  name: string
  doc_type: string
  doc_number: string
  email?: string
  phone?: string
  segment: string
  total_sales: number
  purchase_count: number
  last_purchase?: string
  is_active: boolean
}

// Filters
const searchTerm = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const selectedSegment = ref('')

// Mock data based on seed.sql
const customers = ref<Customer[]>([
  {
    id: '1',
    name: 'PLAZA VEA S.A.',
    doc_type: '6',
    doc_number: '20100033345',
    email: 'compras@plazavea.com.pe',
    phone: '01-615-5000',
    segment: 'VIP',
    total_sales: 125840.50,
    purchase_count: 45,
    last_purchase: '2024-01-15',
    is_active: true
  },
  {
    id: '2',
    name: 'TOTTUS S.A.',
    doc_type: '6',
    doc_number: '20100022278',
    email: 'proveedores@tottus.com.pe',
    segment: 'VIP',
    total_sales: 89340.20,
    purchase_count: 32,
    last_purchase: '2024-01-14',
    is_active: true
  },
  {
    id: '3',
    name: 'Juan Pérez García',
    doc_type: '1',
    doc_number: '45879632',
    email: 'juan.perez@email.com',
    phone: '987-654-321',
    segment: 'Regular',
    total_sales: 1250.75,
    purchase_count: 8,
    last_purchase: '2024-01-13',
    is_active: true
  }
])

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>