import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';

interface OptimisticMutationOptions<TData, TError, TVariables, TContext> 
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey?: string[];
  optimisticUpdate?: (variables: TVariables, currentData: any) => any;
  rollbackOnError?: boolean;
  showNotification?: boolean;
}

export function useOptimisticMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(options: OptimisticMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  
  const {
    mutationFn,
    queryKey,
    optimisticUpdate,
    rollbackOnError = true,
    showNotification = true,
    onSuccess,
    onError,
    onMutate,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      if (queryKey) {
        await queryClient.cancelQueries({ queryKey });
      }

      // Snapshot the previous value
      const previousData = queryKey ? queryClient.getQueryData(queryKey) : null;

      // Optimistically update to the new value
      if (queryKey && optimisticUpdate && previousData) {
        queryClient.setQueryData(queryKey, (old: any) => 
          optimisticUpdate(variables, old)
        );
      }

      // Call user's onMutate if provided
      const userContext = onMutate ? await onMutate(variables) : {};

      // Return a context object with the snapshotted value
      return { previousData, ...userContext } as TContext;
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (rollbackOnError && queryKey && context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (showNotification) {
        addNotification({
          type: 'error',
          title: 'Operation Failed',
          message: error instanceof Error ? error.message : 'An error occurred',
        });
      }

      // Call user's onError if provided
      onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (showNotification) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully',
        });
      }

      // Call user's onSuccess if provided
      onSuccess?.(data, variables, context);
    },
    onSettled: () => {
      // Always refetch after error or success
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    ...mutationOptions,
  });
}