<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- POS Header -->
    <div class="flex-shrink-0 bg-card border-b border-border p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <CreditCard class="h-6 w-6 text-primary" />
            <h1 class="text-xl font-bold">Punto de Venta</h1>
          </div>
          <Badge variant="outline" class="text-xs">
            {{ companiesStore.currentCompany?.legal_name }}
          </Badge>
        </div>
        <div class="flex items-center gap-3">
          <!-- Price List Selector -->
          <div v-if="salesStore.activePriceLists.length > 0" class="min-w-[180px]">
            <p class="text-xs text-muted-foreground mb-1">Lista de Precios</p>
            <select
              :value="salesStore.selectedPriceList?.id"
              @change="onPriceListChange"
              class="w-full px-2 py-1 text-xs border border-input rounded-md bg-background"
            >
              <option
                v-for="priceList in salesStore.activePriceLists"
                :key="priceList.id"
                :value="priceList.id"
              >
                {{ priceList.name }}
              </option>
            </select>
          </div>
          <div class="text-right">
            <p class="text-sm text-muted-foreground">Vendedor</p>
            <p class="font-medium">{{ currentUser?.name || 'Usuario' }}</p>
          </div>
          <Button variant="outline" size="sm" @click="showSettingsDialog = true">
            <Settings class="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>
    </div>

    <!-- Main POS Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel - Products and Cart -->
      <div class="flex-1 flex flex-col">
        <!-- Product Search and Categories -->
        <div class="p-4 border-b border-border">
          <div class="flex gap-4 mb-4">
            <div class="flex-1 relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="productSearch"
                placeholder="Buscar productos por nombre o código..."
                class="h-10 pl-10"
                @input="searchProducts"
              />
            </div>
            <Button variant="outline" @click="showProductDialog = true">
              <Plus class="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>

          <!-- Categories -->
          <div class="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              :class="{ 'bg-primary text-primary-foreground': selectedCategory === null }"
              @click="selectedCategory = null"
            >
              Todos
            </Button>
            <Button
              v-for="category in categories"
              :key="category.id"
              variant="outline"
              size="sm"
              :class="{ 'bg-primary text-primary-foreground': selectedCategory === category.id }"
              @click="selectedCategory = category.id"
            >
              {{ category.name }}
            </Button>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div
              v-for="product in filteredProducts"
              :key="product.product_id"
              class="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary"
              @click="addToCart(product)"
            >
              <div class="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                <template v-if="product.main_image && !isImageError(product.product_id)">
                  <img
                    :src="product.main_image"
                    :alt="product.product_name"
                    class="w-full h-full object-cover"
                    @error="() => handleImageError(product.product_id)"
                  />
                </template>
                <Package v-else class="h-8 w-8 text-muted-foreground" />
              </div>
              <div class="space-y-1">
                <h3 class="font-medium text-sm line-clamp-2">{{ product.product_name }}</h3>
                <p class="text-xs text-muted-foreground">{{ product.sku }}</p>
                <div class="flex items-center justify-between">
                  <p class="font-bold text-primary">
                    {{ formatCurrency(product.unit_price || 0) }}
                  </p>
                  <Badge variant="outline" class="text-xs">
                    Stock: {{ product.available_stock || 0 }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredProducts.length === 0" class="text-center py-12">
            <Package class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">No se encontraron productos</p>
            <Button variant="outline" class="mt-4" @click="productSearch = ''">
              Limpiar búsqueda
            </Button>
          </div>
        </div>
      </div>

      <!-- Right Panel - Cart and Customer -->
      <div class="w-96 bg-card border-l border-border flex flex-col">
        <!-- Customer Selection -->
        <div class="p-4 border-b border-border">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">Cliente</label>
              <Button variant="ghost" size="sm" @click="showCustomerDialog = true">
                <Plus class="h-3 w-3 mr-1" />
                Nuevo
              </Button>
            </div>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="customerSearch"
                placeholder="Buscar cliente por nombre o documento..."
                class="h-10 pl-10"
                @input="searchCustomers"
                @focus="showCustomerDropdown = true"
              />
              <!-- Customer Dropdown -->
              <div
                v-if="showCustomerDropdown && (filteredCustomers.length > 0 || customerSearch)"
                class="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  class="px-3 py-2 cursor-pointer hover:bg-muted"
                  :class="{ 'bg-muted': !selectedCustomer }"
                  @click="selectCustomer(null)"
                >
                  <div class="font-medium">Cliente General</div>
                  <div class="text-xs text-muted-foreground">Sin identificación específica</div>
                </div>
                <div
                  v-for="customer in filteredCustomers"
                  :key="customer.id"
                  class="px-3 py-2 cursor-pointer hover:bg-muted"
                  :class="{ 'bg-muted': selectedCustomer === customer.id }"
                  @click="selectCustomer(customer)"
                >
                  <div class="font-medium">{{ customer.fullname || customer.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ customer.doc_number }} - {{ customer.email || 'Sin email' }}</div>
                </div>
                <div v-if="filteredCustomers.length === 0 && customerSearch" class="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron clientes
                </div>
              </div>
            </div>
            <!-- Selected Customer Display -->
            <div v-if="selectedCustomerData" class="p-2 bg-muted rounded-md">
              <div class="text-sm font-medium">{{ selectedCustomerData.fullname || selectedCustomerData.name }}</div>
              <div class="text-xs text-muted-foreground">{{ selectedCustomerData.doc_number }}</div>
            </div>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4">
            <h3 class="font-medium mb-3 flex items-center justify-between">
              <span>Carrito de Compras</span>
              <Badge variant="outline">{{ cartItems.length }} items</Badge>
            </h3>

            <div v-if="cartItems.length === 0" class="text-center py-8">
              <ShoppingCart class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p class="text-sm text-muted-foreground">Carrito vacío</p>
              <p class="text-xs text-muted-foreground">Agrega productos para comenzar</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(item, index) in cartItems"
                :key="index"
                class="bg-background border border-border rounded-lg p-3"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-start gap-3 flex-1">
                    <!-- Product thumbnail -->
                    <div class="w-10 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                      <template v-if="item.product.main_image && !isImageError(item.product.product_id)">
                        <img
                          :src="item.product.main_image"
                          :alt="item.product.product_name"
                          class="w-full h-full object-cover"
                          @error="() => handleImageError(item.product.product_id)"
                        />
                      </template>
                      <Package v-else class="h-4 w-4 text-gray-500" />
                    </div>
                    <!-- Product info -->
                    <div class="flex-1">
                      <h4 class="font-medium text-sm">{{ item.product.product_name }}</h4>
                      <p class="text-xs text-muted-foreground">{{ item.product.sku }}</p>
                      <!-- Unit Display/Edit -->
                      <div class="flex items-center gap-1 mt-1">
                        <div v-if="editingUnit[index]" class="flex items-center gap-1">
                          <select
                            :value="item.selected_unit || item.product.unit_code"
                            @change="changeUnit(index, ($event.target as HTMLSelectElement).value)"
                            class="text-xs border border-input rounded px-1 py-0.5 bg-background min-w-[80px]"
                          >
                            <option
                              v-for="unit in getAvailableUnitsForItem(item)"
                              :key="unit.code"
                              :value="unit.code"
                            >
                              {{ unit.name }}
                            </option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            class="h-8 w-8 p-0"
                            @click="cancelUnitEdit(index)"
                          >
                            <X class="h-6 w-6 text-gray-600" />
                          </Button>
                        </div>
                        <div v-else class="flex items-center gap-1">
                          <span class="text-xs text-blue-600 font-medium">
                            {{ getUnitName(item.selected_unit || item.product.unit_code) }}
                          </span>
                          <Button
                            v-if="getAvailableUnitsForItem(item).length > 1"
                            variant="ghost"
                            size="sm"
                            class="h-8 w-8 p-0"
                            @click="startUnitEdit(index)"
                          >
                            <Pencil class="h-6 w-6 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 w-7 p-1"
                    @click="removeFromCart(index)"
                  >
                    <X class="h-8 w-8 text-red-600" />
                  </Button>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-7 w-7 p-1"
                      @click="updateQuantity(index, item.quantity - 1)"
                      :disabled="item.quantity <= 1"
                    >
                      <Minus class="h-6 w-6 text-red-600" />
                    </Button>

                    <!-- Quantity Display/Edit -->
                    <div v-if="editingQuantity[index]" class="flex items-center gap-1">
                      <input
                        type="number"
                        :value="item.quantity"
                        @blur="saveQuantity(index, Number($event.target.value))"
                        @keyup.enter="$event.target.blur()"
                        @keyup.escape="cancelQuantityEdit(index)"
                        class="w-12 h-6 text-sm text-center border border-input rounded px-1 bg-background"
                        min="1"
                        ref="quantityInput"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-7 w-7 p-1"
                        @click="saveQuantity(index, item.quantity)"
                      >
                        <Check class="h-5 w-5 text-green-600" />
                      </Button>
                    </div>
                    <div v-else class="flex items-center gap-1">
                      <span class="text-sm font-medium w-8 text-center">{{ item.quantity }}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-7 w-7 p-1"
                        @click="startQuantityEdit(index)"
                      >
                        <Pencil class="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      class="h-7 w-7 p-1"
                      @click="updateQuantity(index, item.quantity + 1)"
                    >
                      <Plus class="h-6 w-6 text-green-600" />
                    </Button>
                  </div>
                  <div class="text-right">
                    <!-- Unit Price Display/Edit -->
                    <div class="text-xs text-muted-foreground mb-1 flex items-center justify-end gap-1">
                      <div v-if="editingPrice[index]" class="flex items-center gap-1">
                        <input
                          type="number"
                          :value="item.unit_price"
                          @blur="saveUnitPrice(index, Number($event.target.value))"
                          @keyup.enter="$event.target.blur()"
                          @keyup.escape="cancelPriceEdit(index)"
                          class="w-16 h-5 text-xs text-right border border-input rounded px-1 bg-background"
                          min="0"
                          step="0.01"
                          ref="priceInput"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-7 w-7 p-1"
                          @click="saveUnitPrice(index, item.unit_price)"
                        >
                          <Check class="h-5 w-5 text-green-600" />
                        </Button>
                      </div>
                      <div v-else class="flex items-center gap-1">
                        <span>{{ formatCurrency(item.unit_price) }}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-7 w-7 p-1"
                          @click="startPriceEdit(index)"
                        >
                          <Pencil class="h-4 w-4 text-blue-600" />
                        </Button>
                      </div>
                      <span>c/u</span>
                    </div>
                    <p class="font-bold text-sm">
                      {{ formatCurrency(item.total) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Summary and Actions -->
        <div class="border-t border-border p-4 space-y-4">
          <!-- Document Type Selection -->
          <div>
            <label class="text-sm font-medium mb-2 block">Tipo de Comprobante</label>
            <select
              v-model="documentType"
              :disabled="requiredDocumentType !== null && requiredDocumentType !== documentType"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="{
                'opacity-50 cursor-not-allowed': requiredDocumentType !== null && requiredDocumentType !== documentType,
                'border-red-300 bg-red-50': !isDocumentTypeValid
              }"
            >
              <option value="03">Boleta de Venta</option>
              <option value="01">Factura</option>
            </select>

            <!-- Validation message -->
            <div v-if="documentTypeValidationMessage" class="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle class="h-3 w-3" />
              {{ documentTypeValidationMessage }}
            </div>

            <!-- Auto-selection message -->
            <div v-else-if="requiredDocumentType && requiredDocumentType === documentType && selectedCustomerData" class="mt-1 text-xs text-blue-600 flex items-center gap-1">
              <CheckCircle class="h-3 w-3" />
              Documento seleccionado automáticamente según normativa SUNAT
            </div>
          </div>

          <!-- Cart Totals -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(cartSubtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>IGV (18%):</span>
              <span>{{ formatCurrency(cartIgv) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t border-border pt-2">
              <span>Total:</span>
              <span class="text-primary">{{ formatCurrency(cartTotal) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <!-- Validation Messages -->
            <div v-if="!canProcessPayment && cartItems.length > 0" class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 text-center">
              <span v-if="!selectedCustomer">⚠️ Selecciona un cliente para continuar</span>
              <span v-else-if="!isDocumentTypeValid">⚠️ {{ documentTypeValidationMessage }}</span>
            </div>

            <Button
              class="w-full h-12"
              :disabled="!canProcessPayment"
              @click="processPayment"
            >
              <Loader2 v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
              <CreditCard v-else class="mr-2 h-6 w-6 text-white font-bold" />
              {{ processing ? 'Procesando...' : 'Procesar Venta' }}
            </Button>

            <div class="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                :disabled="!canProcessPayment"
                @click="holdSale"
              >
                <Clock class="mr-2 h-6 w-6 text-blue-600 font-bold" />
                Retener
              </Button>
              <Button
                variant="outline"
                :disabled="cartItems.length === 0"
                @click="clearCart"
              >
                <Trash2 class="mr-2 h-6 w-6 text-red-600 font-bold" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sale Summary Modal -->
    <Dialog v-model:open="showSaleSummaryModal">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumen de Venta</DialogTitle>
        </DialogHeader>

        <div v-if="saleData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Sale Summary -->
          <div class="space-y-4">
            <div class="bg-muted rounded-lg p-4">
              <h3 class="font-semibold mb-3">Información del Documento</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Tipo:</span>
                  <span class="font-medium">{{ saleData.doc_type === '01' ? 'Factura' : 'Boleta' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Número:</span>
                  <span class="font-medium">{{ saleData.series }}-{{ String(saleData.number).padStart(8, '0') }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Fecha:</span>
                  <span class="font-medium">{{ saleData.issue_date }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Cliente:</span>
                  <span class="font-medium">{{ selectedCustomerData?.fullname || 'Cliente General' }}</span>
                </div>
              </div>
            </div>

            <!-- Items Summary -->
            <div class="bg-muted rounded-lg p-4">
              <h3 class="font-semibold mb-3">Productos</h3>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                <div v-for="item in cartItems" :key="item.product.product_id"
                     class="flex justify-between items-start text-sm border-b border-border pb-2">
                  <div class="flex-1">
                    <div class="font-medium">{{ item.product.product_name }}</div>
                    <div class="text-muted-foreground">
                      {{ item.quantity }} {{ getUnitName(item.selected_unit || item.product.unit_code) }}
                      × {{ formatCurrency(item.unit_price) }}
                    </div>
                  </div>
                  <div class="font-medium">{{ formatCurrency(item.total) }}</div>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="bg-muted rounded-lg p-4">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{{ formatCurrency(cartSubtotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>{{ formatCurrency(cartIgv) }}</span>
                </div>
                <div class="flex justify-between font-bold text-lg border-t border-border pt-2">
                  <span>Total:</span>
                  <span class="text-primary">{{ formatCurrency(cartTotal) }}</span>
                </div>
              </div>
            </div>

            <!-- Processing Options -->
            <div class="space-y-3">
              <h3 class="font-semibold">Opciones de Procesamiento</h3>

              <Button
                class="w-full h-12 bg-green-600 hover:bg-green-700"
                :disabled="processing"
                @click="processSaleDirectly"
              >
                <Loader2 v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
                <CreditCard v-else class="mr-2 h-4 w-4" />
                Venta Simple (Solo Documento)
              </Button>

              <Button
                class="w-full h-12 bg-blue-600 hover:bg-blue-700"
                :disabled="processing"
                @click="processSaleWithQuickShipment"
              >
                <Loader2 v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
                <Package v-else class="mr-2 h-4 w-4" />
                Despacho Rápido (Sin Logística)
              </Button>

              <Button
                class="w-full h-12 bg-orange-600 hover:bg-orange-700"
                :disabled="processing"
                @click="processSaleWithDispatchOrder"
              >
                <Loader2 v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
                <Clock v-else class="mr-2 h-4 w-4" />
                Orden de Despacho (Programado)
              </Button>

              <Button
                variant="outline"
                class="w-full"
                @click="showSaleSummaryModal = false"
                :disabled="processing"
              >
                Cancelar
              </Button>
            </div>
          </div>

          <!-- Ticket Preview (80mm) -->
          <div class="space-y-4">
            <h3 class="font-semibold">Vista Previa Ticket (80mm)</h3>
            <div class="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-xs max-w-[300px] mx-auto">
              <!-- Ticket Header -->
              <div class="text-center mb-4">
                <div class="font-bold text-lg">{{ companiesStore.currentCompany?.trade_name || companiesStore.currentCompany?.legal_name }}</div>
                <div>RUC: {{ companiesStore.currentCompany?.ruc }}</div>
                <div class="text-xs">{{ companiesStore.currentCompany?.address || 'Dirección no configurada' }}</div>
                <div class="border-t border-dashed border-gray-400 mt-2 pt-2">
                  <div class="font-semibold">{{ saleData.doc_type === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA' }}</div>
                  <div>{{ saleData.series }}-{{ String(saleData.number).padStart(8, '0') }}</div>
                </div>
              </div>

              <!-- Customer Info -->
              <div class="mb-3 pb-2 border-b border-dashed border-gray-400">
                <div><strong>Cliente:</strong> {{ selectedCustomerData?.fullname || 'Cliente General' }}</div>
                <div v-if="selectedCustomerData?.doc_number">
                  <strong>{{ selectedCustomerData?.doc_type === '6' ? 'RUC:' : 'DNI:' }}</strong> {{ selectedCustomerData.doc_number }}
                </div>
                <div><strong>Fecha:</strong> {{ new Date().toLocaleDateString('es-PE') }} {{ new Date().toLocaleTimeString('es-PE') }}</div>
              </div>

              <!-- Items -->
              <div class="mb-3">
                <div v-for="item in cartItems" :key="item.product.product_id" class="mb-2">
                  <div class="font-medium">{{ item.product.product_name }}</div>
                  <div class="flex justify-between">
                    <span>{{ item.quantity.toFixed(2) }} {{ getUnitName(item.selected_unit || item.product.unit_code) }} x {{ formatCurrency(item.unit_price) }}</span>
                    <span>{{ formatCurrency(item.total) }}</span>
                  </div>
                </div>
              </div>

              <!-- Totals -->
              <div class="border-t border-dashed border-gray-400 pt-2">
                <div class="flex justify-between">
                  <span>OP. GRAVADAS:</span>
                  <span>{{ formatCurrency(cartSubtotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>IGV (18%):</span>
                  <span>{{ formatCurrency(cartIgv) }}</span>
                </div>
                <div class="flex justify-between font-bold border-t border-gray-400 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>{{ formatCurrency(cartTotal) }}</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="text-center mt-4 pt-2 border-t border-dashed border-gray-400 text-xs">
                <div>Gracias por su compra</div>
                <div class="mt-2">{{ companiesStore.currentCompany?.website || '' }}</div>
                <div>Vendedor: {{ currentUser?.name }}</div>
                <div class="mt-1">** Representación Impresa **</div>
              </div>
            </div>

            <!-- Print Button -->
            <Button variant="outline" class="w-full" @click="printTicket">
              <Printer class="mr-2 h-4 w-4" />
              Imprimir Ticket
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Settings Dialog -->
    <Dialog v-model:open="showSettingsDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del POS</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Caja/Terminal</label>
            <Input v-model="posSettings.terminal" placeholder="Terminal 01" class="mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium">Serie por Defecto - Boletas</label>
            <select
              v-model="posSettings.boletaSeries"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option value="">Seleccionar serie</option>
              <option
                v-for="serie in availableBoletaSeries"
                :key="serie.series"
                :value="serie.series"
              >
                {{ serie.series }} - {{ serie.document_type_name }} (Último: {{ serie.last_number }})
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Serie por Defecto - Facturas</label>
            <select
              v-model="posSettings.facturaSeries"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option value="">Seleccionar serie</option>
              <option
                v-for="serie in availableFacturaSeries"
                :key="serie.series"
                :value="serie.series"
              >
                {{ serie.series }} - {{ serie.document_type_name }} (Último: {{ serie.last_number }})
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium">Tipo Operación Kardex</label>
            <select
              v-model="posSettings.operationTypeKardex"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option
                v-for="type in operationTypes"
                :key="type.code"
                :value="type.code"
              >
                {{ type.code }} - {{ type.descripcion }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium">Tipo Operación Venta</label>
            <select
              v-model="posSettings.operationTypeVenta"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option
                v-for="type in operationTypesV2"
                :key="type.code"
                :value="type.code"
              >
                {{ type.code }} - {{ type.descripcion }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium">Almacén por Defecto</label>
            <select
              v-model="posSettings.defaultWarehouseId"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
            >
              <option value="">Seleccionar automáticamente</option>
              <option
                v-for="warehouse in availableWarehouses"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }} - {{ warehouse.code }}
              </option>
            </select>
            <p class="text-xs text-muted-foreground mt-1">
              Usado para despachos rápidos. Si no se selecciona, se usará el primer almacén disponible.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <Button variant="outline" @click="showSettingsDialog = false">
            Cancelar
          </Button>
          <Button @click="saveSettings">
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'
import { useDocumentSeries } from '@/composables/useDocumentSeries'
import { useProductConversions } from '@/composables/useProductConversions'
import { supabase } from '@/lib/supabase'
// Removed: import { useProductsStore } from '@/stores/products' - using salesStore instead
import {
  CreditCard,
  Settings,
  Search,
  Plus,
  Package,
  ShoppingCart,
  X,
  Minus,
  Clock,
  Trash2,
  Loader2,
  Pencil,
  Check,
  Printer,
  AlertCircle,
  CheckCircle
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const authStore = useAuthStore()
const {
  series,
  operationTypes,
  operationTypesV2,
  loading: seriesLoading,
  error: seriesError,
  fetchAvailableSeries,
  fetchOperationTypes,
  fetchOperationTypesV2,
  getNextDocumentNumber,
  formatFullDocumentNumber
} = useDocumentSeries()
const productConversions = useProductConversions()
// Removed productsStore - using salesStore for products

// State
const productSearch = ref('')
const selectedCategory = ref<string | null>(null)
const selectedCustomer = ref('')
const customerSearch = ref('')
const showCustomerDropdown = ref(false)
const documentType = ref('03') // Boleta by default
const processing = ref(false)
const showSettingsDialog = ref(false)
const showProductDialog = ref(false)
const showCustomerDialog = ref(false)
const failedImages = ref(new Set<string>())

// Edit states
const editingQuantity = ref<Record<number, boolean>>({})
const editingPrice = ref<Record<number, boolean>>({})
const editingUnit = ref<Record<number, boolean>>({})

// Cart
const cartItems = ref<Array<{
  product: any
  quantity: number
  unit_price: number
  total: number
  selected_unit?: string
  base_quantity?: number
}>>([])

// POS Settings
const posSettings = ref({
  terminal: 'Terminal 01',
  boletaSeries: 'B001',
  facturaSeries: 'F001',
  operationTypeKardex: '01', // cat_12 - Default: VENTA INTERNA
  operationTypeVenta: '0101', // cat_17 - Default: VENTA INTERNA
  defaultWarehouseId: '' // Se cargará automáticamente si no está configurado
})

// Load settings from localStorage
const loadSettingsFromStorage = () => {
  const stored = localStorage.getItem('pos_settings')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      posSettings.value = { ...posSettings.value, ...parsed }
    } catch (error) {
      console.error('Error parsing stored POS settings:', error)
    }
  }
}

// Save settings to localStorage
const saveSettingsToStorage = () => {
  localStorage.setItem('pos_settings', JSON.stringify(posSettings.value))
}

// Computed current user from auth store
const currentUser = computed(() => {
  if (authStore.user) {
    return {
      name: authStore.user.user_metadata?.name ||
            authStore.user.user_metadata?.full_name ||
            authStore.user.email?.split('@')[0] ||
            'Usuario'
    }
  }
  return { name: 'Usuario' }
})

// Computed
// Get unique categories from products
const categories = computed(() => {
  const uniqueCategories = new Set()
  const categoriesWithNames: Array<{id: string, name: string}> = []

  salesStore.activeProducts.forEach(product => {
    if (!uniqueCategories.has(product.category_id)) {
      uniqueCategories.add(product.category_id)
      categoriesWithNames.push({
        id: product.category_id,
        name: product.category_name
      })
    }
  })

  return categoriesWithNames
})

const customers = computed(() => salesStore.activeCustomers || [])

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return customers.value

  const search = customerSearch.value.toLowerCase()
  return customers.value.filter(customer =>
    (customer.fullname || customer.name || '').toLowerCase().includes(search) ||
    customer.doc_number?.toLowerCase().includes(search) ||
    customer.email?.toLowerCase().includes(search)
  )
})

const selectedCustomerData = computed(() => {
  if (!selectedCustomer.value) return null
  return customers.value.find(c => c.id === selectedCustomer.value)
})

// Validation for processing payment
const canProcessPayment = computed(() => {
  return cartItems.value.length > 0 && selectedCustomer.value && !processing.value && isDocumentTypeValid.value
})

// SUNAT validation rules for document types
const requiredDocumentType = computed(() => {
  if (!selectedCustomerData.value) return null

  const customerDocType = selectedCustomerData.value.doc_type
  const total = cartTotal.value

  // Rule 1: DNI (1) must use Boleta (03)
  if (customerDocType === '1') {
    return '03'
  }

  // Rule 2: RUC (6) must use Factura (01)
  if (customerDocType === '6') {
    return '01'
  }

  // Rule 3: For amounts > 700, customer must have RUC (6) or DNI (1)
  if (total > 700) {
    if (customerDocType !== '1' && customerDocType !== '6') {
      return null // Invalid - needs DNI or RUC for amounts > 700
    }
    // If DNI, use Boleta; if RUC, use Factura
    return customerDocType === '1' ? '03' : '01'
  }

  // Default case for other scenarios
  return documentType.value
})

const isDocumentTypeValid = computed(() => {
  if (!selectedCustomerData.value) return true

  const customerDocType = selectedCustomerData.value.doc_type
  const total = cartTotal.value
  const currentDocType = documentType.value

  // For amounts > 700, customer must have DNI or RUC
  if (total > 700 && customerDocType !== '1' && customerDocType !== '6') {
    return false
  }

  // Check if current document type matches required
  const required = requiredDocumentType.value
  return required === null || currentDocType === required
})

const documentTypeValidationMessage = computed(() => {
  if (!selectedCustomerData.value) return null

  const customerDocType = selectedCustomerData.value.doc_type
  const total = cartTotal.value

  if (total > 700 && customerDocType !== '1' && customerDocType !== '6') {
    return 'Para montos mayores a S/ 700 el cliente debe tener DNI o RUC'
  }

  if (customerDocType === '1' && documentType.value !== '03') {
    return 'Clientes con DNI deben recibir Boleta de Venta'
  }

  if (customerDocType === '6' && documentType.value !== '01') {
    return 'Clientes con RUC deben recibir Factura'
  }

  return null
})

const filteredProducts = computed(() => {
  let products = salesStore.availableProducts || []

  // Filter by category
  if (selectedCategory.value) {
    products = products.filter(p => p.category_id === selectedCategory.value)
  }

  // Filter by search
  if (productSearch.value) {
    const search = productSearch.value.toLowerCase()
    products = products.filter(p =>
      p.product_name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      (p.barcode && p.barcode.toLowerCase().includes(search))
    )
  }

  return products
})

const cartSubtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
})

const cartIgv = computed(() => {
  return cartSubtotal.value * 0.18
})

const cartTotal = computed(() => {
  return cartSubtotal.value + cartIgv.value
})

// Series computadas
const availableBoletaSeries = computed(() => {
  return series.value.filter(s => s.document_type_code === '03' && s.is_active)
})

const availableFacturaSeries = computed(() => {
  return series.value.filter(s => s.document_type_code === '01' && s.is_active)
})

// Auto-update document type based on customer and total
watch([selectedCustomer, cartTotal], () => {
  const required = requiredDocumentType.value
  if (required && required !== documentType.value) {
    documentType.value = required
  }
}, { immediate: true })

// Almacenes disponibles
const availableWarehouses = ref([])

// Serie actual seleccionada
const currentSeries = computed(() => {
  const seriesCode = documentType.value === '01' ? posSettings.value.facturaSeries : posSettings.value.boletaSeries
  return series.value.find(s => s.series === seriesCode && s.document_type_code === documentType.value)
})

// Methods
const searchProducts = () => {
  // Search is handled by computed property
}

const searchCustomers = () => {
  // Search is handled by computed property
  showCustomerDropdown.value = true
}

const selectCustomer = (customer: any) => {
  if (customer) {
    selectedCustomer.value = customer.id
    customerSearch.value = customer.fullname || customer.name
  } else {
    selectedCustomer.value = ''
    customerSearch.value = 'Cliente General'
  }
  showCustomerDropdown.value = false
}

// Close dropdown when clicking outside
document.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showCustomerDropdown.value = false
  }
})

const onPriceListChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const priceListId = target.value

  if (priceListId && companiesStore.currentCompany) {
    // Find and select the price list
    const priceList = salesStore.activePriceLists.find(pl => pl.id === priceListId)
    if (priceList) {
      salesStore.selectPriceList(priceList)

      // Reload products with the new price list
      await salesStore.fetchProducts(companiesStore.currentCompany.id, priceListId)
    }
  }
}

const addToCart = async (product: any) => {
  const existingIndex = cartItems.value.findIndex(item =>
    item.product.product_id === product.product_id &&
    (item.selected_unit || product.unit_code) === product.unit_code
  )

  if (existingIndex >= 0) {
    updateQuantity(existingIndex, cartItems.value[existingIndex].quantity + 1)
  } else {
    // Load conversions for this product
    await productConversions.fetchConversions(product.product_id)

    cartItems.value.push({
      product,
      quantity: 1,
      unit_price: product.unit_price || 0,
      total: product.unit_price || 0,
      selected_unit: product.unit_code,
      base_quantity: 1
    })
  }
}

const removeFromCart = (index: number) => {
  cartItems.value.splice(index, 1)
}

const updateQuantity = (index: number, newQuantity: number) => {
  if (newQuantity < 1) return

  cartItems.value[index].quantity = newQuantity
  cartItems.value[index].total = cartItems.value[index].unit_price * newQuantity
}

const updateUnitPrice = (index: number, newPrice: number) => {
  if (newPrice < 0) return

  cartItems.value[index].unit_price = newPrice
  cartItems.value[index].total = newPrice * cartItems.value[index].quantity
}

// Inline editing functions
const startQuantityEdit = (index: number) => {
  editingQuantity.value[index] = true
  // Focus the input after DOM update
  nextTick(() => {
    const inputs = document.querySelectorAll('input[ref="quantityInput"]')
    if (inputs[index]) {
      (inputs[index] as HTMLInputElement).focus()
      ;(inputs[index] as HTMLInputElement).select()
    }
  })
}

const saveQuantity = (index: number, newQuantity: number) => {
  if (newQuantity >= 1) {
    updateQuantity(index, newQuantity)
  }
  editingQuantity.value[index] = false
}

const cancelQuantityEdit = (index: number) => {
  editingQuantity.value[index] = false
}

const startPriceEdit = (index: number) => {
  editingPrice.value[index] = true
  // Focus the input after DOM update
  nextTick(() => {
    const inputs = document.querySelectorAll('input[ref="priceInput"]')
    if (inputs[index]) {
      (inputs[index] as HTMLInputElement).focus()
      ;(inputs[index] as HTMLInputElement).select()
    }
  })
}

const saveUnitPrice = (index: number, newPrice: number) => {
  if (newPrice >= 0) {
    updateUnitPrice(index, newPrice)
  }
  editingPrice.value[index] = false
}

const cancelPriceEdit = (index: number) => {
  editingPrice.value[index] = false
}

// Unit conversion functions
const startUnitEdit = (index: number) => {
  editingUnit.value[index] = true
}

const changeUnit = async (index: number, newUnit: string) => {
  const item = cartItems.value[index]
  if (!item || item.selected_unit === newUnit) {
    editingUnit.value[index] = false
    return
  }

  try {
    // Convert quantity to new unit
    const convertedQuantity = await productConversions.convertQuantity(
      item.product.product_id,
      item.selected_unit || item.product.unit_code,
      newUnit,
      item.quantity
    )

    if (convertedQuantity !== null) {
      item.selected_unit = newUnit
      item.quantity = convertedQuantity
      item.total = item.unit_price * convertedQuantity

      // Update base quantity for reference
      item.base_quantity = await productConversions.convertQuantity(
        item.product.product_id,
        newUnit,
        item.product.unit_code,
        convertedQuantity
      ) || convertedQuantity
    }
  } catch (error) {
    console.error('Error converting unit:', error)
  }

  editingUnit.value[index] = false
}

const cancelUnitEdit = (index: number) => {
  editingUnit.value[index] = false
}

const getAvailableUnitsForItem = (item: any) => {
  return productConversions.getConvertibleUnits(
    item.product.product_id,
    item.product.unit_code
  )
}

// Helper function to safely get unit name
const getUnitName = (unitCode: string) => {
  try {
    const units = productConversions.availableUnits.value || []

    if (!Array.isArray(units)) {
      return unitCode
    }

    const found = units.find(u => u.code === unitCode)
    return found?.name || unitCode
  } catch (error) {
    console.error('Error in getUnitName:', error)
    return unitCode
  }
}

const clearCart = () => {
  cartItems.value = []
  selectedCustomer.value = ''
  // Clear editing states
  editingQuantity.value = {}
  editingPrice.value = {}
  editingUnit.value = {}
}

const holdSale = () => {
  // TODO: Implement hold sale functionality
  console.log('Hold sale:', cartItems.value)
}

// State for sale summary modal
const showSaleSummaryModal = ref(false)
const saleData = ref<any>(null)

const processPayment = async () => {
  if (cartItems.value.length === 0) return

  try {
    // Prepare sale data
    saleData.value = await prepareSaleData()

    // Show summary modal
    showSaleSummaryModal.value = true

  } catch (error) {
    console.error('Error preparing sale:', error)
    // TODO: Show error toast
  }
}

const prepareSaleData = async () => {
  // Validar que la empresa y serie estén definidas
  if (!companiesStore.currentCompany?.id) {
    throw new Error('No hay empresa seleccionada')
  }

  const seriesCode = documentType.value === '01' ? posSettings.value.facturaSeries : posSettings.value.boletaSeries
  if (!seriesCode) {
    throw new Error('No se ha configurado una serie para este tipo de documento')
  }

  // Obtener el siguiente número usando la función de la base de datos
  const nextNumber = await getNextDocumentNumber(
    companiesStore.currentCompany.id,
    documentType.value,
    seriesCode
  )

  if (!nextNumber) {
    throw new Error('No se pudo generar el número de documento')
  }

  // Create sales document data
  const salesDocData = {
      company_id: companiesStore.currentCompany.id,
      customer_id: selectedCustomer.value || null,
      doc_type: documentType.value,
      series: seriesCode,
      number: nextNumber, // Usar número generado automáticamente
      issue_date: new Date().toISOString().split('T')[0],
      currency_code: 'PEN',
      exchange_rate: 1,
      op_type_venta: posSettings.value.operationTypeVenta, // Tipo operación venta (cat_17)
      op_type_kardex: posSettings.value.operationTypeKardex, // Tipo operación kardex (cat_12)
      total_ope_gravadas: cartSubtotal.value,
      total_ope_gravadas_local: cartSubtotal.value,
      total_igv: cartIgv.value,
      total_igv_local: cartIgv.value,
      total: cartTotal.value,
      total_local: cartTotal.value,
      igv_affectation: '10',
      created_by: authStore.user?.id,
      items: cartItems.value.map(item => ({
        product_id: item.product.product_id,
        description: item.product.product_name,
        unit_code: item.selected_unit || item.product.unit_code || 'NIU',
        quantity: item.quantity,
        unit_price: item.unit_price,
        igv_affectation: '10',
        total_line: item.total
      }))
    }

  return salesDocData
}

// Process sale with different options
const processSaleDirectly = async () => {
  if (!saleData.value) return

  processing.value = true

  try {
    // Check if the function exists, fallback to regular createSalesDoc
    if (typeof salesStore.createSalesDocWithElectronicInvoicing === 'function') {
      await salesStore.createSalesDocWithElectronicInvoicing(
        saleData.value,
        cartItems.value,
        companiesStore.currentCompany,
        selectedCustomerData.value
      )
    } else {
      // Fallback to regular sales doc creation
      await salesStore.createSalesDoc(saleData.value)
      console.warn('Electronic invoicing function not available, using regular sales doc creation')
    }

    // Clear cart after successful sale
    clearCart()
    showSaleSummaryModal.value = false

    console.log(`Venta procesada exitosamente! Documento: ${saleData.value.series}-${String(saleData.value.number).padStart(8, '0')}`)
    // TODO: Show success toast

  } catch (error) {
    console.error('Error processing direct sale:', error)
    // TODO: Show error toast
  } finally {
    processing.value = false
  }
}

const processSaleWithQuickShipment = async () => {
  if (!saleData.value) return

  processing.value = true

  try {
    // Create sales document with electronic invoicing
    let createdSaleDoc
    if (typeof salesStore.createSalesDocWithElectronicInvoicing === 'function') {
      createdSaleDoc = await salesStore.createSalesDocWithElectronicInvoicing(
        saleData.value,
        cartItems.value,
        companiesStore.currentCompany,
        selectedCustomerData.value
      )
    } else {
      createdSaleDoc = await salesStore.createSalesDoc(saleData.value)
      console.warn('Electronic invoicing function not available, using regular sales doc creation')
    }

    // Create quick shipment (no vehicle/driver needed)
    await salesStore.createQuickShipment(createdSaleDoc.id, cartItems.value, companiesStore.currentCompany.id)

    // Clear cart after successful sale
    clearCart()
    showSaleSummaryModal.value = false

    console.log(`Venta con despacho rápido procesada! Documento: ${saleData.value.series}-${String(saleData.value.number).padStart(8, '0')}`)
    // TODO: Show success toast

  } catch (error) {
    console.error('Error processing sale with quick shipment:', error)
    // TODO: Show error toast
  } finally {
    processing.value = false
  }
}

const processSaleWithDispatchOrder = async () => {
  if (!saleData.value) return

  processing.value = true

  try {
    // Create sales document with electronic invoicing
    let createdSaleDoc
    if (typeof salesStore.createSalesDocWithElectronicInvoicing === 'function') {
      createdSaleDoc = await salesStore.createSalesDocWithElectronicInvoicing(
        saleData.value,
        cartItems.value,
        companiesStore.currentCompany,
        selectedCustomerData.value
      )
    } else {
      createdSaleDoc = await salesStore.createSalesDoc(saleData.value)
      console.warn('Electronic invoicing function not available, using regular sales doc creation')
    }

    // Create dispatch order (status PENDING, will need vehicle/driver assignment later)
    await salesStore.createDispatchOrderForSales([createdSaleDoc.id], companiesStore.currentCompany.id)

    // Clear cart after successful sale
    clearCart()
    showSaleSummaryModal.value = false

    console.log(`Venta con orden de despacho procesada! Documento: ${saleData.value.series}-${String(saleData.value.number).padStart(8, '0')}`)
    // TODO: Show success toast

  } catch (error) {
    console.error('Error processing sale with dispatch order:', error)
    // TODO: Show error toast
  } finally {
    processing.value = false
  }
}

// Helper functions are now implemented in the store

// Print ticket function
const printTicket = () => {
  if (!saleData.value) return

  // Create print window with 80mm styling
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const ticketHTML = generateTicketHTML()

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket - ${saleData.value.series}-${String(saleData.value.number).padStart(8, '0')}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 72mm;
          background: white;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .dashed { border-top: 1px dashed #000; margin: 5px 0; padding-top: 5px; }
        .item { margin: 3px 0; }
        .flex { display: flex; justify-content: space-between; }
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${ticketHTML}
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

const generateTicketHTML = () => {
  if (!saleData.value) return ''

  return `
    <div class="center">
      <div class="bold" style="font-size: 14px;">${companiesStore.currentCompany?.trade_name || companiesStore.currentCompany?.legal_name}</div>
      <div>RUC: ${companiesStore.currentCompany?.ruc}</div>
      <div style="font-size: 10px;">${companiesStore.currentCompany?.address || 'Dirección no configurada'}</div>
      <div class="dashed">
        <div class="bold">${saleData.value.doc_type === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA'}</div>
        <div class="bold">${saleData.value.series}-${String(saleData.value.number).padStart(8, '0')}</div>
      </div>
    </div>

    <div class="dashed">
      <div><strong>Cliente:</strong> ${selectedCustomerData.value?.fullname || 'Cliente General'}</div>
      ${selectedCustomerData.value?.doc_number ?
        `<div><strong>${selectedCustomerData.value?.doc_type === '6' ? 'RUC:' : 'DNI:'}</strong> ${selectedCustomerData.value.doc_number}</div>`
        : ''}
      <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</div>
    </div>

    <div class="dashed">
      ${cartItems.value.map(item => `
        <div class="item">
          <div class="bold">${item.product.product_name}</div>
          <div class="flex">
            <span>${item.quantity.toFixed(2)} ${getUnitName(item.selected_unit || item.product.unit_code)} x ${formatCurrency(item.unit_price)}</span>
            <span>${formatCurrency(item.total)}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="dashed">
      <div class="flex">
        <span>OP. GRAVADAS:</span>
        <span>${formatCurrency(cartSubtotal.value)}</span>
      </div>
      <div class="flex">
        <span>IGV (18%):</span>
        <span>${formatCurrency(cartIgv.value)}</span>
      </div>
      <div class="flex bold dashed">
        <span>TOTAL:</span>
        <span>${formatCurrency(cartTotal.value)}</span>
      </div>
    </div>

    <div class="center dashed" style="font-size: 10px;">
      <div>Gracias por su compra</div>
      <div style="margin-top: 10px;">${companiesStore.currentCompany?.website || ''}</div>
      <div>Vendedor: ${currentUser.value?.name}</div>
      <div style="margin-top: 5px;">** Representación Impresa **</div>
    </div>
  `
}

const saveSettings = () => {
  saveSettingsToStorage()
  // Also save to localStorage for the store functions
  if (posSettings.value.defaultWarehouseId) {
    localStorage.setItem('defaultWarehouseId', posSettings.value.defaultWarehouseId)
  }
  showSettingsDialog.value = false
  console.log('Settings saved:', posSettings.value)
}

const fetchWarehouses = async () => {
  if (!companiesStore.currentCompany?.id) return

  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id, code, name')
      .eq('company_id', companiesStore.currentCompany.id)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    availableWarehouses.value = data || []
  } catch (error) {
    console.error('Error fetching warehouses:', error)
  }
}

const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const handleImageError = (productId: string) => {
  failedImages.value.add(productId)
}

const isImageError = (productId: string) => {
  return failedImages.value.has(productId)
}

// Lifecycle
onMounted(async () => {
  // Load settings from localStorage first
  loadSettingsFromStorage()

  if (companiesStore.currentCompany) {
    // Load all necessary data for POS
    await Promise.all([
      // Load price lists
      salesStore.fetchPriceLists(companiesStore.currentCompany.id),
      // Load customers
      salesStore.fetchCustomers(companiesStore.currentCompany.id),
      // Load available series for documents
      fetchAvailableSeries(companiesStore.currentCompany.id),
      // Load SUNAT operation types
      fetchOperationTypes(),
      fetchOperationTypesV2(),
      // Load available units for conversions
      productConversions.fetchAvailableUnits(),
      // Load warehouses
      fetchWarehouses()
    ])

    // Then load products with selected price list
    await salesStore.fetchProducts(companiesStore.currentCompany.id, salesStore.selectedPriceList?.id)

    // Set default series if available and not already set
    if (availableBoletaSeries.value.length > 0 && !posSettings.value.boletaSeries) {
      posSettings.value.boletaSeries = availableBoletaSeries.value[0].series
    }
    if (availableFacturaSeries.value.length > 0 && !posSettings.value.facturaSeries) {
      posSettings.value.facturaSeries = availableFacturaSeries.value[0].series
    }

    // Save updated settings
    saveSettingsToStorage()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
