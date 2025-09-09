<template>
  <form class="space-y-4" @submit.prevent="register">
    <div v-if="authStore.error" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ authStore.error }}
    </div>
    
    <div v-if="passwordError" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ passwordError }}
    </div>
    
    <div class="space-y-2">
      <label for="name" class="text-sm font-medium leading-none">Full name</label>
      <Input 
        id="name" 
        v-model="name" 
        name="name" 
        type="text" 
        autocomplete="name" 
        required 
        placeholder="Enter your full name" 
        :disabled="authStore.loading"
      />
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
        autocomplete="new-password" 
        required 
        placeholder="Enter your password" 
        :disabled="authStore.loading"
      />
    </div>
    <div class="space-y-2">
      <label for="confirmPassword" class="text-sm font-medium leading-none">Confirm password</label>
      <Input 
        id="confirmPassword" 
        v-model="confirmPassword" 
        name="confirmPassword" 
        type="password" 
        autocomplete="new-password" 
        required 
        placeholder="Confirm your password" 
        :disabled="authStore.loading"
      />
    </div>

    <div class="flex items-center space-x-2">
      <input 
        id="terms" 
        name="terms" 
        type="checkbox" 
        required
        :disabled="authStore.loading"
        class="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2" 
      />
      <label for="terms" class="text-sm">
        I agree to the <a href="#" class="text-primary hover:underline">Terms of Service</a> and <a href="#" class="text-primary hover:underline">Privacy Policy</a>
      </label>
    </div>

    <Button type="submit" class="w-full" :disabled="authStore.loading">
      <UserPlus v-if="!authStore.loading" class="mr-2 h-4 w-4" />
      <div v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
      {{ authStore.loading ? 'Creating account...' : 'Create account' }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserPlus } from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const router = useRouter()
const authStore = useAuthStore()

const register = async () => {
  passwordError.value = ''
  
  if (password.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
    return
  }
  
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long'
    return
  }
  
  const success = await authStore.register(email.value, password.value, name.value)
  if (success) {
    router.push('/')
  }
}
</script>
