import { supabase } from '@/lib/supabase'
import { ensureInvoicesBucketExists, generateInvoiceFileName } from '@/utils/supabaseStorage'

interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface InvoiceData {
  ublVersion: string
  tipoDoc: string
  tipoOperacion: string
  serie: string
  correlativo: string
  fechaEmision: string
  formaPago: {
    moneda: string
    tipo: string
  }
  tipoMoneda: string
  company: {
    ruc: number
    razonSocial: string
    nombreComercial: string
    address: {
      ubigueo: string
      departamento: string
      provincia: string
      distrito: string
      urbanizacion: string
      direccion: string
      codLocal: string
    }
  }
  client: {
    tipoDoc: string
    numDoc: number | string
    rznSocial: string
  }
  mtoOperGravadas: number
  mtoIGV: number
  totalImpuestos: number
  valorVenta: number
  subTotal: number
  mtoImpVenta: number
  details: Array<{
    tipAfeIgv: number
    codProducto: string
    unidad: string
    descripcion: string
    cantidad: number
    mtoValorUnitario: number
    mtoValorVenta: number
    mtoBaseIgv: number
    porcentajeIgv: number
    igv: number
    totalImpuestos: number
    mtoPrecioUnitario: number
  }>
  legends: Array<{
    code: string
    value: string
  }>
}

interface InvoiceResponse {
  xml: string
  hash: string
  sunatResponse: {
    success: boolean
    cdrZip: string
    cdrResponse: {
      code: number
      description: string
      notes: string[]
    }
  }
}

class ElectronicInvoicingService {
  private baseUrl: string
  private user: string
  private password: string
  private tokenKey = 'facturacion_token'
  private tokenExpiryKey = 'facturacion_token_expiry'

  constructor() {
    this.baseUrl = import.meta.env.VITE_FACTURACION_URL || ''
    this.user = import.meta.env.VITE_FACTURACION_USER || ''
    this.password = import.meta.env.VITE_FACTURACION_CLAVE || ''

    if (!this.baseUrl || !this.user || !this.password) {
      console.warn('Electronic invoicing environment variables not configured')
    }
  }

  private isTokenValid(): boolean {
    const token = localStorage.getItem(this.tokenKey)
    const expiry = localStorage.getItem(this.tokenExpiryKey)

    if (!token || !expiry) {
      return false
    }

    const expiryTime = parseInt(expiry)
    const now = Date.now()

    // Check if token expires in less than 5 minutes
    return (expiryTime - now) > 5 * 60 * 1000
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.user,
          password: this.password
        })
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data: AuthResponse = await response.json()

      // Store token with expiry time
      const expiryTime = Date.now() + (data.expires_in * 1000)
      localStorage.setItem(this.tokenKey, data.access_token)
      localStorage.setItem(this.tokenExpiryKey, expiryTime.toString())

      return data.access_token
    } catch (error) {
      console.error('Failed to authenticate with invoicing service:', error)
      throw error
    }
  }

  private async getValidToken(): Promise<string> {
    if (this.isTokenValid()) {
      return localStorage.getItem(this.tokenKey)!
    }

    return await this.authenticate()
  }

  async sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResponse> {
    try {
      const token = await this.getValidToken()

      const response = await fetch(`${this.baseUrl}/api/invoices/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be invalid, try to re-authenticate
          localStorage.removeItem(this.tokenKey)
          localStorage.removeItem(this.tokenExpiryKey)
          const newToken = await this.authenticate()

          const retryResponse = await fetch(`${this.baseUrl}/api/invoices/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify(invoiceData)
          })

          if (!retryResponse.ok) {
            throw new Error(`Invoice send failed: ${retryResponse.statusText}`)
          }

          return await retryResponse.json()
        }
        throw new Error(`Invoice send failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to send invoice:', error)
      throw error
    }
  }

  private async uploadFileToSupabase(content: string | Uint8Array, fileName: string, mimeType: string): Promise<string> {
    try {
      // Convert content to blob
      const blob = new Blob([content], { type: mimeType })

      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Failed to upload file to Supabase:', error)
      throw error
    }
  }

  async processAndStoreInvoiceResponse(
    salesDocId: string,
    invoiceResponse: InvoiceResponse,
    invoiceData: InvoiceData
  ): Promise<void> {
    try {
      // Ensure the invoices bucket exists
      await ensureInvoicesBucketExists()

      // Generate file names
      const xmlFileName = generateInvoiceFileName(invoiceData.serie, invoiceData.correlativo, 'xml')
      const cdrFileName = generateInvoiceFileName(invoiceData.serie, invoiceData.correlativo, 'cdr')

      // Upload XML
      const xmlUrl = await this.uploadFileToSupabase(
        invoiceResponse.xml,
        xmlFileName,
        'application/xml'
      )

      // Upload CDR ZIP (decode base64 first)
      const cdrZipBuffer = Uint8Array.from(atob(invoiceResponse.sunatResponse.cdrZip), c => c.charCodeAt(0))
      const cdrUrl = await this.uploadFileToSupabase(
        cdrZipBuffer,
        cdrFileName,
        'application/zip'
      )

      // Update sales_docs table
      const { error } = await supabase
        .from('sales_docs')
        .update({
          greenter_xml: xmlUrl,
          greenter_cdr: cdrUrl,
          greenter_hash: invoiceResponse.hash,
          greenter_status: invoiceResponse.sunatResponse.success ? 'ACCEPTED' : 'REJECTED',
          error_message: invoiceResponse.sunatResponse.cdrResponse.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesDocId)

      if (error) {
        throw error
      }

      console.log('Invoice files uploaded and database updated successfully')
    } catch (error) {
      console.error('Failed to process and store invoice response:', error)
      throw error
    }
  }

  // Helper method to convert sales document to invoice format
  convertSalesDocToInvoice(salesDoc: any, cartItems: any[], companyData: any, customerData: any): InvoiceData {
    // Helper function to convert numbers to words (simplified)
    const numberToWords = (amount: number): string => {
      // This is a simplified version, you might want to use a proper library
      const integerPart = Math.floor(amount)
      const decimalPart = Math.round((amount - integerPart) * 100)
      return `SON ${integerPart} CON ${decimalPart.toString().padStart(2, '0')}/100 SOLES`
    }

    const details = cartItems.map(item => {
      const unitPrice = item.unit_price
      const quantity = item.quantity
      const subtotal = unitPrice * quantity
      const igvRate = 18 // 18% IGV
      const igvAmount = subtotal * (igvRate / 100)
      const totalWithIgv = subtotal + igvAmount

      return {
        tipAfeIgv: 10, // Gravado - Operación Onerosa
        codProducto: item.product.sku || item.product.product_id,
        unidad: item.selected_unit || item.product.unit_code,
        descripcion: item.product.product_name,
        cantidad: quantity,
        mtoValorUnitario: unitPrice,
        mtoValorVenta: subtotal,
        mtoBaseIgv: subtotal,
        porcentajeIgv: igvRate,
        igv: igvAmount,
        totalImpuestos: igvAmount,
        mtoPrecioUnitario: unitPrice * (1 + igvRate / 100)
      }
    })

    const mtoOperGravadas = details.reduce((sum, detail) => sum + detail.mtoValorVenta, 0)
    const mtoIGV = details.reduce((sum, detail) => sum + detail.igv, 0)
    const mtoImpVenta = mtoOperGravadas + mtoIGV

    return {
      ublVersion: "2.1",
      tipoDoc: salesDoc.doc_type,
      tipoOperacion: "0101", // Venta interna
      serie: salesDoc.series,
      correlativo: salesDoc.number.toString(),
      fechaEmision: new Date(salesDoc.issue_date).toISOString(),
      formaPago: {
        moneda: salesDoc.currency_code,
        tipo: "Contado"
      },
      tipoMoneda: salesDoc.currency_code,
      company: {
        ruc: parseInt(companyData.ruc),
        razonSocial: companyData.legal_name,
        nombreComercial: companyData.trade_name || companyData.legal_name,
        address: {
          ubigueo: companyData.ubigeo_code || "150101",
          departamento: "LIMA", // Should come from ubigeo lookup
          provincia: "LIMA",
          distrito: "LIMA",
          urbanizacion: "-",
          direccion: companyData.address || "",
          codLocal: "0000"
        }
      },
      client: {
        tipoDoc: customerData?.doc_type || "1",
        numDoc: customerData?.doc_number ?
          (customerData.doc_type === "6" ? parseInt(customerData.doc_number) : customerData.doc_number)
          : "11111111",
        rznSocial: customerData?.fullname || "Cliente General"
      },
      mtoOperGravadas: Math.round(mtoOperGravadas * 100) / 100,
      mtoIGV: Math.round(mtoIGV * 100) / 100,
      totalImpuestos: Math.round(mtoIGV * 100) / 100,
      valorVenta: Math.round(mtoOperGravadas * 100) / 100,
      subTotal: Math.round(mtoImpVenta * 100) / 100,
      mtoImpVenta: Math.round(mtoImpVenta * 100) / 100,
      details,
      legends: [
        {
          code: "1000",
          value: numberToWords(mtoImpVenta)
        }
      ]
    }
  }
}

export const electronicInvoicingService = new ElectronicInvoicingService()
export type { InvoiceData, InvoiceResponse }