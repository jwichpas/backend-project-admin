<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Productos</h1>
        <p class="text-muted-foreground">
          Gestiona el catálogo de productos de tu empresa
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportProducts">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateProductDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-5">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input
              v-model="searchTerm"
              placeholder="Nombre, SKU o código de barras..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Categoría</label>
            <select
              v-model="selectedCategory"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las categorías</option>
              <option
                v-for="category in productsStore.activeCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Marca</label>
            <select
              v-model="selectedBrand"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las marcas</option>
              <option
                v-for="brand in productsStore.activeBrands"
                :key="brand.id"
                :value="brand.id"
              >
                {{ brand.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Lista de Precios</label>
            <select
              v-model="selectedPriceList"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin lista de precios</option>
              <option
                v-for="priceList in productsStore.priceLists"
                :key="priceList.id"
                :value="priceList.id"
              >
                {{ priceList.name }} ({{ priceList.currency_code }})
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select
              v-model="selectedStatus"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Products Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Lista de Productos ({{ filteredProducts.length }})</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="showAdvancedFiltersDialog = true">
              <Filter class="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="productsStore.loading">
              <TableCell colspan="8" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando productos...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredProducts.length === 0">
              <TableCell colspan="8" class="text-center py-8 text-muted-foreground">
                No se encontraron productos
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="product in filteredProducts" :key="product.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div v-if="product.main_image" class="h-10 w-10 rounded-md overflow-hidden">
                    <img :src="product.main_image" :alt="product.name" class="h-full w-full object-cover" />
                  </div>
                  <div v-else class="h-10 w-10 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Package class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ product.name || product.product_name }}</p>
                    <p class="text-sm text-muted-foreground">{{ product.description }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-1 rounded text-sm">{{ product.sku }}</code>
              </TableCell>
              <TableCell>
                <span v-if="product.brand_name || (product.brand_id && productsStore.brands.find(b => b.id === product.brand_id))">
                  {{ product.brand_name || productsStore.brands.find(b => b.id === product.brand_id)?.name || '-' }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <span v-if="product.category_name || (product.category_id && productsStore.categories.find(c => c.id === product.category_id))">
                  {{ product.category_name || productsStore.categories.find(c => c.id === product.category_id)?.name || '-' }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <span>{{ product.total_stock || 0 }}</span>
                  <Badge
                    v-if="(product.total_stock || 0) < (product.min_stock || 20)"
                    variant="warning"
                    class="text-xs"
                  >
                    Bajo
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="product.unit_price && product.currency_code">
                  <PriceDisplay 
                    :price="product.unit_price" 
                    :currency="product.currency_code"
                    :discount="product.discount_value"
                  />
                </div>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <Badge :variant="(product.active !== false) ? 'success' : 'outline'">
                  {{ (product.active !== false) ? 'Activo' : 'Inactivo' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="viewProduct(product)" title="Ver producto">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="editProduct(product)" title="Editar producto">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="showProductMenu(product)" title="Más opciones">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Create Product Dialog -->
    <Dialog v-model:open="showCreateProductDialog">
      <DialogContent class="max-w-2xl" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitProductForm" class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Nombre del Producto</label>
              <Input
                v-model="productForm.name"
                placeholder="Ej: Laptop HP Pavilion"
                required
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">SKU</label>
              <Input
                v-model="productForm.sku"
                placeholder="Ej: LP-HP-001"
                required
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Código de Barras</label>
              <Input
                v-model="productForm.barcode"
                placeholder="Ej: 123456789012"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Unidad de Medida</label>
              <select
                v-model="productForm.unit_code"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccionar unidad</option>
                <option
                  v-for="unit in measurementUnits"
                  :key="unit.code"
                  :value="unit.code"
                >
                  {{ unit.code }} - {{ unit.descripcion }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Marca</label>
              <select
                v-model="productForm.brand_id"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin marca</option>
                <option
                  v-for="brand in productsStore.brands"
                  :key="brand.id"
                  :value="brand.id"
                >
                  {{ brand.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Categoría</label>
              <select
                v-model="productForm.category_id"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin categoría</option>
                <option
                  v-for="category in productsStore.categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Descripción</label>
            <textarea
              v-model="productForm.description"
              placeholder="Descripción del producto..."
              rows="3"
              class="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            ></textarea>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm font-medium">Stock Mínimo</label>
              <Input
                v-model.number="productForm.min_stock"
                type="number"
                min="0"
                placeholder="20"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Stock Máximo</label>
              <Input
                v-model.number="productForm.max_stock"
                type="number"
                :min="productForm.min_stock"
                placeholder="100"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Punto de Reorden</label>
              <Input
                v-model.number="productForm.reorder_point"
                type="number"
                min="0"
                placeholder="30"
                class="mt-1"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-1">
            <div>
              <label class="text-sm font-medium">Tipo de Afectación SUNAT</label>
              <select
                v-model="productForm.tipo_afectacion"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="10">Gravado - Operación Onerosa</option>
                <option value="11">Gravado - Retiro por premio</option>
                <option value="12">Gravado - Retiro por donación</option>
                <option value="20">Exonerado - Operación Onerosa</option>
                <option value="30">Inafecto - Operación Onerosa</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex items-center space-x-2">
              <input
                id="is_serialized"
                type="checkbox"
                v-model="productForm.is_serialized"
                class="rounded border-gray-300"
              />
              <label for="is_serialized" class="text-sm font-medium">Producto serializado</label>
            </div>

            <div class="flex items-center space-x-2">
              <input
                id="is_batch_controlled"
                type="checkbox"
                v-model="productForm.is_batch_controlled"
                class="rounded border-gray-300"
              />
              <label for="is_batch_controlled" class="text-sm font-medium">Control por lotes</label>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="active"
              type="checkbox"
              v-model="productForm.active"
              class="rounded border-gray-300"
            />
            <label for="active" class="text-sm font-medium">Producto activo</label>
          </div>

          <!-- Images Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">Imágenes del Producto</label>
              <Button type="button" variant="outline" size="sm" @click="imageInput?.click()">
                <Upload class="mr-2 h-4 w-4" />
                Subir Imágenes
              </Button>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="handleImageSelection"
              />
            </div>

            <!-- Image Previews -->
            <div v-if="imagePreviewUrls.length > 0" class="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div
                v-for="(url, index) in imagePreviewUrls"
                :key="index"
                class="relative group"
              >
                <div class="aspect-square rounded-lg border overflow-hidden bg-muted">
                  <img
                    :src="url"
                    :alt="`Preview ${index + 1}`"
                    class="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  class="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="removeImage(index)"
                >
                  <X class="h-3 w-3" />
                </Button>
                <div v-if="index === 0" class="absolute bottom-1 left-1">
                  <Badge variant="success" class="text-xs">Principal</Badge>
                </div>
              </div>
            </div>

            <!-- Upload Hint -->
            <div v-else class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p class="text-sm text-muted-foreground mb-1">Arrastra imágenes aquí o haz clic para seleccionar</p>
              <p class="text-xs text-muted-foreground">PNG, JPG, WebP hasta 5MB cada una</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelProductForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="productsStore.loading">
              Crear Producto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Advanced Filters Dialog -->
    <Dialog v-model:open="showAdvancedFiltersDialog">
      <DialogContent class="max-w-lg" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>Filtros Avanzados</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Precio Mínimo</label>
              <Input
                v-model.number="advancedFilters.minPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Precio Máximo</label>
              <Input
                v-model.number="advancedFilters.maxPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="mt-1"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Stock Mínimo</label>
              <Input
                v-model.number="advancedFilters.minStock"
                type="number"
                min="0"
                placeholder="0"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Stock Máximo</label>
              <Input
                v-model.number="advancedFilters.maxStock"
                type="number"
                min="0"
                placeholder="0"
                class="mt-1"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Tiene Descuento</label>
            <select
              v-model="advancedFilters.hasDiscount"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="yes">Con descuento</option>
              <option value="no">Sin descuento</option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium">Con Imagen</label>
            <select
              v-model="advancedFilters.hasImage"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="yes">Con imagen</option>
              <option value="no">Sin imagen</option>
            </select>
          </div>
        </div>

        <DialogFooter class="flex justify-between">
          <Button type="button" variant="outline" @click="resetAdvancedFilters">
            Limpiar Filtros
          </Button>
          <div class="flex gap-2">
            <Button type="button" variant="outline" @click="showAdvancedFiltersDialog = false">
              Cancelar
            </Button>
            <Button @click="applyAdvancedFilters">
              Aplicar Filtros
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- View Product Dialog -->
    <Dialog v-model:open="showViewProductDialog">
      <DialogContent class="max-w-4xl" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>Detalles del Producto</DialogTitle>
        </DialogHeader>

        <div v-if="selectedProduct" class="space-y-6">
          <div class="grid gap-6 md:grid-cols-3">
            <!-- Imagen del producto -->
            <div class="space-y-4">
              <div class="aspect-square rounded-lg border overflow-hidden bg-muted">
                <img
                  v-if="selectedProduct.main_image"
                  :src="selectedProduct.main_image"
                  :alt="selectedProduct.product_name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Package class="h-16 w-16 text-muted-foreground" />
                </div>
              </div>
            </div>

            <!-- Información básica -->
            <div class="md:col-span-2 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p class="text-lg font-semibold">{{ selectedProduct.product_name }}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">SKU</label>
                  <code class="bg-muted px-2 py-1 rounded text-sm">{{ selectedProduct.sku }}</code>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">Código de Barras</label>
                  <p>{{ selectedProduct.barcode || '-' }}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">Unidad de Medida</label>
                  <p>{{ selectedProduct.unit_code }}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">Marca</label>
                  <p>{{ selectedProduct.brand_name || '-' }}</p>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">Categoría</label>
                  <p>{{ selectedProduct.category_name || '-' }}</p>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-muted-foreground">Descripción</label>
                <p class="text-sm">{{ selectedProduct.description || 'Sin descripción' }}</p>
              </div>
            </div>
          </div>

          <!-- Información de inventario y precios -->
          <div class="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Inventario</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Stock Total:</span>
                  <span class="font-medium">{{ selectedProduct.total_stock || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Disponible:</span>
                  <span class="font-medium text-green-600">{{ selectedProduct.available_stock || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Reservado:</span>
                  <span class="font-medium text-orange-600">{{ selectedProduct.reserved_stock || 0 }}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-base">Precios</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Precio:</span>
                  <div v-if="selectedProduct.unit_price && selectedProduct.currency_code">
                    <PriceDisplay 
                      :price="selectedProduct.unit_price" 
                      :currency="selectedProduct.currency_code"
                      :discount="selectedProduct.discount_value"
                    />
                  </div>
                  <span v-else class="text-muted-foreground">-</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-base">Estado</CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-muted-foreground">Estado:</span>
                  <Badge :variant="selectedProduct.active !== false ? 'success' : 'outline'">
                    {{ selectedProduct.active !== false ? 'Activo' : 'Inactivo' }}
                  </Badge>
                </div>
                <div class="flex justify-between" v-if="selectedProduct.location">
                  <span class="text-sm text-muted-foreground">Ubicación:</span>
                  <span class="font-medium text-xs">{{ selectedProduct.location }}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showViewProductDialog = false">Cerrar</Button>
          <Button @click="editProduct(selectedProduct!)">
            <Edit class="mr-2 h-4 w-4" />
            Editar Producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Product Dialog -->
    <Dialog v-model:open="showEditProductDialog">
      <DialogContent class="max-w-2xl" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitProductForm" class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Nombre del Producto</label>
              <Input
                v-model="productForm.name"
                placeholder="Ej: Laptop HP Pavilion"
                required
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">SKU</label>
              <Input
                v-model="productForm.sku"
                placeholder="Ej: LP-HP-001"
                required
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Código de Barras</label>
              <Input
                v-model="productForm.barcode"
                placeholder="Ej: 123456789012"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Unidad de Medida</label>
              <select
                v-model="productForm.unit_code"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccionar unidad</option>
                <option
                  v-for="unit in measurementUnits"
                  :key="unit.code"
                  :value="unit.code"
                >
                  {{ unit.code }} - {{ unit.descripcion }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Marca</label>
              <select
                v-model="productForm.brand_id"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin marca</option>
                <option
                  v-for="brand in productsStore.brands"
                  :key="brand.id"
                  :value="brand.id"
                >
                  {{ brand.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Categoría</label>
              <select
                v-model="productForm.category_id"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin categoría</option>
                <option
                  v-for="category in productsStore.categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Descripción</label>
            <textarea
              v-model="productForm.description"
              placeholder="Descripción del producto..."
              rows="3"
              class="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            ></textarea>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm font-medium">Stock Mínimo</label>
              <Input
                v-model.number="productForm.min_stock"
                type="number"
                min="0"
                placeholder="20"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Stock Máximo</label>
              <Input
                v-model.number="productForm.max_stock"
                type="number"
                :min="productForm.min_stock"
                placeholder="100"
                class="mt-1"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Punto de Reorden</label>
              <Input
                v-model.number="productForm.reorder_point"
                type="number"
                min="0"
                placeholder="30"
                class="mt-1"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-1">
            <div>
              <label class="text-sm font-medium">Tipo de Afectación SUNAT</label>
              <select
                v-model="productForm.tipo_afectacion"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="10">Gravado - Operación Onerosa</option>
                <option value="11">Gravado - Retiro por premio</option>
                <option value="12">Gravado - Retiro por donación</option>
                <option value="20">Exonerado - Operación Onerosa</option>
                <option value="30">Inafecto - Operación Onerosa</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex items-center space-x-2">
              <input
                id="edit_is_serialized"
                type="checkbox"
                v-model="productForm.is_serialized"
                class="rounded border-gray-300"
              />
              <label for="edit_is_serialized" class="text-sm font-medium">Producto serializado</label>
            </div>

            <div class="flex items-center space-x-2">
              <input
                id="edit_is_batch_controlled"
                type="checkbox"
                v-model="productForm.is_batch_controlled"
                class="rounded border-gray-300"
              />
              <label for="edit_is_batch_controlled" class="text-sm font-medium">Control por lotes</label>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="edit_active"
              type="checkbox"
              v-model="productForm.active"
              class="rounded border-gray-300"
            />
            <label for="edit_active" class="text-sm font-medium">Producto activo</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelProductForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="productsStore.loading">
              Actualizar Producto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useProductsStore, type ProductFull } from '@/stores/products'
import { sunatMeasurementUnitsService, type SunatCatalogItem } from '@/services/sunatService'
import {
  Download,
  Plus,
  Filter,
  Package,
  Eye,
  Edit,
  MoreVertical,
  Loader2,
  Upload,
  X
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import PriceDisplay from '@/components/Products/PriceDisplay.vue'

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

// State
const showCreateProductDialog = ref(false)
const showAdvancedFiltersDialog = ref(false)
const showViewProductDialog = ref(false)
const showEditProductDialog = ref(false)
const selectedProduct = ref<ProductFull | null>(null)
const editingProduct = ref(false)

// Filters
const searchTerm = ref('')
const selectedCategory = ref('')
const selectedBrand = ref('')
const selectedPriceList = ref('')
const selectedStatus = ref('')

// SUNAT data
const measurementUnits = ref<SunatCatalogItem[]>([])

// Product form
const productForm = ref({
  name: '',
  sku: '',
  barcode: '',
  description: '',
  unit_code: 'NIU',
  brand_id: '',
  category_id: '',
  tipo_afectacion: '10', // Default SUNAT affectation type
  width: 0,
  height: 0,
  length: 0,
  weight_kg: 0,
  is_serialized: false,
  is_batch_controlled: false,
  min_stock: 20,
  max_stock: 100, // Must be >= min_stock
  reorder_point: 30,
  active: true
})

// Product images
const selectedImages = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])
const imageInput = ref<HTMLInputElement>()

// Advanced filters
const advancedFilters = ref({
  minPrice: null as number | null,
  maxPrice: null as number | null,
  minStock: null as number | null,
  maxStock: null as number | null,
  hasDiscount: '',
  hasImage: ''
})

const appliedAdvancedFilters = ref({
  minPrice: null as number | null,
  maxPrice: null as number | null,
  minStock: null as number | null,
  maxStock: null as number | null,
  hasDiscount: '',
  hasImage: ''
})

// Computed
const filteredProducts = computed(() => {
  // Use productsFull if available, otherwise fall back to products
  let products = productsStore.productsFull.length > 0 ? productsStore.productsFull : productsStore.products

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    products = products.filter(product => {
      const name = product.product_name || product.name || ''
      const sku = product.sku || ''
      const barcode = product.barcode || ''

      return name.toLowerCase().includes(term) ||
             sku.toLowerCase().includes(term) ||
             barcode.toLowerCase().includes(term)
    })
  }

  if (selectedCategory.value) {
    products = products.filter(product => {
      // Check both category_id and category_name for filtering
      return product.category_id === selectedCategory.value
    })
  }

  if (selectedBrand.value) {
    products = products.filter(product => {
      // Check both brand_id and brand_name for filtering
      return product.brand_id === selectedBrand.value
    })
  }

  if (selectedStatus.value === 'active') {
    products = products.filter(product =>
      product.active !== false && product.is_active !== false
    )
  } else if (selectedStatus.value === 'inactive') {
    products = products.filter(product =>
      product.active === false || product.is_active === false
    )
  }

  // Apply advanced filters
  if (appliedAdvancedFilters.value.minPrice !== null) {
    products = products.filter(product =>
      product.unit_price && product.unit_price >= appliedAdvancedFilters.value.minPrice!
    )
  }

  if (appliedAdvancedFilters.value.maxPrice !== null) {
    products = products.filter(product =>
      product.unit_price && product.unit_price <= appliedAdvancedFilters.value.maxPrice!
    )
  }

  if (appliedAdvancedFilters.value.minStock !== null) {
    products = products.filter(product => {
      const stock = product.total_stock || 0
      return stock >= appliedAdvancedFilters.value.minStock!
    })
  }

  if (appliedAdvancedFilters.value.maxStock !== null) {
    products = products.filter(product => {
      const stock = product.total_stock || 0
      return stock <= appliedAdvancedFilters.value.maxStock!
    })
  }

  if (appliedAdvancedFilters.value.hasDiscount === 'yes') {
    products = products.filter(product =>
      product.discount_value && product.discount_value > 0
    )
  } else if (appliedAdvancedFilters.value.hasDiscount === 'no') {
    products = products.filter(product =>
      !product.discount_value || product.discount_value === 0
    )
  }

  if (appliedAdvancedFilters.value.hasImage === 'yes') {
    products = products.filter(product =>
      product.main_image && product.main_image.trim() !== ''
    )
  } else if (appliedAdvancedFilters.value.hasImage === 'no') {
    products = products.filter(product =>
      !product.main_image || product.main_image.trim() === ''
    )
  }

  return products
})

// Methods
const getProductTotalStock = (productId: string) => {
  const inventory = productsStore.getProductStock(productId)
  return inventory.reduce((total, item) => total + item.available_qty, 0)
}


const formatCurrency = (amount: number, currencyCode: string) => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toFixed(2)}`
  }
  else if (currencyCode === 'USD') {
    return `$ ${amount.toFixed(2)}`
  }
  else {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

// Load products with current filters
const loadProducts = async () => {
  if (!companyStore.selectedCompany) return

  await productsStore.fetchProductsFull(
    companyStore.selectedCompany.id,
    selectedPriceList.value || null,
    selectedCategory.value || null,
    selectedBrand.value || null
  )
}

const loadMeasurementUnits = async () => {
  try {
    measurementUnits.value = await sunatMeasurementUnitsService.getAll()
    console.log('Measurement units loaded:', measurementUnits.value.length)
  } catch (error) {
    console.error('Error loading measurement units:', error)
  }
}

const submitProductForm = async () => {
  try {
    if (!companyStore.selectedCompany) return

    const productData = {
      ...productForm.value,
      company_id: companyStore.selectedCompany.id
    }

    if (editingProduct.value && selectedProduct.value) {
      // TODO: Implement update product
      console.log('Update product:', productData)
      // await productsStore.updateProduct(selectedProduct.value.product_id, productData)
    } else {
      await productsStore.createProduct(productData)
    }

    cancelProductForm()

    // Refresh products list
    await loadProducts()
  } catch (error) {
    console.error('Error saving product:', error)
  }
}

const cancelProductForm = () => {
  showCreateProductDialog.value = false
  showEditProductDialog.value = false
  editingProduct.value = false
  selectedProduct.value = null
  resetImages()
  productForm.value = {
    name: '',
    sku: '',
    barcode: '',
    description: '',
    unit_code: 'NIU',
    brand_id: '',
    category_id: '',
    tipo_afectacion: '10',
    is_serialized: false,
    is_batch_controlled: false,
    min_stock: 20,
    active: true
  }
}

const exportProducts = () => {
  // TODO: Implement export functionality
  console.log('Export products')
}

const viewProduct = (product: ProductFull) => {
  selectedProduct.value = product
  showViewProductDialog.value = true
}

const editProduct = (product: ProductFull) => {
  selectedProduct.value = product
  editingProduct.value = true

  // Llenar el formulario con los datos del producto
  productForm.value = {
    name: product.product_name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    description: product.description || '',
    unit_code: product.unit_code || 'NIU',
    brand_id: product.brand_id || '',
    category_id: product.category_id || '',
    tipo_afectacion: '10', // Se debería obtener del producto
    is_serialized: false, // Se debería obtener del producto
    is_batch_controlled: false, // Se debería obtener del producto
    min_stock: 20, // Se debería obtener del producto
    active: product.active !== false
  }

  showEditProductDialog.value = true
}

const showProductMenu = (product: ProductFull) => {
  // TODO: Implementar menú contextual con más opciones
  console.log('Show menu for product:', product.sku)
}

const handleImageSelection = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const files = Array.from(target.files)
    selectedImages.value = [...selectedImages.value, ...files]

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          imagePreviewUrls.value.push(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    })
  }
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
}

const resetImages = () => {
  selectedImages.value = []
  imagePreviewUrls.value = []
}

const applyAdvancedFilters = () => {
  appliedAdvancedFilters.value = { ...advancedFilters.value }
  showAdvancedFiltersDialog.value = false
}

const resetAdvancedFilters = () => {
  advancedFilters.value = {
    minPrice: null,
    maxPrice: null,
    minStock: null,
    maxStock: null,
    hasDiscount: '',
    hasImage: ''
  }
  appliedAdvancedFilters.value = {
    minPrice: null,
    maxPrice: null,
    minStock: null,
    maxStock: null,
    hasDiscount: '',
    hasImage: ''
  }
}

onMounted(async () => {
  try {
    // Ensure companies are loaded
    if (companyStore.companies.length === 0) {
      await companyStore.fetchCompanies()
    }

    // Auto-select first company if none selected
    if (!companyStore.selectedCompany && companyStore.companies.length > 0) {
      companyStore.selectCompany(companyStore.companies[0])
    }

    // Load products data if company is available
    if (companyStore.selectedCompany) {
      console.log('Loading products for company:', companyStore.selectedCompany.legal_name)

      await Promise.all([
        productsStore.fetchBrands(companyStore.selectedCompany.id),
        productsStore.fetchCategories(companyStore.selectedCompany.id),
        productsStore.fetchWarehouses(companyStore.selectedCompany.id),
        productsStore.fetchPriceLists(companyStore.selectedCompany.id),
        productsStore.fetchInventoryItems(companyStore.selectedCompany.id),
        loadMeasurementUnits()
      ])

      // Set default price list (first one found) and load products
      if (productsStore.priceLists.length > 0 && !selectedPriceList.value) {
        selectedPriceList.value = productsStore.priceLists[0].id
      }

      // Load products with default filters
      await loadProducts()

      console.log('Products loaded:', productsStore.productsFull.length)
      console.log('Brands loaded:', productsStore.brands.length)
      console.log('Categories loaded:', productsStore.categories.length)
    } else {
      console.warn('No company available to load products')
    }
  } catch (error) {
    console.error('Error loading products data:', error)
  }
})

// Watch for filter changes to reload products
watch([selectedCategory, selectedBrand, selectedPriceList], async () => {
  await loadProducts()
}, { deep: true })
</script>
