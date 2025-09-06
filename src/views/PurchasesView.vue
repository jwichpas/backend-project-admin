<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Compras</h1>
        <p class="text-muted-foreground">
          Gestiona órdenes de compra y documentos de proveedores
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Compra
        </Button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Este Mes</p>
              <p class="text-2xl font-bold">S/ 45,280</p>
            </div>
            <ShoppingCart class="h-8 w-8 text-blue-500" />
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
              <p class="text-sm text-muted-foreground">Proveedores</p>
              <p class="text-2xl font-bold">28</p>
            </div>
            <Truck class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Por Recibir</p>
              <p class="text-2xl font-bold">5</p>
            </div>
            <Package class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Purchases Table -->
    <Card>
      <CardHeader>
        <CardTitle>Documentos de Compra Recientes</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="doc in purchaseDocs" :key="doc.id">
              <TableCell>
                <div>
                  <p class="font-medium">{{ doc.series }}-{{ String(doc.number).padStart(8, '0') }}</p>
                  <p class="text-sm text-muted-foreground">{{ doc.doc_type === '01' ? 'Factura' : 'Boleta' }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p class="font-medium">{{ doc.supplier_name }}</p>
                  <p class="text-sm text-muted-foreground">{{ doc.supplier_ruc }}</p>
                </div>
              </TableCell>
              <TableCell>
                {{ formatDate(doc.issue_date) }}
              </TableCell>
              <TableCell>
                <span class="font-medium">{{ formatCurrency(doc.total) }}</span>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(doc.status) as any">
                  {{ getStatusName(doc.status) }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Eye class="h-4 w-4" />
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
  ShoppingCart,
  Clock,
  Truck,
  Package,
  Eye,
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

interface PurchaseDoc {
  id: string
  doc_type: string
  series: string
  number: number
  supplier_name: string
  supplier_ruc: string
  issue_date: string
  total: number
  status: string
}

// Mock data based on seed.sql
const purchaseDocs = ref<PurchaseDoc[]>([
  {
    id: '1',
    doc_type: '01',
    series: 'F001',
    number: 12345,
    supplier_name: 'GLORIA S.A.',
    supplier_ruc: '20100066671',
    issue_date: '2024-01-10',
    total: 1475.00,
    status: 'RECEIVED'
  },
  {
    id: '2',
    doc_type: '01',
    series: 'F001',
    number: 12346,
    supplier_name: 'ALICORP S.A.A.',
    supplier_ruc: '20100055519',
    issue_date: '2024-01-12',
    total: 850.00,
    status: 'PENDING'
  }
])

// Helper functions
const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    'PENDING': 'warning',
    'RECEIVED': 'success',
    'CANCELLED': 'destructive'
  }
  return variants[status] || 'outline'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    'PENDING': 'Pendiente',
    'RECEIVED': 'Recibido',
    'CANCELLED': 'Cancelado'
  }
  return names[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>