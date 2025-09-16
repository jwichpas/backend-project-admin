<template>
  <div class="p-4 border border-border rounded-lg bg-card">
    <h3 class="font-semibold mb-4">Test de Iconos Lucide</h3>
    <div class="grid grid-cols-6 gap-4 text-center">
      <!-- Iconos usados en el carrito -->
      <div class="flex flex-col items-center gap-2">
        <ShoppingCart class="h-6 w-6 text-blue-600" />
        <span class="text-xs">ShoppingCart</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Plus class="h-6 w-6 text-green-600" />
        <span class="text-xs">Plus</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Minus class="h-6 w-6 text-red-600" />
        <span class="text-xs">Minus</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <X class="h-6 w-6 text-red-600" />
        <span class="text-xs">X</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Pencil class="h-6 w-6 text-gray-600" />
        <span class="text-xs">Pencil</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Check class="h-6 w-6 text-green-600" />
        <span class="text-xs">Check</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Package class="h-6 w-6 text-gray-600" />
        <span class="text-xs">Package</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Clock class="h-6 w-6 text-blue-600" />
        <span class="text-xs">Clock</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Trash2 class="h-6 w-6 text-red-600" />
        <span class="text-xs">Trash2</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <CreditCard class="h-6 w-6 text-purple-600" />
        <span class="text-xs">CreditCard</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Settings class="h-6 w-6 text-gray-600" />
        <span class="text-xs">Settings</span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <Search class="h-6 w-6 text-gray-600" />
        <span class="text-xs">Search</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Pencil,
  Check,
  Package,
  Clock,
  Trash2,
  CreditCard,
  Settings,
  Search
} from 'lucide-vue-next'
</script>