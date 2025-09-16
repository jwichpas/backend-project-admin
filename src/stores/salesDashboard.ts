import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface SalesTimeStats {
  company_id: string
  company_name: string
  sale_day: string
  sale_week: string
  sale_month: string
  sale_quarter: string
  sale_year: string
  day_of_week: number
  month_of_year: number
  total_transactions: number
  unique_customers: number
  total_sales: number
  total_sales_local: number
  total_sales_usd: number
  total_sales_clp: number
  total_taxable_sales: number
  total_tax: number
  avg_transaction_value: number
  total_items_sold: number
}

export interface SalesSellerStats {
  company_id: string
  company_name: string
  seller_user_id: string
  seller_email: string
  seller_name: string
  sale_month: string
  sale_quarter: string
  sale_year: string
  total_transactions: number
  unique_customers: number
  total_sales: number
  total_sales_local: number
  avg_transaction_value: number
  total_items_sold: number
  monthly_rank: number
}

export interface SalesProductStats {
  company_id: string
  company_name: string
  product_id: string
  product_name: string
  sku: string
  category_id: string
  category_name: string
  brand_id: string
  brand_name: string
  sale_month: string
  sale_quarter: string
  sale_year: string
  total_quantity_sold: number
  total_sales_value: number
  total_sales_local: number
  avg_unit_price: number
  monthly_quantity_rank: number
  monthly_value_rank: number
}

export interface SalesCustomerStats {
  company_id: string
  company_name: string
  customer_id: string
  customer_name: string
  customer_doc_type: string
  customer_doc_number: string
  sale_month: string
  sale_quarter: string
  sale_year: string
  total_transactions: number
  total_sales_value: number
  total_sales_local: number
  avg_transaction_value: number
  total_items_purchased: number
  monthly_rank: number
}

export interface SalesBranchStats {
  company_id: string
  company_name: string
  branch_id: string
  branch_name: string
  sale_month: string
  sale_quarter: string
  sale_year: string
  total_transactions: number
  unique_customers: number
  unique_sellers: number
  total_sales_value: number
  total_sales_local: number
  avg_transaction_value: number
  total_items_sold: number
}

export interface SalesMonthlyTrend {
  company_id: string
  company_name: string
  sale_month: string
  sale_year: string
  total_transactions: number
  total_sales: number
  total_sales_local: number
  previous_month_sales: number
  growth_percentage: number
  total_items_sold: number
}

export interface SalesProfitMonthly {
  company_id: string
  sale_month: string
  sale_year: number
  sale_month_number: number
  sale_month_name: string
  total_transactions: number
  unique_customers: number
  total_sales: number
  total_sales_local: number
  total_sales_usd: number
  total_sales_clp: number
  taxable_sales: number
  exempt_sales: number
  non_taxable_sales: number
  total_tax: number
  total_excise_tax: number
  total_discounts: number
  total_other_charges: number
  estimated_profit: number
  estimated_profit_local: number
}

export interface SalesTrendMonthly {
  company_id: string
  sale_month: string
  sale_year: number
  sale_month_number: number
  monthly_sales: number
  previous_month_sales: number
  previous_year_sales: number
  month_over_month_growth: number
  year_over_year_growth: number
}

export interface SalesChannelMonthly {
  company_id: string
  sale_month: string
  doc_type: string
  transaction_count: number
  unique_customers: number
  total_sales: number
  total_sales_local: number
  avg_transaction_value: number
  total_tax: number
}

export interface ProfitabilityMetricsMonthly {
  company_id: string
  sale_month: string
  sale_year?: number
  sale_month_number?: number
  total_sales?: number
  total_sales_local: number
  cost_of_goods_sold?: number
  cost_of_goods_sold_local: number
  gross_profit?: number
  gross_profit_local: number
  gross_margin_percentage?: number
  gross_margin_percentage_local: number
  total_taxes?: number
  total_discounts?: number
  transaction_count?: number
  avg_transaction_value?: number
}

export const useSalesDashboardStore = defineStore('salesDashboard', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastRefresh = ref<Date | null>(null)

  // Dashboard data
  const timeStats = ref<SalesTimeStats[]>([])
  const sellerStats = ref<SalesSellerStats[]>([])
  const productStats = ref<SalesProductStats[]>([])
  const customerStats = ref<SalesCustomerStats[]>([])
  const branchStats = ref<SalesBranchStats[]>([])
  const monthlyTrend = ref<SalesMonthlyTrend[]>([])
  
  // Enhanced dashboard data
  const profitMonthly = ref<SalesProfitMonthly[]>([])
  const trendMonthly = ref<SalesTrendMonthly[]>([])
  const channelMonthly = ref<SalesChannelMonthly[]>([])
  const profitabilityMetrics = ref<ProfitabilityMetricsMonthly[]>([])

  // Filter state
  const selectedDateRange = ref<{start: string, end: string}>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const selectedBranches = ref<string[]>([])
  const selectedSellers = ref<string[]>([])

  // Computed
  const currentMonthStats = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    return timeStats.value.find(stat => 
      stat.sale_month.slice(0, 7) === currentMonth
    )
  })

  const topSellersByMonth = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return sellerStats.value
      .filter(stat => stat.sale_month.slice(0, 7) === currentMonth)
      .sort((a, b) => a.monthly_rank - b.monthly_rank)
      .slice(0, 10)
  })

  const topProductsByQuantity = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return productStats.value
      .filter(stat => stat.sale_month.slice(0, 7) === currentMonth)
      .sort((a, b) => a.monthly_quantity_rank - b.monthly_quantity_rank)
      .slice(0, 10)
  })

  const topProductsByValue = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return productStats.value
      .filter(stat => stat.sale_month.slice(0, 7) === currentMonth)
      .sort((a, b) => a.monthly_value_rank - b.monthly_value_rank)
      .slice(0, 10)
  })

  const topCustomers = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return customerStats.value
      .filter(stat => stat.sale_month.slice(0, 7) === currentMonth)
      .sort((a, b) => a.monthly_rank - b.monthly_rank)
      .slice(0, 10)
  })

  const salesTrendData = computed(() => {
    return monthlyTrend.value
      .filter(trend => {
        const trendDate = new Date(trend.sale_month)
        const startDate = new Date(selectedDateRange.value.start)
        const endDate = new Date(selectedDateRange.value.end)
        return trendDate >= startDate && trendDate <= endDate
      })
      .sort((a, b) => new Date(a.sale_month).getTime() - new Date(b.sale_month).getTime())
  })

  const enhancedSalesTrend = computed(() => {
    return trendMonthly.value
      .filter(trend => {
        const trendDate = new Date(trend.sale_month)
        const startDate = new Date(selectedDateRange.value.start)
        const endDate = new Date(selectedDateRange.value.end)
        return trendDate >= startDate && trendDate <= endDate
      })
      .sort((a, b) => new Date(a.sale_month).getTime() - new Date(b.sale_month).getTime())
  })

  const profitTrendData = computed(() => {
    return profitMonthly.value
      .filter(profit => {
        const profitDate = new Date(profit.sale_month)
        const startDate = new Date(selectedDateRange.value.start)
        const endDate = new Date(selectedDateRange.value.end)
        return profitDate >= startDate && profitDate <= endDate
      })
      .sort((a, b) => new Date(a.sale_month).getTime() - new Date(b.sale_month).getTime())
  })

  const channelPerformance = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    return channelMonthly.value
      .filter(channel => channel.sale_month === currentMonth)
      .sort((a, b) => b.total_sales_local - a.total_sales_local)
  })

  const currentMonthProfitability = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    return profitabilityMetrics.value.find(metric => 
      metric.sale_month === currentMonth
    )
  })

  const yearOverYearComparison = computed(() => {
    return enhancedSalesTrend.value
      .filter(trend => trend.yoy_growth_percent !== null)
      .slice(-12) // Últimos 12 meses
  })

  // Actions
  const refreshMaterializedViews = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: refreshError } = await supabase.rpc('refresh_all_sales_materialized_views')
      
      if (refreshError) {
        throw new Error(refreshError.message)
      }

      lastRefresh.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error refreshing views'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTimeStats = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_by_time_period')
        .select('*')
        .eq('company_id', companyId)

      // Apply date range filter
      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        query = query
          .gte('sale_day', selectedDateRange.value.start)
          .lte('sale_day', selectedDateRange.value.end)
      }

      const { data, error: fetchError } = await query.order('sale_day', { ascending: false })

      if (fetchError) throw fetchError
      timeStats.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching time stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchSellerStats = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_by_seller')
        .select('*')
        .eq('company_id', companyId)

      // Apply date range filter
      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      // Apply seller filter
      if (selectedSellers.value.length > 0) {
        query = query.in('seller_user_id', selectedSellers.value)
      }

      const { data, error: fetchError } = await query.order('monthly_rank', { ascending: true })

      if (fetchError) throw fetchError
      sellerStats.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching seller stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchProductStats = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_by_product')
        .select('*')
        .eq('company_id', companyId)

      // Apply date range filter
      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      const { data, error: fetchError } = await query.order('monthly_value_rank', { ascending: true })

      if (fetchError) throw fetchError
      productStats.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching product stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCustomerStats = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_by_customer')
        .select('*')
        .eq('company_id', companyId)

      // Apply date range filter
      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      const { data, error: fetchError } = await query.order('monthly_rank', { ascending: true })

      if (fetchError) throw fetchError
      customerStats.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching customer stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBranchStats = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_by_branch')
        .select('*')
        .eq('company_id', companyId)

      // Apply date range filter
      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      // Apply branch filter
      if (selectedBranches.value.length > 0) {
        query = query.in('branch_id', selectedBranches.value)
      }

      const { data, error: fetchError } = await query.order('total_sales_value', { ascending: false })

      if (fetchError) throw fetchError
      branchStats.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching branch stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMonthlyTrend = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_monthly_trend')
        .select('*')
        .eq('company_id', companyId)

      // Apply date range filter
      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      const { data, error: fetchError } = await query.order('sale_month', { ascending: true })

      if (fetchError) throw fetchError
      monthlyTrend.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching monthly trend'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchProfitMonthly = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_profit_monthly')
        .select('*')
        .eq('company_id', companyId)

      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      const { data, error: fetchError } = await query.order('sale_month', { ascending: false })

      if (fetchError) throw fetchError
      profitMonthly.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching profit data'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTrendMonthly = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_trend_monthly')
        .select('*')
        .eq('company_id', companyId)

      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      const { data, error: fetchError } = await query.order('sale_month', { ascending: true })

      if (fetchError) throw fetchError
      trendMonthly.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching trend data'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchChannelMonthly = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_sales_channel_monthly')
        .select('*')
        .eq('company_id', companyId)

      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      if (selectedBranches.value.length > 0) {
        query = query.in('branch_id', selectedBranches.value)
      }

      const { data, error: fetchError } = await query.order('total_sales_local', { ascending: false })

      if (fetchError) throw fetchError
      channelMonthly.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching channel data'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchProfitabilityMetrics = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('mv_profitability_metrics_monthly')
        .select('*')
        .eq('company_id', companyId)

      if (selectedDateRange.value.start && selectedDateRange.value.end) {
        const startMonth = selectedDateRange.value.start.slice(0, 7) + '-01'
        const endMonth = selectedDateRange.value.end.slice(0, 7) + '-01'
        query = query
          .gte('sale_month', startMonth)
          .lte('sale_month', endMonth)
      }

      const { data, error: fetchError } = await query.order('sale_month', { ascending: false })

      if (fetchError) throw fetchError
      profitabilityMetrics.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching profitability metrics'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAllDashboardData = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      await Promise.all([
        fetchTimeStats(companyId),
        fetchSellerStats(companyId),
        fetchProductStats(companyId),
        fetchCustomerStats(companyId),
        fetchBranchStats(companyId),
        fetchMonthlyTrend(companyId),
        // Enhanced views
        fetchProfitMonthly(companyId),
        fetchTrendMonthly(companyId),
        fetchChannelMonthly(companyId),
        fetchProfitabilityMetrics(companyId)
      ])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching dashboard data'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setDateRange = (start: string, end: string) => {
    selectedDateRange.value = { start, end }
  }

  const setBranchFilter = (branches: string[]) => {
    selectedBranches.value = branches
  }

  const setSellerFilter = (sellers: string[]) => {
    selectedSellers.value = sellers
  }

  const getMaterializedViewsInfo = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase.rpc('get_materialized_views_info')
      
      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error getting views info'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshSingleView = async (viewName: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: refreshError } = await supabase.rpc('refresh_single_sales_view', { view_name: viewName })
      
      if (refreshError) throw refreshError
      
      lastRefresh.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error refreshing view'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    lastRefresh,
    timeStats,
    sellerStats,
    productStats,
    customerStats,
    branchStats,
    monthlyTrend,
    selectedDateRange,
    selectedBranches,
    selectedSellers,

    // Computed
    currentMonthStats,
    topSellersByMonth,
    topProductsByQuantity,
    topProductsByValue,
    topCustomers,
    salesTrendData,

    // Enhanced data
    profitMonthly,
    trendMonthly,
    channelMonthly,
    profitabilityMetrics,
    enhancedSalesTrend,
    profitTrendData,
    channelPerformance,
    currentMonthProfitability,
    yearOverYearComparison,

    // Actions
    refreshMaterializedViews,
    fetchTimeStats,
    fetchSellerStats,
    fetchProductStats,
    fetchCustomerStats,
    fetchBranchStats,
    fetchMonthlyTrend,
    fetchProfitMonthly,
    fetchTrendMonthly,
    fetchChannelMonthly,
    fetchProfitabilityMetrics,
    fetchAllDashboardData,
    setDateRange,
    setBranchFilter,
    setSellerFilter,
    getMaterializedViewsInfo,
    refreshSingleView
  }
})