import React, { useState, useEffect } from 'react';
import { Submission } from '@/types/submission';
import { formatDate } from '@/utils/date-formatter';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BulkActions } from './BulkActions';
import { QuickFilters, FilterState } from '@/components/ui/quick-filters';
import { useFilteredData } from '@/hooks/useFilteredData';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface LeadsTableProps {
  submissions: Submission[];
  onRefresh?: () => void;
}

type SortField = 'ownerName' | 'timestamp' | 'leadStatus' | 'username';
type SortOrder = 'asc' | 'desc';

export const LeadsTable: React.FC<LeadsTableProps> = ({ submissions, onRefresh }) => {
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>({});

  const { filteredData, availableUsers, availableTerritories } = useFilteredData(
    submissions,
    filters
  );

  // Clear selection when submissions change
  useEffect(() => {
    setSelectedIds([]);
  }, [submissions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredData.map(sub => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number | string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedSubmissions = [...filteredData].sort((a, b) => {
    let aValue: any = a[sortField as keyof Submission];
    let bValue: any = b[sortField as keyof Submission];

    if (sortField === 'timestamp') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'canvas': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'contacted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'prospect': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'opportunity': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'signed_up': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left font-semibold text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <>
      <div data-tour="leads-filters">
        <QuickFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableUsers={availableUsers}
          availableTerritories={availableTerritories}
        />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-light-border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-bg-secondary dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="ownerName">Lead</SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-semibold text-light-text-secondary dark:text-gray-400">Contact</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="leadStatus">Status</SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="username">Assigned To</SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="timestamp">Created</SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-semibold text-light-text-secondary dark:text-gray-400">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-gray-700">
              {sortedSubmissions.map((submission) => (
                <tr 
                  key={submission.id} 
                  className={`hover:bg-light-bg-secondary dark:hover:bg-gray-700 transition-colors ${
                    selectedIds.includes(submission.id) ? 'bg-light-bg-secondary dark:bg-gray-700' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(submission.id)}
                      onCheckedChange={(checked) => handleSelectOne(submission.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-light-text-primary dark:text-white">{submission.ownerName}</p>
                      {submission.businessType && (
                        <p className="text-sm text-light-text-secondary dark:text-gray-400">{submission.businessType}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {submission.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-gray-400">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{submission.phoneNumber}</span>
                        </div>
                      )}
                      {submission.territory && (
                        <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-gray-400">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{submission.territory}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusColor(submission.leadStatus)
                    }`}>
                      {submission.leadStatus?.replace('_', ' ').charAt(0).toUpperCase() + 
                       (submission.leadStatus?.slice(1).replace('_', ' ') || '')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-light-text-primary dark:text-gray-300">
                      {submission.username || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-light-text-secondary dark:text-gray-400">
                      {formatDate(submission.timestamp)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/dashboard/submissions/${submission.id}`, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-light-text-secondary dark:text-gray-400">
            {submissions.length === 0 ? 'No leads found' : 'No leads match the selected filters'}
          </div>
        )}

        {filteredData.length > 0 && filteredData.length < submissions.length && (
          <div className="px-4 py-2 bg-light-bg-secondary dark:bg-gray-900 text-sm text-light-text-secondary dark:text-gray-400">
            Showing {filteredData.length} of {submissions.length} leads
          </div>
        )}
      </div>

      <div data-tour="bulk-actions">
        <BulkActions
          selectedIds={selectedIds}
          submissions={submissions}
          onSuccess={() => {
            setSelectedIds([]);
            onRefresh?.();
        }}
        onClearSelection={() => setSelectedIds([])}
      />
      </div>
    </>
  );
};