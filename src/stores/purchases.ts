import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface PurchaseOrder {
  id: string
  company_id: string
  branch_id?: string
  supplier_id: string
  order_date: string
  expected_delivery_date?: string
  currency_code: string
  exchange_rate?: number
  total_amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'CANCELLED'
  notes?: string
  created_at: string
  updated_at: string
  
  // Datos relacionados (joins)
  supplier_name?: string
  branch_name?: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  description?: string
  unit_code: string
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

export interface PurchaseDoc {
  id: string
  company_id: string
  supplier_id: string
  doc_type: string
  series: string
  number: string
  issue_date: string
  arrival_date?: string
  currency_code: string
  exchange_rate?: number
  op_type_kardex?: string
  total_ope_gravadas: number
  total_ope_gravadas_local: number
  total_ope_gravadas_usd: number
  total_ope_gravadas_clp: number
  total_ope_exoneradas: number
  total_ope_exoneradas_local: number
  total_ope_exoneradas_usd: number
  total_ope_exoneradas_clp: number
  total_ope_inafectas: number
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Datos relacionados
  supplier_name?: string
  doc_type_description?: string
}

export interface PurchaseDocItem {
  id: string
  company_id: string
  purchase_doc_id: string
  product_id: string
  description?: string
  unit_code: string
  quantity: number
  unit_cost: number
  unit_cost_local?: number
  unit_cost_usd?: number
  unit_cost_clp?: number
  additional_cost: number
  additional_cost_local?: number
  additional_cost_usd?: number
  additional_cost_clp?: number
  original_unit_cost: number
  original_unit_cost_local: number
  original_unit_cost_usd: number
  original_unit_cost_clp: number
  discount_pct: number
  type_price: string
  igv_affectation: string
  created_at: string
  
  // Datos relacionados
  product_name?: string
  product_sku?: string
  unit_description?: string
}

export interface Reception {
  id: string
  company_id: string
  warehouse_id: string
  purchase_doc_id?: string
  purchase_order_id?: string
  reception_date: string
  status: 'PARTIAL' | 'COMPLETE' | 'REJECTED'
  notes?: string
  created_at: string
  updated_at: string
  
  // Datos relacionados
  warehouse_name?: string
  purchase_doc_number?: string
  purchase_order_number?: string
}

export interface ReceptionItem {
  id: string
  reception_id: string
  product_id: string
  quantity_received: number
  unit_cost: number
  batch_number?: string
  serial_number?: string
  notes?: string
  created_at: string
  
  // Datos relacionados
  product_name?: string
  product_sku?: string
}

export interface AdditionalCostType {
  code: string
  description: string
}

export interface PurchaseAdditionalCost {
  id: string
  purchase_doc_id: string
  cost_type: string
  proration_method: 'VALUE' | 'QUANTITY' | 'WEIGHT'
  description?: string
  amount: number
  currency_code: string
  exchange_rate: number
  amount_local: number
  affects_inventory: boolean
  created_at: string
  updated_at: string
  
  // Datos relacionados
  cost_type_description?: string
}

export interface Supplier {
  id: string
  company_id: string
  party_type: string
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
// STORE DE COMPRAS
// ============================================================================

export const usePurchasesStore = defineStore('purchases', {
  state: () => ({
    // Estados de datos
    purchaseOrders: [] as PurchaseOrder[],
    purchaseOrderItems: [] as PurchaseOrderItem[],
    purchaseDocs: [] as PurchaseDoc[],
    purchaseDocItems: [] as PurchaseDocItem[],
    receptions: [] as Reception[],
    receptionItems: [] as ReceptionItem[],
    additionalCosts: [] as PurchaseAdditionalCost[],
    additionalCostTypes: [] as AdditionalCostType[],
    suppliers: [] as Supplier[],
    measurementUnits: {} as Record<string, string>, // Cache for unit descriptions
    
    // Estados de UI
    loading: false,
    error: null as string | null,
    selectedPurchaseOrder: null as PurchaseOrder | null,
    selectedPurchaseDoc: null as PurchaseDoc | null,
    selectedReception: null as Reception | null,
  }),

  getters: {
    // Purchase Orders
    activePurchaseOrders: (state) => 
      state.purchaseOrders.filter(po => po.status !== 'CANCELLED'),
    
    pendingPurchaseOrders: (state) => 
      state.purchaseOrders.filter(po => po.status === 'PENDING'),
    
    approvedPurchaseOrders: (state) => 
      state.purchaseOrders.filter(po => po.status === 'APPROVED'),
    
    // Purchase Docs
    activePurchaseDocs: (state) => 
      state.purchaseDocs.filter(doc => !doc.deleted_at),
    
    // Receptions
    activeReceptions: (state) => 
      state.receptions.filter(r => r.status !== 'REJECTED'),
    
    // Suppliers
    activeSuppliers: (state) => 
      state.suppliers.filter(s => s.is_active),
    
    // Measurement Units
    getMeasurementUnits: (state) => state.measurementUnits,

    // Helpers
    getPurchaseOrderItems: (state) => (purchaseOrderId: string) =>
      state.purchaseOrderItems.filter(item => item.purchase_order_id === purchaseOrderId),
    
    getPurchaseDocItems: (state) => (purchaseDocId: string) =>
      state.purchaseDocItems.filter(item => item.purchase_doc_id === purchaseDocId),
    
    getReceptionItems: (state) => (receptionId: string) =>
      state.receptionItems.filter(item => item.reception_id === receptionId),
    
    getAdditionalCosts: (state) => (purchaseDocId: string) =>
      state.additionalCosts.filter(cost => cost.purchase_doc_id === purchaseDocId),
  },

  actions: {
    // ========================================================================
    // PURCHASE ORDERS
    // ========================================================================
    
    async fetchPurchaseOrders(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching purchase orders for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            parties!supplier_id(fullname, razon_social),
            branches(name)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching purchase orders:', error)
          throw error
        }
        
        console.log('Purchase orders fetched:', data?.length || 0, 'records')
        this.purchaseOrders = data?.map(item => ({
          ...item,
          supplier_name: item.parties?.fullname || item.parties?.razon_social,
          branch_name: item.branches?.name
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching purchase orders:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchPurchaseOrderItems(purchaseOrderId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching purchase order items for order:', purchaseOrderId)
      try {
        const { data, error } = await supabase
          .from('purchase_order_items')
          .select(`
            *,
            products(name, sku)
          `)
          .eq('purchase_order_id', purchaseOrderId)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Supabase error fetching purchase order items:', error)
          throw error
        }
        
        console.log('Purchase order items fetched:', data?.length || 0, 'records')
        
        // Get unique unit codes to fetch descriptions
        const unitCodes = [...new Set(data?.map(item => item.unit_code).filter(Boolean))]
        const unitDescriptions = await this.fetchUnitDescriptions(unitCodes)
        
        this.purchaseOrderItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku,
          unit_description: unitDescriptions[item.unit_code] || item.unit_code
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching purchase order items:', error)
      } finally {
        this.loading = false
      }
    },

    async createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from orderData
        const { items, ...purchaseOrderData } = orderData as any
        
        // Create the purchase order first
        const { data: purchaseOrder, error: orderError } = await supabase
          .from('purchase_orders')
          .insert(purchaseOrderData)
          .select()
          .single()

        if (orderError) throw orderError
        
        // Create purchase order items if they exist
        if (items && items.length > 0 && purchaseOrder) {
          const orderItems = items.map((item: any) => ({
            purchase_order_id: purchaseOrder.id,
            product_id: item.product_id,
            description: item.description || null,
            unit_code: item.unit_code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct || 0
          }))

          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(orderItems)

          if (itemsError) throw itemsError
        }
        
        if (purchaseOrder) {
          this.purchaseOrders.unshift(purchaseOrder)
        }
        
        return purchaseOrder
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating purchase order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        
        if (data) {
          const index = this.purchaseOrders.findIndex(po => po.id === id)
          if (index !== -1) {
            this.purchaseOrders[index] = { ...this.purchaseOrders[index], ...data }
          }
        }
        
        return data
      } catch (error: any) {
        this.error = error.message
        console.error('Error updating purchase order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async addPurchaseOrderItem(item: Omit<PurchaseOrderItem, 'id' | 'created_at' | 'total_line'>) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('purchase_order_items')
          .insert(item)
          .select()
          .single()

        if (error) throw error
        
        if (data) {
          this.purchaseOrderItems.push(data)
        }
        
        return data
      } catch (error: any) {
        this.error = error.message
        console.error('Error adding purchase order item:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // PURCHASE DOCS
    // ========================================================================
    
    async fetchPurchaseDocs(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching purchase docs for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('purchase_docs')
          .select(`
            *,
            parties!supplier_id(fullname, razon_social)
          `)
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching purchase docs:', error)
          throw error
        }
        
        console.log('Purchase docs fetched:', data?.length || 0, 'records')
        
        // Get document type descriptions
        const docTypes = await this.fetchDocumentTypes()
        
        this.purchaseDocs = data?.map(item => ({
          ...item,
          supplier_name: item.parties?.fullname || item.parties?.razon_social,
          doc_type_description: docTypes[item.doc_type] || item.doc_type
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching purchase docs:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchPurchaseDocItems(purchaseDocId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching purchase doc items for doc:', purchaseDocId)
      try {
        const { data, error } = await supabase
          .from('purchase_doc_items')
          .select(`
            *,
            products(name, sku)
          `)
          .eq('purchase_doc_id', purchaseDocId)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Supabase error fetching purchase doc items:', error)
          throw error
        }
        
        console.log('Purchase doc items fetched:', data?.length || 0, 'records')
        
        // Get unique unit codes to fetch descriptions
        const unitCodes = [...new Set(data?.map(item => item.unit_code).filter(Boolean))]
        const unitDescriptions = await this.fetchUnitDescriptions(unitCodes)
        
        this.purchaseDocItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku,
          unit_description: unitDescriptions[item.unit_code] || item.unit_code
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching purchase doc items:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // RECEPTIONS
    // ========================================================================
    
    async fetchReceptions(companyId: string) {
      this.loading = true
      this.error = null
      console.log('Fetching receptions for company:', companyId)
      try {
        const { data, error } = await supabase
          .from('receptions')
          .select(`
            *,
            warehouses(name),
            purchase_docs(series, number),
            purchase_orders(id)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error fetching receptions:', error)
          throw error
        }
        
        console.log('Receptions fetched:', data?.length || 0, 'records')
        this.receptions = data?.map(item => ({
          ...item,
          warehouse_name: item.warehouses?.name,
          purchase_doc_number: item.purchase_docs ? `${item.purchase_docs.series}-${item.purchase_docs.number}` : undefined,
          purchase_order_number: item.purchase_orders?.id
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching receptions:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchReceptionItems(receptionId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('reception_items')
          .select(`
            *,
            products(name, sku)
          `)
          .eq('reception_id', receptionId)
          .order('created_at', { ascending: true })

        if (error) throw error
        
        this.receptionItems = data?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_sku: item.products?.sku
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching reception items:', error)
      } finally {
        this.loading = false
      }
    },

    async createReception(receptionData: Omit<Reception, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from receptionData
        const { items, ...receptionCoreData } = receptionData as any
        
        // Create the reception first
        const { data: reception, error: receptionError } = await supabase
          .from('receptions')
          .insert(receptionCoreData)
          .select()
          .single()

        if (receptionError) throw receptionError
        
        // Create reception items if they exist
        if (items && items.length > 0 && reception) {
          const receptionItems = items.map((item: any) => ({
            reception_id: reception.id,
            product_id: item.product_id,
            quantity_received: item.quantity_received,
            unit_cost: item.unit_cost,
            batch_number: item.batch_number || null,
            serial_number: item.serial_number || null,
            notes: item.notes || null
          }))

          const { error: itemsError } = await supabase
            .from('reception_items')
            .insert(receptionItems)

          if (itemsError) throw itemsError
        }
        
        if (reception) {
          this.receptions.unshift(reception)
        }
        
        return reception
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating reception:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // ADDITIONAL COSTS
    // ========================================================================
    
    async fetchAdditionalCostTypes() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('cat_additional_costs')
          .select('*')
          .order('description', { ascending: true })

        if (error) throw error
        this.additionalCostTypes = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching additional cost types:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchAdditionalCosts(purchaseDocId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('purchase_additional_costs')
          .select(`
            *,
            cat_additional_costs(description)
          `)
          .eq('purchase_doc_id', purchaseDocId)
          .order('created_at', { ascending: true })

        if (error) throw error
        
        this.additionalCosts = data?.map(item => ({
          ...item,
          cost_type_description: item.cat_additional_costs?.description
        })) || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching additional costs:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // SUPPLIERS
    // ========================================================================
    
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
          email: item.email,
          phone: item.phone,
          address: item.address,
          is_active: !item.deleted_at,
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
    // HELPER FUNCTIONS
    // ========================================================================
    
    async fetchMeasurementUnits() {
      try {
        const { data, error } = await supabase
          .rpc('get_sunat_measurement_units')
        
        if (error) throw error
        
        // Store in cache
        this.measurementUnits = data?.reduce((map, item) => {
          map[item.code] = item.descripcion
          return map
        }, {} as Record<string, string>) || {}
        
        console.log('Measurement units loaded:', Object.keys(this.measurementUnits).length, 'units')
        return this.measurementUnits
      } catch (error) {
        console.error('Error fetching measurement units:', error)
        return {}
      }
    },

    async fetchUnitDescriptions(unitCodes?: string[]) {
      // Use cached data if available, otherwise fetch
      if (Object.keys(this.measurementUnits).length === 0) {
        await this.fetchMeasurementUnits()
      }
      
      // If specific codes requested, filter; otherwise return all
      if (unitCodes && unitCodes.length > 0) {
        const filteredUnits: Record<string, string> = {}
        unitCodes.forEach(code => {
          if (this.measurementUnits[code]) {
            filteredUnits[code] = this.measurementUnits[code]
          }
        })
        return filteredUnits
      }
      
      return this.measurementUnits
    },

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
          '08': 'NOTA DE DEBITO',
          '09': 'GUIA DE REMISION REMITENTE',
          '20': 'COMPROBANTE DE RETENCION'
        }
      }
    },

    // ========================================================================
    // SELECTORS
    // ========================================================================
    
    selectPurchaseOrder(purchaseOrder: PurchaseOrder) {
      this.selectedPurchaseOrder = purchaseOrder
    },

    selectPurchaseDoc(purchaseDoc: PurchaseDoc) {
      this.selectedPurchaseDoc = purchaseDoc
    },

    selectReception(reception: Reception) {
      this.selectedReception = reception
    },

    clearSelections() {
      this.selectedPurchaseOrder = null
      this.selectedPurchaseDoc = null
      this.selectedReception = null
    },

    // ========================================================================
    // GETTERS
    // ========================================================================
    
    getPurchaseOrderItems(purchaseOrderId: string) {
      return this.purchaseOrderItems.filter(item => 
        item.purchase_order_id === purchaseOrderId
      )
    },

    getPendingPurchaseOrders() {
      return this.purchaseOrders.filter(order => 
        order.status === 'APPROVED' || order.status === 'PENDING'
      )
    },

    async createPurchaseDoc(docData: Omit<PurchaseDoc, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        // Extract items from docData
        const { items, ...purchaseDocData } = docData as any
        
        // Create the purchase document first
        const { data: purchaseDoc, error: docError } = await supabase
          .from('purchase_docs')
          .insert(purchaseDocData)
          .select()
          .single()

        if (docError) throw docError
        
        // Create purchase document items if they exist
        if (items && items.length > 0 && purchaseDoc) {
          const docItems = items.map((item: any) => ({
            company_id: purchaseDocData.company_id,
            purchase_doc_id: purchaseDoc.id,
            product_id: item.product_id,
            description: item.description || null,
            unit_code: item.unit_code,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            unit_cost_local: purchaseDocData.currency_code !== 'PEN' ? item.unit_cost * (purchaseDocData.exchange_rate || 1) : item.unit_cost,
            discount_pct: item.discount_pct || 0,
            igv_affectation: item.igv_affectation || '10',
            total_line: (item.quantity * item.unit_cost) * (1 - (item.discount_pct || 0) / 100)
          }))

          const { error: itemsError } = await supabase
            .from('purchase_doc_items')
            .insert(docItems)

          if (itemsError) throw itemsError
        }
        
        if (purchaseDoc) {
          this.purchaseDocs.unshift(purchaseDoc)
          
          // If this document was created from a purchase order, update the order status
          if ((docData as any).purchase_order_id) {
            await this.updatePurchaseOrder((docData as any).purchase_order_id, { status: 'RECEIVED' })
          }
        }
        
        return purchaseDoc
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating purchase document:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})