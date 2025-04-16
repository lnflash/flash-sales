import { 
  Submission, 
  SubmissionFilters, 
  PaginationState, 
  SortOption,
  SubmissionStats, 
  SubmissionListResponse
} from '@/types/submission';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
console.log('API base URL:', API_BASE_URL);

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

export async function getSubmissionStats(): Promise<SubmissionStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/stats`);
    return handleResponse<SubmissionStats>(response);
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    throw error;
  }
}

// Mock functions for development (similar to what's in the intake app)
export async function getMockSubmissions(): Promise<Submission[]> {
  // This mimics the submissions data from the intake form app
  return [
    {
      id: 1,
      ownerName: 'John Smith',
      phoneNumber: '876-555-1234',
      packageSeen: true,
      decisionMakers: 'Sarah Johnson, Michael Brown',
      interestLevel: 4,
      signedUp: true,
      specificNeeds: 'Needs integration with existing POS system',
      timestamp: '2023-04-10T14:30:00Z',
      username: 'flash'
    },
    {
      id: 2,
      ownerName: 'Emma Wilson',
      phoneNumber: '876-555-7890',
      packageSeen: false,
      decisionMakers: 'David Lee',
      interestLevel: 3,
      signedUp: false,
      specificNeeds: 'Interested in mobile payment solutions',
      timestamp: '2023-04-12T10:15:00Z',
      username: 'flash'
    },
    {
      id: 3,
      ownerName: 'Robert Garcia',
      phoneNumber: '876-555-4321',
      packageSeen: true,
      decisionMakers: '',
      interestLevel: 5,
      signedUp: true,
      specificNeeds: 'Looking for Bitcoin payment processing',
      timestamp: '2023-04-15T16:45:00Z',
      username: 'sales'
    },
    {
      id: 4,
      ownerName: 'Maria Rodriguez',
      phoneNumber: '876-555-5678',
      packageSeen: true,
      decisionMakers: 'Carlos Martinez',
      interestLevel: 5,
      signedUp: true,
      specificNeeds: 'Wants to accept Lightning payments',
      timestamp: '2023-04-20T09:00:00Z',
      username: 'flash'
    },
    {
      id: 5,
      ownerName: 'Alex Johnson',
      phoneNumber: '876-555-8765',
      packageSeen: false,
      decisionMakers: '',
      interestLevel: 2,
      signedUp: false,
      specificNeeds: 'Just exploring options',
      timestamp: '2023-04-22T11:30:00Z',
      username: 'sales'
    },
    {
      id: 6,
      ownerName: 'Sophia Chen',
      phoneNumber: '876-555-2345',
      packageSeen: true,
      decisionMakers: 'William Lee',
      interestLevel: 4,
      signedUp: true,
      specificNeeds: 'Needs multi-location support',
      timestamp: '2023-04-25T14:15:00Z',
      username: 'flash'
    },
    {
      id: 7,
      ownerName: 'James Wilson',
      phoneNumber: '876-555-3456',
      packageSeen: true,
      decisionMakers: '',
      interestLevel: 3,
      signedUp: false,
      specificNeeds: 'Interested in accounting integration',
      timestamp: '2023-04-27T10:45:00Z',
      username: 'sales'
    },
    {
      id: 8,
      ownerName: 'Olivia Brown',
      phoneNumber: '876-555-6789',
      packageSeen: false,
      decisionMakers: 'Noah Adams',
      interestLevel: 4,
      signedUp: true,
      specificNeeds: 'Wants staff training on Bitcoin',
      timestamp: '2023-04-30T16:30:00Z',
      username: 'flash'
    }
  ];
}

export async function getMockSubmissionStats(): Promise<SubmissionStats> {
  return {
    total: 8,
    signedUp: 5,
    avgInterestLevel: 3.75,
    interestedByMonth: [
      { month: 'Jan', count: 0 },
      { month: 'Feb', count: 0 },
      { month: 'Mar', count: 0 },
      { month: 'Apr', count: 8 },
      { month: 'May', count: 0 },
      { month: 'Jun', count: 0 },
      { month: 'Jul', count: 0 },
      { month: 'Aug', count: 0 },
      { month: 'Sep', count: 0 },
      { month: 'Oct', count: 0 },
      { month: 'Nov', count: 0 },
      { month: 'Dec', count: 0 }
    ],
    packageSeenPercentage: 62.5
  };
}