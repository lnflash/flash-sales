import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmissionTable from '@/components/submissions/SubmissionTable';
import SubmissionFiltersComponent from '@/components/submissions/SubmissionFilters';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Submission, SubmissionFilters } from '@/types/submission';

export default function SubmissionsPage() {
  const {
    submissions,
    totalCount,
    pageCount,
    isLoading,
    filters,
    setFilters,
    resetFilters
  } = useSubmissions();

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
        />
        
        {pageCount > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center">
              <button
                className="px-3 py-1 rounded-md bg-flash-dark-3 text-gray-400 hover:bg-flash-dark-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
              >
                Previous
              </button>
              <span className="mx-4 text-gray-400">
                Page 1 of {pageCount}
              </span>
              <button
                className="px-3 py-1 rounded-md bg-flash-dark-3 text-gray-400 hover:bg-flash-dark-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
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