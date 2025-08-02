import React, { useState } from 'react';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { 
  PhoneIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const WeeklyGoals: React.FC = () => {
  const { goals, setGoals, getWeeklyMetrics } = useWeeklyProgramStore();
  const metrics = getWeeklyMetrics();
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoals, setEditedGoals] = useState(goals);

  const handleSave = () => {
    setGoals(editedGoals);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGoals(goals);
    setIsEditing(false);
  };

  const goalItems = [
    {
      key: 'calls',
      label: 'Phone Calls',
      icon: PhoneIcon,
      current: metrics.completedCalls,
      target: goals.calls,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      key: 'meetings',
      label: 'Meetings',
      icon: UserGroupIcon,
      current: metrics.completedMeetings,
      target: goals.meetings,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      key: 'proposals',
      label: 'Proposals',
      icon: DocumentTextIcon,
      current: metrics.completedProposals,
      target: goals.proposals,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      key: 'followUps',
      label: 'Follow-ups',
      icon: ChatBubbleLeftRightIcon,
      current: metrics.completedFollowUps,
      target: goals.followUps,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      key: 'newContacts',
      label: 'New Contacts',
      icon: UserPlusIcon,
      current: 0, // This would need to be tracked separately
      target: goals.newContacts,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Weekly Goals</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Edit goals"
          >
            <PencilIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-green-600 dark:text-green-400"
              title="Save"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-red-600 dark:text-red-400"
              title="Cancel"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {goalItems.map((item) => {
          const Icon = item.icon;
          const progress = item.target > 0 ? (item.current / item.target) * 100 : 0;
          const isCompleted = progress >= 100;

          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={isCompleted ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                        {item.current}
                      </span>
                      <span>/</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedGoals[item.key as keyof typeof editedGoals]}
                          onChange={(e) => setEditedGoals(prev => ({
                            ...prev,
                            [item.key]: parseInt(e.target.value) || 0
                          }))}
                          className="w-16 px-2 py-0.5 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          min="0"
                        />
                      ) : (
                        <span>{item.target}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  }`}>
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-600 dark:bg-green-400' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Overall Progress</p>
          <p className="text-2xl font-bold text-primary">{metrics.completionRate}%</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {metrics.completedActivities} of {metrics.totalActivities} activities completed
        </p>
      </div>
    </div>
  );
};