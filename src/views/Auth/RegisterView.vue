<template>
  <form class="space-y-4" @submit.prevent="register">
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
      />
    </div>

    <div class="flex items-center space-x-2">
      <input 
        id="terms" 
        name="terms" 
        type="checkbox" 
        required
        class="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2" 
      />
      <label for="terms" class="text-sm">
        I agree to the <a href="#" class="text-primary hover:underline">Terms of Service</a> and <a href="#" class="text-primary hover:underline">Privacy Policy</a>
      </label>
    </div>

    <Button type="submit" class="w-full">
      <UserPlus class="mr-2 h-4 w-4" />
      Create account
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
const router = useRouter()
const authStore = useAuthStore()

const register = async () => {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }
  
  await authStore.register(name.value, email.value, password.value)
  if (authStore.isAuthenticated) {
    router.push('/')
  }
}
</script>
