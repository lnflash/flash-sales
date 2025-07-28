import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Deal = Database['public']['Tables']['deals']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type Contact = Database['public']['Tables']['contacts']['Row'];

export interface SupabaseSubmission {
  id: string;
  organization: Organization;
  contact?: Contact;
  deal: Deal;
  ownerName: string;
  phoneNumber?: string;
  packageSeen: boolean;
  decisionMakers?: string;
  interestLevel: number;
  signedUp: boolean;
  specificNeeds?: string;
  timestamp: string;
  username?: string;
}

export function useSupabaseSubmissions() {
  return useQuery({
    queryKey: ['supabase-submissions'],
    queryFn: async () => {
      // Fetch deals with related organizations and contacts
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          organization:organizations!inner(*),
          contact:contacts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match the old submission format for compatibility
      const submissions: SupabaseSubmission[] = data.map((item: any) => ({
        id: item.id,
        organization: item.organization,
        contact: item.contact?.[0],
        deal: item,
        // Map to old field names for compatibility
        ownerName: item.organization.name,
        phoneNumber: item.contact?.[0]?.phone_primary,
        packageSeen: item.package_seen || false,
        decisionMakers: item.decision_makers,
        interestLevel: item.interest_level || 0,
        signedUp: item.status === 'won',
        specificNeeds: item.specific_needs,
        timestamp: item.created_at,
        username: item.owner?.email || 'Unknown'
      }));

      return submissions;
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useSupabaseSubmissionStats() {
  return useQuery({
    queryKey: ['supabase-submission-stats'],
    queryFn: async () => {
      // Get total count
      const { count: total } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      // Get signed up count
      const { count: signedUp } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'won');

      // Get average interest level
      const { data: deals } = await supabase
        .from('deals')
        .select('interest_level')
        .not('interest_level', 'is', null);

      const avgInterestLevel = deals?.length 
        ? deals.reduce((acc: number, d: any) => acc + (d.interest_level || 0), 0) / deals.length
        : 0;

      // Get package seen percentage
      const { count: packageSeenCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('package_seen', true);

      const packageSeenPercentage = total ? (packageSeenCount || 0) / total * 100 : 0;

      return {
        total: total || 0,
        signedUp: signedUp || 0,
        avgInterestLevel,
        packageSeenPercentage,
        interestedByMonth: [] // TODO: Implement monthly aggregation
      };
    },
    staleTime: 60000, // 1 minute
  });
}