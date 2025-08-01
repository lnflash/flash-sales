import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

interface UpdateSubmissionParams {
  id: string;
  updates: Record<string, any>;
}

export function useOptimisticUpdateSubmission() {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateSubmissionParams) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    
    // Optimistically update the cache
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['submission', id] });

      // Snapshot the previous values
      const previousSubmissions = queryClient.getQueryData(['submissions']);
      const previousSubmission = queryClient.getQueryData(['submission', id]);

      // Optimistically update submissions list
      queryClient.setQueryData(['submissions'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions?.map((sub: any) =>
            sub.id === id ? { ...sub, ...updates } : sub
          ),
        };
      });

      // Optimistically update individual submission
      queryClient.setQueryData(['submission', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      // Return context with snapshots
      return { previousSubmissions, previousSubmission };
    },

    // If mutation fails, rollback with snapshots
    onError: (err, { id }, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      if (context?.previousSubmission) {
        queryClient.setQueryData(['submission', id], context.previousSubmission);
      }
      
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update submission. Please try again.',
      });
    },

    // Always refetch after error or success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', id] });
    },

    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Submission updated successfully',
      });
    },
  });
}

// Optimistic create submission
export function useOptimisticCreateSubmission() {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  return useMutation({
    mutationFn: async (newSubmission: any) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(newSubmission)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onMutate: async (newSubmission) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      // Create temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticSubmission = {
        ...newSubmission,
        id: tempId,
        created_at: new Date().toISOString(),
      };

      // Add to submissions list
      queryClient.setQueryData(['submissions'], (old: any) => {
        if (!old) return { submissions: [optimisticSubmission], count: 1 };
        return {
          ...old,
          submissions: [optimisticSubmission, ...old.submissions],
          count: old.count + 1,
        };
      });

      return { previousSubmissions, tempId };
    },

    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create submission. Please try again.',
      });
    },

    onSuccess: (data, variables, context) => {
      // Replace temp submission with real one
      queryClient.setQueryData(['submissions'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.map((sub: any) =>
            sub.id === context?.tempId ? data : sub
          ),
        };
      });

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Submission created successfully',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Optimistic delete submission
export function useOptimisticDeleteSubmission() {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      // Remove from cache
      queryClient.setQueryData(['submissions'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions?.filter((sub: any) => sub.id !== id),
          count: Math.max(0, old.count - 1),
        };
      });

      return { previousSubmissions };
    },

    onError: (err, id, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete submission. Please try again.',
      });
    },

    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Submission deleted successfully',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}