import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Authentication routes
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Auth/LoginView.vue'),
      meta: { layout: 'auth', requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Auth/RegisterView.vue'),
      meta: { layout: 'auth', requiresGuest: true }
    },
    
    // Main application routes
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    // Products module with nested routes
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/categories',
      name: 'products-categories',
      component: () => import('../views/Products/CategoriesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/brands',
      name: 'products-brands',
      component: () => import('../views/Products/BrandsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/price-lists',
      name: 'products-price-lists',
      component: () => import('../views/Products/PriceListsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/locations',
      name: 'products-locations',
      component: () => import('../views/Products/LocationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/SalesView.vue'),
      meta: { requiresAuth: true }
    },
    // Purchases module with nested routes
    {
      path: '/purchases',
      name: 'purchases',
      component: () => import('../views/Purchases/PurchasesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/purchases/orders',
      name: 'purchases-orders',
      component: () => import('../views/Purchases/PurchaseOrdersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/purchases/docs',
      name: 'purchases-docs',
      component: () => import('../views/Purchases/PurchaseDocsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/purchases/receptions',
      name: 'purchases-receptions',
      component: () => import('../views/Purchases/ReceptionsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/CustomersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/suppliers',
      name: 'suppliers',  
      component: () => import('../views/SuppliersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/companies',
      name: 'companies',
      component: () => import('../views/CompaniesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/branches',
      name: 'branches',
      component: () => import('../views/BranchesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/sunat',
      name: 'sunat',
      component: () => import('../views/SunatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exchange-rates',
      name: 'exchange-rates',
      component: () => import('../views/ExchangeRates.vue'),
      meta: { requiresAuth: true }
    },
    
    // Legacy routes (to be removed)
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { requiresAuth: true }
    },
    
    // Catch all route
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth initialization if not completed
  if (!authStore.isInitialized) {
    console.log('Waiting for auth initialization...')
    // Wait a bit for initialization to complete
    let attempts = 0
    while (!authStore.isInitialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
    }
    
    if (!authStore.isInitialized) {
      console.warn('Auth initialization timeout, proceeding anyway')
    } else {
      console.log('Auth initialization completed, proceeding with navigation')
    }
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Route requires auth but user not authenticated, redirecting to login')
    next('/login')
    return
  }
  
  // Check if route requires guest (unauthenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('Route requires guest but user is authenticated, redirecting to dashboard')
    next('/')
    return
  }
  
  console.log('Navigation allowed to:', to.path)
  next()
})

export default router
