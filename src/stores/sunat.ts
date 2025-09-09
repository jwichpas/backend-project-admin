import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import {
  type SunatCatalogItem,
  type UbigeoItem,
  type SunatCatalogKey,
  SUNAT_CATALOGS,
  sunatDocumentTypesService,
  sunatCurrenciesService,
  sunatMeasurementUnitsService,
  sunatTaxTypesService,
  sunatIdentityDocumentTypesService,
  sunatIgvAffectationsService,
  sunatOperationTypesService,
  sunatUnitPriceTypesService,
  sunatOperationTypesV2Service,
  sunatTransferModalitiesService,
  sunatTransferReasonsService,
  sunatInvoiceTypesService,
  sunatLegendCodesService,
  sunatGoodsServicesCodesService,
  sunatPaymentMethodsService,
  sunatFinancialEntitiesService,
  sunatExistenceTypesService,
  sunatCustomsService,
  sunatOperationTypesV3Service,
  sunatUbigeoService,
  sunatUniversalSearchService
} from '@/services/sunatService'

interface SunatState {
  // Individual catalogs
  documentTypes: SunatCatalogItem[]
  currencies: SunatCatalogItem[]
  measurementUnits: SunatCatalogItem[]
  taxTypes: SunatCatalogItem[]
  identityDocumentTypes: SunatCatalogItem[]
  igvAffectations: SunatCatalogItem[]
  operationTypes: SunatCatalogItem[]
  unitPriceTypes: SunatCatalogItem[]
  operationTypesV2: SunatCatalogItem[]
  transferModalities: SunatCatalogItem[]
  transferReasons: SunatCatalogItem[]
  invoiceTypes: SunatCatalogItem[]
  legendCodes: SunatCatalogItem[]
  goodsServicesCodes: SunatCatalogItem[]
  paymentMethods: SunatCatalogItem[]
  financialEntities: SunatCatalogItem[]
  existenceTypes: SunatCatalogItem[]
  customs: SunatCatalogItem[]
  operationTypesV3: SunatCatalogItem[]
  ubigeo: UbigeoItem[]
  
  // Loading states
  loading: Record<string, boolean>
  
  // Cache timestamps
  lastUpdated: Record<string, Date>
  
  // Search states
  searchResults: Record<string, SunatCatalogItem[]>
  searchLoading: Record<string, boolean>
}

export const useSunatStore = defineStore('sunat', () => {
  // State
  const state: Ref<SunatState> = ref({
    documentTypes: [],
    currencies: [],
    measurementUnits: [],
    taxTypes: [],
    identityDocumentTypes: [],
    igvAffectations: [],
    operationTypes: [],
    unitPriceTypes: [],
    operationTypesV2: [],
    transferModalities: [],
    transferReasons: [],
    invoiceTypes: [],
    legendCodes: [],
    goodsServicesCodes: [],
    paymentMethods: [],
    financialEntities: [],
    existenceTypes: [],
    customs: [],
    operationTypesV3: [],
    ubigeo: [],
    loading: {},
    lastUpdated: {},
    searchResults: {},
    searchLoading: {}
  })

  // Getters
  const isLoading = computed(() => (catalogName: string) => state.value.loading[catalogName] || false)
  const isSearchLoading = computed(() => (catalogName: string) => state.value.searchLoading[catalogName] || false)
  const getLastUpdated = computed(() => (catalogName: string) => state.value.lastUpdated[catalogName])
  const getSearchResults = computed(() => (catalogName: string) => state.value.searchResults[catalogName] || [])

  // Helper to check if cache is valid (5 minutes)
  const isCacheValid = (catalogName: string): boolean => {
    const lastUpdate = state.value.lastUpdated[catalogName]
    if (!lastUpdate) return false
    return (Date.now() - lastUpdate.getTime()) < 5 * 60 * 1000
  }

  // Actions for individual catalogs
  const loadDocumentTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('documentTypes') && state.value.documentTypes.length > 0) return
    
    state.value.loading['documentTypes'] = true
    try {
      state.value.documentTypes = await sunatDocumentTypesService.getAll()
      state.value.lastUpdated['documentTypes'] = new Date()
    } catch (error) {
      console.error('Error loading document types:', error)
      throw error
    } finally {
      state.value.loading['documentTypes'] = false
    }
  }

  const loadCurrencies = async (forceReload = false) => {
    if (!forceReload && isCacheValid('currencies') && state.value.currencies.length > 0) return
    
    state.value.loading['currencies'] = true
    try {
      state.value.currencies = await sunatCurrenciesService.getAll()
      state.value.lastUpdated['currencies'] = new Date()
    } catch (error) {
      console.error('Error loading currencies:', error)
      throw error
    } finally {
      state.value.loading['currencies'] = false
    }
  }

  const loadMeasurementUnits = async (forceReload = false) => {
    if (!forceReload && isCacheValid('measurementUnits') && state.value.measurementUnits.length > 0) return
    
    state.value.loading['measurementUnits'] = true
    try {
      state.value.measurementUnits = await sunatMeasurementUnitsService.getAll()
      state.value.lastUpdated['measurementUnits'] = new Date()
    } catch (error) {
      console.error('Error loading measurement units:', error)
      throw error
    } finally {
      state.value.loading['measurementUnits'] = false
    }
  }

  const loadTaxTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('taxTypes') && state.value.taxTypes.length > 0) return
    
    state.value.loading['taxTypes'] = true
    try {
      state.value.taxTypes = await sunatTaxTypesService.getAll()
      state.value.lastUpdated['taxTypes'] = new Date()
    } catch (error) {
      console.error('Error loading tax types:', error)
      throw error
    } finally {
      state.value.loading['taxTypes'] = false
    }
  }

  const loadIdentityDocumentTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('identityDocumentTypes') && state.value.identityDocumentTypes.length > 0) return
    
    state.value.loading['identityDocumentTypes'] = true
    try {
      state.value.identityDocumentTypes = await sunatIdentityDocumentTypesService.getAll()
      state.value.lastUpdated['identityDocumentTypes'] = new Date()
    } catch (error) {
      console.error('Error loading identity document types:', error)
      throw error
    } finally {
      state.value.loading['identityDocumentTypes'] = false
    }
  }

  const loadIgvAffectations = async (forceReload = false) => {
    if (!forceReload && isCacheValid('igvAffectations') && state.value.igvAffectations.length > 0) return
    
    state.value.loading['igvAffectations'] = true
    try {
      state.value.igvAffectations = await sunatIgvAffectationsService.getAll()
      state.value.lastUpdated['igvAffectations'] = new Date()
    } catch (error) {
      console.error('Error loading IGV affectations:', error)
      throw error
    } finally {
      state.value.loading['igvAffectations'] = false
    }
  }

  const loadOperationTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('operationTypes') && state.value.operationTypes.length > 0) return
    
    state.value.loading['operationTypes'] = true
    try {
      state.value.operationTypes = await sunatOperationTypesService.getAll()
      state.value.lastUpdated['operationTypes'] = new Date()
    } catch (error) {
      console.error('Error loading operation types:', error)
      throw error
    } finally {
      state.value.loading['operationTypes'] = false
    }
  }

  const loadUnitPriceTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('unitPriceTypes') && state.value.unitPriceTypes.length > 0) return
    
    state.value.loading['unitPriceTypes'] = true
    try {
      state.value.unitPriceTypes = await sunatUnitPriceTypesService.getAll()
      state.value.lastUpdated['unitPriceTypes'] = new Date()
    } catch (error) {
      console.error('Error loading unit price types:', error)
      throw error
    } finally {
      state.value.loading['unitPriceTypes'] = false
    }
  }

  const loadOperationTypesV2 = async (forceReload = false) => {
    if (!forceReload && isCacheValid('operationTypesV2') && state.value.operationTypesV2.length > 0) return
    
    state.value.loading['operationTypesV2'] = true
    try {
      state.value.operationTypesV2 = await sunatOperationTypesV2Service.getAll()
      state.value.lastUpdated['operationTypesV2'] = new Date()
    } catch (error) {
      console.error('Error loading operation types v2:', error)
      throw error
    } finally {
      state.value.loading['operationTypesV2'] = false
    }
  }

  const loadTransferModalities = async (forceReload = false) => {
    if (!forceReload && isCacheValid('transferModalities') && state.value.transferModalities.length > 0) return
    
    state.value.loading['transferModalities'] = true
    try {
      state.value.transferModalities = await sunatTransferModalitiesService.getAll()
      state.value.lastUpdated['transferModalities'] = new Date()
    } catch (error) {
      console.error('Error loading transfer modalities:', error)
      throw error
    } finally {
      state.value.loading['transferModalities'] = false
    }
  }

  const loadTransferReasons = async (forceReload = false) => {
    if (!forceReload && isCacheValid('transferReasons') && state.value.transferReasons.length > 0) return
    
    state.value.loading['transferReasons'] = true
    try {
      state.value.transferReasons = await sunatTransferReasonsService.getAll()
      state.value.lastUpdated['transferReasons'] = new Date()
    } catch (error) {
      console.error('Error loading transfer reasons:', error)
      throw error
    } finally {
      state.value.loading['transferReasons'] = false
    }
  }

  const loadInvoiceTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('invoiceTypes') && state.value.invoiceTypes.length > 0) return
    
    state.value.loading['invoiceTypes'] = true
    try {
      state.value.invoiceTypes = await sunatInvoiceTypesService.getAll()
      state.value.lastUpdated['invoiceTypes'] = new Date()
    } catch (error) {
      console.error('Error loading invoice types:', error)
      throw error
    } finally {
      state.value.loading['invoiceTypes'] = false
    }
  }

  const loadLegendCodes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('legendCodes') && state.value.legendCodes.length > 0) return
    
    state.value.loading['legendCodes'] = true
    try {
      state.value.legendCodes = await sunatLegendCodesService.getAll()
      state.value.lastUpdated['legendCodes'] = new Date()
    } catch (error) {
      console.error('Error loading legend codes:', error)
      throw error
    } finally {
      state.value.loading['legendCodes'] = false
    }
  }

  const loadGoodsServicesCodes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('goodsServicesCodes') && state.value.goodsServicesCodes.length > 0) return
    
    state.value.loading['goodsServicesCodes'] = true
    try {
      state.value.goodsServicesCodes = await sunatGoodsServicesCodesService.getAll()
      state.value.lastUpdated['goodsServicesCodes'] = new Date()
    } catch (error) {
      console.error('Error loading goods services codes:', error)
      throw error
    } finally {
      state.value.loading['goodsServicesCodes'] = false
    }
  }

  const loadPaymentMethods = async (forceReload = false) => {
    if (!forceReload && isCacheValid('paymentMethods') && state.value.paymentMethods.length > 0) return
    
    state.value.loading['paymentMethods'] = true
    try {
      state.value.paymentMethods = await sunatPaymentMethodsService.getAll()
      state.value.lastUpdated['paymentMethods'] = new Date()
    } catch (error) {
      console.error('Error loading payment methods:', error)
      throw error
    } finally {
      state.value.loading['paymentMethods'] = false
    }
  }

  const loadFinancialEntities = async (forceReload = false) => {
    if (!forceReload && isCacheValid('financialEntities') && state.value.financialEntities.length > 0) return
    
    state.value.loading['financialEntities'] = true
    try {
      state.value.financialEntities = await sunatFinancialEntitiesService.getAll()
      state.value.lastUpdated['financialEntities'] = new Date()
    } catch (error) {
      console.error('Error loading financial entities:', error)
      throw error
    } finally {
      state.value.loading['financialEntities'] = false
    }
  }

  const loadExistenceTypes = async (forceReload = false) => {
    if (!forceReload && isCacheValid('existenceTypes') && state.value.existenceTypes.length > 0) return
    
    state.value.loading['existenceTypes'] = true
    try {
      state.value.existenceTypes = await sunatExistenceTypesService.getAll()
      state.value.lastUpdated['existenceTypes'] = new Date()
    } catch (error) {
      console.error('Error loading existence types:', error)
      throw error
    } finally {
      state.value.loading['existenceTypes'] = false
    }
  }

  const loadCustoms = async (forceReload = false) => {
    if (!forceReload && isCacheValid('customs') && state.value.customs.length > 0) return
    
    state.value.loading['customs'] = true
    try {
      state.value.customs = await sunatCustomsService.getAll()
      state.value.lastUpdated['customs'] = new Date()
    } catch (error) {
      console.error('Error loading customs:', error)
      throw error
    } finally {
      state.value.loading['customs'] = false
    }
  }

  const loadOperationTypesV3 = async (forceReload = false) => {
    if (!forceReload && isCacheValid('operationTypesV3') && state.value.operationTypesV3.length > 0) return
    
    state.value.loading['operationTypesV3'] = true
    try {
      state.value.operationTypesV3 = await sunatOperationTypesV3Service.getAll()
      state.value.lastUpdated['operationTypesV3'] = new Date()
    } catch (error) {
      console.error('Error loading operation types v3:', error)
      throw error
    } finally {
      state.value.loading['operationTypesV3'] = false
    }
  }

  const searchUbigeo = async (searchTerm?: string) => {
    state.value.loading['ubigeo'] = true
    try {
      state.value.ubigeo = await sunatUbigeoService.search(searchTerm)
      state.value.lastUpdated['ubigeo'] = new Date()
    } catch (error) {
      console.error('Error searching ubigeo:', error)
      throw error
    } finally {
      state.value.loading['ubigeo'] = false
    }
  }

  // Universal search action
  const searchCatalog = async (
    catalogName: string,
    searchField: string = 'descripcion',
    searchValue?: string,
    limitResults: number = 100
  ) => {
    state.value.searchLoading[catalogName] = true
    try {
      const results = await sunatUniversalSearchService.search(
        catalogName,
        searchField,
        searchValue,
        limitResults
      )
      state.value.searchResults[catalogName] = results
    } catch (error) {
      console.error(`Error searching catalog ${catalogName}:`, error)
      throw error
    } finally {
      state.value.searchLoading[catalogName] = false
    }
  }

  // Get description for a specific code
  const getCodeDescription = async (catalogName: string, codeValue: string): Promise<string | null> => {
    try {
      return await sunatUniversalSearchService.getDescription(catalogName, codeValue)
    } catch (error) {
      console.error(`Error getting description for ${catalogName}:${codeValue}:`, error)
      return null
    }
  }

  // Load all essential catalogs
  const loadEssentialCatalogs = async (forceReload = false) => {
    const promises = [
      loadDocumentTypes(forceReload),
      loadCurrencies(forceReload),
      loadMeasurementUnits(forceReload),
      loadTaxTypes(forceReload),
      loadIdentityDocumentTypes(forceReload),
      loadIgvAffectations(forceReload),
      loadOperationTypes(forceReload),
      loadPaymentMethods(forceReload)
    ]
    
    await Promise.allSettled(promises)
  }

  // Clear cache
  const clearCache = () => {
    state.value.lastUpdated = {}
    state.value.searchResults = {}
  }

  return {
    // State
    state,
    
    // Getters
    isLoading,
    isSearchLoading,
    getLastUpdated,
    getSearchResults,
    
    // Individual loaders
    loadDocumentTypes,
    loadCurrencies,
    loadMeasurementUnits,
    loadTaxTypes,
    loadIdentityDocumentTypes,
    loadIgvAffectations,
    loadOperationTypes,
    loadUnitPriceTypes,
    loadOperationTypesV2,
    loadTransferModalities,
    loadTransferReasons,
    loadInvoiceTypes,
    loadLegendCodes,
    loadGoodsServicesCodes,
    loadPaymentMethods,
    loadFinancialEntities,
    loadExistenceTypes,
    loadCustoms,
    loadOperationTypesV3,
    searchUbigeo,
    
    // Universal actions
    searchCatalog,
    getCodeDescription,
    loadEssentialCatalogs,
    clearCache,
    
    // Catalog metadata
    SUNAT_CATALOGS
  }
})