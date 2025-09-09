import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    isInitialized: false
  }),
  
  actions: {
    async login(email: string, password: string) {
      this.loading = true
      this.error = null
      
      if (!email || !password) {
        this.error = 'Email and password are required'
        this.loading = false
        return false
      }
      
      if (!email.includes('@')) {
        this.error = 'Please enter a valid email address'
        this.loading = false
        return false
      }
      
      try {
        console.log('Attempting login with:', { email, hasPassword: !!password })
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        
        if (error) {
          console.error('Supabase auth error:', error)
          this.error = error.message
          return false
        }
        
        if (data.user) {
          console.log('Login successful:', data.user)
          this.isAuthenticated = true
          this.user = data.user
          return true
        }
        
        return false
      } catch (err) {
        console.error('Login catch error:', err)
        this.error = err instanceof Error ? err.message : 'An error occurred'
        return false
      } finally {
        this.loading = false
      }
    },
    
    async register(email: string, password: string, name?: string) {
      this.loading = true
      this.error = null
      
      if (!email || !password) {
        this.error = 'Email and password are required'
        this.loading = false
        return false
      }
      
      if (!email.includes('@')) {
        this.error = 'Please enter a valid email address'
        this.loading = false
        return false
      }
      
      try {
        console.log('Attempting register with:', { email, hasPassword: !!password, name })
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name || ''
            }
          }
        })
        
        if (error) {
          console.error('Supabase register error:', error)
          this.error = error.message
          return false
        }
        
        if (data.user) {
          console.log('Registration successful:', data.user)
          this.isAuthenticated = true
          this.user = data.user
          return true
        }
        
        return false
      } catch (err) {
        console.error('Register catch error:', err)
        this.error = err instanceof Error ? err.message : 'An error occurred'
        return false
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      this.loading = true
      
      try {
        await supabase.auth.signOut()
        this.isAuthenticated = false
        this.user = null
        this.error = null
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'An error occurred'
      } finally {
        this.loading = false
      }
    },
    
    async initialize() {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }
        
        if (session?.user) {
          console.log('Session restored:', session.user)
          this.isAuthenticated = true
          this.user = session.user
        } else {
          console.log('No active session found')
          this.isAuthenticated = false
          this.user = null
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' && session?.user) {
            this.isAuthenticated = true
            this.user = session.user
          } else if (event === 'SIGNED_OUT') {
            this.isAuthenticated = false
            this.user = null
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            this.isAuthenticated = true
            this.user = session.user
          }
        })
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        this.isInitialized = true
        console.log('Auth initialization completed:', { isAuthenticated: this.isAuthenticated, userEmail: this.user?.email })
      }
    }
  }
})
