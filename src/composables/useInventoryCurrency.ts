import { ref, computed } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useExchangeRates } from '@/composables/useExchangeRates'
import type { InventoryItem } from '@/stores/products'

export const useInventoryCurrency = (inventoryItems: InventoryItem[]) => {
  const companyStore = useCompanyStore()
  const { convertAmount } = useExchangeRates()
  
  const convertedItems = ref<Map<string, { averageCost: number, totalValue: number }>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const companyCurrency = computed(() => 
    companyStore.selectedCompany?.currency_code || 'PEN'
  )

  const convertInventoryItem = async (item: InventoryItem) => {
    const itemKey = `${item.product_id}-${item.warehouse_id}`
    
    if (!item.original_currency || item.original_currency === companyCurrency.value) {
      // No conversion needed
      convertedItems.value.set(itemKey, {
        averageCost: item.average_cost,
        totalValue: item.balance_qty * item.average_cost
      })
      return
    }

    try {
      const convertedCost = await convertAmount(
        item.average_cost,
        item.original_currency,
        companyCurrency.value
      )
      
      convertedItems.value.set(itemKey, {
        averageCost: convertedCost,
        totalValue: item.balance_qty * convertedCost
      })
    } catch (err) {
      console.warn(`Failed to convert ${item.original_currency} to ${companyCurrency.value} for item ${item.product_name}:`, err)
      // Fallback to original values
      convertedItems.value.set(itemKey, {
        averageCost: item.average_cost,
        totalValue: item.balance_qty * item.average_cost
      })
    }
  }

  const convertAllItems = async (items: InventoryItem[]) => {
    loading.value = true
    error.value = null
    
    try {
      await Promise.all(items.map(item => convertInventoryItem(item)))
    } catch (err: any) {
      error.value = err.message || 'Error converting inventory currencies'
    } finally {
      loading.value = false
    }
  }

  const getTotalValue = computed(() => {
    let total = 0
    for (const [, values] of convertedItems.value) {
      total += values.totalValue
    }
    return total
  })

  const getConvertedItem = (item: InventoryItem) => {
    const itemKey = `${item.product_id}-${item.warehouse_id}`
    return convertedItems.value.get(itemKey) || {
      averageCost: item.average_cost,
      totalValue: item.balance_qty * item.average_cost
    }
  }

  return {
    convertedItems,
    loading,
    error,
    companyCurrency,
    convertAllItems,
    getTotalValue,
    getConvertedItem
  }
}