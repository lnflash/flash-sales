import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionTable from '@/components/submissions/SubmissionTable';
import SubmissionFiltersComponent from '@/components/submissions/SubmissionFilters';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Submission, SubmissionFilters, PaginationState } from '@/types/submission';

export default function SubmissionsPage() {
  const router = useRouter();
  const { search } = router.query;
  
  // Set initial filters based on URL search parameter
  const initialFilters: SubmissionFilters = search ? { search: search as string } : {};
  
  const {
    submissions,
    totalCount,
    pageCount,
    isLoading,
    filters,
    pagination,
    setPagination,
    setFilters,
    resetFilters
  } = useSubmissions(initialFilters);

  // Update filters when URL search parameter changes
  useEffect(() => {
    if (search && search !== filters.search) {
      setFilters({ ...filters, search: search as string });
    }
  }, [search]);

  return (
    <DashboardLayout title="Submissions">
      <div className="mb-8">
        <SubmissionFiltersComponent
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={resetFilters}
        />
        
        <div className="bg-flash-dark-3 p-4 rounded-lg mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-white">All Submissions</h2>
            <p className="text-sm text-gray-400">
              {isLoading ? 'Loading...' : `${totalCount} submissions found`}
            </p>
          </div>
        </div>
        
        <SubmissionTable
          data={submissions}
          isLoading={isLoading}
          totalItems={totalCount}
        />
        
        {pageCount > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center">
              <label htmlFor="pageSize" className="mr-2 text-gray-400 text-sm">Show:</label>
              <select
                id="pageSize"
                value={pagination.pageSize}
                onChange={(e) => setPagination({ ...pagination, pageSize: Number(e.target.value), pageIndex: 0 })}
                className="bg-flash-dark-3 text-gray-200 rounded p-1 border border-flash-dark-2"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="ml-2 text-gray-400 text-sm">per page</span>
            </div>
            
            <nav className="flex items-center">
              <button
                className="px-3 py-1.5 rounded-md bg-flash-dark-3 text-gray-400 hover:bg-flash-dark-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPagination({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
                disabled={pagination.pageIndex === 0}
              >
                Previous
              </button>
              <span className="mx-4 text-gray-400">
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <button
                className="px-3 py-1.5 rounded-md bg-flash-dark-3 text-gray-400 hover:bg-flash-dark-2 disabled:opacity-50 disabled:cursor-not-allowed"
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