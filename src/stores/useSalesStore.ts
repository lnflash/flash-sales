import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Deal = Database['public']['Tables']['deals']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface SalesState {
  // Real-time data
  recentDeals: Deal[]
  activeDeals: Deal[]
  
  // Aggregated stats
  stats: {
    totalDeals: number
    closedDeals: number
    revenue: number
    conversionRate: number
    avgDealSize: number
  }
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchDeals: () => Promise<void>
  subscribeToDeals: () => () => void
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>
}

export const useSalesStore = create<SalesState>()(
  subscribeWithSelector((set, get) => ({
    recentDeals: [],
    activeDeals: [],
    stats: {
      totalDeals: 0,
      closedDeals: 0,
      revenue: 0,
      conversionRate: 0,
      avgDealSize: 0,
    },
    isLoading: false,
    error: null,
    
    fetchDeals: async () => {
      set({ isLoading: true, error: null })
      
      try {
        // Fetch recent deals
        const { data: recent, error: recentError } = await supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (recentError) throw recentError
        
        // Fetch active deals
        const { data: active, error: activeError } = await supabase
          .from('deals')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
        
        if (activeError) throw activeError
        
        // Calculate stats
        const totalDeals = recent?.length || 0
        const closedDeals = recent?.filter((d: any) => d.status === 'won').length || 0
        const revenue = recent?.reduce((sum: number, d: any) => 
          d.status === 'won' ? sum + (d.amount || 0) : sum, 0
        ) || 0
        const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0
        const avgDealSize = closedDeals > 0 ? revenue / closedDeals : 0
        
        set({
          recentDeals: recent || [],
          activeDeals: active || [],
          stats: {
            totalDeals,
            closedDeals,
            revenue,
            conversionRate,
            avgDealSize,
          },
          isLoading: false,
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch deals',
          isLoading: false 
        })
      }
    },
    
    subscribeToDeals: () => {
      const channel = supabase
        .channel('deals-store')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals'
          },
          (payload: any) => {
            // Refetch data on any change
            get().fetchDeals()
          }
        )
        .subscribe()
      
      // Return cleanup function
      return () => {
        supabase.removeChannel(channel)
      }
    },
    
    updateDeal: async (dealId, updates) => {
      const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId)
      
      if (error) {
        set({ error: error.message })
        throw error
      }
      
      // Optimistically update local state
      set((state) => ({
        recentDeals: state.recentDeals.map(d => 
          d.id === dealId ? { ...d, ...updates } : d
        ),
        activeDeals: state.activeDeals.map(d => 
          d.id === dealId ? { ...d, ...updates } : d
        ),
      }))
    },
  }))
)