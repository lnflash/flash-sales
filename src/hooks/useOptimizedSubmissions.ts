import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Submission } from '@/types/submission';
import { useAppStore } from '@/stores/useAppStore';

interface UseOptimizedSubmissionsOptions {
  pageSize?: number;
  filters?: {
    username?: string;
    status?: string;
    signedUp?: boolean;
    territory?: string;
    interestLevel?: number;
    search?: string;
  };
  sortBy?: 'created_at' | 'interest_level' | 'owner_name';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

// Optimized hook for fetching paginated submissions
export function useOptimizedSubmissions({
  pageSize = 50,
  filters = {},
  sortBy = 'created_at',
  sortOrder = 'desc',
  enabled = true
}: UseOptimizedSubmissionsOptions = {}) {
  const addNotification = useAppStore((state) => state.addNotification);

  return useInfiniteQuery({
    queryKey: ['optimized-submissions', filters, sortBy, sortOrder, pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      try {
        let query = supabase
          .from('deals')
          .select('*', { count: 'exact' });

        // Apply filters
        if (filters.username) {
          query = query.eq('username', filters.username);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.signedUp !== undefined) {
          query = query.eq('signed_up', filters.signedUp);
        }
        if (filters.territory) {
          query = query.eq('territory', filters.territory);
        }
        if (filters.interestLevel !== undefined) {
          query = query.gte('interest_level', filters.interestLevel);
        }
        if (filters.search) {
          query = query.or(`owner_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
        }

        // Apply sorting
        const sortColumn = sortBy === 'owner_name' ? 'owner_name' : sortBy;
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        // Apply pagination
        const page = pageParam as number;
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        // Transform to Submission type
        const submissions: Submission[] = (data || []).map((deal: any) => ({
          id: deal.id,
          timestamp: deal.created_at,
          ownerName: deal.owner_name || '',
          phoneNumber: deal.phone_number,
          email: deal.email,
          decisionMakers: deal.decision_makers,
          packageSeen: deal.package_seen || false,
          interestLevel: deal.interest_level,
          specificNeeds: deal.specific_needs,
          signedUp: deal.signed_up || false,
          username: deal.username,
          territory: deal.territory,
          leadStatus: deal.status as any,
          businessType: deal.business_type,
          monthlyRevenue: deal.monthly_revenue,
          numberOfEmployees: deal.number_of_employees,
          yearEstablished: deal.year_established,
          currentProcessor: deal.current_processor,
          monthlyTransactions: deal.monthly_transactions,
          averageTicketSize: deal.average_ticket_size,
          painPoints: deal.pain_points || []
        }));

        return {
          submissions,
          nextPage: page + 1,
          hasMore: (from + submissions.length) < (count || 0),
          totalCount: count || 0
        };
      } catch (error) {
        console.error('Error fetching optimized submissions:', error);
        addNotification({
          type: 'error',
          title: 'Failed to load submissions',
          message: 'Please try refreshing the page'
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    enabled,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false // Don't refetch on window focus for performance
  });
}

// Hook for fetching submission stats with caching
export function useOptimizedSubmissionStats(filters: UseOptimizedSubmissionsOptions['filters'] = {}) {
  return useQuery({
    queryKey: ['submission-stats', filters],
    queryFn: async () => {
      try {
        // Use aggregated queries for better performance
        let baseQuery = supabase.from('deals').select('*', { count: 'exact', head: true });

        // Apply filters
        if (filters.username) {
          baseQuery = baseQuery.eq('username', filters.username);
        }
        if (filters.territory) {
          baseQuery = baseQuery.eq('territory', filters.territory);
        }

        const [
          totalResult,
          signedUpResult,
          avgInterestResult,
          packageSeenResult
        ] = await Promise.all([
          // Total count
          baseQuery,
          // Signed up count
          supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('signed_up', true)
            .match(filters.username ? { username: filters.username } : {}),
          // Average interest level
          supabase
            .from('deals')
            .select('interest_level')
            .match(filters.username ? { username: filters.username } : {}),
          // Package seen count
          supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('package_seen', true)
            .match(filters.username ? { username: filters.username } : {})
        ]);

        const total = totalResult.count || 0;
        const signedUp = signedUpResult.count || 0;
        const packageSeen = packageSeenResult.count || 0;

        // Calculate average interest level
        const interestLevels = avgInterestResult.data?.map((d: any) => d.interest_level).filter(Boolean) || [];
        const avgInterestLevel = interestLevels.length > 0
          ? interestLevels.reduce((a: number, b: number) => a + b, 0) / interestLevels.length
          : 0;

        return {
          total,
          signedUp,
          avgInterestLevel,
          packageSeenPercentage: total > 0 ? (packageSeen / total) * 100 : 0,
          conversionRate: total > 0 ? (signedUp / total) * 100 : 0
        };
      } catch (error) {
        console.error('Error fetching submission stats:', error);
        throw error;
      }
    },
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000 // Keep in cache for 5 minutes
  });
}

// Hook for fetching hot leads with caching
export function useOptimizedHotLeads(limit: number = 10) {
  return useQuery({
    queryKey: ['hot-leads', limit],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .gte('interest_level', 4)
          .order('interest_level', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Transform to Submission type
        const submissions: Submission[] = (data || []).map((deal: any) => ({
          id: deal.id,
          timestamp: deal.created_at,
          ownerName: deal.owner_name || '',
          phoneNumber: deal.phone_number,
          email: deal.email,
          decisionMakers: deal.decision_makers,
          packageSeen: deal.package_seen || false,
          interestLevel: deal.interest_level,
          specificNeeds: deal.specific_needs,
          signedUp: deal.signed_up || false,
          username: deal.username,
          territory: deal.territory,
          leadStatus: deal.status as any,
          businessType: deal.business_type,
          monthlyRevenue: deal.monthly_revenue,
          numberOfEmployees: deal.number_of_employees,
          yearEstablished: deal.year_established,
          currentProcessor: deal.current_processor,
          monthlyTransactions: deal.monthly_transactions,
          averageTicketSize: deal.average_ticket_size,
          painPoints: deal.pain_points || []
        }));

        return submissions;
      } catch (error) {
        console.error('Error fetching hot leads:', error);
        throw error;
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000 // Keep in cache for 5 minutes
  });
}