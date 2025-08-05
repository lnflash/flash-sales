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
      // Use RPC function to bypass CORS restrictions
      const { data, error } = await supabase.rpc('update_deal', {
        deal_id_param: id,
        name_param: updates.name || null,
        organization_id_param: updates.organization_id || null,
        primary_contact_id_param: updates.primary_contact_id || null,
        package_seen_param: updates.package_seen !== undefined ? updates.package_seen : null,
        decision_makers_param: updates.decision_makers || null,
        interest_level_param: updates.interest_level || null,
        status_param: updates.status || null,
        lead_status_param: updates.lead_status || null,
        specific_needs_param: updates.specific_needs || null,
        stage_param: updates.stage || null,
        custom_fields_param: updates.custom_fields || null
      });
      
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
      let status = null;
      
      // Update status based on stage
      if (stage === 'Closed Won') {
        status = 'won';
      } else if (stage === 'Closed Lost') {
        status = 'lost';
      }
      
      // Use RPC function to bypass CORS restrictions
      const { data, error } = await supabase.rpc('update_deal', {
        deal_id_param: id,
        name_param: null,
        organization_id_param: null,
        primary_contact_id_param: null,
        package_seen_param: null,
        decision_makers_param: null,
        interest_level_param: null,
        status_param: status,
        lead_status_param: null,
        specific_needs_param: null,
        stage_param: stage,
        metadata_param: null
      });
      
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
      // Use RPC function for each deal to bypass CORS restrictions
      const updatePromises = ids.map(id => 
        supabase.rpc('update_deal', {
          deal_id_param: id,
          name_param: updates.name || null,
          organization_id_param: updates.organization_id || null,
          primary_contact_id_param: updates.primary_contact_id || null,
          package_seen_param: updates.package_seen !== undefined ? updates.package_seen : null,
          decision_makers_param: updates.decision_makers || null,
          interest_level_param: updates.interest_level || null,
          status_param: updates.status || null,
          lead_status_param: updates.lead_status || null,
          specific_needs_param: updates.specific_needs || null,
          stage_param: updates.stage || null,
          custom_fields_param: updates.custom_fields || null
        })
      );
      
      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} deals`);
      }
      
      return results.map(r => r.data).filter(Boolean);
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
      // Use RPC function to bypass CORS restrictions
      const { error } = await supabase.rpc('soft_delete_deal', {
        deal_id_param: id
      });
      
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