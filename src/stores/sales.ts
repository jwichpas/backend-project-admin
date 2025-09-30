import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { electronicInvoicingService } from '@/services/electronicInvoicing'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface SalesOrder {
  id: string
  company_id: string
  branch_id?: string
  customer_id: string
  order_date: string
  expected_delivery_date?: string
  currency_code: string
  exchange_rate?: number
  total_amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'CANCELLED'
  notes?: string
  created_at: string
  updated_at: string

  // Datos relacionados (joins)
  customer_name?: string
  branch_name?: string
}

export interface SalesOrderItem {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_pct: number
  total_line: number
  created_at: string

  // Datos relacionados
  product_name?: string
  product_sku?: string
  unit_description?: string
}

export interface SalesDoc {
  id: string
  company_id: string
  branch_id?: string
  customer_id: string
  doc_type: string
  series: string
  number: number
  issue_date: string
  currency_code: string
  exchange_rate?: number
  op_type_venta?: string
  op_type_kardex?: string
  igv_affectation: string
  total_ope_gravadas: number
  total_ope_gravadas_local: number
  total_ope_gravadas_usd: number
  total_ope_gravadas_clp: number
  total_ope_exoneradas: number
  total_ope_exoneradas_local: number
  total_ope_exoneradas_usd: number
  total_ope_exoneradas_clp: number
  total_ope_inafectas: number
  total_ope_inafectas_local: number
  total_ope_inafectas_usd: number
  total_ope_inafectas_clp: number
  total_igv: number
  total_igv_local: number
  total_igv_usd: number
  total_igv_clp: number
  total_isc: number
  total_descuentos: number
  total_otros_cargos: number
  total: number
  total_local?: number
  total_usd?: number
  total_clp?: number
  notes?: string
  greenter_xml?: ArrayBuffer
  greenter_cdr?: ArrayBuffer
  greenter_hash?: string
  greenter_ticket?: string
  greenter_status?: string
  error_message?: string
  observations?: string
  created_at: string
  updated_at: string

  // Datos relacionados
  customer_name?: string
  branch_name?: string
}

export interface SalesDocItem {
  id: string
  company_id: string
  sales_doc_id: string
  line_number: number
  product_id: string
  description?: string
  unit_code: string
  quantity: number
  unit_price: number
  unit_price_local: number
  unit_price_usd: number
  unit_price_clp: number
  discount_amount: number
  discount_pct: number
  type_price: string
  igv_affectation: string
  igv_amount: number
  igv_amount_local: number
  igv_amount_usd: number
  igv_amount_clp: number
  isc_amount: number
  total_line: number
  total_line_local: number
  total_line_usd: number
  total_line_clp: number
  created_at: string

  // Datos relacionados
  product_name?: string
  product_sku?: string
  unit_description?: string
}

export interface Shipment {
  id: string
  company_id: string
  warehouse_id: string
  sales_doc_id?: string
  sales_order_id?: string
  shipment_date: string
  status: 'PARTIAL' | 'COMPLETE' | 'RETURNED'
  vehicle_id?: string
  driver_id?: string
  notes?: string
  created_at: string
  updated_at: string

  // Datos relacionados
  warehouse_name?: string
  sales_doc_number?: string
  sales_order_number?: string
  vehicle_plate?: string
  driver_name?: string
}

export interface ShipmentItem {
  id: string
  shipment_id: string
  product_id: string
  quantity_shipped: number
  batch_number?: string
  serial_number?: string
  notes?: string
  created_at: string

  // Datos relacionados
  product_name?: string
  product_sku?: string
}

export interface DispatchOrder {
  id: string
  company_id: string
  warehouse_id: string
  planned_date: string
  actual_date?: string
  vehicle_id?: string
  driver_id?: string
  status: 'PENDING' | 'ASSIGNED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  created_at: string
  updated_at: string

  // Datos relacionados
  warehouse_name?: string
  vehicle_plate?: string
  driver_name?: string
  num_sales_docs?: number
  num_customers?: number
  total_items_quantity?: number
}

export interface Warehouse {
  id: string
  company_id: string
  branch_id?: string
  code: string
  name: string
  width: number
  height: number
  length: number
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  company_id: string
  plate: string
  brand?: string
  model?: string
  year?: number
  capacity_kg?: number
  own: boolean
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  company_id: string
  party_id: string
  user_id?: string | null
  license_number: string
  license_class?: string
  valid_until?: string
  created_at: string
  updated_at: string
  party?: {
    fullname: string
  }
}

export interface Customer {
  id: string
  company_id: string
  party_type: 'CUSTOMER'
  doc_type: string
  doc_number: string
  name: string
  email?: string
  phone?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  product_id: string
  sku: string
  barcode: string | null
  product_name: string
  description: string | null
  brand_id: string
  brand_name: string
  category_id: string
  category_name: string
  unit_code: string
  main_image: string | null
  location: string | null
  unit_price: number | null
  currency_code: string | null
  discount_value: number | null
  total_stock: number
  available_stock: number
  reserved_stock: number
  active: boolean
  metadata: any
}

export interface PriceList {
  id: string
  company_id: string
  name: string
  currency_code: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useSalesStore = defineStore('sales', {
  state: () => ({
    // Loading states
    loading: false,
    error: null as string | null,

    // Sales Orders
    salesOrders: [] as SalesOrder[],
    salesOrderItems: [] as SalesOrderItem[],
    selectedSalesOrder: null as SalesOrder | null,

    // Sales Documents
    salesDocs: [] as SalesDoc[],
    salesDocItems: [] as SalesDocItem[],
    selectedSalesDoc: null as SalesDoc | null,

    // Shipments
    shipments: [] as Shipment[],
    shipmentItems: [] as ShipmentItem[],
    selectedShipment: null as Shipment | null,

    // Dispatch Orders
    dispatchOrders: [] as DispatchOrder[],
    selectedDispatchOrder: null as DispatchOrder | null,

    // Customers
    customers: [] as Customer[],

    // Suppliers
    suppliers: [] as Customer[],

    // Products
    products: [] as Product[],

    // Price Lists
    priceLists: [] as PriceList[],
    selectedPriceList: null as PriceList | null,

    // Warehouses, Vehicles, Drivers
    warehouses: [] as Warehouse[],
    vehicles: [] as Vehicle[],
    drivers: [] as Driver[],

    // SUNAT Catalogs Cache
    documentTypes: {} as Record<string, string>,
    operationTypes: {} as Record<string, string>,
    priceTypes: {} as Record<string, string>,
    igvAffectations: {} as Record<string, string>
  }),

  getters: {
    // Sales Orders
    activeSalesOrders: (state) => state.salesOrders.filter(order =>
      order.status !== 'CANCELLED'
    ),

    pendingSalesOrders: (state) => state.salesOrders.filter(order =>
      order.status === 'PENDING' || order.status === 'APPROVED'
    ),

    // Sales Documents
    activeSalesDocs: (state) => state.salesDocs,

    // Shipments
    activeShipments: (state) => state.shipments,

    // Dispatch Orders
    activeDispatchOrders: (state) => state.dispatchOrders.filter(order =>
      order.status !== 'CANCELLED'
    ),

    // Customers
    activeCustomers: (state) => state.customers.filter(customer =>
      customer.is_active
    ),

    // Suppliers
    activeSuppliers: (state) => state.suppliers.filter(supplier =>
      supplier.is_active
    ),

    // Products
    activeProducts: (state) => state.products.filter(product =>
      product.active
    ),

    availableProducts: (state) => state.products.filter(product =>
      product.active && product.available_stock > 0
    ),

    // Price Lists
    activePriceLists: (state) => state.priceLists,

    defaultPriceList: (state) => state.priceLists.find(priceList =>
      priceList.is_default
    ) || null,

    // Warehouses, Vehicles, Drivers
    activeWarehouses: (state) => state.warehouses,
    activeVehicles: (state) => state.vehicles,
    activeDrivers: (state) => state.drivers,

    // Available Sales Docs (not assigned to dispatch orders)
    availableSalesDocs: (state) => state.salesDocs.filter(doc =>
      // You would need to track which sales_docs are assigned to dispatch orders
      // For now, return all active sales docs
      true
    )
  },

  actions: {
    // ========================================================================
    // SALES ORDERS
    // ========================================================================

    async fetchSalesOrders(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching sales orders for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('sales_orders')
          .select(`
            *,
            branches(name),
            parties!customer_id(fullname)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching sales orders:', error)
          throw error
        }

        console.log('Sales orders fetched:', data?.length || 0, 'records')
        this.salesOrders = data?.map(item => ({
          ...item,
          customer_name: item.parties?.fullname,
          branch_name: item.branches?.name
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching sales orders:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchSalesOrderItems(salesOrderId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('sales_order_items')
          .select(`
            *,
            products(name, sku, unit_code)
          `)
          .eq('sales_order_id', salesOrderId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Get measurement units for all items
        let measurementUnits = []
        if (data && data.length > 0) {
          const { data: unitsData, error: unitsError } = await supabase
            .rpc('get_sunat_measurement_units')

          if (!unitsError) {
            measurementUnits = unitsData || []
          }
        }

        this.salesOrderItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku,
          unit_description: measurementUnits.find(u => u.code === item.products?.unit_code)?.descripcion
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching sales order items:', error)
      } finally {
        this.loading = false
      }
    },

    async createSalesOrder(orderData: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from orderData
        const { items, ...salesOrderData } = orderData as any

        // Create the sales order first
        const { data: salesOrder, error: orderError } = await supabase
          .from('sales_orders')
          .insert(salesOrderData)
          .select()
          .single()

        if (orderError) throw orderError

        // Create sales order items if they exist
        if (items && items.length > 0 && salesOrder) {
          const orderItems = items.map((item: any) => ({
            sales_order_id: salesOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct || 0
          }))

          const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(orderItems)

          if (itemsError) throw itemsError
        }

        if (salesOrder) {
          this.salesOrders.unshift(salesOrder)
        }

        return salesOrder
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating sales order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSalesOrder(id: string, updateData: Partial<SalesOrder>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from updateData
        const { items, ...salesOrderData } = updateData as any

        // Update the sales order first
        const { data: updatedOrder, error: orderError } = await supabase
          .from('sales_orders')
          .update(salesOrderData)
          .eq('id', id)
          .select()
          .single()

        if (orderError) throw orderError

        // Update sales order items if provided
        if (items && items.length > 0) {
          // Delete existing items
          const { error: deleteError } = await supabase
            .from('sales_order_items')
            .delete()
            .eq('sales_order_id', id)

          if (deleteError) throw deleteError

          // Insert new items
          const orderItems = items.map((item: any) => ({
            sales_order_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct || 0
          }))

          const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(orderItems)

          if (itemsError) throw itemsError
        }

        // Update local state
        const index = this.salesOrders.findIndex(order => order.id === id)
        if (index !== -1 && updatedOrder) {
          this.salesOrders[index] = { ...this.salesOrders[index], ...updatedOrder }
        }

        return updatedOrder
      } catch (error: any) {
        this.error = error.message
        console.error('Error updating sales order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // SALES DOCUMENTS
    // ========================================================================

    async fetchSalesDocs(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching sales documents for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('sales_docs')
          .select(`
            *,
            branches(name),
            parties!customer_id(fullname, doc_type),
            sales_doc_items(
              *,
              products(name, sku, unit_code)
            )
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching sales docs:', error)
          throw error
        }

        console.log('Sales docs fetched:', data?.length || 0, 'records')
        this.salesDocs = data?.map(item => ({
          ...item,
          customer_name: item.parties?.fullname,
          branch_name: item.branches?.name,
          items: item.sales_doc_items?.map(docItem => ({
            id: docItem.id,
            product_id: docItem.product_id,
            product: {
              code: docItem.products?.sku || 'N/A',
              description: docItem.products?.name || docItem.description || 'N/A',
              unit_code: docItem.products?.unit_code || docItem.unit_code
            },
            description: docItem.description || docItem.products?.name,
            unit_code: docItem.unit_code,
            quantity: docItem.quantity,
            unit_price: docItem.unit_price,
            total_amount: docItem.total_line,
            total: docItem.total_line
          })) || []
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching sales docs:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchSalesDocItems(salesDocId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('sales_doc_items')
          .select(`
            *,
            products(name, sku)
          `)
          .eq('sales_doc_id', salesDocId)
          .order('line_number', { ascending: true })

        if (error) throw error

        this.salesDocItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching sales doc items:', error)
      } finally {
        this.loading = false
      }
    },

    async createSalesDoc(docData: Omit<SalesDoc, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from docData
        const { items, ...salesDocData } = docData as any

        // Get branch_id from localStorage
        const selectedBranchId = localStorage.getItem('selectedBranchId')
        if (selectedBranchId) {
          salesDocData.branch_id = selectedBranchId
        }

        // Create the sales document first
        const { data: salesDoc, error: docError } = await supabase
          .from('sales_docs')
          .insert(salesDocData)
          .select()
          .single()

        if (docError) throw docError

        // Create sales document items if they exist
        if (items && items.length > 0 && salesDoc) {
          const docItems = items.map((item: any, index: number) => {
            const exchangeRate = salesDocData.exchange_rate || 1
            const unitPrice = Number(item.unit_price) || 0
            const quantity = Number(item.quantity) || 0
            const discountPct = Number(item.discount_pct) || 0

            // Helper function to round to 6 decimal places to avoid precision issues
            const roundTo6 = (value: number): number => Math.round(value * 1000000) / 1000000

            // Calculate base values
            const unitPriceLocal = salesDocData.currency_code !== 'PEN'
              ? roundTo6(unitPrice * exchangeRate)
              : unitPrice

            const unitPriceUsd = salesDocData.currency_code === 'USD'
              ? unitPrice
              : roundTo6(unitPrice / exchangeRate)

            const unitPriceClp = salesDocData.currency_code === 'CLP' ? unitPrice : 0

            const discountAmount = roundTo6((quantity * unitPrice) * discountPct / 100)
            const totalLine = roundTo6((quantity * unitPrice) * (1 - discountPct / 100))
            const totalLineLocal = roundTo6(totalLine * exchangeRate)

            return {
              company_id: salesDocData.company_id,
              sales_doc_id: salesDoc.id,
              line_number: index + 1,
              product_id: item.product_id || item.id,
              description: item.description || item.product_name || null,
              unit_code: item.unit_code,
              quantity: quantity,
              unit_price: unitPrice,
              unit_price_local: unitPriceLocal,
              unit_price_usd: unitPriceUsd,
              unit_price_clp: unitPriceClp,
              discount_pct: discountPct,
              discount_amount: discountAmount,
              type_price: item.type_price || '01',
              igv_affectation: item.igv_affectation || '10',
              igv_amount: Number(item.igv_amount) || 0,
              igv_amount_local: Number(item.igv_amount_local) || 0,
              igv_amount_usd: Number(item.igv_amount_usd) || 0,
              igv_amount_clp: Number(item.igv_amount_clp) || 0,
              isc_amount: Number(item.isc_amount) || 0,
              total_line: totalLine,
              total_line_local: totalLineLocal,
              total_line_usd: salesDocData.currency_code === 'USD' ? totalLine : 0,
              total_line_clp: salesDocData.currency_code === 'CLP' ? totalLine : 0
            }
          })

          const { error: itemsError } = await supabase
            .from('sales_doc_items')
            .insert(docItems)

          if (itemsError) throw itemsError
        }

        if (salesDoc) {
          this.salesDocs.unshift(salesDoc)
        }

        return salesDoc
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating sales document:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createSalesDocWithElectronicInvoicing(
      docData: Omit<SalesDoc, 'id' | 'created_at' | 'updated_at'>,
      cartItems: any[],
      companyData: any,
      customerData: any
    ) {
      this.loading = true
      this.error = null
      try {
        // First create the sales document
        const salesDoc = await this.createSalesDoc(docData)

        // Generate electronic invoice
        try {
          const invoiceData = electronicInvoicingService.convertSalesDocToInvoice(
            salesDoc,
            cartItems,
            companyData,
            customerData
          )

          console.log('Sending invoice to electronic invoicing service:', invoiceData)

          // Send to external invoicing service
          const invoiceResponse = await electronicInvoicingService.sendInvoice(invoiceData)

          console.log('Invoice response received:', invoiceResponse)

          // Process and store the response (upload files and update database)
          await electronicInvoicingService.processAndStoreInvoiceResponse(
            salesDoc.id,
            invoiceResponse,
            invoiceData
          )

          console.log('Electronic invoice processed successfully')

          // Update local sales doc with electronic invoice status
          if (salesDoc && this.salesDocs.length > 0) {
            const docIndex = this.salesDocs.findIndex(doc => doc.id === salesDoc.id)
            if (docIndex >= 0) {
              this.salesDocs[docIndex] = {
                ...this.salesDocs[docIndex],
                greenter_hash: invoiceResponse.hash,
                greenter_status: invoiceResponse.sunatResponse.success ? 'ACCEPTED' : 'REJECTED',
                error_message: invoiceResponse.sunatResponse.cdrResponse.description
              }
            }
          }

        } catch (invoiceError) {
          console.error('Electronic invoicing failed:', invoiceError)

          // Update sales document with error status
          await supabase
            .from('sales_docs')
            .update({
              greenter_status: 'ERROR',
              error_message: `Error en facturación electrónica: ${invoiceError.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', salesDoc.id)

          // Don't throw the error here - the sales document was created successfully
          // Just log the invoice error for later retry
          console.warn('Sales document created but electronic invoicing failed. Document can be processed later.')
        }

        return salesDoc
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating sales document with electronic invoicing:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // SHIPMENTS
    // ========================================================================

    async fetchShipments(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching shipments for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select(`
            *,
            warehouses(name),
            sales_docs(series, number),
            vehicles(plate),
            drivers(party:parties!party_id(fullname))
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching shipments:', error)
          throw error
        }

        console.log('Shipments fetched:', data?.length || 0, 'records')
        this.shipments = data?.map(item => ({
          ...item,
          warehouse_name: item.warehouses?.name,
          sales_doc_number: item.sales_docs ? `${item.sales_docs.series}-${item.sales_docs.number}` : undefined,
          vehicle_plate: item.vehicles?.plate,
          driver_name: item.drivers?.party?.fullname
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching shipments:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchShipmentItems(shipmentId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('shipment_items')
          .select(`
            *,
            products(name, sku)
          `)
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: true })

        if (error) throw error

        this.shipmentItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching shipment items:', error)
      } finally {
        this.loading = false
      }
    },

    async createShipment(shipmentData: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from shipmentData
        const { items, ...shipmentCoreData } = shipmentData as any

        // Create the shipment first
        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments')
          .insert(shipmentCoreData)
          .select()
          .single()

        if (shipmentError) throw shipmentError

        // Create shipment items if they exist
        if (items && items.length > 0 && shipment) {
          const shipmentItems = items.map((item: any) => ({
            shipment_id: shipment.id,
            product_id: item.product_id,
            quantity_shipped: item.quantity_shipped,
            batch_number: item.batch_number || null,
            serial_number: item.serial_number || null,
            notes: item.notes || null
          }))

          const { error: itemsError } = await supabase
            .from('shipment_items')
            .insert(shipmentItems)

          if (itemsError) throw itemsError
        }

        if (shipment) {
          this.shipments.unshift(shipment)
        }

        return shipment
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating shipment:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateShipment(id: string, updateData: Partial<Shipment>) {
      this.loading = true
      this.error = null
      try {
        const { data: updatedShipment, error } = await supabase
          .from('shipments')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // Update local state
        const index = this.shipments.findIndex(shipment => shipment.id === id)
        if (index !== -1 && updatedShipment) {
          this.shipments[index] = { ...this.shipments[index], ...updatedShipment }
        }

        return updatedShipment
      } catch (error: any) {
        this.error = error.message
        console.error('Error updating shipment:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // DISPATCH ORDERS
    // ========================================================================

    async fetchDispatchOrders(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching dispatch orders for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('v_dispatch_orders_summary')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching dispatch orders:', error)
          throw error
        }

        console.log('Dispatch orders fetched:', data?.length || 0, 'records')
        this.dispatchOrders = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching dispatch orders:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // PRODUCTS
    // ========================================================================

    async fetchProducts(companyId: string, priceListId?: string) {
      this.loading = true
      this.error = null
      console.log('Fetching products for company:', companyId, 'with price list:', priceListId)
      try {
        const payload: any = {
          p_company_id: companyId
        }

        // Add price list ID if provided
        if (priceListId) {
          payload.p_price_list_id = priceListId
        }

        const { data, error } = await supabase
          .rpc('list_products_full', payload)

        if (error) {
          console.error('Supabase error fetching products:', error)
          throw error
        }

        console.log('Products fetched:', data?.length || 0, 'records')
        this.products = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching products:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // PRICE LISTS
    // ========================================================================

    async fetchPriceLists(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching price lists for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('price_lists')
          .select('*')
          .eq('company_id', companyId)
          .order('is_default', { ascending: false })
          .order('name', { ascending: true })

        if (error) {
          console.error('Supabase error fetching price lists:', error)
          throw error
        }

        console.log('Price lists fetched:', data?.length || 0, 'records')
        this.priceLists = data || []

        // Auto-select default price list if available
        if (!this.selectedPriceList && data && data.length > 0) {
          const defaultPriceList = data.find(pl => pl.is_default)
          this.selectedPriceList = defaultPriceList || data[0]
        }
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching price lists:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // CUSTOMERS
    // ========================================================================

    async fetchCustomers(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching customers for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('parties')
          .select('*, fullname')
          .eq('company_id', companyId)
          .eq('is_customer', true)
          .order('fullname', { ascending: true })

        if (error) {
          console.error('Supabase error fetching customers:', error)
          throw error
        }

        // Map data to match expected Customer interface
        this.customers = data?.map(item => ({
          id: item.id,
          company_id: item.company_id,
          party_type: 'CUSTOMER',
          doc_type: item.doc_type,
          doc_number: item.doc_number,
          name: item.fullname || item.razon_social,
          email: item.email,
          phone: item.phone,
          address: item.address,
          is_active: !item.deleted_at,
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || []

        console.log('Customers fetched:', this.customers.length, 'records')
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching customers:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchSuppliers(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching suppliers for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('parties')
          .select('*, fullname')
          .eq('company_id', companyId)
          .eq('is_supplier', true)
          .order('fullname', { ascending: true })

        if (error) {
          console.error('Supabase error fetching suppliers:', error)
          throw error
        }

        // Map data to match expected Supplier interface
        this.suppliers = data?.map(item => ({
          id: item.id,
          company_id: item.company_id,
          party_type: 'SUPPLIER',
          doc_type: item.doc_type,
          doc_number: item.doc_number,
          name: item.fullname || item.razon_social,
          fullname: item.fullname,
          razon_social: item.razon_social,
          email: item.email,
          phone: item.phone,
          address: item.address,
          is_active: !item.deleted_at,
          is_supplier: true,
          created_at: item.created_at,
          updated_at: item.updated_at
        })) || []

        console.log('Suppliers fetched:', this.suppliers.length, 'records')
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching suppliers:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // WAREHOUSES, VEHICLES, DRIVERS
    // ========================================================================

    async fetchWarehouses(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching warehouses for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('*')
          .eq('company_id', companyId)
          .order('name', { ascending: true })

        if (error) {
          console.error('Supabase error fetching warehouses:', error)
          throw error
        }

        console.log('Warehouses fetched:', data?.length || 0, 'records')
        this.warehouses = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching warehouses:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchVehicles(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching vehicles for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('company_id', companyId)
          .order('plate', { ascending: true })

        if (error) {
          console.error('Supabase error fetching vehicles:', error)
          throw error
        }

        console.log('Vehicles fetched:', data?.length || 0, 'records')
        this.vehicles = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching vehicles:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchDrivers(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching drivers for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select(`
            *,
            party:parties!party_id(fullname)
          `)
          .eq('company_id', companyId)
          .order('party(fullname)', { ascending: true })

        if (error) {
          console.error('Supabase error fetching drivers:', error)
          throw error
        }

        console.log('Drivers fetched:', data?.length || 0, 'records')
        this.drivers = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching drivers:', error)
      } finally {
        this.loading = false
      }
    },

    async createDispatchOrder(dispatchOrderData: Omit<DispatchOrder, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract sales docs from dispatchOrderData
        const { salesDocs, ...dispatchData } = dispatchOrderData as any

        // Create the dispatch order first
        const { data: dispatchOrder, error: dispatchError } = await supabase
          .from('dispatch_orders')
          .insert(dispatchData)
          .select()
          .single()

        if (dispatchError) throw dispatchError

        // Assign sales documents to the dispatch order
        if (salesDocs && salesDocs.length > 0 && dispatchOrder) {
          const dispatchSalesDocs = salesDocs.map((salesDocId: string) => ({
            dispatch_order_id: dispatchOrder.id,
            sales_doc_id: salesDocId
          }))

          const { error: salesDocsError } = await supabase
            .from('dispatch_order_sales_docs')
            .insert(dispatchSalesDocs)

          if (salesDocsError) throw salesDocsError
        }

        if (dispatchOrder) {
          this.dispatchOrders.unshift(dispatchOrder)
        }

        return dispatchOrder
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating dispatch order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateDispatchOrder(id: string, updateData: Partial<DispatchOrder>) {
      this.loading = true
      this.error = null
      try {
        const { data: updatedOrder, error } = await supabase
          .from('dispatch_orders')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // Update local state
        const index = this.dispatchOrders.findIndex(order => order.id === id)
        if (index !== -1 && updatedOrder) {
          this.dispatchOrders[index] = { ...this.dispatchOrders[index], ...updatedOrder }
        }

        return updatedOrder
      } catch (error: any) {
        this.error = error.message
        console.error('Error updating dispatch order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchDispatchOrderDetails(dispatchOrderId: string) {
      this.loading = true
      this.error = null
      try {
        // Get consolidated sales documents for this dispatch order
        const { data: salesDocs, error: salesDocsError } = await supabase
          .from('dispatch_order_sales_docs')
          .select(`
            sales_docs (
              id,
              series,
              number,
              issue_date,
              total,
              currency_code,
              customer_id,
              doc_type,
              parties!customer_id (
                id,
                fullname,
                doc_number,
                doc_type
              ),
              sales_doc_items (
                id,
                description,
                quantity,
                unit_code,
                product_id
              )
            )
          `)
          .eq('dispatch_order_id', dispatchOrderId)

        if (salesDocsError) throw salesDocsError

        // Get consolidated items using the view
        const { data: consolidatedItems, error: itemsError } = await supabase
          .from('v_dispatch_order_items_consolidated')
          .select('*')
          .eq('dispatch_order_id', dispatchOrderId)

        if (itemsError) throw itemsError

        // Get consolidated customer summary
        const { data: customerSummary, error: customerError } = await supabase
          .from('v_dispatch_order_sales_consolidated')
          .select('*')
          .eq('dispatch_order_id', dispatchOrderId)
          .single()

        if (customerError) throw customerError

        return {
          salesDocs: salesDocs?.map(item => ({
            ...item.sales_docs,
            customer: item.sales_docs.parties
          })) || [],
          consolidatedItems: consolidatedItems || [],
          customerSummary
        }
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching dispatch order details:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    async fetchDocumentTypes() {
      try {
        const { data, error } = await supabase
          .rpc('get_sunat_document_types')

        if (error) throw error

        // Return as a map for easy lookup
        return data?.reduce((map, item) => {
          map[item.code] = item.descripcion
          return map
        }, {} as Record<string, string>) || {}
      } catch (error) {
        console.error('Error fetching document types:', error)
        // Fallback to static mapping
        return {
          '01': 'FACTURA',
          '03': 'BOLETA DE VENTA',
          '07': 'NOTA DE CREDITO',
          '08': 'NOTA DE DEBITO'
        }
      }
    },

    async fetchOperationTypes() {
      try {
        const { data, error } = await supabase
          .from('sunat.cat_17_tipo_operacion')
          .select('*')
          .order('code', { ascending: true })

        if (error) throw error

        return data?.reduce((map, item) => {
          map[item.code] = item.descripcion
          return map
        }, {} as Record<string, string>) || {}
      } catch (error) {
        console.error('Error fetching operation types:', error)
        return {}
      }
    },

    // ========================================================================
    // SELECTORS
    // ========================================================================

    selectSalesOrder(salesOrder: SalesOrder) {
      this.selectedSalesOrder = salesOrder
    },

    selectSalesDoc(salesDoc: SalesDoc) {
      this.selectedSalesDoc = salesDoc
    },

    selectShipment(shipment: Shipment) {
      this.selectedShipment = shipment
    },

    selectDispatchOrder(dispatchOrder: DispatchOrder) {
      this.selectedDispatchOrder = dispatchOrder
    },

    selectPriceList(priceList: PriceList) {
      this.selectedPriceList = priceList
    },

    clearSelections() {
      this.selectedSalesOrder = null
      this.selectedSalesDoc = null
      this.selectedShipment = null
      this.selectedDispatchOrder = null
      this.selectedPriceList = null
    },

    // ========================================================================
    // GETTERS
    // ========================================================================

    getSalesOrderItems(salesOrderId: string) {
      return this.salesOrderItems.filter(item =>
        item.sales_order_id === salesOrderId
      )
    },

    getSalesDocItems(salesDocId: string) {
      return this.salesDocItems.filter(item =>
        item.sales_doc_id === salesDocId
      )
    },

    getShipmentItems(shipmentId: string) {
      return this.shipmentItems.filter(item =>
        item.shipment_id === shipmentId
      )
    },

    getPendingSalesOrders() {
      return this.salesOrders.filter(order =>
        order.status === 'APPROVED' || order.status === 'PENDING'
      )
    },

    // ========================================================================
    // FUNCIONES ESPECÍFICAS PARA PUNTO DE VENTA
    // ========================================================================

    async createQuickShipment(salesDocId: string, cartItems: any[], companyId: string) {
      this.loading = true
      this.error = null
      try {
        // Obtener el warehouse_id predeterminado (desde localStorage o configuración)
        const selectedBranchId = localStorage.getItem('selectedBranchId')
        let warehouseId = localStorage.getItem('defaultWarehouseId')

        // Si no hay warehouse seleccionado, obtener el primero disponible
        if (!warehouseId) {
          const { data: warehouses, error: warehouseError } = await supabase
            .from('warehouses')
            .select('id')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .limit(1)

          if (warehouseError) throw warehouseError
          if (!warehouses || warehouses.length === 0) {
            throw new Error('No se encontró un almacén activo para crear el envío')
          }

          warehouseId = warehouses[0].id
        }

        // Crear el shipment
        const shipmentData = {
          company_id: companyId,
          warehouse_id: warehouseId,
          sales_doc_id: salesDocId,
          shipment_date: new Date().toISOString().split('T')[0],
          status: 'COMPLETE',
          vehicle_id: null, // Sin vehículo para despacho rápido
          driver_id: null,  // Sin chofer para despacho rápido
          notes: 'Despacho rápido desde punto de venta'
        }

        const { data: shipment, error: shipmentError } = await supabase
          .from('shipments')
          .insert(shipmentData)
          .select()
          .single()

        if (shipmentError) throw shipmentError

        // Crear los shipment_items
        if (cartItems && cartItems.length > 0 && shipment) {
          const shipmentItems = cartItems.map((item: any) => ({
            shipment_id: shipment.id,
            product_id: item.product.product_id,
            quantity_shipped: item.base_quantity || item.quantity, // Usar cantidad base si está disponible
            batch_number: null,
            serial_number: null,
            notes: `Vendido en ${item.selected_unit || item.product.unit_code} - Cantidad original: ${item.quantity}`
          }))

          const { error: itemsError } = await supabase
            .from('shipment_items')
            .insert(shipmentItems)

          if (itemsError) throw itemsError
        }

        if (shipment) {
          this.shipments.unshift(shipment)
        }

        return shipment
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating quick shipment:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createDispatchOrderForSales(salesDocIds: string[], companyId: string, vehicleId?: string, driverId?: string) {
      this.loading = true
      this.error = null
      try {
        // Obtener el warehouse_id predeterminado
        const selectedBranchId = localStorage.getItem('selectedBranchId')
        let warehouseId = localStorage.getItem('defaultWarehouseId')

        // Si no hay warehouse seleccionado, obtener el primero disponible
        if (!warehouseId) {
          const { data: warehouses, error: warehouseError } = await supabase
            .from('warehouses')
            .select('id')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .limit(1)

          if (warehouseError) throw warehouseError
          if (!warehouses || warehouses.length === 0) {
            throw new Error('No se encontró un almacén activo para crear la orden de despacho')
          }

          warehouseId = warehouses[0].id
        }

        // Crear la dispatch order
        const dispatchOrderData = {
          company_id: companyId,
          warehouse_id: warehouseId,
          planned_date: new Date().toISOString().split('T')[0],
          vehicle_id: vehicleId || null,
          driver_id: driverId || null,
          status: 'PENDING',
          notes: 'Orden de despacho desde punto de venta'
        }

        const { data: dispatchOrder, error: dispatchError } = await supabase
          .from('dispatch_orders')
          .insert(dispatchOrderData)
          .select()
          .single()

        if (dispatchError) throw dispatchError

        // Asociar los sales_docs a la dispatch order
        if (salesDocIds && salesDocIds.length > 0 && dispatchOrder) {
          const salesDocsAssignments = salesDocIds.map((salesDocId: string) => ({
            dispatch_order_id: dispatchOrder.id,
            sales_doc_id: salesDocId
          }))

          const { error: assignmentError } = await supabase
            .from('dispatch_order_sales_docs')
            .insert(salesDocsAssignments)

          if (assignmentError) throw assignmentError
        }

        if (dispatchOrder) {
          this.dispatchOrders.unshift(dispatchOrder)
        }

        return dispatchOrder
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating dispatch order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSaleStatus(saleId: string, status: string) {
      this.loading = true
      this.error = null
      try {
        // Actualizar solo el status del sales_doc en la base de datos
        const updateData = {
          status: status.toUpperCase(),
          updated_at: new Date().toISOString()
        }

        const { data: updatedDoc, error } = await supabase
          .from('sales_docs')
          .update(updateData)
          .eq('id', saleId)
          .select()
          .single()

        if (error) throw error

        // Actualizar el estado local si existe
        const index = this.salesDocs.findIndex(doc => doc.id === saleId)
        if (index !== -1 && updatedDoc) {
          this.salesDocs[index] = { ...this.salesDocs[index], ...updatedDoc }
        }

        return updatedDoc
      } catch (error: any) {
        this.error = error.message
        console.error('Error updating sale status:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
