import React from "react";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
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
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

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

interface WeeklyCalendarProps {
  onActivityClick: (activity: Activity) => void;
  onAddActivity: (date: string) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onActivityClick, onAddActivity }) => {
  const { currentWeek, getActivitiesByDate, updateActivityStatus } = useWeeklyProgramStore();
  const weekStart = new Date(currentWeek);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getActivitiesForDate = (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const activities = getActivitiesByDate(dateStr);

      if (!Array.isArray(activities)) {
        console.error("getActivitiesByDate did not return an array");
        return [];
      }

      return activities.sort((a, b) => {
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

  const getStatusIcon = (status: Activity["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "cancelled":
        return <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "in_progress":
        return <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  const ActivityCard: React.FC<{ activity: Activity; isToday: boolean }> = ({ activity, isToday }) => {
    const config = ACTIVITY_TYPE_CONFIG[activity.type];
    const Icon = iconMap[config.icon as keyof typeof iconMap];
    const priorityConfig = PRIORITY_CONFIG[activity.priority];

    return (
      <div
        onClick={() => onActivityClick(activity)}
        className={`
          group relative p-3 rounded-lg border cursor-pointer transition-all
          ${activity.status === "completed" ? "opacity-75" : ""}
          ${activity.status === "cancelled" ? "opacity-50 line-through" : ""}
          ${config.color} ${config.darkColor}
          hover:shadow-md hover:scale-[1.02]
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                {activity.time && <span className="text-xs opacity-75">{activity.time}</span>}
              </div>
              {activity.type === "custom" && activity.customType && <p className="text-xs font-medium opacity-90">{activity.customType}</p>}
              {activity.entityName && <p className="text-xs opacity-75 truncate">{activity.entityName}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs ${priorityConfig.color}`}>{priorityConfig.label}</span>
                {getStatusIcon(activity.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {activity.status === "planned" && isToday && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateActivityStatus(activity.id, "in_progress");
                }}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
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
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
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

  const MobileActivityCard: React.FC<{
    activity: Activity;
    isToday: boolean;
    onActivityClick: (activity: Activity) => void;
    updateActivityStatus: (id: string, status: Activity["status"]) => void;
  }> = ({ activity, isToday, onActivityClick, updateActivityStatus }) => {
    const config = ACTIVITY_TYPE_CONFIG[activity.type];
    const Icon = iconMap[config.icon as keyof typeof iconMap];
    const priorityConfig = PRIORITY_CONFIG[activity.priority];

    return (
      <div
        onClick={() => onActivityClick(activity)}
        className={`
          relative p-4 rounded-lg border cursor-pointer transition-all
          ${activity.status === "completed" ? "opacity-75" : ""}
          ${activity.status === "cancelled" ? "opacity-50 line-through" : ""}
          bg-white dark:bg-gray-800 border-light-border dark:border-gray-700
          hover:shadow-md active:scale-[0.98]
        `}
      >
        {/* Priority indicator bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${priorityConfig.bgColor}`} />

        <div className="space-y-3">
          {/* Header with icon, title, and time */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md ${config.color} ${config.darkColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium text-light-text-primary dark:text-white truncate">{activity.title}</h4>
                  {activity.type === "custom" && activity.customType && (
                    <p className="text-sm font-medium text-light-text-secondary dark:text-gray-400">{activity.customType}</p>
                  )}
                </div>
                {activity.time && <span className="text-sm font-medium text-light-text-secondary dark:text-gray-400 ml-2">{activity.time}</span>}
              </div>
            </div>
          </div>

          {/* Entity name if available */}
          {activity.entityName && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-light-text-tertiary dark:text-gray-500" />
              <p className="text-sm text-light-text-secondary dark:text-gray-400 truncate">{activity.entityName}</p>
            </div>
          )}

          {/* Priority and status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color} ${priorityConfig.bgColor}`}>
                {priorityConfig.label}
              </span>
              {getStatusIcon(activity.status)}
            </div>

            {/* Action buttons for mobile */}
            <div className="flex items-center gap-2">
              {activity.status === "planned" && isToday && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateActivityStatus(activity.id, "in_progress");
                  }}
                  className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                  title="Start"
                >
                  <ClockIcon className="h-4 w-4" />
                </button>
              )}
              {activity.status === "in_progress" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateActivityStatus(activity.id, "completed");
                  }}
                  className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                  title="Complete"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActivityClick(activity);
                }}
                className="p-2 bg-light-bg-secondary dark:bg-gray-700 text-light-text-secondary dark:text-gray-400 rounded-md hover:bg-light-bg-tertiary dark:hover:bg-gray-600 transition-colors"
                title="View details"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile: Single column layout, Desktop: 7-column grid */}
      <div className="block md:hidden">
        {/* Mobile View - Vertical stack of days */}
        {weekDays.map((day, index) => {
          const dayActivities = getActivitiesForDate(day);
          const isDayToday = isToday(day);
          const isWeekend = index === 5 || index === 6;

          return (
            <div
              key={index}
              className={`
                rounded-lg border p-4 mb-4
                ${
                  isDayToday
                    ? "bg-flash-green/5 dark:bg-flash-green/10 border-flash-green"
                    : "bg-white dark:bg-gray-800 border-light-border dark:border-gray-700"
                }
                ${isWeekend ? "opacity-75" : ""}
              `}
            >
              {/* Mobile Day Header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-light-text-primary dark:text-white">{format(day, "EEEE")}</h3>
                  <p className={`text-sm ${isDayToday ? "text-flash-green" : "text-light-text-secondary dark:text-gray-400"}`}>{format(day, "MMM d")}</p>
                </div>
                <button
                  onClick={() => onAddActivity(format(day, "yyyy-MM-dd"))}
                  className="p-2 rounded-md hover:bg-light-bg-secondary dark:hover:bg-gray-700 transition-colors"
                  title="Add activity"
                >
                  <PlusIcon className="h-5 w-5 text-light-text-secondary dark:text-gray-400" />
                </button>
              </div>

              {/* Mobile Activities */}
              <div className="space-y-2">
                {dayActivities.length === 0 ? (
                  <div
                    onClick={() => onAddActivity(format(day, "yyyy-MM-dd"))}
                    className="py-8 flex flex-col items-center justify-center text-light-text-secondary dark:text-gray-400 text-sm cursor-pointer hover:bg-light-bg-secondary dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <PlusCircleIcon className="h-8 w-8 mb-2 opacity-50" />
                    <span>No activities</span>
                    <span className="text-xs opacity-75">Tap to add</span>
                  </div>
                ) : (
                  dayActivities.map((activity) => (
                    <MobileActivityCard
                      key={activity.id}
                      activity={activity}
                      isToday={isDayToday}
                      onActivityClick={onActivityClick}
                      updateActivityStatus={updateActivityStatus}
                    />
                  ))
                )}
              </div>

              {/* Mobile Day Summary */}
              <div className="mt-3 pt-3 border-t border-light-border dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-light-text-secondary dark:text-gray-400">
                  <span>{dayActivities.length} activities</span>
                  <span>{dayActivities.filter((a) => a.status === "completed").length} completed</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View - 7-column grid */}
      <div className="hidden md:grid md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayActivities = getActivitiesForDate(day);
          const isDayToday = isToday(day);
          const isWeekend = index === 5 || index === 6;

          return (
            <div
              key={index}
              className={`
                rounded-lg border p-4
                ${
                  isDayToday
                    ? "bg-flash-green/5 dark:bg-flash-green/10 border-flash-green"
                    : "bg-white dark:bg-gray-800 border-light-border dark:border-gray-700"
                }
                ${isWeekend ? "opacity-75" : ""}
              `}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-light-text-primary dark:text-white">{format(day, "EEEE")}</h3>
                  <p className={`text-sm ${isDayToday ? "text-flash-green" : "text-light-text-secondary dark:text-gray-400"}`}>{format(day, "MMM d")}</p>
                </div>
                <button
                  onClick={() => onAddActivity(format(day, "yyyy-MM-dd"))}
                  className="p-1.5 rounded-md hover:bg-light-bg-secondary dark:hover:bg-gray-700 transition-colors"
                  title="Add activity"
                >
                  <PlusIcon className="h-4 w-4 text-light-text-secondary dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {dayActivities.length === 0 ? (
                  <div
                    onClick={() => onAddActivity(format(day, "yyyy-MM-dd"))}
                    className="h-full flex items-center justify-center text-light-text-secondary dark:text-gray-400 text-sm cursor-pointer hover:bg-light-bg-secondary dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <span>No activities</span>
                  </div>
                ) : (
                  dayActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} isToday={isDayToday} />)
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-light-border dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-light-text-secondary dark:text-gray-400">
                  <span>{dayActivities.length} activities</span>
                  <span>{dayActivities.filter((a) => a.status === "completed").length} done</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
