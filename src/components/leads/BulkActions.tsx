import React, { useState } from 'react';
import { 
  TrashIcon, 
  TagIcon, 
  UserGroupIcon, 
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { LeadStage } from '@/types/lead-qualification';
import { updateSubmission } from '@/lib/supabase-api';
import { Submission, LeadStatus } from '@/types/submission';

interface BulkActionsProps {
  selectedIds: (number | string)[];
  submissions: Submission[];
  onSuccess: () => void;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ 
  selectedIds, 
  submissions,
  onSuccess,
  onClearSelection 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  const selectedSubmissions = submissions.filter(sub => 
    selectedIds.includes(sub.id)
  );

  const handleBulkStatusUpdate = async (status: string) => {
    setIsProcessing(true);
    try {
      const updates = selectedSubmissions.map(submission => 
        updateSubmission(submission.id, { leadStatus: status as LeadStatus })
      );
      await Promise.all(updates);
      onSuccess();
      onClearSelection();
    } catch (error) {
      console.error('Error updating statuses:', error);
    } finally {
      setIsProcessing(false);
      setShowStatusMenu(false);
    }
  };

  const handleBulkAssign = async (assignee: string) => {
    setIsProcessing(true);
    try {
      const updates = selectedSubmissions.map(submission => 
        updateSubmission(submission.id, { username: assignee })
      );
      await Promise.all(updates);
      onSuccess();
      onClearSelection();
    } catch (error) {
      console.error('Error assigning leads:', error);
    } finally {
      setIsProcessing(false);
      setShowAssignMenu(false);
    }
  };

  const handleBulkExport = () => {
    const csvContent = [
      ['Owner Name', 'Phone', 'Interest Level', 'Status', 'Created Date'].join(','),
      ...selectedSubmissions.map(sub => [
        `"${sub.ownerName}"`,
        `"${sub.phoneNumber}"`,
        `"${sub.interestLevel}"`,
        `"${sub.leadStatus || 'new'}"`,
        `"${new Date(sub.timestamp).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads? This action cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      // Mark as deleted using lead status
      const updates = selectedSubmissions.map(submission => 
        updateSubmission(submission.id, { leadStatus: 'contacted' as LeadStatus })
      );
      await Promise.all(updates);
      onSuccess();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting leads:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} lead{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            
            <div className="flex items-center gap-2">
              {/* Change Status */}
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <TagIcon className="h-4 w-4" />
                  Change Status
                </Button>
                
                {showStatusMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-popover rounded-lg shadow-lg border border-border p-2 min-w-[200px]">
                    <div className="space-y-1">
                      {['new', 'contacted', 'qualified', 'qualified', 'converted'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleBulkStatusUpdate(status)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
                        >
                          {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assign To */}
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAssignMenu(!showAssignMenu)}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  Assign To
                </Button>
                
                {showAssignMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-popover rounded-lg shadow-lg border border-border p-2 min-w-[200px]">
                    <div className="space-y-1">
                      {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'].map(assignee => (
                        <button
                          key={assignee}
                          onClick={() => handleBulkAssign(assignee)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
                        >
                          {assignee}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkExport}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </Button>

              {/* Delete */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
};