<template>
  <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <!-- <img src="/logo.svg" alt="Company Logo" class="mx-auto h-12 w-auto mb-4" /> --> <!-- Add your logo -->
        <CardTitle class="text-2xl text-center">{{ pageTitle }}</CardTitle>
        <p class="text-sm text-muted-foreground text-center">
          {{ pageSubtitle }}
        </p>
      </CardHeader>
      <CardContent>
        <slot />
        
        <div v-if="showAuthLinks" class="mt-4 text-center text-sm">
          <span v-if="isLoginPage">
            Don't have an account? 
            <router-link to="/register" class="text-primary hover:underline">Sign up</router-link>
          </span>
          <span v-else>
            Already have an account? 
            <router-link to="/login" class="text-primary hover:underline">Sign in</router-link>
          </span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'

const route = useRoute()
const themeStore = useThemeStore()

const isLoginPage = computed(() => route.name === 'login')

const pageTitle = computed(() => {
  return isLoginPage.value ? 'Sign in to your account' : 'Create an account'
})

const pageSubtitle = computed(() => {
  return isLoginPage.value 
    ? 'Enter your credentials to access your account'
    : 'Enter your details to create your account'
})

const showAuthLinks = computed(() => {
  return route.name === 'login' || route.name === 'register'
})

onMounted(() => {
  if (themeStore.darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  // Add localStorage persistence if desired
})
</script>
