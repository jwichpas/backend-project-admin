<template>
  <form class="space-y-4" @submit.prevent="login">
    <div v-if="authStore.error" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ authStore.error }}
    </div>
    
    <div class="space-y-2">
      <label for="email" class="text-sm font-medium leading-none">Email address</label>
      <Input 
        id="email" 
        v-model="email" 
        name="email" 
        type="email" 
        autocomplete="email" 
        required 
        placeholder="Enter your email" 
        :disabled="authStore.loading"
      />
    </div>
    <div class="space-y-2">
      <label for="password" class="text-sm font-medium leading-none">Password</label>
      <Input 
        id="password" 
        v-model="password" 
        name="password" 
        type="password" 
        autocomplete="current-password" 
        required 
        placeholder="Enter your password" 
        :disabled="authStore.loading"
      />
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <input 
          id="remember" 
          name="remember" 
          type="checkbox" 
          :disabled="authStore.loading"
          class="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2" 
        />
        <label for="remember" class="text-sm">Remember me</label>
      </div>
      <div class="text-sm">
        <a href="#" class="text-primary hover:underline">Forgot password?</a>
      </div>
    </div>

    <Button type="submit" class="w-full" :disabled="authStore.loading">
      <Lock v-if="!authStore.loading" class="mr-2 h-4 w-4" />
      <div v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
      {{ authStore.loading ? 'Signing in...' : 'Sign in' }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Lock } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const email = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore()

const login = async () => {
  console.log('Login form submitted with:', {
    email: email.value,
    password: password.value ? '[HIDDEN]' : 'EMPTY',
    emailLength: email.value?.length || 0,
    passwordLength: password.value?.length || 0
  })
  
  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>
