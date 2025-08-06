import React from "react";
import { RepWeeklyData } from "../../types/rep-tracking";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface RepTrackingTableProps {
  data: RepWeeklyData[];
}

export function RepTrackingTable({ data }: RepTrackingTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Rep Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Week Starting</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Monday Update</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tuesday Call</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{record.repName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(record.weekStartDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {record.submittedMondayUpdate ? (
                  <CheckIcon className="h-5 w-5 text-flash-green mx-auto" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-500 dark:text-red-400 mx-auto" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {record.attendedTuesdayCall ? (
                  <CheckIcon className="h-5 w-5 text-flash-green mx-auto" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-red-500 dark:text-red-400 mx-auto" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(record.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
