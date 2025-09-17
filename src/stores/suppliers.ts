import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

// Related table interfaces
export interface PartyContact {
  id: string
  company_id: string
  party_id: string
  name?: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface PartyLocation {
  id: string
  party_id: string
  latitude: number
  longitude: number
  sequence?: number
  is_primary: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface PartyEstablecimiento {
  id: string
  party_id: string
  codigo?: string
  tipo_establecimiento?: string
  actividad_economica?: string
  direccion?: string
  ubigeo_sunat?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface PartyRepresentante {
  id: string
  party_id: string
  tipo_de_documento?: string
  numero_de_documento?: string
  nombre?: string
  cargo?: string
  fecha_desde?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Supplier {
  id: string
  company_id: string
  // Party fields from migration
  is_customer: boolean
  is_supplier: boolean
  doc_type: string
  doc_number: string
  apellido_paterno?: string
  apellido_materno?: string
  nombres?: string
  razon_social?: string
  fullname?: string // Generated field
  email?: string
  phone?: string
  address?: string
  ubigeo_code?: string
  country_code: string
  establishments?: any[] // JSONB field
  representatives?: any[] // JSONB field
  created_at: string
  updated_at: string
  deleted_at?: string

  // Computed/mapped fields for UI
  name: string
  party_type: 'individual' | 'company'
  commercial_name?: string
  mobile?: string
  website?: string
  reference?: string
  coordinates?: string
  notes?: string

  // Related data
  contacts?: PartyContact[]
  locations?: PartyLocation[]
  establecimientos?: PartyEstablecimiento[]
  representantes?: PartyRepresentante[]
}

export interface SupplierStats {
  total: number
  companies: number
  individuals: number
  recentlyAdded: number
}

export interface CreateSupplierRequest {
  party_type: 'individual' | 'company'
  doc_type: string
  doc_number: string

  // Name fields (mapped based on party_type)
  name: string
  apellido_paterno?: string
  apellido_materno?: string
  nombres?: string
  razon_social?: string

  // Contact info
  email?: string
  phone?: string
  address?: string
  ubigeo?: string
  country_code?: string

  // UI-only fields (not stored directly in parties table)
  commercial_name?: string
  mobile?: string
  website?: string
  reference?: string
  coordinates?: string
  notes?: string

  // Related data
  contacts?: Omit<PartyContact, 'id' | 'party_id' | 'created_at' | 'updated_at'>[]
  locations?: Omit<PartyLocation, 'id' | 'party_id' | 'created_at' | 'updated_at'>[]
  establecimientos?: Omit<PartyEstablecimiento, 'id' | 'party_id' | 'created_at' | 'updated_at'>[]
  representantes?: Omit<PartyRepresentante, 'id' | 'party_id' | 'created_at' | 'updated_at'>[]
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string
}

export const useSuppliersStore = defineStore('suppliers', () => {
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const stats = ref<SupplierStats>({
    total: 0,
    companies: 0,
    individuals: 0,
    recentlyAdded: 0
  })

  const fetchSuppliers = async (companyId: string) => {
    loading.value = true
    error.value = null

    try {
      // Fetch parties with all related data
      const { data: partiesData, error: partiesError } = await supabase
        .from('parties')
        .select(`
          *,
          party_contacts(
            id,
            name,
            email,
            phone,
            notes,
            created_at,
            updated_at,
            deleted_at
          ),
          party_locations(
            id,
            latitude,
            longitude,
            sequence,
            is_primary,
            description,
            created_at,
            updated_at
          ),
          party_establecimientos(
            id,
            codigo,
            tipo_establecimiento,
            actividad_economica,
            direccion,
            ubigeo_sunat,
            created_at,
            updated_at,
            deleted_at
          ),
          party_representantes(
            id,
            tipo_de_documento,
            numero_de_documento,
            nombre,
            cargo,
            fecha_desde,
            created_at,
            updated_at,
            deleted_at
          )
        `)
        .eq('company_id', companyId)
        .eq('is_supplier', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (partiesError) throw partiesError

      // Map database data to frontend format
      const mappedSuppliers: Supplier[] = (partiesData || []).map(party => {
        // Get primary location for coordinates
        const primaryLocation = party.party_locations?.find((loc: any) => loc.is_primary)
        const coordinates = primaryLocation
          ? `${primaryLocation.latitude}, ${primaryLocation.longitude}`
          : ''

        return {
          ...party,
          name: party.fullname || party.razon_social || party.nombres || '',
          party_type: party.razon_social ? 'company' : 'individual',
          ubigeo: party.ubigeo_code || '',
          coordinates,
          // UI-only fields (not in database)
          commercial_name: '',
          mobile: '',
          website: '',
          reference: '',
          notes: '',
          // Related data
          contacts: party.party_contacts || [],
          locations: party.party_locations || [],
          establecimientos: party.party_establecimientos || [],
          representantes: party.party_representantes || []
        }
      })

      suppliers.value = mappedSuppliers
      updateStats()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching suppliers'
      console.error('Error fetching suppliers:', err)
    } finally {
      loading.value = false
    }
  }

  const createSupplier = async (supplierData: CreateSupplierRequest, companyId: string): Promise<Supplier | null> => {
    if (!companyId) {
      error.value = 'No company selected'
      return null
    }

    loading.value = true
    error.value = null

    try {
      // Map form data to parties table structure
      const newParty = {
        company_id: companyId,
        is_supplier: true,
        is_customer: false,
        doc_type: supplierData.doc_type,
        doc_number: supplierData.doc_number,
        email: supplierData.email,
        phone: supplierData.phone,
        address: supplierData.address,
        ubigeo_code: supplierData.ubigeo,
        country_code: supplierData.country_code || 'PE',
        // Map name fields based on party type
        ...(supplierData.party_type === 'company' ? {
          razon_social: supplierData.name,
          apellido_paterno: null,
          apellido_materno: null,
          nombres: null
        } : {
          razon_social: null,
          nombres: supplierData.name,
          apellido_paterno: supplierData.apellido_paterno || null,
          apellido_materno: supplierData.apellido_materno || null
        }),
        // Store additional data in JSONB fields if needed
        establishments: supplierData.establecimientos || [],
        representatives: supplierData.representantes || []
      }

      // Create the main party record
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .insert(newParty)
        .select()
        .single()

      if (partyError) throw partyError

      const partyId = partyData.id

      // Create related records in parallel
      const promises: Promise<any>[] = []

      // Insert contacts
      if (supplierData.contacts && supplierData.contacts.length > 0) {
        const contactInserts = supplierData.contacts.map(contact => ({
          ...contact,
          company_id: companyId,
          party_id: partyId
        }))
        promises.push(
          supabase.from('party_contacts').insert(contactInserts)
        )
      }

      // Insert locations
      if (supplierData.locations && supplierData.locations.length > 0) {
        const locationInserts = supplierData.locations.map(location => ({
          ...location,
          party_id: partyId
        }))
        promises.push(
          supabase.from('party_locations').insert(locationInserts)
        )
      }

      // Insert establecimientos
      if (supplierData.establecimientos && supplierData.establecimientos.length > 0) {
        const establecimientoInserts = supplierData.establecimientos.map(establecimiento => ({
          ...establecimiento,
          party_id: partyId
        }))
        promises.push(
          supabase.from('party_establecimientos').insert(establecimientoInserts)
        )
      }

      // Insert representantes
      if (supplierData.representantes && supplierData.representantes.length > 0) {
        const representanteInserts = supplierData.representantes.map(representante => ({
          ...representante,
          party_id: partyId
        }))
        promises.push(
          supabase.from('party_representantes').insert(representanteInserts)
        )
      }

      // Handle coordinates by creating a location if provided
      if (supplierData.coordinates) {
        const [lat, lng] = supplierData.coordinates.split(',').map(coord => parseFloat(coord.trim()))
        if (!isNaN(lat) && !isNaN(lng)) {
          promises.push(
            supabase.from('party_locations').insert({
              party_id: partyId,
              latitude: lat,
              longitude: lng,
              is_primary: true,
              description: 'Ubicación principal'
            })
          )
        }
      }

      // Wait for all related inserts to complete
      await Promise.all(promises)

      // Map the created data back to frontend format
      const mappedSupplier: Supplier = {
        ...partyData,
        name: partyData.fullname || partyData.razon_social || partyData.nombres || '',
        party_type: partyData.razon_social ? 'company' : 'individual',
        commercial_name: supplierData.commercial_name || '',
        mobile: supplierData.mobile || '',
        website: supplierData.website || '',
        reference: supplierData.reference || '',
        coordinates: supplierData.coordinates || '',
        notes: supplierData.notes || '',
        contacts: [],
        locations: [],
        establecimientos: [],
        representantes: []
      }

      suppliers.value.unshift(mappedSupplier)
      updateStats()
      return mappedSupplier
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error creating supplier'
      console.error('Error creating supplier:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateSupplier = async (supplierData: UpdateSupplierRequest): Promise<Supplier | null> => {
    loading.value = true
    error.value = null

    try {
      const { id, ...updateData } = supplierData

      // Map form data to parties table structure
      const mappedUpdateData = {
        doc_type: updateData.doc_type,
        doc_number: updateData.doc_number,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        ubigeo_code: updateData.ubigeo,
        country_code: updateData.country_code,
        // Map name fields based on party type
        ...(updateData.party_type === 'company' ? {
          razon_social: updateData.name,
          apellido_paterno: null,
          apellido_materno: null,
          nombres: null
        } : {
          razon_social: null,
          nombres: updateData.name,
          apellido_paterno: updateData.apellido_paterno,
          apellido_materno: updateData.apellido_materno
        }),
        // Update JSONB fields if provided
        ...(updateData.establecimientos && {
          establishments: updateData.establecimientos
        }),
        ...(updateData.representantes && {
          representatives: updateData.representantes
        }),
        updated_at: new Date().toISOString()
      }

      // Update the main party record
      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .update(mappedUpdateData)
        .eq('id', id)
        .select()
        .single()

      if (partyError) throw partyError

      // Update related tables
      const promises: Promise<any>[] = []

      // Update contacts
      if (updateData.contacts !== undefined) {
        // Delete existing contacts and insert new ones (simple approach)
        promises.push(
          supabase.from('party_contacts').delete().eq('party_id', id).then(() => {
            if (updateData.contacts && updateData.contacts.length > 0) {
              const contactInserts = updateData.contacts.map(contact => ({
                ...contact,
                company_id: partyData.company_id,
                party_id: id
              }))
              return supabase.from('party_contacts').insert(contactInserts)
            }
          })
        )
      }

      // Update locations
      if (updateData.locations !== undefined) {
        promises.push(
          supabase.from('party_locations').delete().eq('party_id', id).then(() => {
            if (updateData.locations && updateData.locations.length > 0) {
              const locationInserts = updateData.locations.map(location => ({
                ...location,
                party_id: id
              }))
              return supabase.from('party_locations').insert(locationInserts)
            }
          })
        )
      }

      // Handle coordinates update
      if (updateData.coordinates !== undefined) {
        if (updateData.coordinates) {
          const [lat, lng] = updateData.coordinates.split(',').map(coord => parseFloat(coord.trim()))
          if (!isNaN(lat) && !isNaN(lng)) {
            promises.push(
              supabase.from('party_locations').delete().eq('party_id', id).eq('is_primary', true).then(() =>
                supabase.from('party_locations').insert({
                  party_id: id,
                  latitude: lat,
                  longitude: lng,
                  is_primary: true,
                  description: 'Ubicación principal'
                })
              )
            )
          }
        } else {
          // Clear coordinates
          promises.push(
            supabase.from('party_locations').delete().eq('party_id', id).eq('is_primary', true)
          )
        }
      }

      // Update establecimientos
      if (updateData.establecimientos !== undefined) {
        promises.push(
          supabase.from('party_establecimientos').delete().eq('party_id', id).then(() => {
            if (updateData.establecimientos && updateData.establecimientos.length > 0) {
              const establecimientoInserts = updateData.establecimientos.map(establecimiento => ({
                ...establecimiento,
                party_id: id
              }))
              return supabase.from('party_establecimientos').insert(establecimientoInserts)
            }
          })
        )
      }

      // Update representantes
      if (updateData.representantes !== undefined) {
        promises.push(
          supabase.from('party_representantes').delete().eq('party_id', id).then(() => {
            if (updateData.representantes && updateData.representantes.length > 0) {
              const representanteInserts = updateData.representantes.map(representante => ({
                ...representante,
                party_id: id
              }))
              return supabase.from('party_representantes').insert(representanteInserts)
            }
          })
        )
      }

      // Wait for all updates to complete
      await Promise.all(promises)

      // Fetch updated data with all relations
      const { data: updatedData, error: fetchError } = await supabase
        .from('parties')
        .select(`
          *,
          party_contacts(*),
          party_locations(*),
          party_establecimientos(*),
          party_representantes(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Map response back to frontend format
      const primaryLocation = updatedData.party_locations?.find((loc: any) => loc.is_primary)
      const coordinates = primaryLocation
        ? `${primaryLocation.latitude}, ${primaryLocation.longitude}`
        : ''

      const mappedData: Supplier = {
        ...updatedData,
        name: updatedData.fullname || updatedData.razon_social || updatedData.nombres || '',
        party_type: updatedData.razon_social ? 'company' : 'individual',
        ubigeo: updatedData.ubigeo_code || '',
        coordinates,
        // UI-only fields
        commercial_name: updateData.commercial_name || '',
        mobile: updateData.mobile || '',
        website: updateData.website || '',
        reference: updateData.reference || '',
        notes: updateData.notes || '',
        // Related data
        contacts: updatedData.party_contacts || [],
        locations: updatedData.party_locations || [],
        establecimientos: updatedData.party_establecimientos || [],
        representantes: updatedData.party_representantes || []
      }

      const index = suppliers.value.findIndex(s => s.id === id)
      if (index !== -1) {
        suppliers.value[index] = mappedData
        updateStats()
      }

      return mappedData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error updating supplier'
      console.error('Error updating supplier:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteSupplier = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const { error: supabaseError } = await supabase
        .from('parties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (supabaseError) throw supabaseError

      suppliers.value = suppliers.value.filter(s => s.id !== id)
      updateStats()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting supplier'
      console.error('Error deleting supplier:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const getSupplierById = (id: string): Supplier | undefined => {
    return suppliers.value.find(s => s.id === id)
  }

  const getSuppliersByType = (type: 'individual' | 'company'): Supplier[] => {
    return suppliers.value.filter(s => s.party_type === type)
  }

  const searchSuppliers = (query: string): Supplier[] => {
    if (!query.trim()) return suppliers.value

    const searchTerm = query.toLowerCase().trim()
    return suppliers.value.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.commercial_name?.toLowerCase().includes(searchTerm) ||
      supplier.doc_number.includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.mobile?.includes(searchTerm)
    )
  }

  const updateStats = () => {
    const total = suppliers.value.length
    const companies = suppliers.value.filter(s => s.party_type === 'company').length
    const individuals = suppliers.value.filter(s => s.party_type === 'individual').length
    
    // Count suppliers added in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentlyAdded = suppliers.value.filter(s => 
      new Date(s.created_at) > thirtyDaysAgo
    ).length

    stats.value = {
      total,
      companies,
      individuals,
      recentlyAdded
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    suppliers,
    loading,
    error,
    stats,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    getSuppliersByType,
    searchSuppliers,
    clearError
  }
})