import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MinimalistCalendar } from "@/components/weekly-program/MinimalistCalendar";
import { SimpleGoals } from "@/components/weekly-program/SimpleGoals";
import { ActivityModal } from "@/components/weekly-program/ActivityModal";
import { ActivityDetails } from "@/components/weekly-program/ActivityDetails";
import { useWeeklyProgramStore } from "@/stores/useWeeklyProgramStore";
import { useAuth } from "@/hooks/useAuth";
import { Activity } from "@/types/weekly-program";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, PlusIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function WeeklyProgramPage() {
  const { currentWeek, setCurrentWeek, getWeeklyMetrics } = useWeeklyProgramStore();
  const { user, loading: authLoading } = useAuth();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [showAdvancedView, setShowAdvancedView] = useState(false);

  const metrics = getWeeklyMetrics();
  const weekStart = new Date(currentWeek);

  const handlePreviousWeek = () => {
    const prevWeek = subWeeks(weekStart, 1);
    setCurrentWeek(format(prevWeek, "yyyy-MM-dd"));
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(weekStart, 1);
    setCurrentWeek(format(nextWeek, "yyyy-MM-dd"));
  };

  const handleCurrentWeek = () => {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    setCurrentWeek(format(today, "yyyy-MM-dd"));
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  const handleAddActivity = (date?: string) => {
    setDefaultDate(date);
    setSelectedActivity(null);
    setShowActivityModal(true);
  };

  const handleEditActivity = () => {
    setShowDetailsModal(false);
    setShowActivityModal(true);
  };

  if (authLoading) {
    return (
      <DashboardLayout title="Weekly Program">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Weekly Program">
      <div className="space-y-6 p-4 max-w-6xl mx-auto">
        {/* Streamlined Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Program</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Focus on what matters most this week</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle for advanced view (placeholder for future feature) */}
            <button
              onClick={() => setShowAdvancedView(!showAdvancedView)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title={showAdvancedView ? "Switch to simple view" : "Switch to advanced view"}
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{showAdvancedView ? "Simple" : "Advanced"}</span>
            </button>

            {/* Quick add button */}
            <button
              onClick={() => handleAddActivity()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-flash-green hover:bg-flash-green/90 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Activity</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Simple Week Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <button onClick={handlePreviousWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {format(weekStart, "MMM d")} - {format(addWeeks(weekStart, 1), "MMM d, yyyy")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {metrics.completedActivities} of {metrics.totalActivities} completed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCurrentWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Go to current week"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content - Mobile: Stack, Desktop: Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Goals Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SimpleGoals />
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <MinimalistCalendar onActivityClick={handleActivityClick} onAddActivity={handleAddActivity} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setDefaultDate(undefined);
          setSelectedActivity(null);
        }}
        activity={selectedActivity || undefined}
        defaultDate={defaultDate}
      />

      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedActivity(null);
          }}
          onEdit={handleEditActivity}
        />
      )}
    </DashboardLayout>
  );
}
