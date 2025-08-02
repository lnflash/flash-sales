import React, { useState } from 'react';
import { Activity, ACTIVITY_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/weekly-program';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { format } from 'date-fns';
import { 
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface ActivityDetailsProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export const ActivityDetails: React.FC<ActivityDetailsProps> = ({
  activity,
  isOpen,
  onClose,
  onEdit
}) => {
  const { updateActivity, deleteActivity, duplicateActivity, updateActivityStatus } = useWeeklyProgramStore();
  const [outcome, setOutcome] = useState(activity.outcome || '');
  const [nextSteps, setNextSteps] = useState(activity.nextSteps || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  const priorityConfig = PRIORITY_CONFIG[activity.priority];

  const handleSaveNotes = () => {
    updateActivity(activity.id, { outcome, nextSteps });
  };

  const handleDelete = () => {
    deleteActivity(activity.id);
    onClose();
  };

  const handleDuplicate = () => {
    const tomorrow = new Date(activity.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    duplicateActivity(activity.id, format(tomorrow, 'yyyy-MM-dd'));
    onClose();
  };

  const getStatusButton = () => {
    switch (activity.status) {
      case 'planned':
        return (
          <Button
            onClick={() => updateActivityStatus(activity.id, 'in_progress')}
            className="flex items-center gap-2"
            size="sm"
          >
            <ClockIcon className="h-4 w-4" />
            Start Activity
          </Button>
        );
      case 'in_progress':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => updateActivityStatus(activity.id, 'completed')}
              className="flex items-center gap-2"
              size="sm"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Complete
            </Button>
            <Button
              onClick={() => updateActivityStatus(activity.id, 'cancelled')}
              variant="secondary"
              className="flex items-center gap-2"
              size="sm"
            >
              <XCircleIcon className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Cancelled</span>
          </div>
        );
      case 'rescheduled':
        return (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <ArrowPathIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Rescheduled</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color} ${config.darkColor}`}>
              <span className="text-sm font-medium">
                {activity.type === 'custom' && activity.customType ? activity.customType : config.label}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{activity.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Activity Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium text-foreground">
                {format(new Date(activity.date), 'EEEE, MMM d, yyyy')}
                {activity.time && ` at ${activity.time}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className={`font-medium ${priorityConfig.color}`}>
                {priorityConfig.label} Priority
              </p>
            </div>
          </div>

          {/* Lead Info */}
          {activity.leadName && (
            <div>
              <p className="text-sm text-muted-foreground">Related Lead</p>
              <p className="font-medium text-foreground">{activity.leadName}</p>
            </div>
          )}

          {/* Description */}
          {activity.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-foreground">{activity.description}</p>
            </div>
          )}

          {/* Status and Actions */}
          <div className="flex items-center justify-between py-4 border-y border-border">
            {getStatusButton()}
          </div>

          {/* Outcome and Next Steps (for completed activities) */}
          {(activity.status === 'completed' || activity.status === 'cancelled') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Outcome / Notes
                </label>
                <textarea
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  onBlur={handleSaveNotes}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="What was the result of this activity?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Next Steps
                </label>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  onBlur={handleSaveNotes}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="What should happen next?"
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button
              onClick={onEdit}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={handleDuplicate}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Duplicate
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                Are you sure you want to delete this activity? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDelete}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Activity
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};