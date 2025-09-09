import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize auth store after everything is set up
const authStore = useAuthStore()

// Initialize auth and then mount the app
authStore.initialize().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Failed to initialize auth store:', error)
  app.mount('#app')
})
