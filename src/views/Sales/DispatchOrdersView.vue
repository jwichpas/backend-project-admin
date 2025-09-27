<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">Órdenes de Despacho</h2>
        <p class="text-muted-foreground">
          Consolida documentos de venta para despacho en lotes
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportDispatchOrders">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateDispatchDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Orden de Despacho
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Órdenes</p>
              <p class="text-2xl font-bold">{{ salesStore.activeDispatchOrders.length }}</p>
            </div>
            <Package class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Pendientes</p>
              <p class="text-2xl font-bold text-orange-600">{{ pendingCount }}</p>
            </div>
            <Clock class="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Despachadas</p>
              <p class="text-2xl font-bold text-green-600">{{ dispatchedCount }}</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Este Mes</p>
              <p class="text-2xl font-bold">{{ currentMonthCount }}</p>
            </div>
            <Calendar class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Dispatch Orders Table -->
    <Card>
      <CardContent class="p-0">
        <div class="p-6 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Órdenes de Despacho</h3>
            <div class="flex items-center gap-2">
              <select 
                v-model="statusFilter" 
                class="px-3 py-1 text-sm border border-border rounded-md"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="ASSIGNED">Asignado</option>
                <option value="DISPATCHED">Despachado</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted border-b border-border">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Orden
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Almacén
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha Planeada
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vehículo
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Conductor
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Documentos
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Clientes
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-if="filteredDispatchOrders.length === 0">
                <td colspan="9" class="px-4 py-8 text-center text-muted-foreground">
                  <div class="flex flex-col items-center gap-2">
                    <Package class="h-8 w-8 text-muted-foreground" />
                    <span>No hay órdenes de despacho</span>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="order in filteredDispatchOrders" 
                :key="order.id"
                class="hover:bg-muted/50 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="font-medium text-sm">
                    #{{ order.id.slice(-8).toUpperCase() }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ formatDate(order.created_at) }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">{{ order.warehouse_name || 'N/A' }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">{{ formatDate(order.planned_date) }}</div>
                  <div v-if="order.actual_date" class="text-xs text-muted-foreground">
                    Real: {{ formatDate(order.actual_date) }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">
                    {{ order.vehicle_plate || 'Sin asignar' }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">
                    {{ order.driver_name || 'Sin asignar' }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm font-medium">
                    {{ order.num_sales_docs || 0 }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    documentos
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm font-medium">
                    {{ order.num_customers || 0 }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    clientes
                  </div>
                </td>
                <td class="px-4 py-3">
                  <Badge :variant="getStatusVariant(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline" @click="viewOrder(order)">
                      Ver
                    </Button>
                    <Button 
                      v-if="order.status === 'PENDING'" 
                      size="sm" 
                      variant="outline"
                      @click="assignVehicleDriver(order)"
                    >
                      Asignar
                    </Button>
                    <Button 
                      v-if="order.status === 'ASSIGNED'" 
                      size="sm" 
                      @click="dispatchOrder(order)"
                    >
                      Despachar
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Create Dispatch Order Dialog -->
    <Dialog v-model:open="showCreateDispatchDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Despacho</DialogTitle>
          <DialogDescription>
            Consolida documentos de venta para despacho en lotes
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="submitDispatchOrder" class="space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Warehouse -->
            <div class="space-y-2">
              <label for="warehouse" class="text-sm font-medium">Almacén *</label>
              <select
                id="warehouse"
                v-model="formData.warehouse_id"
                required
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar almacén</option>
                <option
                  v-for="warehouse in salesStore.activeWarehouses"
                  :key="warehouse.id"
                  :value="warehouse.id"
                >
                  {{ warehouse.code }} - {{ warehouse.name }}
                </option>
              </select>
            </div>

            <!-- Planned Date -->
            <div class="space-y-2">
              <label for="planned_date" class="text-sm font-medium">Fecha Planeada *</label>
              <input
                id="planned_date"
                v-model="formData.planned_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- Vehicle -->
            <div class="space-y-2">
              <label for="vehicle" class="text-sm font-medium">Vehículo</label>
              <select
                id="vehicle"
                v-model="formData.vehicle_id"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar vehículo</option>
                <option
                  v-for="vehicle in salesStore.activeVehicles"
                  :key="vehicle.id"
                  :value="vehicle.id"
                >
                  {{ vehicle.plate }} - {{ vehicle.brand }} {{ vehicle.model }}
                </option>
              </select>
            </div>

            <!-- Driver -->
            <div class="space-y-2">
              <label for="driver" class="text-sm font-medium">Conductor</label>
              <select
                id="driver"
                v-model="formData.driver_id"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar conductor</option>
                <option
                  v-for="driver in salesStore.activeDrivers"
                  :key="driver.id"
                  :value="driver.id"
                >
                  {{ driver.nombre_completo }} - {{ driver.license_number }}
                </option>
              </select>
            </div>
          </div>

          <!-- Sales Documents Selection -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium">Documentos de Venta</h3>
              <div class="text-sm text-muted-foreground">
                {{ selectedSalesDocsCount }} seleccionados
              </div>
            </div>
            
            <div class="border border-border rounded-lg max-h-60 overflow-y-auto">
              <div class="p-3 border-b border-border bg-muted">
                <div class="flex items-center space-x-2">
                  <input
                    id="select-all"
                    type="checkbox"
                    :checked="allSalesDocsSelected"
                    @change="toggleAllSalesDocs"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <label for="select-all" class="text-sm font-medium">
                    Seleccionar todos
                  </label>
                </div>
              </div>
              <div class="divide-y divide-border">
                <div
                  v-for="salesDoc in salesStore.availableSalesDocs"
                  :key="salesDoc.id"
                  class="p-3 flex items-center space-x-3"
                >
                  <input
                    :id="`sales-doc-${salesDoc.id}`"
                    type="checkbox"
                    :value="salesDoc.id"
                    v-model="formData.selectedSalesDocs"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">
                      {{ salesDoc.series }}-{{ salesDoc.number }}
                    </div>
                    <div class="text-sm text-muted-foreground truncate">
                      {{ salesDoc.customer_name }}
                    </div>
                  </div>
                  <div class="text-sm font-medium">
                    S/ {{ salesDoc.total.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <label for="notes" class="text-sm font-medium">Notas</label>
            <textarea
              id="notes"
              v-model="formData.notes"
              rows="3"
              placeholder="Observaciones o instrucciones especiales"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" @click="showCreateDispatchDialog = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="submitting">
              {{ submitting ? 'Creando...' : 'Crear Orden de Despacho' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- View Order Dialog -->
    <Dialog v-model:open="showViewDialog">
      <DialogContent class="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div class="flex items-center justify-between">
            <div>
              <DialogTitle>Orden de Despacho #{{ selectedOrder?.id?.slice(-8).toUpperCase() }}</DialogTitle>
              <DialogDescription>
                {{ selectedOrder?.warehouse_name }} - {{ formatDate(selectedOrder?.planned_date) }}
              </DialogDescription>
            </div>
            <div class="flex items-center gap-3">
              <Badge :variant="getStatusVariant(selectedOrder?.status)">
                {{ getStatusLabel(selectedOrder?.status) }}
              </Badge>
              <Button variant="outline" size="sm" @click="exportToPDF" :disabled="loadingDetails">
                <FileText class="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div v-if="selectedOrder && !loadingDetails" class="space-y-6">
          <!-- Header Info -->
          <Card>
            <CardContent class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="space-y-1">
                  <div class="text-xs font-medium text-muted-foreground">ALMACÉN</div>
                  <div class="font-medium">{{ selectedOrder.warehouse_name }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-xs font-medium text-muted-foreground">VEHÍCULO</div>
                  <div class="font-medium">{{ selectedOrder.vehicle_plate || 'Sin asignar' }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-xs font-medium text-muted-foreground">CONDUCTOR</div>
                  <div class="font-medium">{{ selectedOrder.driver_name || 'Sin asignar' }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-xs font-medium text-muted-foreground">FECHA REAL</div>
                  <div class="font-medium">{{ selectedOrder.actual_date ? formatDate(selectedOrder.actual_date) : 'Pendiente' }}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent class="p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ selectedOrder.num_sales_docs || 0 }}</div>
                <div class="text-sm text-muted-foreground">Documentos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ selectedOrder.num_customers || 0 }}</div>
                <div class="text-sm text-muted-foreground">Clientes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4 text-center">
                <div class="text-2xl font-bold text-purple-600">{{ orderDetails?.consolidatedItems?.length || 0 }}</div>
                <div class="text-sm text-muted-foreground">Productos Únicos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4 text-center">
                <div class="text-2xl font-bold text-orange-600">{{ getTotalQuantity() }}</div>
                <div class="text-sm text-muted-foreground">Items Totales</div>
              </CardContent>
            </Card>
          </div>

          <!-- Tabs -->
          <Card>
            <CardContent class="p-0">
              <!-- Tab Navigation -->
              <nav class="flex space-x-8 border-b border-border px-6 pt-4" aria-label="Tabs">
                <button
                  v-for="tab in detailTabs"
                  :key="tab.id"
                  @click="activeDetailTab = tab.id"
                  :class="[
                    'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                    activeDetailTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  ]"
                >
                  <component :is="tab.icon" class="mr-2 h-4 w-4 inline" />
                  {{ tab.name }}
                  <Badge 
                    v-if="tab.count !== undefined" 
                    :variant="activeDetailTab === tab.id ? 'default' : 'secondary'"
                    class="ml-2"
                  >
                    {{ tab.count }}
                  </Badge>
                </button>
              </nav>

              <!-- Tab Content -->
              <div class="p-6">
                <!-- Documents Tab -->
                <div v-if="activeDetailTab === 'documents'" class="space-y-4">
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-muted/50">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Documento</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <tr v-for="doc in orderDetails?.salesDocs" :key="doc.id" class="hover:bg-muted/25">
                          <td class="px-4 py-3">
                            <div class="font-medium">{{ doc.series }}-{{ doc.number }}</div>
                            <div class="text-xs text-muted-foreground">{{ doc.id.slice(-8).toUpperCase() }}</div>
                          </td>
                          <td class="px-4 py-3">
                            <div class="font-medium">{{ doc.customer?.fullname }}</div>
                            <div class="text-xs text-muted-foreground">{{ doc.customer?.doc_type }} {{ doc.customer?.doc_number }}</div>
                          </td>
                          <td class="px-4 py-3">
                            <div class="text-sm">{{ formatDate(doc.issue_date) }}</div>
                          </td>
                          <td class="px-4 py-3 text-right">
                            <div class="font-medium">{{ doc.currency_code }} {{ doc.total.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Customers Tab -->
                <div v-if="activeDetailTab === 'customers'" class="space-y-4">
                  <div class="grid gap-4">
                    <Card v-for="customer in uniqueCustomers" :key="customer.id" class="border-l-4 border-l-blue-500">
                      <CardContent class="p-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <h4 class="font-semibold">{{ customer.fullname }}</h4>
                            <p class="text-sm text-muted-foreground">{{ customer.doc_type }} {{ customer.doc_number }}</p>
                          </div>
                          <div class="text-right">
                            <div class="text-sm font-medium">{{ customer.documents.length }} documento(s)</div>
                            <div class="text-xs text-muted-foreground">Total: {{ customer.currency_code }} {{ customer.total.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</div>
                          </div>
                        </div>
                        <div class="mt-2">
                          <div class="text-xs text-muted-foreground">Documentos:</div>
                          <div class="flex flex-wrap gap-1 mt-1">
                            <Badge v-for="doc in customer.documents" :key="doc" variant="outline" class="text-xs">
                              {{ doc }}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <!-- Products Tab -->
                <div v-if="activeDetailTab === 'products'" class="space-y-4">
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-muted/50">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Producto</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Cantidad</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Unidad</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Documentos</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Clientes</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Monto Total</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <tr v-for="item in orderDetails?.consolidatedItems" :key="item.product_id" class="hover:bg-muted/25">
                          <td class="px-4 py-3">
                            <div class="font-medium">{{ item.product_name }}</div>
                            <div class="text-xs text-muted-foreground">SKU: {{ item.sku }}</div>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <div class="font-bold text-lg">{{ item.total_quantity }}</div>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <Badge variant="outline">{{ item.unit_code }}</Badge>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <Badge>{{ item.num_sales_docs }}</Badge>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <Badge variant="secondary">{{ item.num_customers }}</Badge>
                          </td>
                          <td class="px-4 py-3 text-right">
                            <div class="font-medium">S/ {{ item.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Notes -->
          <Card v-if="selectedOrder.notes">
            <CardContent class="p-4">
              <h4 class="font-medium mb-2">Notas y Observaciones</h4>
              <p class="text-sm text-muted-foreground">{{ selectedOrder.notes }}</p>
            </CardContent>
          </Card>

          <!-- Actions -->
          <div class="flex justify-between items-center pt-4">
            <div class="text-sm text-muted-foreground">
              Creado el {{ formatDate(selectedOrder.created_at) }}
            </div>
            <div class="flex gap-3">
              <Button variant="outline" @click="showViewDialog = false">
                Cerrar
              </Button>
              <Button 
                v-if="selectedOrder.status === 'PENDING'" 
                variant="outline"
                @click="openAssignDialog(selectedOrder)"
              >
                Asignar Vehículo/Conductor
              </Button>
              <Button 
                v-if="selectedOrder.status === 'ASSIGNED'" 
                @click="dispatchOrder(selectedOrder)"
              >
                Despachar Orden
              </Button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="loadingDetails" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-sm text-muted-foreground">Cargando detalles...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Assign Vehicle/Driver Dialog -->
    <Dialog v-model:open="showAssignDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Vehículo y Conductor</DialogTitle>
          <DialogDescription>
            Orden #{{ selectedOrder?.id?.slice(-8).toUpperCase() }}
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="submitAssignment" class="space-y-4">
          <!-- Vehicle -->
          <div class="space-y-2">
            <label for="assign-vehicle" class="text-sm font-medium">Vehículo</label>
            <select
              id="assign-vehicle"
              v-model="assignmentForm.vehicle_id"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar vehículo</option>
              <option
                v-for="vehicle in salesStore.activeVehicles"
                :key="vehicle.id"
                :value="vehicle.id"
              >
                {{ vehicle.plate }} - {{ vehicle.brand }} {{ vehicle.model }}
              </option>
            </select>
          </div>

          <!-- Driver -->
          <div class="space-y-2">
            <label for="assign-driver" class="text-sm font-medium">Conductor</label>
            <select
              id="assign-driver"
              v-model="assignmentForm.driver_id"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar conductor</option>
              <option
                v-for="driver in salesStore.activeDrivers"
                :key="driver.id"
                :value="driver.id"
              >
                {{ driver.nombre_completo }} - {{ driver.license_number }}
              </option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" @click="showAssignDialog = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="assignmentSubmitting">
              {{ assignmentSubmitting ? 'Asignando...' : 'Asignar' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import { useDespatchGuidesStore } from '@/stores/despatchGuides'
import {
  Download,
  Plus,
  Package,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Users,
  ShoppingCart
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const despatchGuidesStore = useDespatchGuidesStore()

// State
const showCreateDispatchDialog = ref(false)
const showViewDialog = ref(false)
const showAssignDialog = ref(false)
const submitting = ref(false)
const assignmentSubmitting = ref(false)
const loadingDetails = ref(false)
const statusFilter = ref('')
const selectedOrder = ref<any>(null)
const orderDetails = ref<any>(null)
const activeDetailTab = ref('documents')

// Form Data
const formData = ref({
  warehouse_id: '',
  planned_date: new Date().toISOString().split('T')[0],
  vehicle_id: '',
  driver_id: '',
  notes: '',
  selectedSalesDocs: [] as string[]
})

const assignmentForm = ref({
  vehicle_id: '',
  driver_id: ''
})

// Computed
const pendingCount = computed(() => {
  return salesStore.activeDispatchOrders.filter(d => d.status === 'PENDING' || d.status === 'ASSIGNED').length
})

const dispatchedCount = computed(() => {
  return salesStore.activeDispatchOrders.filter(d => d.status === 'DISPATCHED' || d.status === 'COMPLETED').length
})

const currentMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return salesStore.activeDispatchOrders.filter(order => {
    const orderDate = new Date(order.planned_date)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  }).length
})

const selectedSalesDocsCount = computed(() => {
  return formData.value.selectedSalesDocs.length
})

const allSalesDocsSelected = computed(() => {
  return salesStore.availableSalesDocs.length > 0 && 
         formData.value.selectedSalesDocs.length === salesStore.availableSalesDocs.length
})

const filteredDispatchOrders = computed(() => {
  if (!statusFilter.value) {
    return salesStore.activeDispatchOrders
  }
  return salesStore.activeDispatchOrders.filter(order => order.status === statusFilter.value)
})

const detailTabs = computed(() => [
  {
    id: 'documents',
    name: 'Documentos',
    icon: FileText,
    count: orderDetails.value?.salesDocs?.length || 0
  },
  {
    id: 'customers',
    name: 'Clientes',
    icon: Users,
    count: uniqueCustomers.value?.length || 0
  },
  {
    id: 'products',
    name: 'Productos',
    icon: ShoppingCart,
    count: orderDetails.value?.consolidatedItems?.length || 0
  }
])

const uniqueCustomers = computed(() => {
  if (!orderDetails.value?.salesDocs) return []
  
  const customerMap = new Map()
  
  orderDetails.value.salesDocs.forEach((doc: any) => {
    if (doc.customer) {
      const customerId = doc.customer.id
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          fullname: doc.customer.fullname,
          doc_type: doc.customer.doc_type,
          doc_number: doc.customer.doc_number,
          documents: [],
          total: 0,
          currency_code: doc.currency_code
        })
      }
      
      const customer = customerMap.get(customerId)
      customer.documents.push(`${doc.series}-${doc.number}`)
      customer.total += doc.total
    }
  })
  
  return Array.from(customerMap.values())
})

// Methods
const exportDispatchOrders = () => {
  console.log('Export dispatch orders')
}

const toggleAllSalesDocs = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    formData.value.selectedSalesDocs = salesStore.availableSalesDocs.map(doc => doc.id)
  } else {
    formData.value.selectedSalesDocs = []
  }
}

const resetForm = () => {
  formData.value = {
    warehouse_id: '',
    planned_date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    driver_id: '',
    notes: '',
    selectedSalesDocs: []
  }
}

const submitDispatchOrder = async () => {
  if (!companiesStore.currentCompany) return
  if (formData.value.selectedSalesDocs.length === 0) {
    alert('Debe seleccionar al menos un documento de venta')
    return
  }

  submitting.value = true
  
  try {
    const dispatchOrderData = {
      company_id: companiesStore.currentCompany.id,
      warehouse_id: formData.value.warehouse_id,
      planned_date: formData.value.planned_date,
      vehicle_id: formData.value.vehicle_id || null,
      driver_id: formData.value.driver_id || null,
      notes: formData.value.notes || null,
      status: 'PENDING' as const,
      salesDocs: formData.value.selectedSalesDocs
    }
    
    await salesStore.createDispatchOrder(dispatchOrderData)
    
    showCreateDispatchDialog.value = false
    resetForm()
    
    // TODO: Show success message
    console.log('Dispatch order created successfully!')
    
  } catch (error) {
    console.error('Error creating dispatch order:', error)
    // TODO: Show error message
  } finally {
    submitting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusLabel = (status: string) => {
  const labels = {
    'PENDING': 'Pendiente',
    'ASSIGNED': 'Asignado', 
    'DISPATCHED': 'Despachado',
    'COMPLETED': 'Completado',
    'CANCELLED': 'Cancelado'
  }
  return labels[status as keyof typeof labels] || status
}

const getStatusVariant = (status: string) => {
  const variants = {
    'PENDING': 'secondary',
    'ASSIGNED': 'outline',
    'DISPATCHED': 'default',
    'COMPLETED': 'default',
    'CANCELLED': 'destructive'
  }
  return variants[status as keyof typeof variants] || 'secondary'
}

const getTotalQuantity = () => {
  if (!orderDetails.value?.consolidatedItems) return 0
  return orderDetails.value.consolidatedItems.reduce((sum: number, item: any) => sum + item.total_quantity, 0)
}

const viewOrder = async (order: any) => {
  selectedOrder.value = order
  orderDetails.value = null
  loadingDetails.value = true
  showViewDialog.value = true
  activeDetailTab.value = 'documents'
  
  try {
    orderDetails.value = await salesStore.fetchDispatchOrderDetails(order.id)
  } catch (error) {
    console.error('Error loading order details:', error)
    // Keep dialog open but show error state
  } finally {
    loadingDetails.value = false
  }
}

const exportToPDF = async () => {
  if (!selectedOrder.value || !orderDetails.value) return

  try {
    // Prepare data for Laravel backend
    const salesDocs = orderDetails.value?.salesDocs || []

    // Debug: Log the raw data to see what we're working with
    console.log('🔍 Raw salesDocs data:', salesDocs)

    const pdfData = {
      id: selectedOrder.value.id,
      status: selectedOrder.value.status,
      planned_date: selectedOrder.value.planned_date,
      actual_date: selectedOrder.value.actual_date,
      warehouse_name: selectedOrder.value.warehouse_name,
      vehicle_plate: selectedOrder.value.vehicle_plate,
      driver_name: selectedOrder.value.driver_name,
      summary: {
        total_documents: salesDocs.length,
        total_items: salesDocs.reduce((total, doc) => total + ((doc.items || doc.sales_doc_items || []).length), 0),
        total_amount: salesDocs.reduce((total, doc) => total + (doc.total_amount || 0), 0)
      },
      documents: salesDocs.map((doc, index) => {
        console.log(`📄 Document ${index}:`, doc) // Debug individual documents
        return {
          id: String(doc.id || `doc-${index}`),
          series: String(doc.series || 'F001'),
          number: String(doc.number || '00000001'),
          issue_date: String(doc.issue_date || new Date().toISOString().split('T')[0]),
          doc_type: String(doc.doc_type || doc.document_type || '03'), // Try both fields with default
          total_amount: Number(doc.total_amount || 0),
          customer_name: String(doc.customer_name || doc.customer_business_name || doc.parties?.business_name || doc.parties?.fullname || 'Cliente no especificado'),
          items: (doc.items || doc.sales_doc_items || []).map((item, itemIndex) => ({
            description: String(item.description || `Item ${itemIndex + 1}`),
            quantity: Number(item.quantity || 1),
            unit_code: String(item.unit_code || 'NIU'),
            product_id: item.product_id ? String(item.product_id) : null
          }))
        }
      })
    }

    // Debug: Log the final data being sent to Laravel
    console.log('📤 PDF Data being sent to Laravel:', pdfData)

    // Get authentication token from despatchGuides store
    const despatchGuidesStore = useDespatchGuidesStore()
    const token = await despatchGuidesStore.getValidToken()

    // Call Laravel backend to generate PDF
    const response = await fetch(`${import.meta.env.VITE_FACTURACION_URL}/api/dispatch-orders/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      },
      body: JSON.stringify(pdfData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error generando PDF')
    }

    // Download the PDF
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orden-despacho-${selectedOrder.value.id.slice(-8).toUpperCase()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('✅ PDF generado exitosamente')

  } catch (error) {
    console.error('❌ Error exportando PDF:', error)
    alert('Error generando PDF: ' + error.message)
  }
}

const createPrintableContent = () => {
  const order = selectedOrder.value
  const details = orderDetails.value
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orden de Despacho ${order.id.slice(-8).toUpperCase()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .total { font-weight: bold; }
        .badge { background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ORDEN DE DESPACHO</h1>
        <h2>#${order.id.slice(-8).toUpperCase()}</h2>
        <p>Fecha: ${formatDate(order.planned_date)} | Estado: ${getStatusLabel(order.status)}</p>
      </div>
      
      <div class="info-grid">
        <div>
          <h3>Información General</h3>
          <p><strong>Almacén:</strong> ${order.warehouse_name}</p>
          <p><strong>Fecha Planeada:</strong> ${formatDate(order.planned_date)}</p>
          ${order.actual_date ? `<p><strong>Fecha Real:</strong> ${formatDate(order.actual_date)}</p>` : ''}
        </div>
        <div>
          <h3>Asignación</h3>
          <p><strong>Vehículo:</strong> ${order.vehicle_plate || 'Sin asignar'}</p>
          <p><strong>Conductor:</strong> ${order.driver_name || 'Sin asignar'}</p>
        </div>
      </div>
      
      <div class="section">
        <h3>Resumen</h3>
        <div class="info-grid">
          <p><strong>Documentos:</strong> ${details.salesDocs?.length || 0}</p>
          <p><strong>Clientes:</strong> ${uniqueCustomers.value?.length || 0}</p>
          <p><strong>Productos Únicos:</strong> ${details.consolidatedItems?.length || 0}</p>
          <p><strong>Items Totales:</strong> ${getTotalQuantity()}</p>
        </div>
      </div>
      
      <div class="section">
        <h3>Documentos de Venta</h3>
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${details.salesDocs?.map((doc: any) => `
              <tr>
                <td>${doc.series}-${doc.number}</td>
                <td>${doc.customer?.fullname}</td>
                <td>${formatDate(doc.issue_date)}</td>
                <td>${doc.currency_code} ${doc.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>Productos Consolidados</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Documentos</th>
              <th>Clientes</th>
              <th>Monto Total</th>
            </tr>
          </thead>
          <tbody>
            ${details.consolidatedItems?.map((item: any) => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.sku}</td>
                <td class="total">${item.total_quantity}</td>
                <td>${item.unit_code}</td>
                <td>${item.num_sales_docs}</td>
                <td>${item.num_customers}</td>
                <td>S/ ${item.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>
      
      ${order.notes ? `
        <div class="section">
          <h3>Notas y Observaciones</h3>
          <p>${order.notes}</p>
        </div>
      ` : ''}
      
      <div class="section" style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        <p>Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}</p>
      </div>
    </body>
    </html>
  `
}

const assignVehicleDriver = (order: any) => {
  selectedOrder.value = order
  assignmentForm.value = {
    vehicle_id: order.vehicle_id || '',
    driver_id: order.driver_id || ''
  }
  showAssignDialog.value = true
}

const openAssignDialog = (order: any) => {
  showViewDialog.value = false
  assignVehicleDriver(order)
}

const submitAssignment = async () => {
  if (!selectedOrder.value) return

  assignmentSubmitting.value = true
  
  try {
    // Update dispatch order with vehicle and driver assignment
    await salesStore.updateDispatchOrder(selectedOrder.value.id, {
      vehicle_id: assignmentForm.value.vehicle_id || null,
      driver_id: assignmentForm.value.driver_id || null,
      status: 'ASSIGNED'
    })

    // Update the local order data
    const orderIndex = salesStore.dispatchOrders.findIndex(o => o.id === selectedOrder.value.id)
    if (orderIndex !== -1) {
      const updatedOrder = { 
        ...salesStore.dispatchOrders[orderIndex], 
        vehicle_id: assignmentForm.value.vehicle_id,
        driver_id: assignmentForm.value.driver_id,
        status: 'ASSIGNED'
      }
      salesStore.dispatchOrders[orderIndex] = updatedOrder
    }

    showAssignDialog.value = false
    
    // TODO: Show success message
    console.log('Vehicle and driver assigned successfully!')
    
  } catch (error) {
    console.error('Error assigning vehicle/driver:', error)
    // TODO: Show error message
  } finally {
    assignmentSubmitting.value = false
  }
}

const dispatchOrder = async (order: any) => {
  try {
    console.log(`🚚 Iniciando despacho de orden: ${order.id}`)

    // 1. Generar guías de remisión automáticamente para todos los documentos
    console.log('📋 Generando guías de remisión...')
    const dispatchResult = await despatchGuidesStore.createDespatchGuidesFromDispatchOrder(order.id)

    if (!dispatchResult.success) {
      console.error('❌ Error generando guías:', dispatchResult.errors)
      alert(`Error generando guías de remisión:\n${dispatchResult.errors.map(e => `- ${e.sales_doc_number}: ${e.error}`).join('\n')}`)
      return
    }

    // 2. Actualizar estado de la orden de despacho a DISPATCHED
    console.log('📦 Actualizando estado de la orden...')
    await salesStore.updateDispatchOrder(order.id, {
      status: 'DISPATCHED',
      actual_date: new Date().toISOString().split('T')[0]
    })

    // 3. Actualizar datos locales
    const orderIndex = salesStore.dispatchOrders.findIndex(o => o.id === order.id)
    if (orderIndex !== -1) {
      const updatedOrder = {
        ...salesStore.dispatchOrders[orderIndex],
        status: 'DISPATCHED',
        actual_date: new Date().toISOString().split('T')[0]
      }
      salesStore.dispatchOrders[orderIndex] = updatedOrder
    }

    // 4. Cerrar dialog si está abierto
    if (showViewDialog.value) {
      showViewDialog.value = false
    }

    // 5. Mostrar resumen de éxito
    console.log('✅ Despacho completado exitosamente!')
    console.log(`📊 Resumen:`)
    console.log(`   - Total documentos procesados: ${dispatchResult.total_processed}`)
    console.log(`   - Guías generadas exitosamente: ${dispatchResult.successful}`)
    console.log(`   - Errores: ${dispatchResult.failed}`)

    alert(`🎉 ¡Despacho completado exitosamente!\n\n📊 Resumen:\n• ${dispatchResult.successful} guías de remisión generadas\n• ${dispatchResult.total_processed} documentos procesados\n• Orden actualizada a estado DISPATCHED`)

  } catch (error) {
    console.error('❌ Error durante el despacho:', error)
    alert(`Error durante el proceso de despacho:\n${error.message}`)
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize companies if not already loaded
  if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0) {
    try {
      const userId = localStorage.getItem('userId')
      if (userId) {
        await companiesStore.fetchUserCompanies(userId)
      }
    } catch (error) {
      console.error('Error fetching user companies:', error)
    }
  }
  
  if (companiesStore.currentCompany) {
    await Promise.all([
      salesStore.fetchDispatchOrders(companiesStore.currentCompany.id),
      salesStore.fetchWarehouses(companiesStore.currentCompany.id),
      salesStore.fetchVehicles(companiesStore.currentCompany.id),
      salesStore.fetchDrivers(companiesStore.currentCompany.id),
      salesStore.fetchSalesDocs(companiesStore.currentCompany.id)
    ])
  }
})

// Watchers
watch(
  () => companiesStore.currentCompany,
  async (newCompany) => {
    if (newCompany) {
      await Promise.all([
        salesStore.fetchDispatchOrders(newCompany.id),
        salesStore.fetchWarehouses(newCompany.id),
        salesStore.fetchVehicles(newCompany.id),
        salesStore.fetchDrivers(newCompany.id),
        salesStore.fetchSalesDocs(newCompany.id)
      ])
    }
  }
)
</script>