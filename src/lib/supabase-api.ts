import { supabase } from '@/lib/supabase/client';
import { 
  Submission, 
  SubmissionFilters, 
  PaginationState, 
  SortOption,
  SubmissionStats, 
  SubmissionListResponse
} from '@/types/submission';
import { mapSubmissionToSupabase } from '@/lib/supabase-submission-mapper';

// Helper function to convert Supabase data to Submission format
function mapSupabaseToSubmission(data: any): Submission {
  if (!data) return null as any;
  
  return {
    id: data.id,
    ownerName: data.name || '',
    phoneNumber: data.phone || '',
    packageSeen: data.package_seen || false,
    decisionMakers: data.other_decision_makers || '',
    interestLevel: data.interest_level || 0,
    signedUp: data.signed_up || false,
    specificNeeds: data.specific_needs || '',
    username: data.deal_owner_username || '',
    territory: data.state_province || '',
    timestamp: data.created_at || new Date().toISOString(),
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
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
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
      query = query.eq('signed_up', filters.signedUp);
    }
    if (filters.packageSeen !== undefined) {
      query = query.eq('package_seen', filters.packageSeen);
    }
    if (filters.username) {
      query = query.eq('deal_owner_username', filters.username);
    }
  }

  // Apply sorting
  if (sortBy && sortBy.length > 0) {
    const sortField = sortBy[0].id;
    const sortOrder = sortBy[0].desc ? false : true; // Supabase uses ascending: true/false
    
    // Map frontend field names to database column names
    const fieldMap: Record<string, string> = {
      ownerName: 'name',
      phoneNumber: 'phone',
      packageSeen: 'package_seen',
      decisionMakers: 'other_decision_makers',
      interestLevel: 'interest_level',
      signedUp: 'signed_up',
      specificNeeds: 'specific_needs',
      username: 'deal_owner_username',
      territory: 'state_province',
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
    // Build the base query
    let countQuery = supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });
    
    let dataQuery = supabase
      .from('organizations')
      .select('*');

    // Apply filters to both queries
    countQuery = buildSupabaseQuery(countQuery, filters);
    dataQuery = buildSupabaseQuery(dataQuery, filters, pagination, sortBy);

    // Execute count query
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Execute data query
    const { data, error: dataError } = await dataQuery;
    if (dataError) throw dataError;

    const submissions = (data || []).map(mapSupabaseToSubmission);
    
    return {
      data: submissions,
      totalCount: count || 0,
      pageCount: pagination ? Math.ceil((count || 0) / pagination.pageSize) : 1,
    };
  } catch (error) {
    console.error('Error fetching submissions from Supabase:', error);
    throw error;
  }
}

export async function getSubmissionById(id: number): Promise<Submission> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Submission not found');

    return mapSupabaseToSubmission(data);
  } catch (error) {
    console.error(`Error fetching submission ${id} from Supabase:`, error);
    throw error;
  }
}

export async function createSubmission(data: Omit<Submission, 'id' | 'timestamp'>): Promise<Submission> {
  try {
    // Map the submission data to Supabase format
    const supabaseData = mapSubmissionToSupabase(data);

    const { data: newSubmission, error } = await supabase
      .from('organizations')
      .insert(supabaseData)
      .select()
      .single();

    if (error) throw error;
    if (!newSubmission) throw new Error('Failed to create submission');

    return mapSupabaseToSubmission(newSubmission);
  } catch (error) {
    console.error('Error creating submission in Supabase:', error);
    throw error;
  }
}

export async function updateSubmission(id: number, data: Partial<Submission>): Promise<Submission> {
  try {
    // Create a partial update object
    const updateData: any = {};
    
    // Map only the fields that are provided
    if (data.ownerName !== undefined) updateData.name = data.ownerName;
    if (data.phoneNumber !== undefined) updateData.phone = data.phoneNumber;
    if (data.packageSeen !== undefined) updateData.package_seen = data.packageSeen;
    if (data.decisionMakers !== undefined) updateData.other_decision_makers = data.decisionMakers;
    if (data.interestLevel !== undefined) updateData.interest_level = data.interestLevel;
    if (data.signedUp !== undefined) updateData.signed_up = data.signedUp;
    if (data.specificNeeds !== undefined) updateData.specific_needs = data.specificNeeds;
    if (data.username !== undefined) updateData.deal_owner_username = data.username;
    if (data.territory !== undefined) updateData.state_province = data.territory;

    const { data: updatedSubmission, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedSubmission) throw new Error('Failed to update submission');

    return mapSupabaseToSubmission(updatedSubmission);
  } catch (error) {
    console.error(`Error updating submission ${id} in Supabase:`, error);
    throw error;
  }
}

export async function deleteSubmission(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('organizations')
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
      .from('organizations')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;

    // Get signed up count
    const { count: signedUpCount, error: signedError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('signed_up', true);
    
    if (signedError) throw signedError;

    // Get package seen count
    const { count: packageSeenCount, error: packageError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('package_seen', true);
    
    if (packageError) throw packageError;

    // Get average interest level
    const { data: interestData, error: interestError } = await supabase
      .from('organizations')
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