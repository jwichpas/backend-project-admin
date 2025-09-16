<template>
  <div class="bg-card border border-border rounded-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Top Productos</h3>
      <div class="flex items-center gap-2">
        <select
          v-model="sortType"
          class="text-xs border border-input rounded px-2 py-1 bg-background"
        >
          <option value="value">Por Valor</option>
          <option value="quantity">Por Cantidad</option>
        </select>
        <Package class="h-5 w-5 text-muted-foreground" />
      </div>
    </div>

    <div v-if="sortedProducts.length === 0" class="flex items-center justify-center h-96 text-muted-foreground">
      <div class="text-center">
        <Package class="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos de productos disponibles</p>
        <p class="text-sm">Los productos más vendidos aparecerán aquí</p>
      </div>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-border">
          <tr class="text-left">
            <th class="pb-2 font-medium text-muted-foreground">#</th>
            <th class="pb-2 font-medium text-muted-foreground">Producto</th>
            <th class="pb-2 font-medium text-muted-foreground">Categoría</th>
            <th class="pb-2 font-medium text-muted-foreground">Marca</th>
            <th class="pb-2 font-medium text-muted-foreground text-right">Cantidad</th>
            <th class="pb-2 font-medium text-muted-foreground text-right">Valor Total</th>
            <th class="pb-2 font-medium text-muted-foreground text-right">Precio Prom.</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(product, index) in displayProducts"
            :key="product.product_id"
            class="border-b border-border/50 hover:bg-muted/30 transition-colors"
          >
            <td class="py-3">
              <div class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                   :class="getRankBadgeClass(index)">
                {{ index + 1 }}
              </div>
            </td>
            <td class="py-3">
              <div class="font-medium">{{ product.product_name }}</div>
              <div class="text-xs text-muted-foreground">SKU: {{ product.sku }}</div>
            </td>
            <td class="py-3">
              <div class="text-sm">{{ product.category_name }}</div>
            </td>
            <td class="py-3">
              <div class="text-sm">{{ product.brand_name }}</div>
            </td>
            <td class="py-3 text-right">
              <div class="font-medium">{{ formatQuantity(product.total_quantity_sold) }}</div>
              <div class="text-xs text-muted-foreground">Rank #{{ product.monthly_quantity_rank }}</div>
            </td>
            <td class="py-3 text-right">
              <div class="font-medium">{{ formatCurrency(product.total_sales_value) }}</div>
              <div class="text-xs text-muted-foreground">Rank #{{ product.monthly_value_rank }}</div>
            </td>
            <td class="py-3 text-right">
              <div class="font-medium">{{ formatCurrency(product.avg_unit_price) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-4 text-sm border-t border-border pt-4">
      <div class="text-center">
        <p class="text-muted-foreground">Productos Únicos</p>
        <p class="font-bold text-lg">{{ uniqueProducts }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">{{ sortType === 'value' ? 'Valor Total' : 'Cantidad Total' }}</p>
        <p class="font-bold text-lg">{{ totalValue }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Precio Promedio</p>
        <p class="font-bold text-lg">{{ averagePrice }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Package } from 'lucide-vue-next'
import type { SalesProductStats } from '@/stores/salesDashboard'

interface Props {
  products: SalesProductStats[]
  theme?: 'light' | 'dark'
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  maxItems: 10
})

const sortType = ref<'value' | 'quantity'>('value')

const formatCurrency = (value: number) => {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatQuantity = (value: number) => {
  return `${value.toLocaleString('es-PE')} uds`
}

const sortedProducts = computed(() => {
  const sorted = [...props.products].sort((a, b) => {
    if (sortType.value === 'value') {
      return b.total_sales_value - a.total_sales_value
    } else {
      return b.total_quantity_sold - a.total_quantity_sold
    }
  })

  return sorted
})

const displayProducts = computed(() => {
  return sortedProducts.value.slice(0, props.maxItems)
})

const getRankBadgeClass = (index: number) => {
  if (index === 0) return 'bg-yellow-500 text-white'
  if (index === 1) return 'bg-gray-400 text-white dark:bg-gray-600'
  if (index === 2) return 'bg-orange-500 text-white'
  return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

const uniqueProducts = computed(() => props.products.length)

const totalValue = computed(() => {
  const total = props.products.reduce((sum, product) => {
    return sum + (sortType.value === 'value' ? product.total_sales_value : product.total_quantity_sold)
  }, 0)

  return sortType.value === 'value' ? formatCurrency(total) : formatQuantity(total)
})

const averagePrice = computed(() => {
  if (props.products.length === 0) return formatCurrency(0)

  const totalPrice = props.products.reduce((sum, product) => sum + (product.avg_unit_price || 0), 0)
  return formatCurrency(totalPrice / props.products.length)
})
</script>