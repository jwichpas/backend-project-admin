import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

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
            products(name, sku, unit_code),
            sunat_cat_03_unidades_medida:unit_code(descripcion)
          `)
          .eq('sales_order_id', salesOrderId)
          .order('created_at', { ascending: true })

        if (error) throw error
        
        this.salesOrderItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku,
          unit_description: item.sunat_cat_03_unidades_medida?.descripcion
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
            parties!customer_id(fullname)
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
          branch_name: item.branches?.name
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
        
        // Create the sales document first
        const { data: salesDoc, error: docError } = await supabase
          .from('sales_docs')
          .insert(salesDocData)
          .select()
          .single()

        if (docError) throw docError
        
        // Create sales document items if they exist
        if (items && items.length > 0 && salesDoc) {
          const docItems = items.map((item: any, index: number) => ({
            company_id: salesDocData.company_id,
            sales_doc_id: salesDoc.id,
            line_number: index + 1,
            product_id: item.product_id,
            description: item.description || null,
            unit_code: item.unit_code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit_price_local: salesDocData.currency_code !== 'PEN' ? item.unit_price * (salesDocData.exchange_rate || 1) : item.unit_price,
            discount_pct: item.discount_pct || 0,
            discount_amount: (item.quantity * item.unit_price) * (item.discount_pct || 0) / 100,
            type_price: item.type_price || '01',
            igv_affectation: item.igv_affectation || '10',
            igv_amount: item.igv_amount || 0,
            igv_amount_local: item.igv_amount_local || 0,
            total_line: (item.quantity * item.unit_price) * (1 - (item.discount_pct || 0) / 100),
            total_line_local: ((item.quantity * item.unit_price) * (1 - (item.discount_pct || 0) / 100)) * (salesDocData.exchange_rate || 1)
          }))

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
            drivers(nombre_completo)
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
          driver_name: item.drivers?.nombre_completo
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

    clearSelections() {
      this.selectedSalesOrder = null
      this.selectedSalesDoc = null
      this.selectedShipment = null
      this.selectedDispatchOrder = null
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
    }
  }
})