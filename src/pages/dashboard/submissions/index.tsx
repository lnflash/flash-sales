import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionTable from '@/components/submissions/SubmissionTable';
import SubmissionFiltersComponent from '@/components/submissions/SubmissionFilters';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Submission, SubmissionFilters, PaginationState } from '@/types/submission';
import { deleteSubmission } from '@/lib/api';
import { getUserFromStorage } from '@/lib/auth';
import { hasPermission } from '@/types/roles';

export default function SubmissionsPage() {
  const router = useRouter();
  const { search } = router.query;
  const [user, setUser] = useState(getUserFromStorage());
  
  // Set initial filters based on URL search parameter and user role
  const getInitialFilters = (): SubmissionFilters => {
    const filters: SubmissionFilters = search ? { search: search as string } : {};
    
    // If user is a Sales Rep or has no role (doesn't have permission to view all reps), filter by their username
    if (user && (!user.role || !hasPermission(user.role, 'canViewAllReps'))) {
      filters.username = user.username;
    }
    
    return filters;
  };
  
  const initialFilters = getInitialFilters();
  
  const {
    submissions,
    totalCount,
    pageCount,
    isLoading,
    filters,
    pagination,
    setPagination,
    setFilters,
    resetFilters,
    refetch
  } = useSubmissions(initialFilters);

  // Update filters when URL search parameter changes
  useEffect(() => {
    if (search && search !== filters.search) {
      const newFilters = { ...filters, search: search as string };
      // Always maintain username filter for Sales Reps or users with no role
      if (user && (!user.role || !hasPermission(user.role, 'canViewAllReps'))) {
        newFilters.username = user.username;
      }
      setFilters(newFilters);
    }
  }, [search]);

  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Override setFilters to always maintain username filter for Sales Reps or users with no role
  const handleSetFilters = (newFilters: SubmissionFilters) => {
    // Always maintain username filter for Sales Reps or users with no role
    if (user && (!user.role || !hasPermission(user.role, 'canViewAllReps'))) {
      newFilters.username = user.username;
    }
    setFilters(newFilters);
  };

  // Override resetFilters to maintain username filter for Sales Reps or users with no role
  const handleResetFilters = () => {
    const baseFilters: SubmissionFilters = {};
    // Maintain username filter for Sales Reps or users with no role even after reset
    if (user && (!user.role || !hasPermission(user.role, 'canViewAllReps'))) {
      baseFilters.username = user.username;
    }
    setFilters(baseFilters);
    setPagination({ pageIndex: 0, pageSize: 25 });
  };

  const handleDelete = async (id: number | string) => {
    setDeletingId(id);
    try {
      await deleteSubmission(id);
      // Refresh the submissions list
      await refetch();
    } catch (error) {
      console.error('Failed to delete submission:', error);
      alert('Failed to delete submission. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout title="Submissions">
      <div className="mb-8">
        <SubmissionFiltersComponent
          filters={filters}
          onFilterChange={handleSetFilters}
          onResetFilters={handleResetFilters}
        />
        
        <div className="bg-white p-4 rounded-lg mb-4 flex justify-between items-center shadow-sm border border-light-border">
          <div>
            <h2 className="text-lg font-semibold text-light-text-primary">All Submissions</h2>
            <p className="text-sm text-light-text-secondary">
              {isLoading ? 'Loading...' : `${totalCount} submissions found`}
            </p>
          </div>
        </div>
        
        <SubmissionTable
          data={submissions}
          isLoading={isLoading}
          totalItems={totalCount}
          onDelete={handleDelete}
        />
        
        {pageCount > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="pageSize" className="mr-2 text-light-text-secondary text-xs sm:text-sm">Show:</label>
              <select
                id="pageSize"
                value={pagination.pageSize}
                onChange={(e) => setPagination({ ...pagination, pageSize: Number(e.target.value), pageIndex: 0 })}
                className="bg-white text-light-text-primary rounded p-1 text-xs sm:text-sm border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="ml-2 text-light-text-secondary text-xs sm:text-sm">per page</span>
            </div>
            
            <nav className="flex items-center">
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md bg-white text-light-text-primary border border-light-border hover:bg-light-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPagination({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
                disabled={pagination.pageIndex === 0}
              >
                Previous
              </button>
              <span className="mx-2 sm:mx-4 text-light-text-secondary text-xs sm:text-sm">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md bg-white text-light-text-primary border border-light-border hover:bg-light-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPagination({ ...pagination, pageIndex: Math.min(pageCount - 1, pagination.pageIndex + 1) })}
                disabled={pagination.pageIndex >= pageCount - 1}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}