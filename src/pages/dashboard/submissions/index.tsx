import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionTable from '@/components/submissions/SubmissionTable';
import SubmissionFiltersComponent from '@/components/submissions/SubmissionFilters';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Submission, SubmissionFilters, PaginationState } from '@/types/submission';
import { deleteSubmission } from '@/lib/api';
import { getUserFromStorage } from '@/lib/auth';
import { hasPermission } from '@/types/roles';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function SubmissionsPage() {
  const router = useRouter();
  const { search } = router.query;
  const [user, setUser] = useState<ReturnType<typeof getUserFromStorage>>(null);
  const [initialFiltersSet, setInitialFiltersSet] = useState(false);

  useEffect(() => {
    setUser(getUserFromStorage());
  }, []);
  
  // Start with empty filters - we'll set them properly once user is loaded
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
  } = useSubmissions({});

  // Update filters when user is loaded
  useEffect(() => {
    if (user && !initialFiltersSet) {
      const initialFilters: SubmissionFilters = search ? { search: search as string } : {};
      
      // If user is a Sales Rep or has no role (doesn't have permission to view all reps), filter by their username
      if (!user.role || !hasPermission(user.role, 'canViewAllReps')) {
        initialFilters.username = user.username;
        console.log('Setting username filter for non-admin user:', user.username);
      } else {
        console.log('User has admin permissions, showing all submissions');
      }
      
      setFilters(initialFilters);
      setInitialFiltersSet(true);
    }
  }, [user, search, setFilters, initialFiltersSet]);

  // Update filters when URL search parameter changes
  useEffect(() => {
    if (search && search !== filters.search && user && initialFiltersSet) {
      const newFilters = { ...filters, search: search as string };
      // Always maintain username filter for Sales Reps or users with no role
      if (!user.role || !hasPermission(user.role, 'canViewAllReps')) {
        newFilters.username = user.username;
        console.log('Maintaining username filter for search:', user.username);
      }
      setFilters(newFilters);
    }
  }, [search, user, filters.search, initialFiltersSet, setFilters]);

  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Override setFilters to always maintain username filter for Sales Reps or users with no role
  const handleSetFilters = (newFilters: SubmissionFilters) => {
    // Always maintain username filter for Sales Reps or users with no role
    if (user && (!user.role || !hasPermission(user.role, 'canViewAllReps'))) {
      newFilters.username = user.username;
      console.log('Maintaining username filter in handleSetFilters:', user.username);
    }
    setFilters(newFilters);
  };

  // Override resetFilters to maintain username filter for Sales Reps or users with no role
  const handleResetFilters = () => {
    const baseFilters: SubmissionFilters = {};
    // Maintain username filter for Sales Reps or users with no role even after reset
    if (user && (!user.role || !hasPermission(user.role, 'canViewAllReps'))) {
      baseFilters.username = user.username;
      console.log('Maintaining username filter in handleResetFilters:', user.username);
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
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <SubmissionFiltersComponent
              filters={filters}
              onFilterChange={handleSetFilters}
              onResetFilters={handleResetFilters}
            />
          </div>
          <Link
            href="/intake"
            className="inline-flex items-center px-4 py-2 bg-flash-green text-white rounded-md hover:bg-flash-green-dark transition-colors font-medium shadow-sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Canvas Form
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center shadow-sm border border-light-border dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-white">
              {user && (!user.role || !hasPermission(user.role, 'canViewAllReps')) 
                ? 'My Submissions' 
                : 'All Submissions'
              }
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-gray-400">
              {isLoading ? 'Loading...' : `${totalCount} submissions found`}
              {user && (!user.role || !hasPermission(user.role, 'canViewAllReps')) && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full">
                  Filtered to {user.username}
                </span>
              )}
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
              <label htmlFor="pageSize" className="mr-2 text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm">Show:</label>
              <select
                id="pageSize"
                value={pagination.pageSize}
                onChange={(e) => setPagination({ ...pagination, pageSize: Number(e.target.value), pageIndex: 0 })}
                className="bg-white dark:bg-gray-700 text-light-text-primary dark:text-white rounded p-1 text-xs sm:text-sm border border-light-border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-flash-green"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="ml-2 text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm">per page</span>
            </div>
            
            <nav className="flex items-center">
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md bg-white dark:bg-gray-700 text-light-text-primary dark:text-white border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPagination({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
                disabled={pagination.pageIndex === 0}
              >
                Previous
              </button>
              <span className="mx-2 sm:mx-4 text-light-text-secondary dark:text-gray-400 text-xs sm:text-sm">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <button
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md bg-white dark:bg-gray-700 text-light-text-primary dark:text-white border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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