import { supabase } from '@/lib/supabase/client';
import { useOptimisticMutation } from './useOptimisticMutation';
import type { Database } from '@/types/database';

type Deal = Database['public']['Tables']['deals']['Row'];
type DealInsert = Database['public']['Tables']['deals']['Insert'];
type DealUpdate = Database['public']['Tables']['deals']['Update'];

// Hook for creating a new deal
export function useCreateDeal() {
  return useOptimisticMutation<Deal, Error, DealInsert>({
    mutationFn: async (newDeal: DealInsert) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(newDeal)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    queryKey: ['supabase-submissions'],
    optimisticUpdate: (newDeal, currentData) => {
      if (Array.isArray(currentData)) {
        return [
          {
            ...newDeal,
            id: `temp-${Date.now()}`, // Temporary ID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...currentData,
        ];
      }
      return currentData;
    },
    showNotification: true,
  });
}

// Hook for updating a deal
export function useUpdateDeal() {
  return useOptimisticMutation<Deal, Error, { id: string; updates: DealUpdate }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    queryKey: ['supabase-submissions'],
    optimisticUpdate: ({ id, updates }, currentData) => {
      if (Array.isArray(currentData)) {
        return currentData.map((item: any) =>
          item.deal?.id === id 
            ? { ...item, deal: { ...item.deal, ...updates, updated_at: new Date().toISOString() } }
            : item
        );
      }
      return currentData;
    },
  });
}

// Hook for updating deal stage with validation
export function useUpdateDealStage() {
  return useOptimisticMutation<Deal, Error, { id: string; stage: string; probability?: number }>({
    mutationFn: async ({ id, stage, probability }) => {
      const updates: DealUpdate = {
        stage,
        stage_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (probability !== undefined) {
        updates.probability = probability;
      }
      
      // Update status based on stage
      if (stage === 'Closed Won') {
        updates.status = 'won';
        updates.closed_at = new Date().toISOString();
      } else if (stage === 'Closed Lost') {
        updates.status = 'lost';
        updates.closed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    queryKey: ['supabase-submissions'],
    showNotification: true,
  });
}

// Hook for bulk updating deals
export function useBulkUpdateDeals() {
  return useOptimisticMutation<Deal[], Error, { ids: string[]; updates: DealUpdate }>({
    mutationFn: async ({ ids, updates }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .in('id', ids)
        .select();
      
      if (error) throw error;
      return data;
    },
    queryKey: ['supabase-submissions'],
    optimisticUpdate: ({ ids, updates }, currentData) => {
      if (Array.isArray(currentData)) {
        return currentData.map((item: any) =>
          ids.includes(item.deal?.id)
            ? { ...item, deal: { ...item.deal, ...updates, updated_at: new Date().toISOString() } }
            : item
        );
      }
      return currentData;
    },
  });
}

// Hook for deleting a deal (soft delete)
export function useDeleteDeal() {
  return useOptimisticMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    queryKey: ['supabase-submissions'],
    optimisticUpdate: (id, currentData) => {
      if (Array.isArray(currentData)) {
        return currentData.filter((item: any) => item.deal?.id !== id);
      }
      return currentData;
    },
    showNotification: true,
  });
}