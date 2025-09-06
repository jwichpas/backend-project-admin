<template>
  <form class="space-y-4" @submit.prevent="login">
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
      />
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <input 
          id="remember" 
          name="remember" 
          type="checkbox" 
          class="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2" 
        />
        <label for="remember" class="text-sm">Remember me</label>
      </div>
      <div class="text-sm">
        <a href="#" class="text-primary hover:underline">Forgot password?</a>
      </div>
    </div>

    <Button type="submit" class="w-full">
      <Lock class="mr-2 h-4 w-4" />
      Sign in
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
  await authStore.login(email.value, password.value)
  if (authStore.isAuthenticated) {
    router.push('/')
  }
}
</script>
