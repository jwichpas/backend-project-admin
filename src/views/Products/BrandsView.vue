<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Marcas</h1>
        <p class="text-muted-foreground">
          Gestiona las marcas de tus productos
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="showCreateDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Marca
        </Button>
      </div>
    </div>

    <!-- Search and Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input 
              v-model="searchTerm" 
              placeholder="Nombre o código de marca..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select 
              v-model="selectedStatus"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Brands Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card 
        v-for="brand in filteredBrands" 
        :key="brand.id"
        class="hover:shadow-md transition-shadow cursor-pointer"
        @click="editBrand(brand)"
      >
        <CardContent class="p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Award class="h-5 w-5 text-white" />
            </div>
            <Badge :variant="brand.active ? 'success' : 'outline'">
              {{ brand.active ? 'Activa' : 'Inactiva' }}
            </Badge>
          </div>
          
          <div class="space-y-2">
            <h3 class="font-semibold text-lg">{{ brand.name }}</h3>
            <p v-if="brand.code" class="text-sm text-muted-foreground">
              Código: {{ brand.code }}
            </p>
            <div class="text-xs text-muted-foreground">
              Productos: {{ getProductCount(brand.id) }}
            </div>
          </div>

          <div class="flex justify-end mt-4 gap-1" @click.stop>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8"
              @click="editBrand(brand)"
            >
              <Edit class="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-destructive hover:text-destructive"
              @click="deleteBrand(brand)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Empty State -->
      <Card v-if="filteredBrands.length === 0" class="col-span-full">
        <CardContent class="p-8 text-center">
          <Award class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">No hay marcas</h3>
          <p class="text-muted-foreground mb-4">
            Empieza creando tu primera marca para organizar tus productos
          </p>
          <Button @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            Nueva Marca
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-md" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>
            {{ editingBrand ? 'Editar Marca' : 'Nueva Marca' }}
          </DialogTitle>
        </DialogHeader>
        
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Nombre de la Marca</label>
            <Input
              v-model="brandForm.name"
              placeholder="Ej: Nike"
              required
              class="mt-1"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium">Código (Opcional)</label>
            <Input
              v-model="brandForm.code"
              placeholder="Ej: NIKE"
              class="mt-1"
            />
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="active"
              type="checkbox"
              v-model="brandForm.active"
              class="rounded border-gray-300"
            />
            <label for="active" class="text-sm font-medium">Marca activa</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="productsStore.loading">
              {{ editingBrand ? 'Actualizar' : 'Crear' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useProductsStore, type Brand } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { Plus, Award, Edit, Trash2 } from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'

const companiesStore = useCompaniesStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()

// State
const searchTerm = ref('')
const selectedStatus = ref('')
const showCreateDialog = ref(false)
const editingBrand = ref<Brand | null>(null)
const brandForm = ref({
  name: '',
  code: '',
  active: true
})

// Computed
const filteredBrands = computed(() => {
  let brands = productsStore.brands

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    brands = brands.filter(brand => 
      brand.name.toLowerCase().includes(term) ||
      (brand.code && brand.code.toLowerCase().includes(term))
    )
  }

  if (selectedStatus.value === 'active') {
    brands = brands.filter(brand => brand.active)
  } else if (selectedStatus.value === 'inactive') {
    brands = brands.filter(brand => !brand.active)
  }

  return brands.sort((a, b) => a.name.localeCompare(b.name))
})

// Methods
const getProductCount = (brandId: string): number => {
  return productsStore.products.filter(p => p.brand_id === brandId).length
}

const editBrand = (brand: Brand) => {
  editingBrand.value = brand
  brandForm.value = {
    name: brand.name,
    code: brand.code || '',
    active: brand.active
  }
  showCreateDialog.value = true
}

const deleteBrand = async (brand: Brand) => {
  const productCount = getProductCount(brand.id)
  
  if (productCount > 0) {
    alert(`No se puede eliminar la marca "${brand.name}" porque tiene ${productCount} productos asociados.`)
    return
  }

  if (confirm(`¿Estás seguro de que deseas eliminar la marca "${brand.name}"?`)) {
    // TODO: Implement delete brand
    console.log('Delete brand:', brand)
  }
}

const submitForm = async () => {
  try {
    if (!companiesStore.currentCompany) return

    const brandData = {
      ...brandForm.value,
      company_id: companiesStore.currentCompany.id
    }

    if (editingBrand.value) {
      // TODO: Implement update brand
      console.log('Update brand:', brandData)
    } else {
      await productsStore.createBrand(brandData)
    }
    
    cancelForm()
  } catch (error) {
    console.error('Error saving brand:', error)
  }
}

const cancelForm = () => {
  showCreateDialog.value = false
  editingBrand.value = null
  brandForm.value = {
    name: '',
    code: '',
    active: true
  }
}

const refreshData = async () => {
  if (companiesStore.currentCompany) {
    await Promise.all([
      productsStore.fetchBrands(companiesStore.currentCompany.id),
      productsStore.fetchProducts(companiesStore.currentCompany.id)
    ])
  }
}

onMounted(async () => {
  console.log('BrandsView onMounted - currentCompany:', companiesStore.currentCompany)

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0 && authStore.user) {
    await companiesStore.fetchUserCompanies(authStore.user.id)
  }

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length > 0) {
    companiesStore.selectCompany(companiesStore.userCompanies[0].company)
  }

  if (companiesStore.currentCompany) {
    await refreshData()
  }
})

// Watch for company changes
watch(
  () => companiesStore.currentCompany,
  async (newCompany, oldCompany) => {
    if (newCompany && oldCompany && newCompany.id !== oldCompany.id) {
      console.log('Company changed in BrandsView, reloading data...', {
        from: oldCompany.id,
        to: newCompany.id
      })
      await refreshData()
    }
  }, { deep: true }
)
</script>