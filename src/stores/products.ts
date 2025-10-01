import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export interface Product {
  id: string
  company_id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  brand_id: string
  category_id: string
  unit_code: string
  tipo_afectacion: string
  width?: number
  height?: number
  length?: number
  weight_kg?: number
  volume_m3?: number
  is_serialized: boolean
  is_batch_controlled: boolean
  min_stock?: number
  max_stock?: number
  reorder_point?: number
  active: boolean
  tags?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string

  // Related data from list_products_full function
  brand_name?: string
  category_name?: string
  main_image?: string
  location?: string
  unit_price?: number
  currency_code?: string
  discount_value?: number
}

export interface ProductFull {
  product_id: string
  sku: string
  barcode?: string
  product_name: string
  description?: string
  brand_id?: string
  brand_name?: string
  category_id?: string
  category_name?: string
  unit_code: string
  main_image?: string
  location?: string
  unit_price?: number
  currency_code?: string
  discount_value?: number
  total_stock?: number
  available_stock?: number
  reserved_stock?: number
  active?: boolean
  metadata?: Record<string, any>
}

export interface Brand {
  id: string
  company_id: string
  name: string
  code?: string
  active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Category {
  id: string
  company_id: string
  parent_id?: string
  name: string
  code?: string
  active: boolean
  level: number
  created_at: string
  updated_at: string
  deleted_at?: string
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

export interface PriceListItem {
  id: string
  company_id: string
  price_list_id: string
  product_id: string
  unit_price: number
  valid_from: string
  valid_to?: string
}

export interface ProductLocation {
  id: string
  product_id: string
  warehouse_zone_id?: string
  position_x?: number
  position_y?: number
  position_z?: number
  capacity_max?: number
  stock_actual: number
  es_principal: boolean
  estado: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseZone {
  id: string
  company_id: string
  warehouse_id: string
  code: string
  name?: string
  width?: number
  height?: number
  length?: number
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  product_id: string
  product_name: string
  product_sku: string
  warehouse_id: string
  warehouse_name: string
  balance_qty: number
  reserved_qty: number
  available_qty: number
  average_cost: number
  original_currency?: string
  min_stock?: number
  max_stock?: number
  main_image?: string
}

export interface Warehouse {
  id: string
  company_id: string
  branch_id?: string
  code: string
  name: string
  address?: string
  width?: number
  height?: number
  length?: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [] as Product[],
    productsFull: [] as ProductFull[],
    brands: [] as Brand[],
    categories: [] as Category[],
    warehouses: [] as Warehouse[],
    warehouseZones: [] as WarehouseZone[],
    priceLists: [] as PriceList[],
    priceListItems: [] as PriceListItem[],
    productLocations: [] as ProductLocation[],
    inventoryItems: [] as InventoryItem[],
    loading: false,
    error: null as string | null,
    selectedProduct: null as Product | null,
    selectedPriceList: null as PriceList | null
  }),

  getters: {
    activeProducts: (state) => state.products.filter(p => p.active),
    activeBrands: (state) => state.brands.filter(b => b.active),
    activeCategories: (state) => state.categories.filter(c => c.active),
    activeWarehouses: (state) => state.warehouses.filter(w => w.is_active),
    defaultPriceList: (state) => state.priceLists.find(pl => pl.is_default),

    getProductStock: (state) => (productId: string, warehouseId?: string) => {
      let inventory = state.inventoryItems.filter(i => i.product_id === productId)
      if (warehouseId) {
        inventory = inventory.filter(i => i.warehouse_id === warehouseId)
      }
      return inventory
    },

    getProductPrice: (state) => (productId: string, priceListId?: string) => {
      const targetPriceListId = priceListId || state.defaultPriceList?.id
      if (!targetPriceListId) return null

      return state.priceListItems.find(item =>
        item.product_id === productId &&
        item.price_list_id === targetPriceListId &&
        (!item.valid_to || new Date(item.valid_to) >= new Date())
      )
    },

    getProductLocations: (state) => (productId: string) => {
      return state.productLocations.filter(loc => loc.product_id === productId)
    }
  },

  actions: {
    async fetchProducts(companyId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            brands(name),
            categories(name)
          `)
          .eq('company_id', companyId)
          .eq('active', true)
          .order('name')

        if (error) throw error
        this.products = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching products:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchProductsFull(companyId: string, priceListId?: string, categoryId?: string, brandId?: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.rpc('list_products_full', {
          p_company_id: companyId,
          p_price_list_id: priceListId || null,
          p_category_id: categoryId || null,
          p_brand_id: brandId || null
        })

        if (error) throw error

        // Convert storage paths to public URLs for main_image
        const productsWithImages = (data || []).map((product: ProductFull) => {
          if (product.main_image) {
            const { data: urlData } = supabase.storage
              .from('inventario')
              .getPublicUrl(product.main_image)
            return {
              ...product,
              main_image: urlData.publicUrl
            }
          }
          return product
        })

        this.productsFull = productsWithImages
        console.log('Products full fetched:', productsWithImages?.length || 0)
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching products full:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchBrands(companyId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('company_id', companyId)
          .eq('active', true)
          .order('name')

        if (error) throw error
        this.brands = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching brands:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchCategories(companyId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('company_id', companyId)
          .eq('active', true)
          .order('level', { ascending: true })
          .order('name')

        if (error) throw error
        this.categories = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching categories:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchWarehouses(companyId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('*')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name')

        if (error) throw error
        this.warehouses = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching warehouses:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchWarehouseZones(companyId: string, warehouseId?: string) {
      this.loading = true
      this.error = null
      try {
        let query = supabase
          .from('warehouse_zones')
          .select('*')
          .eq('company_id', companyId)
          .is('deleted_at', null)

        if (warehouseId) {
          query = query.eq('warehouse_id', warehouseId)
        }

        const { data, error } = await query.order('code')

        if (error) throw error
        this.warehouseZones = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching warehouse zones:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchPriceLists(companyId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('price_lists')
          .select('*')
          .eq('company_id', companyId)
          .order('name')

        if (error) throw error
        this.priceLists = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching price lists:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchPriceListItems(companyId: string, priceListId?: string) {
      this.loading = true
      this.error = null
      try {
        let query = supabase
          .from('price_list_items')
          .select(`
            *,
            products!inner(
              id,
              name,
              sku,
              company_id
            )
          `)
          .eq('company_id', companyId)
          .order('valid_from', { ascending: false })

        if (priceListId) {
          query = query.eq('price_list_id', priceListId)
        }

        const { data, error } = await query

        if (error) throw error
        this.priceListItems = data || []
        console.log('Price list items loaded:', this.priceListItems.length)
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching price list items:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchInventoryItems(companyId: string, warehouseId?: string, categoryId?: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.rpc('get_inventory_items', {
          p_company_id: companyId,
          p_warehouse_id: warehouseId,
          p_category_id: categoryId
        })

        if (error) throw error

        // Convert storage paths to public URLs for main_image
        const itemsWithImages = (data || []).map((item: InventoryItem) => {
          if (item.main_image) {
            const { data: urlData } = supabase.storage
              .from('inventario')
              .getPublicUrl(item.main_image)
            return {
              ...item,
              main_image: urlData.publicUrl
            }
          }
          return item
        })

        this.inventoryItems = itemsWithImages
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching inventory items:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchProductLocations(productId: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('product_location')
          .select('*')
          .eq('product_id', productId)
          .eq('estado', true)

        if (error) throw error
        this.productLocations = data || []
      } catch (error: any) {
        this.error = error.message
        console.error('Error fetching product locations:', error)
      } finally {
        this.loading = false
      }
    },

    // CRUD Operations
    async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single()

        if (error) throw error
        if (data) {
          this.products.push(data)
        }
        return data
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating product:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createBrand(brandData: Omit<Brand, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('brands')
          .insert(brandData)
          .select()
          .single()

        if (error) throw error
        if (data) {
          this.brands.push(data)
        }
        return data
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating brand:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select()
          .single()

        if (error) throw error
        if (data) {
          this.categories.push(data)
        }
        return data
      } catch (error: any) {
        this.error = error.message
        console.error('Error creating category:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    selectProduct(product: Product) {
      this.selectedProduct = product
    },

    selectPriceList(priceList: PriceList) {
      this.selectedPriceList = priceList
    }
  }
})
