import { defineStore } from 'pinia'

export interface Company {
  id: string
  ruc: string
  legal_name: string
  trade_name: string | null
  currency_code: string
  valuation_method: string
  sol_user?: string
  sol_pass?: string
  cert_path?: string
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  company_id: string
  code: string
  name: string
  address: string
  ubigeo_code: string
  is_active: boolean
}

export const useCompanyStore = defineStore('company', {
  state: () => ({
    companies: [] as Company[],
    selectedCompany: null as Company | null,
    branches: [] as Branch[],
    selectedBranch: null as Branch | null,
    loading: false
  }),
  
  getters: {
    currentCompanyBranches: (state) => {
      if (!state.selectedCompany) return []
      return state.branches.filter(branch => branch.company_id === state.selectedCompany?.id)
    }
  },

  actions: {
    async fetchCompanies() {
      this.loading = true
      try {
        // Mock data based on seed.sql
        this.companies = [{
          id: '1',
          ruc: '20600055519',
          legal_name: 'MI EMPRESA SAC',
          trade_name: 'MI EMPRESA',
          currency_code: 'PEN',
          valuation_method: 'PROMEDIO_MOVIL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      } finally {
        this.loading = false
      }
    },

    async fetchBranches(companyId: string) {
      this.loading = true
      try {
        // Mock data based on seed.sql
        this.branches = [
          {
            id: '1',
            company_id: companyId,
            code: '001',
            name: 'Casa Matriz',
            address: 'Av. Arequipa 123',
            ubigeo_code: '150101',
            is_active: true
          },
          {
            id: '2', 
            company_id: companyId,
            code: '002',
            name: 'Sucursal Ate',
            address: 'Av. Nicolás Ayllón 2345',
            ubigeo_code: '150103',
            is_active: true
          },
          {
            id: '3',
            company_id: companyId,
            code: '003', 
            name: 'Sucursal Callao',
            address: 'Av. Saenz Peña 345',
            ubigeo_code: '070101',
            is_active: false
          }
        ]
      } finally {
        this.loading = false
      }
    },

    selectCompany(company: Company) {
      this.selectedCompany = company
      this.fetchBranches(company.id)
    },

    selectBranch(branch: Branch) {
      this.selectedBranch = branch
    }
  }
})
