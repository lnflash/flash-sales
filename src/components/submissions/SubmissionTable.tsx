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
import { Submission } from '@/types/submission';
import { formatDate } from '@/utils/date-formatter';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ArrowsUpDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface SubmissionTableProps {
  data: Submission[];
  isLoading?: boolean;
  totalItems?: number;
  onDelete?: (id: number) => void;
}

export default function SubmissionTable({ data, isLoading = false, totalItems = 0, onDelete }: SubmissionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true }
  ]);

  const columnHelper = createColumnHelper<Submission>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => <span className="text-light-text-tertiary">{info.getValue()}</span>,
      }),
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
      columnHelper.accessor('signedUp', {
        header: 'Status',
        cell: (info) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              info.getValue()
                ? 'bg-flash-green/10 text-flash-green border border-flash-green/20'
                : 'bg-gray-100 text-light-text-secondary border border-light-border'
            }`}
          >
            {info.getValue() ? 'Signed Up' : 'Prospect'}
          </span>
        ),
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
                  const submissionId = Number(info.getValue());
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