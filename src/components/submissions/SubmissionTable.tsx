'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Submission, LeadStatus } from '@/types/submission';
import { formatDate } from '@/utils/date-formatter';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ArrowsUpDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { MobileCard, MobileCardRow } from '@/components/ui/responsive-table';

interface SubmissionTableProps {
  data: Submission[];
  isLoading?: boolean;
  totalItems?: number;
  onDelete?: (id: number | string) => void;
}

export default function SubmissionTable({ data, isLoading = false, totalItems = 0, onDelete }: SubmissionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true }
  ]);
  const { isMobile } = useMobileMenu();

  const columnHelper = createColumnHelper<Submission>();

  const columns = useMemo(
    () => [
      // Removed ID column as requested
      // columnHelper.accessor('id', {
      //   header: 'ID',
      //   cell: (info) => <span className="text-light-text-tertiary">{info.getValue()}</span>,
      // }),
      columnHelper.accessor('ownerName', {
        header: 'Business Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('packageSeen', {
        header: 'Package Seen',
        cell: (info) => (
          <span className={info.getValue() ? 'text-flash-green' : 'text-light-text-tertiary'}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
      }),
      columnHelper.accessor('interestLevel', {
        header: 'Interest',
        cell: (info) => {
          const level = info.getValue();
          return (
            <div className="flex items-center">
              <div className="w-1/2 bg-light-bg-tertiary rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
                  style={{ width: `${(level / 5) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-light-text-primary">{level}/5</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('leadStatus', {
        header: 'Status',
        cell: (info) => {
          const submission = info.row.original;
          const status = info.getValue() as LeadStatus | undefined;
          const displayStatus = status || (submission.signedUp ? 'signed_up' : 'canvas');
          
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                displayStatus === 'signed_up'
                  ? 'bg-flash-green/10 text-flash-green border border-flash-green/20'
                  : displayStatus === 'opportunity'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : displayStatus === 'prospect'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : displayStatus === 'contacted'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-light-text-secondary border border-light-border'
              }`}
            >
              {displayStatus.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </span>
          );
        },
      }),
      columnHelper.accessor('username', {
        header: 'Rep',
        cell: (info) => (
          <span className="text-light-text-primary">{info.getValue() || 'N/A'}</span>
        ),
      }),
      columnHelper.accessor('territory', {
        header: 'Territory',
        cell: (info) => (
          <span className="text-light-text-primary">{info.getValue() || 'N/A'}</span>
        ),
      }),
      columnHelper.accessor('timestamp', {
        header: 'Date',
        cell: (info) => <span className="text-light-text-primary">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor('id', {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/submissions/${info.getValue()}`}
              className="p-1 text-light-text-secondary hover:text-flash-green rounded-md transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </Link>
            <Link
              href={`/dashboard/submissions/${info.getValue()}/edit`}
              className="p-1 text-light-text-secondary hover:text-amber-600 rounded-md transition-colors"
              title="Edit"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </Link>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const submissionId = info.getValue();
                  if (window.confirm('Are you sure you want to delete this submission?')) {
                    onDelete(submissionId);
                  }
                }}
                className="p-1 text-light-text-secondary hover:text-red-600 rounded-md transition-colors"
                title="Delete"
                type="button"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ),
      }),
    ],
    [columnHelper, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-light-border">
        <div className="animate-pulse">
          <div className="h-12 bg-light-bg-tertiary"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-t border-light-border bg-light-bg-secondary"></div>
          ))}
        </div>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="flex flex-col space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-light-border">
            <p className="text-light-text-secondary">No submissions found</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-light-text-secondary mb-2">
              Showing {data.length} of {totalItems || data.length} submissions
            </div>
            {data.map((submission) => {
              const displayStatus = submission.leadStatus || (submission.signedUp ? 'signed_up' : 'canvas');
              
              return (
                <div key={submission.id} className="bg-white rounded-lg shadow-sm border border-light-border overflow-hidden">
                  <MobileCard>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-light-text-primary text-lg">
                          {submission.ownerName}
                        </h3>
                        <p className="text-sm text-light-text-secondary mt-1">
                          {formatDate(submission.timestamp)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          displayStatus === 'signed_up'
                            ? 'bg-flash-green/10 text-flash-green border border-flash-green/20'
                            : displayStatus === 'opportunity'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : displayStatus === 'prospect'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : displayStatus === 'contacted'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-gray-100 text-light-text-secondary border border-light-border'
                        }`}
                      >
                        {displayStatus.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <MobileCardRow label="Package Seen" value={
                        <span className={submission.packageSeen ? 'text-flash-green' : 'text-light-text-tertiary'}>
                          {submission.packageSeen ? 'Yes' : 'No'}
                        </span>
                      } />
                      
                      <MobileCardRow label="Interest Level" value={
                        <div className="flex items-center">
                          <div className="w-16 bg-light-bg-tertiary rounded-full h-2 mr-2">
                            <div
                              className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
                              style={{ width: `${(submission.interestLevel / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{submission.interestLevel}/5</span>
                        </div>
                      } />
                      
                      <MobileCardRow label="Sales Rep" value={submission.username || 'N/A'} />
                      <MobileCardRow label="Territory" value={submission.territory || 'N/A'} />
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-light-border">
                      <Link
                        href={`/dashboard/submissions/${submission.id}`}
                        className="flex-1 text-center py-2 text-sm font-medium text-flash-green hover:text-flash-green-light transition-colors"
                      >
                        View Details
                      </Link>
                      <div className="h-4 w-px bg-light-border" />
                      <Link
                        href={`/dashboard/submissions/${submission.id}/edit`}
                        className="flex-1 text-center py-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        Edit
                      </Link>
                      {onDelete && (
                        <>
                          <div className="h-4 w-px bg-light-border" />
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this submission?')) {
                                onDelete(submission.id);
                              }
                            }}
                            className="flex-1 text-center py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </MobileCard>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-light-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-light-border">
          <thead className="bg-light-bg-secondary">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUpIcon className="w-4 h-4 ml-1" />,
                          desc: <ChevronDownIcon className="w-4 h-4 ml-1" />,
                        }[header.column.getIsSorted() as string] ??
                          (header.column.getCanSort() ? (
                            <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-light-text-tertiary" />
                          ) : null)}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-light-border">
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id} 
                className="hover:bg-light-bg-secondary transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="py-12 text-center text-light-text-tertiary">
          <p>No submissions found</p>
        </div>
      )}
      
      {data.length > 0 && (
        <div className="py-4 px-6 border-t border-light-border text-light-text-secondary text-sm">
          Showing {data.length} of {totalItems} submissions
        </div>
      )}
    </div>
  );
}