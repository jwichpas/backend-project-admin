import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface DespatchGuide {
  id: number
  user_id: number
  company_id: number
  serie: string
  correlativo: string
  fecha_emision: string
  tipo_doc: string
  version: string
  destinatario_tipo_doc: string
  destinatario_num_doc: string
  destinatario_razon_social: string
  cod_traslado: string
  mod_traslado: string
  fecha_traslado: string
  peso_total: number
  und_peso_total: string
  num_bultos?: number
  partida_ubigueo: string
  partida_direccion: string
  llegada_ubigueo: string
  llegada_direccion: string
  transportista_tipo_doc?: string
  transportista_num_doc?: string
  transportista_razon_social?: string
  transportista_nro_mtc?: string
  vehiculo_placa?: string
  conductor_tipo_doc?: string
  conductor_num_doc?: string
  conductor_nombres?: string
  conductor_apellidos?: string
  conductor_licencia?: string
  ticket?: string
  xml?: string
  cdr_zip?: string
  sunat_response?: any
  enviado_sunat: boolean
  estado_sunat: string
  created_at: string
  updated_at: string
  company?: any
  details?: DespatchGuideDetail[]
}

export interface DespatchGuideDetail {
  id: number
  despatch_guide_id: number
  codigo: string
  descripcion: string
  unidad: string
  cantidad: number
  codigo_sunat?: string
  peso_unitario?: number
  observaciones?: string
}

export interface DespatchGuideRequest {
  company: {
    ruc: string
    razonSocial: string
    nombreComercial?: string
    address: {
      ubigueo: string
      departamento: string
      provincia: string
      distrito: string
      urbanizacion?: string
      direccion: string
      codLocal?: string
    }
  }
  serie?: string
  correlativo?: string
  fechaEmision?: string
  tipoDoc?: string
  version?: string
  destinatario: {
    tipoDoc: string
    numDoc: string
    rznSocial: string
  }
  envio: {
    codTraslado: string
    modTraslado: string
    fechaTraslado: string
    pesoTotal: number
    undPesoTotal?: string
    numBultos?: number
    partida: {
      ubigueo: string
      direccion: string
    }
    llegada: {
      ubigueo: string
      direccion: string
    }
    transportista?: {
      tipoDoc: string
      numDoc: string
      rznSocial: string
      nroMtc: string
    }
    vehiculo?: {
      placa: string
    }
    conductor?: {
      tipoDoc: string
      numDoc: string
      nombres: string
      apellidos: string
      licencia: string
    }
  }
  details: {
    codigo: string
    descripcion: string
    unidad: string
    cantidad: number
    codigoSunat?: string
    pesoUnitario?: number
    observaciones?: string
  }[]
  relatedDocument: {
    id: string
    documentTypeCode: string
    documentType?: string
    issuerPartyRuc: string
  }
}

export interface DocumentSeries {
  id: string
  document_type_code: string
  document_type_name: string
  series: string
  branch_id: string
  branch_name: string
  last_number: number
  is_active: boolean
}

export const useDespatchGuidesStore = defineStore('despatchGuides', () => {
  const despatchGuides = ref<DespatchGuide[]>([])
  const currentDespatchGuide = ref<DespatchGuide | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // API Base URL para Facturación (mismo que POS)
  const API_BASE_URL = import.meta.env.VITE_FACTURACION_URL || 'http://localhost:8000'
  const API_USER = import.meta.env.VITE_FACTURACION_USER || ''
  const API_PASSWORD = import.meta.env.VITE_FACTURACION_CLAVE || ''

  // Token management (same as electronicInvoicing service)
  const tokenKey = 'facturacion_token'
  const tokenExpiryKey = 'facturacion_token_expiry'

  // Check if token is valid
  const isTokenValid = (): boolean => {
    const token = localStorage.getItem(tokenKey)
    const expiry = localStorage.getItem(tokenExpiryKey)

    if (!token || !expiry) {
      return false
    }

    const expiryTime = parseInt(expiry)
    const now = Date.now()

    // Check if token expires in less than 5 minutes
    return (expiryTime - now) > 5 * 60 * 1000
  }

  // Authenticate with facturacion API
  const authenticate = async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: API_USER,
          password: API_PASSWORD
        })
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Store token with expiry time
      const expiryTime = Date.now() + (data.expires_in * 1000)
      localStorage.setItem(tokenKey, data.access_token)
      localStorage.setItem(tokenExpiryKey, expiryTime.toString())

      return data.access_token
    } catch (error) {
      console.error('Failed to authenticate with dispatch guides service:', error)
      throw error
    }
  }

  // Get valid token
  const getValidToken = async (): Promise<string> => {
    if (isTokenValid()) {
      return localStorage.getItem(tokenKey)!
    }

    return await authenticate()
  }

  // Headers para autenticación
  const getAuthHeaders = async () => {
    const token = await getValidToken()
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Obtener series disponibles desde Supabase
  const getAvailableDocumentSeries = async (branchId: string, companyId: string, documentTypeCode: string = '09'): Promise<DocumentSeries[]> => {
    try {
      const { data, error } = await supabase.rpc('get_available_document_series', {
        p_company_id: companyId,
        p_document_type_code: documentTypeCode,
        p_branch_id: branchId
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error al obtener series:', err)
      throw err
    }
  }

  // Obtener motivos de traslado de SUNAT
  const getSunatTransferReasons = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sunat_transfer_reasons')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error al obtener motivos de traslado:', err)
      throw err
    }
  }

  // Obtener modalidades de traslado de SUNAT
  const getSunatTransferModalities = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sunat_transfer_modalities')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error al obtener modalidades de traslado:', err)
      throw err
    }
  }

  // Obtener customers (parties) para destinatario
  const getCustomers = async (searchTerm?: string) => {
    try {
      const query = supabase
        .from('parties')
        .select('id, razon_social, fullname, doc_type, doc_number')
        .eq('is_customer', true)
        .is('deleted_at', null)

      if (searchTerm) {
        query.or(`razon_social.ilike.%${searchTerm}%,fullname.ilike.%${searchTerm}%,doc_number.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error al obtener customers:', err)
      throw err
    }
  }

  // Obtener guías de remisión desde Supabase
  const fetchDespatchGuidesFromSupabase = async (filters?: { company_id?: string, status?: string, limit?: number }) => {
    try {
      let query = supabase
        .from('despatch_guides')
        .select(`
          *,
          despatch_guide_details(*),
          despatch_guide_sales_docs(
            sales_doc_id,
            sales_docs(series, number, issue_date, total_amount)
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.company_id) {
        query = query.eq('company_id', filters.company_id)
      }

      if (filters?.status) {
        query = query.eq('sunat_status', filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error al obtener guías de remisión desde Supabase:', err)
      throw err
    }
  }

  // Obtener una guía específica desde Supabase
  const fetchDespatchGuideFromSupabase = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('despatch_guides')
        .select(`
          *,
          despatch_guide_details(*),
          despatch_guide_sales_docs(
            sales_doc_id,
            sales_docs(series, number, issue_date, total_amount, customer_id)
          ),
          companies(legal_name, trade_name, ruc)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error al obtener guía de remisión desde Supabase:', err)
      throw err
    }
  }

  // Actualizar estado de guía en Supabase (cuando se consulte el estado en SUNAT)
  const updateDespatchGuideStatus = async (id: string, statusData: { sunat_status: string, sunat_response?: any, cdr_zip_content?: string }) => {
    try {
      const { data, error } = await supabase
        .from('despatch_guides')
        .update(statusData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error al actualizar estado de guía en Supabase:', err)
      throw err
    }
  }

  // Listar guías de remisión
  const fetchDespatchGuides = async (filters?: { company_id?: string, estado?: string }) => {
    loading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      if (filters?.company_id) queryParams.append('company_id', filters.company_id)
      if (filters?.estado) queryParams.append('estado', filters.estado)

      const response = await fetch(`${API_BASE_URL}/api/despatch-guides?${queryParams}`, {
        headers: await getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al cargar guías de remisión')
      }

      const result = await response.json()
      despatchGuides.value = result.data || []
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Obtener guía específica
  const fetchDespatchGuide = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/despatch-guides/${id}`, {
        headers: await getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al cargar guía de remisión')
      }

      const guide = await response.json()
      currentDespatchGuide.value = guide
      return guide
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Enviar guía de remisión a SUNAT
  const sendDespatchGuide = async (guideData: DespatchGuideRequest) => {
    loading.value = true
    error.value = null

    try {
      // Log para debug - ver qué se está enviando
      console.log('sendDespatchGuide - Sending data:', {
        hasRelatedDocument: !!guideData.relatedDocument,
        relatedDocument: guideData.relatedDocument,
        fullData: guideData
      })

      const response = await fetch(`${API_BASE_URL}/api/despatch-guides/send`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(guideData)
      })

      if (!response.ok) {
        // Log del error para debug
        console.error('Error response status:', response.status)
        console.error('Error response headers:', response.headers)

        let errorDetails
        let errorMessage
        try {
          // Intentar leer como JSON primero
          const responseText = await response.text()
          console.error('Error response text:', responseText)

          try {
            errorDetails = JSON.parse(responseText)
            errorMessage = errorDetails.message || errorDetails.error || `Error ${response.status}`
          } catch (parseError) {
            errorMessage = `Error ${response.status}: ${responseText}`
          }
        } catch (readError) {
          console.error('Could not read response:', readError)
          errorMessage = `Error ${response.status}: Unable to read response`
        }

        if (response.status === 401) {
          // Token might be invalid, try to re-authenticate
          localStorage.removeItem(tokenKey)
          localStorage.removeItem(tokenExpiryKey)
          const newToken = await authenticate()

          const retryResponse = await fetch(`${API_BASE_URL}/api/despatch-guides/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify(guideData)
          })

          if (!retryResponse.ok) {
            const retryText = await retryResponse.text()
            let retryMessage
            try {
              const retryResult = JSON.parse(retryText)
              retryMessage = retryResult.message || 'Error al enviar guía de remisión'
            } catch {
              retryMessage = retryText || 'Error al enviar guía de remisión'
            }
            throw new Error(retryMessage)
          }

          return await retryResponse.json()
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Consultar estado de guía
  const checkDespatchGuideStatus = async (ticket: string, companyRuc: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/despatch-guides/status`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          ticket,
          company_ruc: companyRuc
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al consultar estado')
      }

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Generar XML de guía
  const generateDespatchGuideXML = async (guideData: DespatchGuideRequest) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/despatch-guides/xml`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(guideData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al generar XML')
      }

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Generar PDF de guía
  const generateDespatchGuidePDF = async (guideData: DespatchGuideRequest) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/despatch-guides/pdf`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(guideData)
      })

      if (!response.ok) {
        throw new Error('Error al generar PDF')
      }

      // Descargar el PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `guia-remision-${guideData.serie}-${guideData.correlativo}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Guardar guía en Supabase
  const saveToSupabase = async (guideData: DespatchGuideRequest, sunatResult: any, saleData: any, dispatchData: any, seriesData: any) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id

      // Obtener el siguiente número disponible de forma atómica
      const { data: nextNumberData, error: nextNumberError } = await supabase.rpc('get_next_document_number', {
        p_company_id: saleData.company_id,
        p_document_type: '09',
        p_series: guideData.serie
      })

      if (nextNumberError) {
        console.error('Error getting next document number:', nextNumberError)
        throw nextNumberError
      }

      const nextNumber = nextNumberData || 1
      const correlativo = String(nextNumber).padStart(8, '0')

      // Crear el registro principal en despatch_guides
      const despatchGuideRecord = {
        company_id: saleData.company_id,
        branch_id: saleData.branch_id,
        user_id: userId,
        series: guideData.serie,
        correlativo: correlativo, // Usar el número obtenido de la base de datos
        issue_date: guideData.fechaEmision,
        doc_type: guideData.tipoDoc || '09',
        version: guideData.version || '2022',

        // Destinatario
        recipient_doc_type: guideData.destinatario.tipoDoc,
        recipient_doc_number: guideData.destinatario.numDoc,
        recipient_business_name: guideData.destinatario.rznSocial,

        // Traslado
        transfer_reason: guideData.envio.codTraslado,
        transport_mode: guideData.envio.modTraslado,
        transfer_date: guideData.envio.fechaTraslado,
        total_weight: guideData.envio.pesoTotal,
        weight_unit: guideData.envio.undPesoTotal || 'KGM',
        number_packages: guideData.envio.numBultos,

        // Direcciones
        origin_ubigeo: guideData.envio.partida.ubigueo,
        origin_address: guideData.envio.partida.direccion,
        destination_ubigeo: guideData.envio.llegada.ubigueo,
        destination_address: guideData.envio.llegada.direccion,

        // Transportista (si es transporte público)
        carrier_doc_type: guideData.envio.transportista?.tipoDoc || null,
        carrier_doc_number: guideData.envio.transportista?.numDoc || null,
        carrier_business_name: guideData.envio.transportista?.rznSocial || null,
        carrier_mtc_number: guideData.envio.transportista?.nroMtc || null,

        // Vehículo (si es transporte privado)
        vehicle_plate: guideData.envio.vehiculo?.placa || null,

        // Conductor (si es transporte privado)
        driver_doc_type: guideData.envio.conductor?.tipoDoc || null,
        driver_doc_number: guideData.envio.conductor?.numDoc || null,
        driver_first_names: guideData.envio.conductor?.nombres || null,
        driver_last_names: guideData.envio.conductor?.apellidos || null,
        driver_license: guideData.envio.conductor?.licencia || null,

        // Estado SUNAT
        ticket: sunatResult.ticket || null,
        xml_content: sunatResult.xml || null,
        cdr_zip_content: null, // Se actualizará cuando se consulte el estado
        sunat_response: sunatResult,
        sent_to_sunat: sunatResult.success || false,
        sunat_status: sunatResult.success ? 'SENT' : 'PENDING'
      }

      const { data: despatchGuideInserted, error: guideError } = await supabase
        .from('despatch_guides')
        .insert(despatchGuideRecord)
        .select()
        .single()

      if (guideError) {
        console.error('Error inserting dispatch guide:', guideError)
        throw guideError
      }

      console.log('Dispatch guide saved to Supabase:', despatchGuideInserted)

      // Crear los detalles
      if (guideData.details && guideData.details.length > 0) {
        const detailsData = guideData.details.map(detail => ({
          despatch_guide_id: despatchGuideInserted.id,
          product_code: detail.codigo,
          description: detail.descripcion,
          unit_code: detail.unidad,
          quantity: detail.cantidad,
          sunat_product_code: detail.codigoSunat || null,
          unit_weight: detail.pesoUnitario || null,
          observations: detail.observaciones || null
        }))

        const { error: detailsError } = await supabase
          .from('despatch_guide_details')
          .insert(detailsData)

        if (detailsError) {
          console.error('Error inserting dispatch guide details:', detailsError)
          throw detailsError
        }

        console.log('Dispatch guide details saved to Supabase')
      }

      // Crear relación con documento de venta
      if (saleData.id) {
        const { error: relationError } = await supabase
          .from('despatch_guide_sales_docs')
          .insert({
            despatch_guide_id: despatchGuideInserted.id,
            sales_doc_id: saleData.id
          })

        if (relationError) {
          console.error('Error creating sales document relation:', relationError)
          throw relationError
        }

        console.log('Sales document relation created')
      }

      // Actualizar el contador de documentos con el número real usado
      const seriesNumber = guideData.serie
      const { error: counterError } = await supabase
        .from('document_counters')
        .upsert({
          company_id: saleData.company_id,
          document_type_code: '09', // Guía de remisión
          series: seriesNumber,
          last_number: nextNumber // Usar el número real que se insertó
        })

      if (counterError) {
        console.error('Error updating document counter:', counterError)
        // No lanzar error aquí, solo logear
      } else {
        console.log('Document counter updated successfully for series:', seriesNumber, 'with number:', nextNumber)
      }

      return despatchGuideInserted
    } catch (error) {
      console.error('Error saving dispatch guide to Supabase:', error)
      throw error
    }
  }

  // Crear guías desde orden de despacho (múltiples documentos)
  const createDespatchGuidesFromDispatchOrder = async (dispatchOrderId: string) => {
    try {
      loading.value = true
      error.value = null

      // Obtener la información completa de la orden de despacho
      const { data: dispatchOrder, error: dispatchOrderError } = await supabase
        .from('dispatch_orders')
        .select(`
          *,
          companies(id, legal_name, trade_name, ruc, address, ubigeo_code),
          warehouses(
            id,
            name,
            address,
            branches(id, name, address, ubigeo_code)
          ),
          vehicles(plate, brand, model),
          drivers(id, party_id, parties(doc_type, doc_number, fullname)),
          dispatch_order_sales_docs(
            sales_doc_id,
            sales_docs(
              *,
              sales_doc_items(*),
              parties(doc_type, doc_number, razon_social, fullname, ubigeo_code, address)
            )
          )
        `)
        .eq('id', dispatchOrderId)
        .single()

      if (dispatchOrderError) throw dispatchOrderError

      console.log('Dispatch order loaded:', dispatchOrder)

      // Obtener serie disponible para guías de remisión (usar selectedBranchId del localStorage)
      const selectedBranchId = localStorage.getItem('selectedBranchId')
      if (!selectedBranchId) {
        throw new Error('No hay sucursal seleccionada. Por favor selecciona una sucursal.')
      }

      const availableSeries = await getAvailableDocumentSeries(
        selectedBranchId,
        dispatchOrder.company_id,
        '09'
      )

      if (!availableSeries || availableSeries.length === 0) {
        throw new Error('No hay series disponibles para guías de remisión')
      }

      const selectedSeries = availableSeries[0] // Usar la primera serie disponible

      const results = []
      const errors = []

      // Procesar cada documento de venta en la orden
      for (const salesDocRelation of dispatchOrder.dispatch_order_sales_docs) {
        const salesDoc = salesDocRelation.sales_docs

        try {
          console.log(`Processing sales doc: ${salesDoc.series}-${salesDoc.number}`)

          // Preparar datos de la venta para el formato esperado
          const saleDataFormatted = {
            id: salesDoc.id,
            company_id: dispatchOrder.company_id,
            branch_id: selectedBranchId, // Usar el selectedBranchId válido
            serie: salesDoc.series,
            correlativo: salesDoc.number,
            tipo_comprobante: salesDoc.doc_type === '01' ? 'factura' : 'boleta',
            company: {
              ruc: dispatchOrder.companies.ruc,
              razon_social: dispatchOrder.companies.legal_name,
              nombre_comercial: dispatchOrder.companies.trade_name,
              address: {
                ubigueo: dispatchOrder.companies.ubigeo_code || dispatchOrder.warehouses?.branches?.ubigeo_code || '150101',
                direccion: dispatchOrder.companies.address || dispatchOrder.warehouses?.address || 'Sin dirección'
              },
              ubigueo: dispatchOrder.companies.ubigeo_code || dispatchOrder.warehouses?.branches?.ubigeo_code || '150101',
              direccion: dispatchOrder.companies.address || dispatchOrder.warehouses?.address || 'Sin dirección'
            },
            customer: {
              document_type: salesDoc.parties.doc_type === '6' ? 'RUC' : 'DNI',
              document_number: salesDoc.parties.doc_number,
              business_name: salesDoc.parties.razon_social,
              full_name: salesDoc.parties.fullname
            },
            branch: {
              ubigueo: dispatchOrder.warehouses?.branches?.ubigeo_code || '150101',
              address: dispatchOrder.warehouses?.address || 'Sin dirección'
            },
            items: salesDoc.sales_doc_items.map((item: any) => ({
              product: {
                code: item.product?.code || `PROD${item.id}`,
                description: item.description
              },
              code: item.product?.code || `PROD${item.id}`,
              description: item.description,
              unit_code: item.unit_code,
              quantity: item.quantity
            }))
          }

          // Preparar datos de despacho usando la información de la orden
          const dispatchDataFormatted = {
            dispatch_date: new Date().toISOString().split('T')[0],
            vehicle_type: 'own', // Siempre será propio si tiene vehículo asignado
            destination_ubigueo: salesDoc.parties.ubigeo_code || '150101',
            destination_address: salesDoc.parties.address || 'Dirección del cliente',
            total_weight: salesDoc.sales_doc_items.reduce((total: number, item: any) =>
              total + (item.quantity * 1), 0), // 1kg por item por defecto
            vehicle_plate: dispatchOrder.vehicles?.plate,
            driver: dispatchOrder.drivers?.parties ? {
              document_type: dispatchOrder.drivers.parties.doc_type,
              document_number: dispatchOrder.drivers.parties.doc_number,
              names: dispatchOrder.drivers.parties.fullname?.split(' ')[0] || '',
              last_names: dispatchOrder.drivers.parties.fullname?.split(' ').slice(1).join(' ') || '',
              license_number: 'SIN_LICENCIA' // TODO: Agregar campo de licencia a drivers
            } : null
          }

          // Crear la guía de remisión
          const result = await createDespatchGuideFromSale(
            saleDataFormatted,
            dispatchDataFormatted,
            selectedSeries
          )

          if (result.success) {
            // Actualizar estado del documento de venta
            await supabase
              .from('sales_docs')
              .update({ status: 'DISPATCHED' })
              .eq('id', salesDoc.id)

            results.push({
              sales_doc_id: salesDoc.id,
              sales_doc_number: `${salesDoc.series}-${salesDoc.number}`,
              dispatch_guide_result: result
            })

            console.log(`✅ Guía creada exitosamente para ${salesDoc.series}-${salesDoc.number}`)
          } else {
            throw new Error(result.error || 'Error desconocido al crear guía')
          }

        } catch (saleError) {
          console.error(`❌ Error processing sales doc ${salesDoc.series}-${salesDoc.number}:`, saleError)
          errors.push({
            sales_doc_id: salesDoc.id,
            sales_doc_number: `${salesDoc.series}-${salesDoc.number}`,
            error: saleError.message
          })
        }
      }

      // Actualizar estado de la orden de despacho si todas las guías fueron exitosas
      if (errors.length === 0) {
        await supabase
          .from('dispatch_orders')
          .update({
            status: 'DISPATCHED',
            updated_at: new Date().toISOString()
          })
          .eq('id', dispatchOrderId)
      }

      return {
        success: errors.length === 0,
        total_processed: dispatchOrder.dispatch_order_sales_docs.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error creating dispatch guides from dispatch order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Crear guía desde venta/despacho
  const createDespatchGuideFromSale = async (saleData: any, dispatchData: any, seriesData: any) => {
    // Log para debug - ver qué datos llegan
    console.log('createDespatchGuideFromSale - Input data:', {
      saleData,
      dispatchData,
      seriesData,
      saleFields: {
        serie: saleData?.serie,
        correlativo: saleData?.correlativo,
        tipo_comprobante: saleData?.tipo_comprobante,
        company_ruc: saleData?.company?.ruc
      }
    })

    // Adaptamos para manejar ambas estructuras de datos
    const seriesNumber = seriesData?.series || seriesData?.series_number
    const currentNumber = seriesData?.last_number ?? seriesData?.current_number

    // Validar campos requeridos
    if (!seriesNumber) {
      throw new Error('Serie no válida')
    }

    if (currentNumber === undefined || currentNumber === null) {
      throw new Error('Número correlativo no válido')
    }

    // Fallback para destination_ubigueo si está vacío
    if (!dispatchData.destination_ubigueo || dispatchData.destination_ubigueo.trim() === '') {
      dispatchData.destination_ubigueo = '150101' // Lima por defecto
    }

    if (!dispatchData.destination_address || dispatchData.destination_address.trim() === '') {
      dispatchData.destination_address = 'Dirección no especificada'
    }

    // Validaciones finales después de fallbacks
    if (!dispatchData.destination_ubigueo) {
      throw new Error('Ubigeo de destino es requerido')
    }

    if (!dispatchData.destination_address) {
      throw new Error('Dirección de destino es requerida')
    }

    // Construir datos de la guía basado en la venta y datos de despacho
    const guideData: DespatchGuideRequest = {
      company: {
        ruc: saleData.company?.ruc || saleData.ruc || '10000000001',
        razonSocial: saleData.company?.razon_social || saleData.razon_social || 'EMPRESA DEMO',
        nombreComercial: saleData.company?.nombre_comercial || saleData.nombre_comercial || 'DEMO',
        address: {
          ubigueo: saleData.company?.address?.ubigueo || saleData.company?.ubigueo || '150101',
          departamento: saleData.company?.address?.departamento || saleData.company?.departamento || 'LIMA',
          provincia: saleData.company?.address?.provincia || saleData.company?.provincia || 'LIMA',
          distrito: saleData.company?.address?.distrito || saleData.company?.distrito || 'LIMA',
          direccion: saleData.company?.address?.direccion || saleData.company?.direccion || saleData.company?.address || 'Sin dirección',
          codLocal: '0000'
        }
      },
      serie: seriesNumber,
      correlativo: (currentNumber + 1).toString().padStart(8, '0'),
      fechaEmision: new Date().toISOString().split('T')[0],
      tipoDoc: '09', // Tipo de documento: Guía de Remisión
      version: '2022', // Versión del formato de guía
      destinatario: {
        tipoDoc: saleData.customer?.document_type === 'RUC' ? '6' : '1',
        numDoc: saleData.customer?.document_number || '12345678',
        rznSocial: saleData.customer?.business_name || saleData.customer?.full_name || 'Cliente Demo'
      },
      envio: {
        codTraslado: '01', // Venta
        modTraslado: dispatchData.vehicle_type === 'own' ? '02' : '01', // Privado/Público
        fechaTraslado: dispatchData.dispatch_date,
        pesoTotal: dispatchData.total_weight || 0,
        undPesoTotal: 'KGM', // Unidad de peso total (Kilogramos)
        numBultos: dispatchData.num_bultos || null,
        partida: {
          ubigueo: saleData.branch?.ubigueo || '150101',
          direccion: saleData.branch?.address || 'Dirección de origen'
        },
        llegada: {
          ubigueo: dispatchData.destination_ubigueo,
          direccion: dispatchData.destination_address
        }
      },
      details: (saleData.items || []).map((item: any) => ({
        codigo: item.product?.code || item.code || 'PROD001',
        descripcion: item.product?.description || item.description || 'Producto',
        unidad: item.unit_code || 'NIU',
        cantidad: item.quantity || 1
      })),
      relatedDocument: {
        id: (saleData.serie || 'F001') + '-' + String(saleData.correlativo || '00000001').padStart(8, '0'),
        documentTypeCode: (saleData.tipo_comprobante === 'factura') ? '01' : '03',
        documentType: (saleData.tipo_comprobante === 'factura') ? 'Factura' : 'Boleta',
        issuerPartyRuc: saleData.company?.ruc || saleData.ruc || '10000000001'
      }
    }

    // Agregar datos de transporte según el tipo
    if (dispatchData.vehicle_type === 'own') {
      // Transporte privado - Solo vehículo y conductor
      guideData.envio.vehiculo = {
        placa: dispatchData.vehicle_plate
      }
      if (dispatchData.driver_id) {
        console.log('🔧 DespatchGuides Store - Procesando conductor:', {
          driver_document_type: dispatchData.driver.document_type,
          isDocTypeDNI: dispatchData.driver.document_type === '1',
          finalTipoDoc: dispatchData.driver.document_type === '1' ? '1' : '6'
        })

        guideData.envio.conductor = {
          tipoDoc: dispatchData.driver.document_type === '1' ? '1' : '6',
          numDoc: dispatchData.driver.document_number,
          nombres: dispatchData.driver.names,
          apellidos: dispatchData.driver.last_names,
          licencia: dispatchData.driver.license_number
        }

        console.log('✅ DespatchGuides Store - Conductor final:', guideData.envio.conductor)
      }
      // NO agregar transportista para transporte privado
    } else {
      // Transporte público - Solo transportista
      guideData.envio.transportista = {
        tipoDoc: '6',
        numDoc: dispatchData.carrier_ruc,
        rznSocial: dispatchData.carrier_name,
        nroMtc: dispatchData.carrier_mtc
      }
      // NO agregar vehículo ni conductor para transporte público
    }

    // Enviar a SUNAT
    const sunatResult = await sendDespatchGuide(guideData)

    // Si el envío fue exitoso, guardar también en Supabase
    if (sunatResult.success) {
      try {
        const supabaseRecord = await saveToSupabase(guideData, sunatResult, saleData, dispatchData, seriesData)
        console.log('Dispatch guide saved to both SUNAT and Supabase successfully')

        // Agregar el ID de Supabase al resultado
        sunatResult.supabase_id = supabaseRecord.id
      } catch (supabaseError) {
        console.error('Failed to save to Supabase, but SUNAT submission was successful:', supabaseError)
        // No lanzar error aquí para no interferir con el flujo exitoso de SUNAT
        // El usuario sabrá que se envió a SUNAT correctamente
        sunatResult.supabase_error = supabaseError.message
      }
    }

    return sunatResult
  }

  // Computed
  const pendingGuides = computed(() =>
    despatchGuides.value.filter(guide => guide.estado_sunat === 'PENDIENTE')
  )

  const sentGuides = computed(() =>
    despatchGuides.value.filter(guide => guide.estado_sunat === 'ENVIADO')
  )

  const acceptedGuides = computed(() =>
    despatchGuides.value.filter(guide => guide.estado_sunat === 'ACEPTADO')
  )

  const rejectedGuides = computed(() =>
    despatchGuides.value.filter(guide => guide.estado_sunat === 'RECHAZADO')
  )

  return {
    // State
    despatchGuides,
    currentDespatchGuide,
    loading,
    error,

    // Actions
    fetchDespatchGuides,
    fetchDespatchGuide,
    sendDespatchGuide,
    checkDespatchGuideStatus,
    generateDespatchGuideXML,
    generateDespatchGuidePDF,
    createDespatchGuideFromSale,
    createDespatchGuidesFromDispatchOrder,
    saveToSupabase,
    fetchDespatchGuidesFromSupabase,
    fetchDespatchGuideFromSupabase,
    updateDespatchGuideStatus,
    getAvailableDocumentSeries,
    getSunatTransferReasons,
    getSunatTransferModalities,
    getCustomers,
    getValidToken,

    // Computed
    pendingGuides,
    sentGuides,
    acceptedGuides,
    rejectedGuides
  }
})
