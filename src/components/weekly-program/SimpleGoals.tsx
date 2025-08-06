import React, { useState } from "react";
import { useWeeklyProgramStore } from "@/stores/useWeeklyProgramStore";
import { PhoneIcon, UserGroupIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export const SimpleGoals: React.FC = () => {
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

  // Only show the most important metrics for reps
  const coreGoals = [
    {
      key: "calls" as keyof typeof goals,
      label: "Calls",
      icon: PhoneIcon,
      current: metrics.completedCalls,
      target: goals.calls,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      key: "meetings" as keyof typeof goals,
      label: "Meetings",
      icon: UserGroupIcon,
      current: metrics.completedMeetings,
      target: goals.meetings,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      key: "followUps" as keyof typeof goals,
      label: "Follow-ups",
      icon: ChatBubbleLeftRightIcon,
      current: metrics.completedFollowUps,
      target: goals.followUps,
      color: "text-green-600 dark:text-green-400",
    },
    {
      key: "proposals" as keyof typeof goals,
      label: "Proposals",
      icon: DocumentTextIcon,
      current: metrics.completedProposals,
      target: goals.proposals,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Goals</h3>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="Edit goals">
            <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors" title="Save">
              <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </button>
            <button onClick={handleCancel} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Cancel">
              <XMarkIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {coreGoals.map((goal) => {
          const Icon = goal.icon;
          const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
          const isComplete = goal.current >= goal.target;

          return (
            <div key={goal.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${goal.color}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{goal.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedGoals[goal.key]}
                      onChange={(e) =>
                        setEditedGoals({
                          ...editedGoals,
                          [goal.key]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <span className={`text-sm font-semibold ${isComplete ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                      {goal.current}/{goal.target}
                    </span>
                  )}
                </div>
              </div>

              {/* Simple progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isComplete ? "bg-green-500 dark:bg-green-400" : progress > 75 ? "bg-orange-500 dark:bg-orange-400" : "bg-gray-400 dark:bg-gray-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly completion summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Week Progress</span>
          <span className="font-semibold text-gray-900 dark:text-white">{Math.round(metrics.completionRate)}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-flash-green to-green-500 transition-all duration-300"
            style={{ width: `${metrics.completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};
