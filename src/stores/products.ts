import { defineStore } from 'pinia'

export interface Product {
  id: string
  company_id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  brand_id?: string
  category_id?: string
  unit_code: string
  tipo_afectacion: string
  weight_kg?: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Related data
  brand?: Brand
  category?: Category
}

export interface Brand {
  id: string
  company_id: string
  name: string
  code: string
  is_active: boolean
}

export interface Category {
  id: string
  company_id: string
  name: string
  code: string
  parent_id?: string
  level: number
  is_active: boolean
}

export interface WarehouseStock {
  id: string
  warehouse_id: string
  product_id: string
  balance_qty: number
  reserved_qty: number
  available_qty: number
  last_cost: number
  average_cost: number
  
  // Related data
  warehouse?: Warehouse
  product?: Product
}

export interface Warehouse {
  id: string
  company_id: string
  branch_id: string
  code: string
  name: string
  address: string
  width?: number
  height?: number
  length?: number
  is_active: boolean
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [] as Product[],
    brands: [] as Brand[],
    categories: [] as Category[],
    warehouses: [] as Warehouse[],
    warehouseStock: [] as WarehouseStock[],
    loading: false,
    selectedProduct: null as Product | null
  }),

  getters: {
    activeProducts: (state) => state.products.filter(p => p.is_active),
    activeBrands: (state) => state.brands.filter(b => b.is_active),
    activeCategories: (state) => state.categories.filter(c => c.is_active),
    activeWarehouses: (state) => state.warehouses.filter(w => w.is_active),
    
    getProductStock: (state) => (productId: string, warehouseId?: string) => {
      let stock = state.warehouseStock.filter(s => s.product_id === productId)
      if (warehouseId) {
        stock = stock.filter(s => s.warehouse_id === warehouseId)
      }
      return stock
    }
  },

  actions: {
    async fetchProducts(companyId: string) {
      this.loading = true
      try {
        // Mock data based on seed.sql
        this.products = [
          {
            id: '1',
            company_id: companyId,
            sku: 'LECHE-GLORIA-1L',
            barcode: '7751850006017',
            name: 'Leche Gloria Entera 1L',
            description: 'Leche entera en caja 1L',
            brand_id: '1',
            category_id: '1',
            unit_code: 'LTR',
            tipo_afectacion: '10',
            weight_kg: 1.03,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            company_id: companyId,
            sku: 'ACEITE-PRIMOR-1L',
            barcode: '7750245000014',
            name: 'Aceite Primor 1L',
            description: 'Aceite vegetal Primor 1L',
            brand_id: '2',
            category_id: '2',
            unit_code: 'LTR',
            tipo_afectacion: '10',
            weight_kg: 0.92,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      } finally {
        this.loading = false
      }
    },

    async fetchBrands(companyId: string) {
      this.loading = true
      try {
        this.brands = [
          { id: '1', company_id: companyId, name: 'Gloria', code: 'GLORIA', is_active: true },
          { id: '2', company_id: companyId, name: 'Alicorp', code: 'ALICORP', is_active: true },
          { id: '3', company_id: companyId, name: 'Nestlé', code: 'NESTLE', is_active: true },
          { id: '4', company_id: companyId, name: 'Backus', code: 'BACKUS', is_active: true },
          { id: '5', company_id: companyId, name: 'Laive', code: 'LAIVE', is_active: true }
        ]
      } finally {
        this.loading = false
      }
    },

    async fetchCategories(companyId: string) {
      this.loading = true
      try {
        this.categories = [
          { id: '1', company_id: companyId, name: 'Lácteos', code: 'LACTEOS', level: 1, is_active: true },
          { id: '2', company_id: companyId, name: 'Abarrotes', code: 'ABARROTES', level: 1, is_active: true },
          { id: '3', company_id: companyId, name: 'Bebidas', code: 'BEBIDAS', level: 1, is_active: true },
          { id: '4', company_id: companyId, name: 'Limpieza', code: 'LIMPIEZA', level: 1, is_active: true }
        ]
      } finally {
        this.loading = false
      }
    },

    async fetchWarehouses(companyId: string) {
      this.loading = true
      try {
        this.warehouses = [
          {
            id: '1',
            company_id: companyId,
            branch_id: '1',
            code: 'ALM001',
            name: 'Almacén Principal',
            address: 'Av. Arequipa 123, Lima',
            width: 20,
            height: 5,
            length: 30,
            is_active: true
          },
          {
            id: '2',
            company_id: companyId,
            branch_id: '2',
            code: 'ALM002',
            name: 'Almacén Ate',
            address: 'Av. Nicolás Ayllón 2345, Ate',
            width: 15,
            height: 4,
            length: 25,
            is_active: false
          }
        ]
      } finally {
        this.loading = false
      }
    },

    async fetchWarehouseStock(warehouseId?: string) {
      this.loading = true
      try {
        this.warehouseStock = [
          {
            id: '1',
            warehouse_id: '1',
            product_id: '1',
            balance_qty: 100,
            reserved_qty: 0,
            available_qty: 100,
            last_cost: 12.50,
            average_cost: 12.50
          },
          {
            id: '2',
            warehouse_id: '1',
            product_id: '2',
            balance_qty: 75,
            reserved_qty: 5,
            available_qty: 70,
            last_cost: 8.50,
            average_cost: 8.50
          }
        ]
      } finally {
        this.loading = false
      }
    },

    selectProduct(product: Product) {
      this.selectedProduct = product
    }
  }
})