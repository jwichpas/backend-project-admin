import { ref, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { sunatCurrenciesService, type SunatCatalogItem } from '@/services/sunatService'

export interface ExchangeRate {
  id: number
  rate_date: string
  from_currency_code: string
  to_currency_code: string
  rate: number
  created_at: string
  updated_at: string
}

export interface Currency extends SunatCatalogItem {}

export interface ExchangeRateFilters {
  dateFrom?: string
  dateTo?: string
  fromCurrency?: string
  toCurrency?: string
}

export interface CreateExchangeRateData {
  rate_date: string
  from_currency_code: string
  to_currency_code: string
  rate: number
  create_inverse?: boolean
}

export interface UpdateExchangeRateData extends CreateExchangeRateData {}

export const useExchangeRates = () => {
  // Estados reactivos
  const exchangeRates: Ref<ExchangeRate[]> = ref([])
  const currencies: Ref<Currency[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Obtener lista de tipos de cambio con filtros opcionales
   */
  const fetchExchangeRates = async (filters: ExchangeRateFilters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      let query = supabase
        .from('exchange_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .order('from_currency_code', { ascending: true })

      // Aplicar filtros si están definidos
      if (filters.dateFrom) {
        query = query.gte('rate_date', filters.dateFrom)
      }
      
      if (filters.dateTo) {
        query = query.lte('rate_date', filters.dateTo)
      }
      
      if (filters.fromCurrency) {
        query = query.eq('from_currency_code', filters.fromCurrency)
      }
      
      if (filters.toCurrency) {
        query = query.eq('to_currency_code', filters.toCurrency)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      exchangeRates.value = data || []
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los tipos de cambio'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener lista de monedas disponibles usando el servicio SUNAT
   */
  const fetchCurrencies = async () => {
    try {
      const data = await sunatCurrenciesService.getAll()
      currencies.value = data
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las monedas'
      console.error('Error fetching currencies:', err)
      
      // Fallback a datos mock en caso de error
      currencies.value = [
        { code: 'PEN', descripcion: 'Sol Peruano' },
        { code: 'USD', descripcion: 'Dólar Americano' },
        { code: 'EUR', descripcion: 'Euro' },
        { code: 'CLP', descripcion: 'Peso Chileno' }
      ]
    }
  }

  /**
   * Crear un nuevo tipo de cambio (también crea la conversión inversa automáticamente)
   */
  const createExchangeRate = async (data: CreateExchangeRateData) => {
    loading.value = true
    error.value = null

    try {
      // Validar que las monedas sean diferentes
      if (data.from_currency_code === data.to_currency_code) {
        throw new Error('Las monedas origen y destino deben ser diferentes')
      }

      // Validar que la tasa sea positiva
      if (data.rate <= 0) {
        throw new Error('La tasa de cambio debe ser mayor a cero')
      }

      // Separar create_inverse del payload de base de datos
      const { create_inverse, ...dbData } = data
      
      // Crear la conversión principal
      const { data: result, error: insertError } = await supabase
        .from('exchange_rates')
        .insert([dbData])
        .select()
        .single()

      if (insertError) {
        // Manejar error de duplicado (unique constraint)
        if (insertError.code === '23505') {
          throw new Error('Ya existe un tipo de cambio para esta fecha y par de monedas')
        }
        throw new Error(insertError.message)
      }

      // Crear automáticamente la conversión inversa solo si está habilitado
      if (create_inverse !== false) {
        const inverseData = {
          rate_date: data.rate_date,
          from_currency_code: data.to_currency_code,
          to_currency_code: data.from_currency_code,
          rate: parseFloat((1 / data.rate).toFixed(6)) // Redondear a 6 decimales
        }

        // Insertar la conversión inversa (solo si no existe ya)
        const { error: inverseError } = await supabase
          .from('exchange_rates')
          .insert([inverseData])

        if (inverseError && inverseError.code !== '23505') {
          // Si hay error y no es duplicado, logeamos pero no fallamos
          console.warn('No se pudo crear la conversión inversa:', inverseError.message)
        }
      }

      return result
    } catch (err: any) {
      error.value = err.message || 'Error al crear el tipo de cambio'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un tipo de cambio existente (también actualiza o crea la conversión inversa)
   */
  const updateExchangeRate = async (id: number, data: UpdateExchangeRateData) => {
    loading.value = true
    error.value = null

    try {
      // Validar que las monedas sean diferentes
      if (data.from_currency_code === data.to_currency_code) {
        throw new Error('Las monedas origen y destino deben ser diferentes')
      }

      // Validar que la tasa sea positiva
      if (data.rate <= 0) {
        throw new Error('La tasa de cambio debe ser mayor a cero')
      }

      // Separar create_inverse del payload de base de datos
      const { create_inverse, ...dbData } = data
      
      // Actualizar el registro principal
      const { data: result, error: updateError } = await supabase
        .from('exchange_rates')
        .update({
          ...dbData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        // Manejar error de duplicado (unique constraint)
        if (updateError.code === '23505') {
          throw new Error('Ya existe un tipo de cambio para esta fecha y par de monedas')
        }
        throw new Error(updateError.message)
      }

      // Manejar conversión inversa solo si está habilitado
      if (create_inverse === true) {
        // Buscar si existe la conversión inversa para la misma fecha
        const { data: inverseExists } = await supabase
          .from('exchange_rates')
          .select('id')
          .eq('rate_date', data.rate_date)
          .eq('from_currency_code', data.to_currency_code)
          .eq('to_currency_code', data.from_currency_code)
          .single()

        const inverseData = {
          rate_date: data.rate_date,
          from_currency_code: data.to_currency_code,
          to_currency_code: data.from_currency_code,
          rate: parseFloat((1 / data.rate).toFixed(6)) // Redondear a 6 decimales
        }

        if (inverseExists) {
          // Si existe, actualizar la conversión inversa
          await supabase
            .from('exchange_rates')
            .update({
              ...inverseData,
              updated_at: new Date().toISOString()
            })
            .eq('id', inverseExists.id)
        } else {
          // Si no existe, crear la conversión inversa
          await supabase
            .from('exchange_rates')
            .insert([inverseData])
        }
      }

      return result
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar el tipo de cambio'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un tipo de cambio (también elimina la conversión inversa si existe)
   */
  const deleteExchangeRate = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      // Primero obtener los datos del registro que se va a eliminar
      const { data: recordToDelete, error: fetchError } = await supabase
        .from('exchange_rates')
        .select('rate_date, from_currency_code, to_currency_code')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      // Eliminar el registro principal
      const { error: deleteError } = await supabase
        .from('exchange_rates')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Buscar y eliminar la conversión inversa si existe
      if (recordToDelete) {
        const { error: deleteInverseError } = await supabase
          .from('exchange_rates')
          .delete()
          .eq('rate_date', recordToDelete.rate_date)
          .eq('from_currency_code', recordToDelete.to_currency_code)
          .eq('to_currency_code', recordToDelete.from_currency_code)

        if (deleteInverseError) {
          // Si no se puede eliminar la inversa, solo logeamos el error pero no fallamos
          console.warn('No se pudo eliminar la conversión inversa:', deleteInverseError.message)
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar el tipo de cambio'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener la tasa de cambio más reciente para un par de monedas
   */
  const getLatestExchangeRate = async (fromCurrency: string, toCurrency: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency_code', fromCurrency)
        .eq('to_currency_code', toCurrency)
        .order('rate_date', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No se encontró ningún registro
          return null
        }
        throw new Error(fetchError.message)
      }

      return data
    } catch (err: any) {
      error.value = err.message || 'Error al obtener la tasa de cambio'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener tasa de cambio para una fecha específica
   */
  const getExchangeRateByDate = async (
    fromCurrency: string, 
    toCurrency: string, 
    date: string
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency_code', fromCurrency)
        .eq('to_currency_code', toCurrency)
        .eq('rate_date', date)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No se encontró ningún registro para esa fecha exacta
          // Buscar la tasa más cercana anterior a esa fecha
          const { data: closestData, error: closestError } = await supabase
            .from('exchange_rates')
            .select('*')
            .eq('from_currency_code', fromCurrency)
            .eq('to_currency_code', toCurrency)
            .lte('rate_date', date)
            .order('rate_date', { ascending: false })
            .limit(1)
            .single()

          if (closestError) {
            if (closestError.code === 'PGRST116') {
              return null
            }
            throw new Error(closestError.message)
          }

          return closestData
        }
        throw new Error(fetchError.message)
      }

      return data
    } catch (err: any) {
      error.value = err.message || 'Error al obtener la tasa de cambio'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Convertir monto usando tasa de cambio
   */
  const convertAmount = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: string
  ) => {
    if (fromCurrency === toCurrency) {
      return amount
    }

    try {
      let exchangeRate: ExchangeRate | null

      if (date) {
        exchangeRate = await getExchangeRateByDate(fromCurrency, toCurrency, date)
      } else {
        exchangeRate = await getLatestExchangeRate(fromCurrency, toCurrency)
      }

      if (!exchangeRate) {
        throw new Error(`No se encontró tasa de cambio para ${fromCurrency}/${toCurrency}`)
      }

      return amount * exchangeRate.rate
    } catch (err: any) {
      error.value = err.message || 'Error al convertir el monto'
      throw err
    }
  }

  return {
    // Estados
    exchangeRates,
    currencies,
    loading,
    error,
    
    // Métodos de consulta
    fetchExchangeRates,
    fetchCurrencies,
    getLatestExchangeRate,
    getExchangeRateByDate,
    
    // Métodos de modificación
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    
    // Utilidades
    convertAmount
  }
}