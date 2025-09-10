<template>
  <div v-if="loading" class="flex items-center gap-2">
    <div class="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
    <span class="text-xs text-muted-foreground">Calculando...</span>
  </div>
  
  <div v-else-if="error" class="text-xs text-red-500">
    Error en conversión
  </div>
  
  <div v-else class="space-y-1">
    <!-- Precio convertido (principal) -->
    <div class="font-medium">
      {{ formatCurrency(displayPrice, displayCurrency) }}
      <span v-if="isConverted" class="text-xs text-blue-600 ml-1" title="Precio convertido">
        💱
      </span>
    </div>
    
    <!-- Precio original si fue convertido -->
    <div v-if="isConverted" class="text-xs text-muted-foreground">
      Original: {{ formatCurrency(price, currency) }}
    </div>
    
    <!-- Descuento -->
    <div v-if="discount" class="text-xs text-green-600">
      (-{{ discount }}%)
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useExchangeRates } from '@/composables/useExchangeRates'

interface Props {
  price: number
  currency: string
  discount?: number
}

const props = defineProps<Props>()

const companyStore = useCompanyStore()
const { convertAmount } = useExchangeRates()

const loading = ref(true)
const error = ref(false)
const convertedPrice = ref<number>(props.price)
const isConverted = ref(false)

// Computed para mostrar el precio y moneda correctos
const displayPrice = computed(() => convertedPrice.value)
const displayCurrency = computed(() => {
  if (!companyStore.selectedCompany) return props.currency
  return isConverted.value ? (companyStore.selectedCompany.currency_code || 'PEN') : props.currency
})

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

const convertPriceIfNeeded = async () => {
  if (!companyStore.selectedCompany) {
    convertedPrice.value = props.price
    isConverted.value = false
    loading.value = false
    return
  }

  const companyCurrency = companyStore.selectedCompany.currency_code || 'PEN'
  
  // Si las monedas son iguales, no hay conversión
  if (props.currency === companyCurrency) {
    convertedPrice.value = props.price
    isConverted.value = false
    loading.value = false
    return
  }

  try {
    // Convertir usando tipos de cambio
    const converted = await convertAmount(props.price, props.currency, companyCurrency)
    convertedPrice.value = converted
    isConverted.value = true
    error.value = false
  } catch (err) {
    console.warn(`No se pudo convertir ${props.currency} a ${companyCurrency}:`, err)
    // Si no se puede convertir, mostrar precio original
    convertedPrice.value = props.price
    isConverted.value = false
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await convertPriceIfNeeded()
})
</script>