<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center space-y-4">
      <h1 class="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 class="text-2xl font-semibold">Página no encontrada</h2>
      <p class="text-muted-foreground max-w-md mx-auto">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <Button @click="$router.push('/')">
        Volver al Dashboard
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
</script>