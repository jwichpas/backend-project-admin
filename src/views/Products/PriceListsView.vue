<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Listas de Precios</h1>
        <p class="text-muted-foreground">
          Gestiona diferentes listas de precios para tus productos
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="showCreateDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Lista
        </Button>
      </div>
    </div>

    <!-- Price Lists -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card 
        v-for="priceList in productsStore.priceLists" 
        :key="priceList.id"
        class="hover:shadow-md transition-shadow"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <DollarSign class="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle class="text-lg">{{ priceList.name }}</CardTitle>
                <p class="text-sm text-muted-foreground">{{ priceList.currency_code }}</p>
              </div>
            </div>
            <Badge v-if="priceList.is_default" variant="success">
              Por defecto
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Productos:</span>
              <span class="font-medium">{{ getPriceListItemCount(priceList.id) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Última actualización:</span>
              <span class="font-medium">{{ formatDate(priceList.updated_at) }}</span>
            </div>
          </div>

          <div class="flex justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm"
              @click="viewPriceListItems(priceList)"
            >
              <Eye class="mr-2 h-4 w-4" />
              Ver Productos
            </Button>
            
            <div class="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8"
                @click="editPriceList(priceList)"
              >
                <Edit class="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8 text-destructive hover:text-destructive"
                :disabled="priceList.is_default"
                @click="deletePriceList(priceList)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Empty State -->
      <Card v-if="productsStore.priceLists.length === 0" class="col-span-full">
        <CardContent class="p-8 text-center">
          <DollarSign class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">No hay listas de precios</h3>
          <p class="text-muted-foreground mb-4">
            Crea tu primera lista de precios para gestionar precios de productos
          </p>
          <Button @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            Nueva Lista
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Price List Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-md" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>
            {{ editingPriceList ? 'Editar Lista de Precios' : 'Nueva Lista de Precios' }}
          </DialogTitle>
        </DialogHeader>
        
        <form @submit.prevent="submitPriceListForm" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Nombre de la Lista</label>
            <Input
              v-model="priceListForm.name"
              placeholder="Ej: Lista de Precios Mayorista"
              required
              class="mt-1"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium">Moneda</label>
            <select
              v-model="priceListForm.currency_code"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="is_default"
              type="checkbox"
              v-model="priceListForm.is_default"
              class="rounded border-gray-300"
            />
            <label for="is_default" class="text-sm font-medium">
              Lista de precios por defecto
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelPriceListForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="productsStore.loading">
              {{ editingPriceList ? 'Actualizar' : 'Crear' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Price List Items Dialog -->
    <Dialog v-model:open="showItemsDialog">
      <DialogContent class="max-w-4xl" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>
            {{ selectedPriceList?.name }} - Productos
          </DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <!-- Add Product Section -->
          <Card>
            <CardContent class="p-4">
              <h4 class="font-medium mb-3">Agregar Producto</h4>
              <div class="grid gap-3 md:grid-cols-4">
                <select
                  v-model="itemForm.product_id"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccionar producto</option>
                  <option 
                    v-for="product in availableProducts" 
                    :key="product.id" 
                    :value="product.id"
                  >
                    {{ product.name }} ({{ product.sku }})
                  </option>
                </select>
                
                <Input
                  v-model.number="itemForm.unit_price"
                  type="number"
                  step="0.01"
                  placeholder="Precio unitario"
                />
                
                <Input
                  v-model="itemForm.valid_from"
                  type="date"
                  placeholder="Válido desde"
                />
                
                <Button @click="addPriceListItem" :disabled="!itemForm.product_id || !itemForm.unit_price">
                  <Plus class="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- Items Table -->
          <div class="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Válido desde</TableHead>
                  <TableHead>Válido hasta</TableHead>
                  <TableHead class="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in priceListItems" :key="item.id">
                  <TableCell>
                    {{ getProductName(item.product_id) }}
                  </TableCell>
                  <TableCell>
                    <code class="bg-muted px-2 py-1 rounded text-sm">
                      {{ getProductSKU(item.product_id) }}
                    </code>
                  </TableCell>
                  <TableCell class="font-medium">
                    {{ formatCurrency(item.unit_price, selectedPriceList?.currency_code || 'PEN') }}
                  </TableCell>
                  <TableCell>{{ formatDate(item.valid_from) }}</TableCell>
                  <TableCell>{{ item.valid_to ? formatDate(item.valid_to) : '-' }}</TableCell>
                  <TableCell class="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      @click="removePriceListItem(item)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow v-if="priceListItems.length === 0">
                  <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                    No hay productos en esta lista de precios
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showItemsDialog = false">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useProductsStore, type PriceList, type PriceListItem } from '@/stores/products'
import { supabase } from '@/lib/supabase'
import { Plus, DollarSign, Eye, Edit, Trash2 } from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

// State
const showCreateDialog = ref(false)
const showItemsDialog = ref(false)
const editingPriceList = ref<PriceList | null>(null)
const selectedPriceList = ref<PriceList | null>(null)
const priceListItems = ref<PriceListItem[]>([])

const priceListForm = ref({
  name: '',
  currency_code: 'PEN',
  is_default: false
})

const itemForm = ref({
  product_id: '',
  unit_price: 0,
  valid_from: new Date().toISOString().split('T')[0]
})

// Computed
const availableProducts = computed(() => {
  const usedProductIds = new Set(priceListItems.value.map(item => item.product_id))
  return productsStore.products.filter(product => !usedProductIds.has(product.id))
})

// Methods
const getPriceListItemCount = (priceListId: string): number => {
  return productsStore.priceListItems.filter(item => item.price_list_id === priceListId).length
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const formatCurrency = (amount: number, currencyCode: string): string => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toFixed(2)}`
  }
  
  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2
  })
  
  return formatter.format(amount)
}

const getProductName = (productId: string): string => {
  return productsStore.products.find(p => p.id === productId)?.name || 'Producto no encontrado'
}

const getProductSKU = (productId: string): string => {
  return productsStore.products.find(p => p.id === productId)?.sku || '-'
}

const editPriceList = (priceList: PriceList) => {
  editingPriceList.value = priceList
  priceListForm.value = {
    name: priceList.name,
    currency_code: priceList.currency_code,
    is_default: priceList.is_default
  }
  showCreateDialog.value = true
}

const deletePriceList = async (priceList: PriceList) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la lista "${priceList.name}"?`)) {
    // TODO: Implement delete price list
    console.log('Delete price list:', priceList)
  }
}

const viewPriceListItems = async (priceList: PriceList) => {
  selectedPriceList.value = priceList
  
  // Load price list items for this specific price list
  await productsStore.fetchPriceListItems(companyStore.selectedCompany?.id || '', priceList.id)
  priceListItems.value = productsStore.priceListItems.filter(item => item.price_list_id === priceList.id)
  
  showItemsDialog.value = true
}

const submitPriceListForm = async () => {
  try {
    if (!companyStore.selectedCompany) return

    const priceListData = {
      ...priceListForm.value,
      company_id: companyStore.selectedCompany.id
    }

    if (editingPriceList.value) {
      // TODO: Implement update price list
      console.log('Update price list:', priceListData)
    } else {
      // TODO: Implement create price list
      console.log('Create price list:', priceListData)
    }
    
    cancelPriceListForm()
  } catch (error) {
    console.error('Error saving price list:', error)
  }
}

const cancelPriceListForm = () => {
  showCreateDialog.value = false
  editingPriceList.value = null
  priceListForm.value = {
    name: '',
    currency_code: 'PEN',
    is_default: false
  }
}

const addPriceListItem = async () => {
  if (!selectedPriceList.value || !itemForm.value.product_id || !itemForm.value.unit_price) return

  try {
    const { data, error } = await supabase
      .from('price_list_items')
      .insert({
        company_id: companyStore.selectedCompany?.id || '',
        price_list_id: selectedPriceList.value.id,
        product_id: itemForm.value.product_id,
        unit_price: itemForm.value.unit_price,
        valid_from: itemForm.value.valid_from
      })
      .select()
      .single()

    if (error) throw error

    // Reload price list items
    await productsStore.fetchPriceListItems(companyStore.selectedCompany?.id || '', selectedPriceList.value.id)
    priceListItems.value = productsStore.priceListItems.filter(item => item.price_list_id === selectedPriceList.value?.id)
    
    // Reset form
    itemForm.value = {
      product_id: '',
      unit_price: 0,
      valid_from: new Date().toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('Error adding price list item:', error)
  }
}

const removePriceListItem = async (item: PriceListItem) => {
  try {
    const { error } = await supabase
      .from('price_list_items')
      .delete()
      .eq('id', item.id)

    if (error) throw error

    // Remove from local array
    const index = priceListItems.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      priceListItems.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Error removing price list item:', error)
  }
}

onMounted(async () => {
  if (companyStore.selectedCompany) {
    await Promise.all([
      productsStore.fetchPriceLists(companyStore.selectedCompany.id),
      productsStore.fetchProducts(companyStore.selectedCompany.id),
      productsStore.fetchPriceListItems(companyStore.selectedCompany.id)
    ])
  }
})
</script>