import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null as any
  }),
  actions: {
    login(email?: string, password?: string) {
      // TODO: Implement real authentication with Supabase
      console.log('Login attempt:', { email })
      this.isAuthenticated = true
      this.user = {
        email,
        name: 'Usuario Demo'
      }
    },
    logout() {
      this.isAuthenticated = false
      this.user = null
    }
  }
})
