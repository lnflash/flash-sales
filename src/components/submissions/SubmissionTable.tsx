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
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface SubmissionTableProps {
  data: Submission[];
  isLoading?: boolean;
}

export default function SubmissionTable({ data, isLoading = false }: SubmissionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true }
  ]);

  const columnHelper = createColumnHelper<Submission>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor('ownerName', {
        header: 'Business Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('packageSeen', {
        header: 'Package Seen',
        cell: (info) => (
          <span className={info.getValue() ? 'text-flash-green' : 'text-gray-400'}>
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
              <div className="w-1/2 bg-flash-dark-2 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
                  style={{ width: `${(level / 5) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm">{level}/5</span>
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
                ? 'bg-flash-green/20 text-flash-green'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {info.getValue() ? 'Signed Up' : 'Prospect'}
          </span>
        ),
      }),
      columnHelper.accessor('username', {
        header: 'Rep',
        cell: (info) => (
          <span className="text-gray-300">{info.getValue() || 'N/A'}</span>
        ),
      }),
      columnHelper.accessor('timestamp', {
        header: 'Date',
        cell: (info) => <span>{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor('id', {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/submissions/${info.getValue()}`}
              className="p-1 text-gray-400 hover:text-flash-green rounded-md transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </Link>
            <Link
              href={`/dashboard/submissions/${info.getValue()}/edit`}
              className="p-1 text-gray-400 hover:text-flash-yellow rounded-md transition-colors"
              title="Edit"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </Link>
          </div>
        ),
      }),
    ],
    [columnHelper]
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
      <div className="bg-flash-dark-3 rounded-lg shadow-md overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-flash-dark-2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-t border-flash-dark-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-flash-dark-2">
          <thead className="bg-flash-dark-2">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
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
                            <ArrowsUpDownIcon className="w-4 h-4 ml-1 text-gray-500" />
                          ) : null)}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-flash-dark-2">
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id} 
                className="hover:bg-flash-dark-2 transition-colors"
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
        <div className="py-12 text-center text-gray-400">
          <p>No submissions found</p>
        </div>
      )}
    </div>
  );
}