<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Reportes</h1>
        <p class="text-muted-foreground">
          Análisis y reportes de tu negocio
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Calendar class="mr-2 h-4 w-4" />
          Programar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Reporte
        </Button>
      </div>
    </div>

    <!-- Report Categories -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Sales Reports -->
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <TrendingUp class="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle class="text-lg">Reportes de Ventas</CardTitle>
              <p class="text-sm text-muted-foreground">Análisis de ingresos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <BarChart3 class="mr-2 h-4 w-4" />
            Ventas por Período
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <PieChart class="mr-2 h-4 w-4" />
            Ventas por Producto
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Users class="mr-2 h-4 w-4" />
            Ventas por Cliente
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <MapPin class="mr-2 h-4 w-4" />
            Ventas por Sucursal
          </Button>
        </CardContent>
      </Card>

      <!-- Inventory Reports -->
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Package class="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle class="text-lg">Reportes de Inventario</CardTitle>
              <p class="text-sm text-muted-foreground">Control de stock</p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Database class="mr-2 h-4 w-4" />
            Stock Actual
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <AlertTriangle class="mr-2 h-4 w-4" />
            Stock Mínimo
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <History class="mr-2 h-4 w-4" />
            Movimientos de Stock
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <DollarSign class="mr-2 h-4 w-4" />
            Valoración de Inventario
          </Button>
        </CardContent>
      </Card>

      <!-- Purchase Reports -->
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <ShoppingCart class="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle class="text-lg">Reportes de Compras</CardTitle>
              <p class="text-sm text-muted-foreground">Análisis de costos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <TrendingDown class="mr-2 h-4 w-4" />
            Compras por Período
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Truck class="mr-2 h-4 w-4" />
            Compras por Proveedor
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Package class="mr-2 h-4 w-4" />
            Compras por Producto
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Clock class="mr-2 h-4 w-4" />
            Órdenes Pendientes
          </Button>
        </CardContent>
      </Card>

      <!-- Financial Reports -->
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <DollarSign class="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle class="text-lg">Reportes Financieros</CardTitle>
              <p class="text-sm text-muted-foreground">Estados financieros</p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Calculator class="mr-2 h-4 w-4" />
            Estado de Resultados
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <FileText class="mr-2 h-4 w-4" />
            Balance General
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <CreditCard class="mr-2 h-4 w-4" />
            Flujo de Caja
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Percent class="mr-2 h-4 w-4" />
            Análisis de Rentabilidad
          </Button>
        </CardContent>
      </Card>

      <!-- Tax Reports -->
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <FileText class="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle class="text-lg">Reportes Tributarios</CardTitle>
              <p class="text-sm text-muted-foreground">SUNAT y tributos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Receipt class="mr-2 h-4 w-4" />
            Registro de Ventas
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <ShoppingCart class="mr-2 h-4 w-4" />
            Registro de Compras
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <FileText class="mr-2 h-4 w-4" />
            PLT (PLE)
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Calculator class="mr-2 h-4 w-4" />
            Cálculo de IGV
          </Button>
        </CardContent>
      </Card>

      <!-- Custom Reports -->
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Settings class="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle class="text-lg">Reportes Personalizados</CardTitle>
              <p class="text-sm text-muted-foreground">A medida</p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Plus class="mr-2 h-4 w-4" />
            Crear Reporte
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Save class="mr-2 h-4 w-4" />
            Plantillas Guardadas
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Share class="mr-2 h-4 w-4" />
            Reportes Compartidos
          </Button>
          <Button variant="ghost" class="w-full justify-start h-8 text-sm">
            <Clock class="mr-2 h-4 w-4" />
            Reportes Programados
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Reports -->
    <Card>
      <CardHeader>
        <CardTitle>Reportes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <BarChart3 class="h-5 w-5" />
              </div>
              <div>
                <h4 class="font-medium">Ventas Enero 2024</h4>
                <p class="text-sm text-muted-foreground">Generado hace 2 horas</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="success">Completado</Badge>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <Download class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <Package class="h-5 w-5" />
              </div>
              <div>
                <h4 class="font-medium">Inventario - Stock Bajo</h4>
                <p class="text-sm text-muted-foreground">Generado ayer</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="success">Completado</Badge>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <Download class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <FileText class="h-5 w-5" />
              </div>
              <div>
                <h4 class="font-medium">Registro de Ventas - Diciembre</h4>
                <p class="text-sm text-muted-foreground">Generado hace 3 días</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="warning">Procesando</Badge>
              <Button variant="ghost" size="icon" class="h-8 w-8" disabled>
                <Clock class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {
  Plus,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  MapPin,
  Package,
  Database,
  AlertTriangle,
  History,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Truck,
  Clock,
  Calculator,
  FileText,
  CreditCard,
  Percent,
  Receipt,
  Settings,
  Save,
  Share,
  Download
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
</script>