import React from 'react';
import { RepWeeklyData } from '../../types/rep-tracking';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface RepTrackingTableProps {
  data: RepWeeklyData[];
}

export function RepTrackingTable({ data }: RepTrackingTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-light-border">
        <thead className="bg-light-bg-secondary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary uppercase tracking-wider">
              Rep Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary uppercase tracking-wider">
              Week Starting
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-light-text-secondary uppercase tracking-wider">
              Monday Update
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-light-text-secondary uppercase tracking-wider">
              Tuesday Call
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-light-border">
          {data.map((record) => (
            <tr key={record.id} className="hover:bg-light-bg-secondary transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light-text-primary">
                {record.repName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text-primary">
                {formatDate(record.weekStartDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {record.submittedMondayUpdate ? (
                  <CheckIcon className="h-5 w-5 text-flash-green mx-auto" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {record.attendedTuesdayCall ? (
                  <CheckIcon className="h-5 w-5 text-flash-green mx-auto" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text-primary">
                {formatDate(record.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}