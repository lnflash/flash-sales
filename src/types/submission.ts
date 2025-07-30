// Mirror the intake form submission type
export interface Submission {
  id: number | string; // Support both number (legacy) and string (Supabase UUID)
  ownerName: string;
  phoneNumber?: string;
  packageSeen: boolean;
  decisionMakers?: string;
  interestLevel: number;
  signedUp: boolean;
  specificNeeds?: string;
  timestamp: string;
  username?: string;
  territory?: string;
}

// Types for stats and metrics
export interface SubmissionStats {
  total: number;
  signedUp: number;
  avgInterestLevel: number;
  interestedByMonth: { month: string; count: number }[];
  packageSeenPercentage: number;
}

// Types for the filter state
export interface SubmissionFilters {
  search?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  interestLevel?: number[];
  signedUp?: boolean;
  packageSeen?: boolean;
  username?: string;
}

// Type for the sort options
export interface SortOption {
  id: keyof Submission;
  desc: boolean;
}

// Type for pagination
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SubmissionListResponse {
  data: Submission[];
  totalCount: number;
  pageCount: number;
}

// Dashboard context state
export interface DashboardState {
  submissions: Submission[];
  stats: SubmissionStats;
  filters: SubmissionFilters;
  pagination: PaginationState;
  sortBy: SortOption[];
  isLoading: boolean;
  error: string | null;
}