<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Categorías</h1>
        <p class="text-muted-foreground">
          Organiza tus productos en categorías y subcategorías
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="showCreateDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>
    </div>

    <!-- Categories Tree -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Categorías ({{ productsStore.categories.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <div class="p-4">
          <CategoryTree 
            :categories="rootCategories"
            :all-categories="productsStore.categories"
            @edit="editCategory"
            @delete="deleteCategory"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-md" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>
            {{ editingCategory ? 'Editar Categoría' : 'Nueva Categoría' }}
          </DialogTitle>
        </DialogHeader>
        
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Nombre</label>
            <Input
              v-model="categoryForm.name"
              placeholder="Ej: Abarrotes"
              required
              class="mt-1"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium">Código (Opcional)</label>
            <Input
              v-model="categoryForm.code"
              placeholder="Ej: ABARROTES"
              class="mt-1"
            />
          </div>

          <div>
            <label class="text-sm font-medium">Categoría Padre</label>
            <select
              v-model="categoryForm.parent_id"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin categoría padre</option>
              <option 
                v-for="category in availableParentCategories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ '  '.repeat(category.level) }}{{ category.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="active"
              type="checkbox"
              v-model="categoryForm.active"
              class="rounded border-gray-300"
            />
            <label for="active" class="text-sm font-medium">Categoría activa</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="productsStore.loading">
              {{ editingCategory ? 'Actualizar' : 'Crear' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useProductsStore, type Category } from '@/stores/products'
import { Plus } from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import CategoryTree from '@/components/Products/CategoryTree.vue'

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

// Form state
const showCreateDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = ref({
  name: '',
  code: '',
  parent_id: '',
  active: true
})

// Computed
const rootCategories = computed(() => 
  productsStore.categories.filter(cat => !cat.parent_id)
)

const availableParentCategories = computed(() => {
  // Exclude the current category being edited and its children
  if (!editingCategory.value) return productsStore.categories
  
  const excludeIds = new Set([editingCategory.value.id])
  const addChildren = (parentId: string) => {
    productsStore.categories
      .filter(cat => cat.parent_id === parentId)
      .forEach(cat => {
        excludeIds.add(cat.id)
        addChildren(cat.id)
      })
  }
  
  addChildren(editingCategory.value.id)
  
  return productsStore.categories.filter(cat => !excludeIds.has(cat.id))
})

// Methods
const editCategory = (category: Category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    code: category.code || '',
    parent_id: category.parent_id || '',
    active: category.active
  }
  showCreateDialog.value = true
}

const deleteCategory = async (category: Category) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
    // TODO: Implement delete category
    console.log('Delete category:', category)
  }
}

const submitForm = async () => {
  try {
    if (!companyStore.selectedCompany) return

    const categoryData = {
      ...categoryForm.value,
      company_id: companyStore.selectedCompany.id,
      level: categoryForm.value.parent_id ? 
        (productsStore.categories.find(c => c.id === categoryForm.value.parent_id)?.level || 0) + 1 : 
        1,
      parent_id: categoryForm.value.parent_id || null
    }

    if (editingCategory.value) {
      // TODO: Implement update category
      console.log('Update category:', categoryData)
    } else {
      await productsStore.createCategory(categoryData)
    }
    
    cancelForm()
  } catch (error) {
    console.error('Error saving category:', error)
  }
}

const cancelForm = () => {
  showCreateDialog.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    code: '',
    parent_id: '',
    active: true
  }
}

onMounted(async () => {
  if (companyStore.selectedCompany) {
    await productsStore.fetchCategories(companyStore.selectedCompany.id)
  }
})
</script>