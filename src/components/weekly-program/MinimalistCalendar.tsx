import React, { useState } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { Activity, ACTIVITY_TYPE_CONFIG, PRIORITY_CONFIG } from "@/types/weekly-program";
import { useWeeklyProgramStore } from "@/stores/useWeeklyProgramStore";
import {
  PhoneIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  PlusIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

const iconMap = {
  PhoneIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  PlusCircleIcon,
};

interface MinimalistCalendarProps {
  onActivityClick: (activity: Activity) => void;
  onAddActivity: (date: string) => void;
}

export const MinimalistCalendar: React.FC<MinimalistCalendarProps> = ({ onActivityClick, onAddActivity }) => {
  const { currentWeek, getActivitiesByDate, updateActivityStatus } = useWeeklyProgramStore();
  const [focusedDay, setFocusedDay] = useState<string | null>(null);
  const weekStart = new Date(currentWeek);
  const today = format(new Date(), "yyyy-MM-dd");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getActivitiesForDate = (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const activities = getActivitiesByDate(dateStr);

      if (!Array.isArray(activities)) {
        console.error("getActivitiesByDate did not return an array");
        return [];
      }

      return activities
        .filter((activity) => activity.status !== "cancelled")
        .sort((a, b) => {
          // Sort by time if available, then by priority
          if (a.time && b.time) return a.time.localeCompare(b.time);
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    } catch (error) {
      console.error("Error getting activities for date:", error);
      return [];
    }
  };

  const SimpleActivityCard: React.FC<{ activity: Activity; isToday: boolean }> = ({ activity, isToday }) => {
    const config = ACTIVITY_TYPE_CONFIG[activity.type];
    const Icon = iconMap[config.icon as keyof typeof iconMap];
    const isCompleted = activity.status === "completed";
    const isInProgress = activity.status === "in_progress";

    return (
      <div
        onClick={() => onActivityClick(activity)}
        className={`
          group relative p-2 rounded-md border cursor-pointer transition-all
          ${isCompleted ? "opacity-60 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : ""}
          ${isInProgress ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : ""}
          ${
            !isCompleted && !isInProgress
              ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              : ""
          }
          hover:shadow-sm
        `}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium truncate ${isCompleted ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}
              >
                {activity.title}
              </span>
              {activity.time && <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{activity.time}</span>}
            </div>
            {activity.entityName && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{activity.entityName}</p>}
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {activity.status === "planned" && isToday && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateActivityStatus(activity.id, "in_progress");
                }}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"
                title="Start"
              >
                <ClockIcon className="h-3 w-3" />
              </button>
            )}
            {activity.status === "in_progress" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateActivityStatus(activity.id, "completed");
                }}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400"
                title="Complete"
              >
                <CheckCircleIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TodayFocusView: React.FC = () => {
    const todayActivities = getActivitiesForDate(new Date());
    const urgentActivities = todayActivities.filter((a) => a.priority === "high" && a.status !== "completed");
    const pendingActivities = todayActivities.filter((a) => a.status === "planned" || a.status === "in_progress");

    return (
      <div className="bg-gradient-to-r from-flash-green/10 to-blue-50 dark:from-flash-green/5 dark:to-blue-900/10 rounded-lg border border-flash-green/20 dark:border-flash-green/30 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Focus</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{pendingActivities.length} pending</span>
        </div>

        {urgentActivities.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">🔥 Urgent</h4>
            <div className="space-y-1">
              {urgentActivities.slice(0, 3).map((activity) => (
                <SimpleActivityCard key={activity.id} activity={activity} isToday={true} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next 3 Tasks</h4>
            <div className="space-y-1">
              {pendingActivities.slice(0, 3).map((activity) => (
                <SimpleActivityCard key={activity.id} activity={activity} isToday={true} />
              ))}
              {pendingActivities.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400 py-2">No pending tasks for today</div>}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Add</h4>
            <div className="space-y-1">
              <button
                onClick={() => onAddActivity(today)}
                className="w-full p-2 text-left rounded-md border border-dashed border-gray-300 dark:border-gray-600 hover:border-flash-green hover:bg-flash-green/5 transition-colors text-sm text-gray-600 dark:text-gray-400"
              >
                + Add task for today
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Today's Focus Section */}
      <TodayFocusView />

      {/* Simplified Week View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Week Overview</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </p>
        </div>

        {/* Mobile: Vertical list, Desktop: Horizontal grid */}
        <div className="p-4">
          <div className="block sm:hidden space-y-3">
            {weekDays.map((day, index) => {
              const dayActivities = getActivitiesForDate(day);
              const isDayToday = isToday(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const completedCount = dayActivities.filter((a) => a.status === "completed").length;

              return (
                <div
                  key={index}
                  className={`
                    rounded-lg border p-3 cursor-pointer transition-all
                    ${
                      isDayToday
                        ? "bg-flash-green/5 dark:bg-flash-green/10 border-flash-green"
                        : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }
                  `}
                  onClick={() => setFocusedDay(focusedDay === dateStr ? null : dateStr)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className={`font-medium ${isDayToday ? "text-flash-green" : "text-gray-900 dark:text-white"}`}>{format(day, "EEEE")}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{format(day, "MMM d")}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {dayActivities.length > 0 ? (
                          <span>
                            {completedCount}/{dayActivities.length}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddActivity(dateStr);
                            }}
                            className="text-flash-green hover:text-flash-green/80"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {focusedDay === dateStr && dayActivities.length > 0 && (
                    <div className="space-y-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      {dayActivities.slice(0, 5).map((activity) => (
                        <SimpleActivityCard key={activity.id} activity={activity} isToday={isDayToday} />
                      ))}
                      {dayActivities.length > 5 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">+{dayActivities.length - 5} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: Horizontal grid */}
          <div className="hidden sm:grid sm:grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const dayActivities = getActivitiesForDate(day);
              const isDayToday = isToday(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const completedCount = dayActivities.filter((a) => a.status === "completed").length;
              const isWeekend = index === 5 || index === 6;

              return (
                <div
                  key={index}
                  className={`
                    rounded-lg border p-3 min-h-[120px] transition-all
                    ${
                      isDayToday
                        ? "bg-flash-green/5 dark:bg-flash-green/10 border-flash-green"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }
                    ${isWeekend ? "opacity-75" : ""}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className={`text-sm font-medium ${isDayToday ? "text-flash-green" : "text-gray-900 dark:text-white"}`}>{format(day, "EEE")}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{format(day, "MMM d")}</p>
                    </div>
                    {dayActivities.length > 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {completedCount}/{dayActivities.length}
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddActivity(dateStr)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-flash-green transition-colors"
                        title="Add activity"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity) => (
                      <SimpleActivityCard key={activity.id} activity={activity} isToday={isDayToday} />
                    ))}
                    {dayActivities.length > 3 && <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">+{dayActivities.length - 3}</div>}
                    {dayActivities.length === 0 && (
                      <div
                        onClick={() => onAddActivity(dateStr)}
                        className="text-xs text-gray-400 dark:text-gray-500 text-center py-4 cursor-pointer hover:text-flash-green transition-colors"
                      >
                        Click to add
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
