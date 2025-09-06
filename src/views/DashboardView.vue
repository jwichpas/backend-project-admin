<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
        <p class="text-muted-foreground">
          Resumen general de {{ companyStore.selectedCompany?.legal_name || 'tu empresa' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Ventas Hoy</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">S/ 2,350.00</div>
          <p class="text-xs text-muted-foreground">
            <span class="text-green-600">+12.5%</span> vs ayer
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Productos Vendidos</CardTitle>
          <Package class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">156</div>
          <p class="text-xs text-muted-foreground">
            <span class="text-green-600">+8.2%</span> vs ayer
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Stock Bajo</CardTitle>
          <AlertTriangle class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-amber-600">23</div>
          <p class="text-xs text-muted-foreground">
            Productos requieren reposición
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Clientes Nuevos</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">12</div>
          <p class="text-xs text-muted-foreground">
            <span class="text-green-600">+4</span> esta semana
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts and Tables Row -->
    <div class="grid gap-6 lg:grid-cols-7">
      <!-- Sales Chart -->
      <div class="lg:col-span-4">
        <DefaultMultipleBarChart />
      </div>

      <!-- Recent Activities -->
      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-green-500"></div>
            <div class="flex-1 space-y-1">
              <p class="text-sm">Venta F001-000123 completada</p>
              <p class="text-xs text-muted-foreground">hace 2 minutos</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-blue-500"></div>
            <div class="flex-1 space-y-1">
              <p class="text-sm">Nuevo producto agregado</p>
              <p class="text-xs text-muted-foreground">hace 15 minutos</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-amber-500"></div>
            <div class="flex-1 space-y-1">
              <p class="text-sm">Stock bajo en Leche Gloria 1L</p>
              <p class="text-xs text-muted-foreground">hace 1 hora</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-purple-500"></div>
            <div class="flex-1 space-y-1">
              <p class="text-sm">Reporte mensual generado</p>
              <p class="text-xs text-muted-foreground">hace 2 horas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Sales and Top Products -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recent Sales -->
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Plaza Vea S.A.</TableCell>
                <TableCell>S/ 850.00</TableCell>
                <TableCell>
                  <Badge variant="success">Pagado</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tottus S.A.</TableCell>
                <TableCell>S/ 1,200.00</TableCell>
                <TableCell>
                  <Badge variant="warning">Pendiente</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Juan Pérez</TableCell>
                <TableCell>S/ 45.50</TableCell>
                <TableCell>
                  <Badge variant="success">Pagado</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Top Products -->
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Package class="h-6 w-6 text-white" />
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium">Leche Gloria Entera 1L</h4>
                <p class="text-xs text-muted-foreground">156 vendidos</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">S/ 15.00</p>
                <p class="text-xs text-green-600">+12%</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Package class="h-6 w-6 text-white" />
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium">Aceite Primor 1L</h4>
                <p class="text-xs text-muted-foreground">98 vendidos</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">S/ 8.50</p>
                <p class="text-xs text-green-600">+8%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useProductsStore } from '@/stores/products'
import {
  Download,
  Plus,
  TrendingUp,
  Package,
  AlertTriangle,
  Users
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
import DefaultMultipleBarChart from '@/components/ui/DefaultMultipleBarChart.vue'

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

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