<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 bg-white dark:bg-gray-900 rounded-xl shadow-modern-lg p-8">
      <div class="text-center">
        <!-- <img src="/logo.svg" alt="Company Logo" class="mx-auto h-12 w-auto" /> --> <!-- Add your logo -->
        <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Sign in to your account</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Or <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500">create a new account</router-link></p>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
onMounted(() => {
  if (themeStore.darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  // Add localStorage persistence if desired
})
</script>
