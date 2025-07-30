import { 
  Submission, 
  SubmissionFilters, 
  PaginationState, 
  SortOption,
  SubmissionStats, 
  SubmissionListResponse
} from '@/types/submission';

// Feature flag to use Supabase instead of external API
// Temporarily disable Supabase for submissions until we properly implement it
const USE_SUPABASE = false; // process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

// Import Supabase functions synchronously
import * as supabaseApiModule from './supabase-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
console.log('API base URL:', API_BASE_URL, 'USE_SUPABASE:', USE_SUPABASE, 'NODE_ENV:', process.env.NODE_ENV);

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'An error occurred while fetching data');
  }
  return response.json();
}

// Function to build query params from filters, pagination, and sorting
function buildQueryString(
  filters?: SubmissionFilters, 
  pagination?: PaginationState,
  sortBy?: SortOption[]
): string {
  const params = new URLSearchParams();
  
  // Add filters
  if (filters) {
    if (filters.search) params.append('search', filters.search);
    if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
    if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);
    if (filters.interestLevel?.length) params.append('interestLevel', filters.interestLevel.join(','));
    if (filters.signedUp !== undefined) params.append('signedUp', filters.signedUp.toString());
    if (filters.packageSeen !== undefined) params.append('packageSeen', filters.packageSeen.toString());
    if (filters.username) params.append('username', filters.username);
  }
  
  // Add pagination
  if (pagination) {
    params.append('page', pagination.pageIndex.toString());
    params.append('limit', pagination.pageSize.toString());
  }
  
  // Add sorting
  if (sortBy && sortBy.length > 0) {
    const sortField = sortBy[0].id;
    const sortOrder = sortBy[0].desc ? 'desc' : 'asc';
    params.append('sortBy', sortField);
    params.append('sortOrder', sortOrder);
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// API functions
export async function getSubmissions(
  filters?: SubmissionFilters,
  pagination?: PaginationState,
  sortBy?: SortOption[]
): Promise<SubmissionListResponse> {
  // Use Supabase if enabled
  if (USE_SUPABASE) {
    console.log('Fetching submissions from Supabase (territory data available)');
    return await supabaseApiModule.getSubmissions(filters, pagination, sortBy);
  }

  // Use external API
  try {
    const queryString = buildQueryString(filters, pagination, sortBy);
    const url = `${API_BASE_URL}/submissions${queryString}`;
    console.log('Fetching submissions from URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Parse the response text back to JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error(`Failed to parse response: ${responseText}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

export async function getSubmissionById(id: number): Promise<Submission> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`);
    return handleResponse<Submission>(response);
  } catch (error) {
    console.error(`Error fetching submission ${id}:`, error);
    throw error;
  }
}

export async function createSubmission(data: Omit<Submission, 'id' | 'timestamp'>): Promise<Submission> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Submission>(response);
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
}

export async function updateSubmission(id: number, data: Partial<Submission>): Promise<Submission> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Submission>(response);
  } catch (error) {
    console.error(`Error updating submission ${id}:`, error);
    throw error;
  }
}

export async function deleteSubmission(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete submission');
    }
    
    // DELETE requests might return 204 No Content, which is successful
    if (response.status === 204) {
      return;
    }
    
    // If there's content, try to parse it
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      await response.json(); // consume the response if JSON
    }
  } catch (error) {
    console.error(`Error deleting submission ${id}:`, error);
    throw error;
  }
}

export async function getSubmissionStats(): Promise<SubmissionStats> {
  // Use Supabase if enabled
  if (USE_SUPABASE) {
    return await supabaseApiModule.getSubmissionStats();
  }

  // Use external API
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/stats`);
    return handleResponse<SubmissionStats>(response);
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    throw error;
  }
}