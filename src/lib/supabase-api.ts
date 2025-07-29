import { supabase } from '@/lib/supabase/client';
import { 
  Submission, 
  SubmissionFilters, 
  PaginationState, 
  SortOption,
  SubmissionStats, 
  SubmissionListResponse
} from '@/types/submission';

// Helper function to convert Supabase deal data to Submission format
function mapDealToSubmission(deal: any): Submission {
  if (!deal) return null as any;
  
  return {
    id: parseInt(deal.id) || 0, // Convert UUID to number for compatibility
    ownerName: deal.organization?.name || deal.name || '',
    phoneNumber: deal.primary_contact?.phone_primary || '',
    packageSeen: deal.package_seen || false,
    decisionMakers: deal.decision_makers || '',
    interestLevel: deal.interest_level || 0,
    signedUp: deal.status === 'won' || false,
    specificNeeds: deal.specific_needs || '',
    username: deal.owner?.email?.split('@')[0] || '',
    territory: deal.organization?.state_province || '',
    timestamp: deal.created_at || new Date().toISOString(),
  };
}

// Function to build Supabase query with filters, pagination, and sorting
function buildSupabaseQuery(
  baseQuery: any,
  filters?: SubmissionFilters,
  pagination?: PaginationState,
  sortBy?: SortOption[]
) {
  let query = baseQuery;

  // Apply filters
  if (filters) {
    if (filters.search) {
      query = query.or(`organization.name.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }
    if (filters.dateRange?.start) {
      query = query.gte('created_at', filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      query = query.lte('created_at', filters.dateRange.end);
    }
    if (filters.interestLevel?.length) {
      query = query.in('interest_level', filters.interestLevel);
    }
    if (filters.signedUp !== undefined) {
      query = filters.signedUp 
        ? query.eq('status', 'won')
        : query.neq('status', 'won');
    }
    if (filters.packageSeen !== undefined) {
      query = query.eq('package_seen', filters.packageSeen);
    }
    if (filters.username) {
      query = query.eq('owner.email', `${filters.username}@flashbitcoin.com`);
    }
  }

  // Apply sorting
  if (sortBy && sortBy.length > 0) {
    const sortField = sortBy[0].id;
    const sortOrder = sortBy[0].desc ? false : true; // Supabase uses ascending: true/false
    
    // Map frontend field names to database column names
    const fieldMap: Record<string, string> = {
      ownerName: 'organization.name',
      phoneNumber: 'primary_contact.phone_primary',
      packageSeen: 'package_seen',
      decisionMakers: 'decision_makers',
      interestLevel: 'interest_level',
      signedUp: 'status',
      specificNeeds: 'specific_needs',
      username: 'owner.email',
      territory: 'organization.state_province',
      timestamp: 'created_at',
    };
    
    const dbField = fieldMap[sortField] || sortField;
    query = query.order(dbField, { ascending: sortOrder });
  } else {
    // Default sort by created_at descending
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  if (pagination) {
    const from = pagination.pageIndex * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  return query;
}

// API functions
export async function getSubmissions(
  filters?: SubmissionFilters,
  pagination?: PaginationState,
  sortBy?: SortOption[]
): Promise<SubmissionListResponse> {
  try {
    console.log('Fetching submissions from Supabase deals table with filters:', filters);
    
    // Build the base query with joins
    let countQuery = supabase
      .from('deals')
      .select(`
        *,
        organization:organizations(*),
        primary_contact:contacts(*),
        owner:users(*)
      `, { count: 'exact', head: true });
    
    let dataQuery = supabase
      .from('deals')
      .select(`
        *,
        organization:organizations(*),
        primary_contact:contacts(*),
        owner:users(*)
      `);

    // Apply filters to both queries
    countQuery = buildSupabaseQuery(countQuery, filters);
    dataQuery = buildSupabaseQuery(dataQuery, filters, pagination, sortBy);

    // Execute count query
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Supabase count error:', countError);
      throw countError;
    }

    // Execute data query
    const { data, error: dataError } = await dataQuery;
    if (dataError) {
      console.error('Supabase data error:', dataError);
      throw dataError;
    }

    console.log('Supabase raw deals data:', data);
    const submissions = (data || []).map(mapDealToSubmission);
    console.log('Mapped submissions:', submissions);
    
    return {
      data: submissions,
      totalCount: count || 0,
      pageCount: pagination ? Math.ceil((count || 0) / pagination.pageSize) : 1,
    };
  } catch (error) {
    console.error('Error fetching submissions from Supabase:', error);
    // Fall back to external API if Supabase fails
    throw error;
  }
}

export async function getSubmissionById(id: number): Promise<Submission> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        organization:organizations(*),
        primary_contact:contacts(*),
        owner:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Submission not found');

    return mapDealToSubmission(data);
  } catch (error) {
    console.error(`Error fetching submission ${id} from Supabase:`, error);
    throw error;
  }
}

export async function createSubmission(data: Omit<Submission, 'id' | 'timestamp'>): Promise<Submission> {
  try {
    // This is complex - we need to create organization, contact, and deal
    // For now, throw an error to use the external API
    throw new Error('Creating submissions via Supabase not yet implemented');
  } catch (error) {
    console.error('Error creating submission in Supabase:', error);
    throw error;
  }
}

export async function updateSubmission(id: number, data: Partial<Submission>): Promise<Submission> {
  try {
    // Update only the deal fields that map to submission fields
    const updateData: any = {};
    
    if (data.packageSeen !== undefined) updateData.package_seen = data.packageSeen;
    if (data.decisionMakers !== undefined) updateData.decision_makers = data.decisionMakers;
    if (data.interestLevel !== undefined) updateData.interest_level = data.interestLevel;
    if (data.signedUp !== undefined) updateData.status = data.signedUp ? 'won' : 'open';
    if (data.specificNeeds !== undefined) updateData.specific_needs = data.specificNeeds;

    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(*),
        primary_contact:contacts(*),
        owner:users(*)
      `)
      .single();

    if (error) throw error;
    if (!updatedDeal) throw new Error('Failed to update submission');

    return mapDealToSubmission(updatedDeal);
  } catch (error) {
    console.error(`Error updating submission ${id} in Supabase:`, error);
    throw error;
  }
}

export async function deleteSubmission(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting submission ${id} from Supabase:`, error);
    throw error;
  }
}

export async function getSubmissionStats(): Promise<SubmissionStats> {
  try {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;

    // Get signed up count (won deals)
    const { count: signedUpCount, error: signedError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'won');
    
    if (signedError) throw signedError;

    // Get package seen count
    const { count: packageSeenCount, error: packageError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('package_seen', true);
    
    if (packageError) throw packageError;

    // Get average interest level
    const { data: interestData, error: interestError } = await supabase
      .from('deals')
      .select('interest_level');
    
    if (interestError) throw interestError;

    const totalInterest = (interestData || []).reduce((sum: number, item: any) => sum + (item.interest_level || 0), 0);
    const avgInterestLevel = interestData?.length ? totalInterest / interestData.length : 0;

    return {
      total: totalCount || 0,
      signedUp: signedUpCount || 0,
      avgInterestLevel: avgInterestLevel,
      interestedByMonth: [], // TODO: Implement monthly stats if needed
      packageSeenPercentage: totalCount ? ((packageSeenCount || 0) / totalCount) * 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching submission stats from Supabase:', error);
    throw error;
  }
}