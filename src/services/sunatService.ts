import { supabase } from '@/lib/supabase'

// Types for SUNAT Catalogs
export interface SunatCatalogItem {
  code: string
  descripcion: string
}

export interface UbigeoItem {
  code: string
  departamento: string
  provincia: string
  distrito: string
  full_name?: string
}

export interface SearchOptions {
  searchTerm?: string
  limit?: number
}

// Document Types (cat_01_tipo_documento)
export const sunatDocumentTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_document_types')
    if (error) throw error
    return data || []
  }
}

// Currencies (cat_02_monedas)
export const sunatCurrenciesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_currencies')
    if (error) throw error
    return data || []
  }
}

// Measurement Units (cat_03_unidades_medida)
export const sunatMeasurementUnitsService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_measurement_units')
    if (error) throw error
    return data || []
  }
}

// Tax Types (cat_05_tipos_tributo)
export const sunatTaxTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_tax_types')
    if (error) throw error
    return data || []
  }
}

// Identity Document Types (cat_06_doc_identidad)
export const sunatIdentityDocumentTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_identity_document_types')
    if (error) throw error
    return data || []
  }
}

// IGV Affectations (cat_07_afect_igv)
export const sunatIgvAffectationsService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_igv_affectations')
    if (error) throw error
    return data || []
  }
}

// Operation Types (cat_12_tipo_operacion)
export const sunatOperationTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_operation_types')
    if (error) throw error
    return data || []
  }
}

// Unit Price Types (cat_16_tipo_precio_unitario)
export const sunatUnitPriceTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_unit_price_types')
    if (error) throw error
    return data || []
  }
}

// Operation Types V2 (cat_17_tipo_operacion)
export const sunatOperationTypesV2Service = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_operation_types_v2')
    if (error) throw error
    return data || []
  }
}

// Transfer Modalities (cat_18_modalidad_traslado)
export const sunatTransferModalitiesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_transfer_modalities')
    if (error) throw error
    return data || []
  }
}

// Transfer Reasons (cat_20_motivo_traslado)
export const sunatTransferReasonsService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_transfer_reasons')
    if (error) throw error
    return data || []
  }
}

// Invoice Types (cat_51_tipo_factura)
export const sunatInvoiceTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_invoice_types')
    if (error) throw error
    return data || []
  }
}

// Legend Codes (cat_52_codigo_leyendas)
export const sunatLegendCodesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_legend_codes')
    if (error) throw error
    return data || []
  }
}

// Goods and Services Codes (cat_54_codigo_bb_ss)
export const sunatGoodsServicesCodesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_goods_services_codes')
    if (error) throw error
    return data || []
  }
}

// Ubigeo
export const sunatUbigeoService = {
  async search(searchTerm?: string): Promise<UbigeoItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_ubigeo', { search_term: searchTerm })
    if (error) throw error
    return data || []
  }
}

// Payment Methods (tab_01_medio_pago)
export const sunatPaymentMethodsService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_payment_methods')
    if (error) throw error
    return data || []
  }
}

// Financial Entities (tab_03_entidad_financiera)
export const sunatFinancialEntitiesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_financial_entities')
    if (error) throw error
    return data || []
  }
}

// Existence Types (tab_05_tipo_existencia)
export const sunatExistenceTypesService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_existence_types')
    if (error) throw error
    return data || []
  }
}

// Customs (tab_11_aduana)
export const sunatCustomsService = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_customs')
    if (error) throw error
    return data || []
  }
}

// Operation Types V3 (tab_12_tipo_operacion)
export const sunatOperationTypesV3Service = {
  async getAll(): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('get_sunat_operation_types_v3')
    if (error) throw error
    return data || []
  }
}

// Universal search function
export const sunatUniversalSearchService = {
  async search(
    catalogName: string,
    searchField: string = 'descripcion',
    searchValue?: string,
    limitResults: number = 100
  ): Promise<SunatCatalogItem[]> {
    const { data, error } = await supabase.rpc('search_sunat_catalog', {
      catalog_name: catalogName,
      search_field: searchField,
      search_value: searchValue,
      limit_results: limitResults
    })
    if (error) throw error
    return data || []
  },

  async getDescription(catalogName: string, codeValue: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_sunat_code_description', {
      catalog_name: catalogName,
      code_value: codeValue
    })
    if (error) throw error
    return data
  }
}

// Catalog metadata for UI management
export const SUNAT_CATALOGS = {
  'cat_01_tipo_documento': {
    name: 'Tipos de Documento',
    description: 'Catálogo de tipos de documentos de identidad',
    service: sunatDocumentTypesService,
    codeMaxLength: 2
  },
  'cat_02_monedas': {
    name: 'Monedas',
    description: 'Catálogo de monedas',
    service: sunatCurrenciesService,
    codeMaxLength: 3
  },
  'cat_03_unidades_medida': {
    name: 'Unidades de Medida',
    description: 'Catálogo de unidades de medida',
    service: sunatMeasurementUnitsService,
    codeMaxLength: 10
  },
  'cat_05_tipos_tributo': {
    name: 'Tipos de Tributo',
    description: 'Catálogo de tipos de tributos',
    service: sunatTaxTypesService,
    codeMaxLength: 4
  },
  'cat_06_doc_identidad': {
    name: 'Documentos de Identidad',
    description: 'Catálogo de documentos de identidad',
    service: sunatIdentityDocumentTypesService,
    codeMaxLength: 1
  },
  'cat_07_afect_igv': {
    name: 'Afectación IGV',
    description: 'Catálogo de tipos de afectación del IGV',
    service: sunatIgvAffectationsService,
    codeMaxLength: 2
  },
  'cat_12_tipo_operacion': {
    name: 'Tipos de Operación',
    description: 'Catálogo de tipos de operación',
    service: sunatOperationTypesService,
    codeMaxLength: 2
  },
  'cat_16_tipo_precio_unitario': {
    name: 'Tipos de Precio Unitario',
    description: 'Catálogo de tipos de precio unitario',
    service: sunatUnitPriceTypesService,
    codeMaxLength: 2
  },
  'cat_17_tipo_operacion': {
    name: 'Tipos de Operación V2',
    description: 'Catálogo de tipos de operación (versión 2)',
    service: sunatOperationTypesV2Service,
    codeMaxLength: 4
  },
  'cat_18_modalidad_traslado': {
    name: 'Modalidades de Traslado',
    description: 'Catálogo de modalidades de traslado',
    service: sunatTransferModalitiesService,
    codeMaxLength: 2
  },
  'cat_20_motivo_traslado': {
    name: 'Motivos de Traslado',
    description: 'Catálogo de motivos de traslado',
    service: sunatTransferReasonsService,
    codeMaxLength: 2
  },
  'cat_51_tipo_factura': {
    name: 'Tipos de Factura',
    description: 'Catálogo de tipos de factura',
    service: sunatInvoiceTypesService,
    codeMaxLength: 4
  },
  'cat_52_codigo_leyendas': {
    name: 'Códigos de Leyendas',
    description: 'Catálogo de códigos de leyendas',
    service: sunatLegendCodesService,
    codeMaxLength: 4
  },
  'cat_54_codigo_bb_ss': {
    name: 'Códigos de Bienes y Servicios',
    description: 'Catálogo de códigos de bienes y servicios',
    service: sunatGoodsServicesCodesService,
    codeMaxLength: 3
  },
  'tab_01_medio_pago': {
    name: 'Medios de Pago',
    description: 'Tabla de medios de pago',
    service: sunatPaymentMethodsService,
    codeMaxLength: 3
  },
  'tab_03_entidad_financiera': {
    name: 'Entidades Financieras',
    description: 'Tabla de entidades financieras',
    service: sunatFinancialEntitiesService,
    codeMaxLength: 3
  },
  'tab_05_tipo_existencia': {
    name: 'Tipos de Existencia',
    description: 'Tabla de tipos de existencia',
    service: sunatExistenceTypesService,
    codeMaxLength: 3
  },
  'tab_11_aduana': {
    name: 'Aduanas',
    description: 'Tabla de aduanas',
    service: sunatCustomsService,
    codeMaxLength: 3
  },
  'tab_12_tipo_operacion': {
    name: 'Tipos de Operación V3',
    description: 'Tabla de tipos de operación (versión 3)',
    service: sunatOperationTypesV3Service,
    codeMaxLength: 3
  },
  'ubigeo': {
    name: 'Ubigeo',
    description: 'Código de ubicación geográfica',
    service: sunatUbigeoService,
    codeMaxLength: 6
  }
} as const

export type SunatCatalogKey = keyof typeof SUNAT_CATALOGS