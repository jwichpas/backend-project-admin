import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

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
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('legal_name')

        if (error) throw error
        this.companies = data || []
        console.log('Companies loaded:', this.companies)
      } catch (error: any) {
        console.error('Error fetching companies:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchBranches(companyId: string) {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('company_id', companyId)
          .order('code')

        if (error) throw error
        this.branches = data || []
        console.log('Branches loaded:', this.branches)
      } catch (error: any) {
        console.error('Error fetching branches:', error)
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
