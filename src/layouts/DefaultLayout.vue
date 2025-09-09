<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Collapsible Sidebar -->
    <aside class="relative flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300 ease-in-out" :class="[isCollapsed ? 'w-20' : 'w-64']">
      <div class="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div v-if="!isCollapsed" class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Package class="h-5 w-5" />
          </div>
          <span class="font-bold text-sidebar-foreground">ERP System</span>
        </div>
        <button @click="toggleCollapse" class="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu class="h-5 w-5" />
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto px-2">
        <ul class="space-y-1">
          <!-- Dashboard -->
          <li>
            <router-link to="/" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/')">
              <LayoutDashboard class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/')" />
              <span v-if="!isCollapsed">Dashboard</span>
            </router-link>
          </li>

          <!-- Sales Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ventas</p>
          </li>
          <li>
            <router-link to="/sales" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/sales')">
              <Receipt class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/sales')" />
              <span v-if="!isCollapsed">Ventas</span>
            </router-link>
          </li>
          <li>
            <router-link to="/customers" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/customers')">
              <Users class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/customers')" />
              <span v-if="!isCollapsed">Clientes</span>
            </router-link>
          </li>

          <!-- Purchases Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compras</p>
          </li>
          <li>
            <router-link to="/purchases" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/purchases')">
              <ShoppingCart class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/purchases')" />
              <span v-if="!isCollapsed">Compras</span>
            </router-link>
          </li>
          <li>
            <router-link to="/suppliers" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/suppliers')">
              <Truck class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/suppliers')" />
              <span v-if="!isCollapsed">Proveedores</span>
            </router-link>
          </li>

          <!-- Inventory Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventario</p>
          </li>
          <li>
            <router-link to="/products" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/products')">
              <Package class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/products')" />
              <span v-if="!isCollapsed">Productos</span>
            </router-link>
          </li>
          <li>
            <router-link to="/inventory" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/inventory')">
              <Warehouse class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/inventory')" />
              <span v-if="!isCollapsed">Almacenes</span>
            </router-link>
          </li>

          <!-- Logistics Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logística</p>
          </li>
          <li>
            <router-link to="/map" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/map')">
              <MapPin class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/map')" />
              <span v-if="!isCollapsed">Mapa</span>
            </router-link>
          </li>

          <!-- Reports Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reportes</p>
          </li>
          <li>
            <router-link to="/reports" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/reports')">
              <BarChart3 class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/reports')" />
              <span v-if="!isCollapsed">Reportes</span>
            </router-link>
          </li>

          <!-- Administration Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administración</p>
          </li>
          <li>
            <router-link to="/companies" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/companies')">
              <Building class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/companies')" />
              <span v-if="!isCollapsed">Empresas</span>
            </router-link>
          </li>
          <li>
            <router-link to="/branches" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/branches')">
              <MapPin class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/branches')" />
              <span v-if="!isCollapsed">Sucursales</span>
            </router-link>
          </li>
          <li>
            <router-link to="/sunat" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/sunat')">
              <FileText class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/sunat')" />
              <span v-if="!isCollapsed">Catálogos SUNAT</span>
            </router-link>
          </li>

          <!-- Settings -->
          <li class="mt-6">
            <router-link to="/settings" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/settings')">
              <Settings class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/settings')" />
              <span v-if="!isCollapsed">Configuración</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <header class="flex h-16 items-center justify-between border-b bg-background px-6">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-foreground capitalize">{{ getPageTitle() }}</h1>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Company Selector -->
          <div v-if="companiesStore.userCompanies.length > 0" class="min-w-[200px]">
            <div class="flex items-center gap-2 mb-1">
              <Building class="h-3 w-3 text-muted-foreground" />
              <span class="text-xs font-medium text-muted-foreground">Empresa</span>
            </div>
            <select
              v-model="selectedCompanyId"
              class="w-full px-2 py-1 text-xs border border-input rounded-md bg-background"
              @change="onCompanyChange"
            >
              <option value="">Seleccionar empresa</option>
              <option
                v-for="userCompany in companiesStore.userCompanies"
                :key="userCompany.company.id"
                :value="userCompany.company.id"
              >
                {{ userCompany.company.trade_name || userCompany.company.legal_name }}
              </option>
            </select>
          </div>
          
          <!-- Branch Selector -->
          <div v-if="availableBranches.length > 0" class="min-w-[160px]">
            <div class="flex items-center gap-2 mb-1">
              <MapPin class="h-3 w-3 text-muted-foreground" />
              <span class="text-xs font-medium text-muted-foreground">Sucursal</span>
            </div>
            <select
              v-model="selectedBranchId"
              class="w-full px-2 py-1 text-xs border border-input rounded-md bg-background"
              @change="onBranchChange"
            >
              <option value="">Todas las sucursales</option>
              <option
                v-for="branch in availableBranches"
                :key="branch.id"
                :value="branch.id"
              >
                {{ branch.code }} - {{ branch.name }}
              </option>
            </select>
          </div>

          <!-- Dark Mode Toggle -->
          <button @click="toggleDarkMode" class="rounded-md p-2 text-muted-foreground hover:bg-muted">
            <Moon v-if="!darkMode" class="h-5 w-5" />
            <Sun v-else class="h-5 w-5" />
          </button>
          
          <!-- User Profile -->
          <div class="relative">
            <button 
              @click="userMenuOpen = !userMenuOpen" 
              class="flex items-center rounded-full p-1 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User class="h-4 w-4" />
              </div>
            </button>
            <div 
              v-if="userMenuOpen" 
              class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-popover border shadow-lg"
            >
              <div class="py-1">
                <a href="#" class="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted">Mi Perfil</a>
                <a href="#" class="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted">Configuración</a>
                <div class="border-t border-border my-1"></div>
                <button @click="logout" class="block w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { useBranchesStore } from '@/stores/branches'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { 
  Menu, LayoutDashboard, Settings, Moon, Sun, User,
  Receipt, Users, ShoppingCart, Truck, Package, Warehouse, BarChart3,
  Building, MapPin, FileText
} from 'lucide-vue-next'
import Select from '@/components/ui/Select.vue'

const route = useRoute()
const router = useRouter()
const companiesStore = useCompaniesStore()
const branchesStore = useBranchesStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const userMenuOpen = ref(false)
const toggleCollapse = () => { isCollapsed.value = !isCollapsed.value }

// Company and Branch selection
const selectedCompanyId = ref<string | null>(null)
const selectedBranchId = ref<string | null>(localStorage.getItem('selectedBranchId') || null)

// Available branches for the selected company
const availableBranches = computed(() => {
  return selectedCompanyId.value ? branchesStore.branches : []
})

// Current selected company name for display
const selectedCompanyName = computed(() => {
  const userCompany = companiesStore.userCompanies.find(uc => uc.company.id === selectedCompanyId.value)
  return userCompany ? (userCompany.company.trade_name || userCompany.company.legal_name) : ''
})

// Current selected branch name for display
const selectedBranchName = computed(() => {
  const branch = branchesStore.branches.find(b => b.id === selectedBranchId.value)
  return branch ? `${branch.code} - ${branch.name}` : ''
})

// Handlers for selector changes
const onCompanyChange = async () => {
  if (selectedCompanyId.value) {
    // Set current company in the store
    const userCompany = companiesStore.userCompanies.find(uc => uc.company.id === selectedCompanyId.value)
    if (userCompany) {
      companiesStore.setCurrentCompany(userCompany.company)
    }
    
    // Load branches for the selected company
    await branchesStore.fetchAll(selectedCompanyId.value)
    
    // Check if current selected branch belongs to this company
    const savedBranchId = localStorage.getItem('selectedBranchId')
    if (savedBranchId && branchesStore.branches.find(b => b.id === savedBranchId)) {
      selectedBranchId.value = savedBranchId
    } else {
      selectedBranchId.value = ''
      localStorage.removeItem('selectedBranchId')
    }
  } else {
    companiesStore.currentCompany = null
    branchesStore.reset()
    selectedBranchId.value = ''
    localStorage.removeItem('selectedBranchId')
  }
}

const onBranchChange = () => {
  // Save selected branch to localStorage for persistence
  if (selectedBranchId.value) {
    localStorage.setItem('selectedBranchId', selectedBranchId.value)
  } else {
    localStorage.removeItem('selectedBranchId')
  }
  console.log('Branch changed to:', selectedBranchId.value)
}

// Page title helper
const getPageTitle = () => {
  const routeNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'products': 'Productos',
    'sales': 'Ventas',
    'purchases': 'Compras',
    'inventory': 'Inventario',
    'customers': 'Clientes',
    'suppliers': 'Proveedores',
    'map': 'Mapa',
    'reports': 'Reportes',
    'companies': 'Empresas',
    'branches': 'Sucursales',
    'settings': 'Configuración'
  }
  return routeNames[route.name as string] || 'Sistema ERP'
}

const darkMode = ref(themeStore.darkMode)
const toggleDarkMode = () => {
  themeStore.toggleDarkMode()
  darkMode.value = themeStore.darkMode
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Navigation helpers
const getNavClass = (path: string) => {
  const isActive = route.path === path
  return isActive 
    ? 'bg-primary text-primary-foreground'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
}

const getIconClass = (path: string) => {
  const isActive = route.path === path
  return isActive 
    ? 'text-primary-foreground'
    : 'text-muted-foreground group-hover:text-foreground'
}

onMounted(async () => {
  // Initialize companies for the authenticated user
  if (authStore.user) {
    await companiesStore.fetchUserCompanies(authStore.user.id)
    
    // Auto-select first company if available and none is selected
    if (companiesStore.userCompanies.length > 0 && !selectedCompanyId.value) {
      const firstUserCompany = companiesStore.userCompanies[0]
      selectedCompanyId.value = firstUserCompany.company.id
      companiesStore.setCurrentCompany(firstUserCompany.company)
      
      // Load branches for the selected company
      await branchesStore.fetchAll(firstUserCompany.company.id)
      
      // Restore saved branch selection if valid for this company
      const savedBranchId = localStorage.getItem('selectedBranchId')
      if (savedBranchId && branchesStore.branches.find(b => b.id === savedBranchId)) {
        selectedBranchId.value = savedBranchId
      }
    }
  }
})
</script>
