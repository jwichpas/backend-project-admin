<template>
  <form class="mt-8 space-y-6" @submit.prevent="login">
    <div class="space-y-4 rounded-md shadow-sm">
      <div>
        <label for="email" class="sr-only">Email address</label>
        <input id="email" v-model="email" name="email" type="email" autocomplete="email" required class="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm dark:bg-gray-800" placeholder="Email address" />
      </div>
      <div>
        <label for="password" class="sr-only">Password</label>
        <input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required class="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm dark:bg-gray-800" placeholder="Password" />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <input id="remember" name="remember" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-800" />
        <label for="remember" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
      </div>
      <div class="text-sm">
        <a href="#" class="font-medium text-primary-600 hover:text-primary-500">Forgot your password?</a>
      </div>
    </div>

    <div>
      <button type="submit" class="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3">
          <Lock class="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
        </span>
        Sign in
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Lock } from 'lucide-vue-next'

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
