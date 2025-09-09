<template>
  <div class="space-y-2">
    <div 
      v-for="category in categories" 
      :key="category.id"
      class="border border-border rounded-lg"
    >
      <!-- Category Row -->
      <div class="flex items-center justify-between p-3 hover:bg-muted/50">
        <div class="flex items-center gap-3">
          <Button
            v-if="hasChildren(category.id)"
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            @click="toggleExpanded(category.id)"
          >
            <ChevronRight 
              class="h-4 w-4 transition-transform" 
              :class="{ 'rotate-90': expandedCategories.has(category.id) }"
            />
          </Button>
          <div v-else class="w-6"></div>

          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <FolderOpen v-if="hasChildren(category.id)" class="h-4 w-4 text-white" />
              <Folder v-else class="h-4 w-4 text-white" />
            </div>
            
            <div>
              <p class="font-medium">{{ category.name }}</p>
              <p v-if="category.code" class="text-sm text-muted-foreground">
                Código: {{ category.code }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Badge :variant="category.active ? 'success' : 'outline'">
            {{ category.active ? 'Activo' : 'Inactivo' }}
          </Badge>
          
          <span class="text-sm text-muted-foreground">
            Nivel {{ category.level }}
          </span>

          <div class="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8"
              @click="$emit('edit', category)"
            >
              <Edit class="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-destructive hover:text-destructive"
              @click="$emit('delete', category)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Children (Recursive) -->
      <div 
        v-if="hasChildren(category.id) && expandedCategories.has(category.id)"
        class="ml-6 border-t border-border"
      >
        <CategoryTree
          :categories="getChildren(category.id)"
          :all-categories="allCategories"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>

    <div v-if="categories.length === 0" class="text-center py-8 text-muted-foreground">
      No hay categorías disponibles
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Category } from '@/stores/products'
import { ChevronRight, FolderOpen, Folder, Edit, Trash2 } from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

interface Props {
  categories: Category[]
  allCategories: Category[]
}

interface Emits {
  (e: 'edit', category: Category): void
  (e: 'delete', category: Category): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// State
const expandedCategories = ref<Set<string>>(new Set())

// Methods
const hasChildren = (categoryId: string): boolean => {
  return props.allCategories.some(cat => cat.parent_id === categoryId)
}

const getChildren = (categoryId: string): Category[] => {
  return props.allCategories.filter(cat => cat.parent_id === categoryId)
}

const toggleExpanded = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}
</script>