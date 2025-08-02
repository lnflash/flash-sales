import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WeeklyCalendar } from '@/components/weekly-program/WeeklyCalendar';
import { WeeklyGoals } from '@/components/weekly-program/WeeklyGoals';
import { ActivityModal } from '@/components/weekly-program/ActivityModal';
import { ActivityDetails } from '@/components/weekly-program/ActivityDetails';
import { WeeklyProgramContent } from '@/components/weekly-program/WeeklyProgramContent';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { useAuth } from '@/hooks/useAuth';
import { Activity } from '@/types/weekly-program';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export default function WeeklyProgramPage() {
  const { currentWeek, setCurrentWeek, getWeeklyMetrics, clearWeek } = useWeeklyProgramStore();
  const { user, loading: authLoading } = useAuth();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const isAdmin = !authLoading && user?.role === 'Flash Admin';

  const metrics = getWeeklyMetrics();
  const weekStart = new Date(currentWeek);

  const handlePreviousWeek = () => {
    const prevWeek = subWeeks(weekStart, 1);
    setCurrentWeek(format(prevWeek, 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(weekStart, 1);
    setCurrentWeek(format(nextWeek, 'yyyy-MM-dd'));
  };

  const handleCurrentWeek = () => {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    setCurrentWeek(format(today, 'yyyy-MM-dd'));
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

  const handleExportWeek = () => {
    try {
      // Get all activities for the week using the store's filtered method
      const weekActivities = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayActivities = useWeeklyProgramStore.getState().getActivitiesByDate(dateStr);
        weekActivities.push(...dayActivities);
      }
      
      if (weekActivities.length === 0) {
        alert('No activities to export for this week.');
        return;
      }

    const csvContent = [
      ['Date', 'Time', 'Type', 'Title', 'Lead', 'Priority', 'Status', 'Outcome'].join(','),
      ...weekActivities.map(activity => [
        activity.date,
        activity.time || '',
        activity.type,
        `"${activity.title}"`,
        `"${activity.leadName || ''}"`,
        activity.priority,
        activity.status,
        `"${activity.outcome || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-program-${currentWeek}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting week:', error);
      alert('Failed to export week data. Please try again.');
    }
  };

  const handleClearWeek = () => {
    if (window.confirm('Are you sure you want to clear all activities for this week? This action cannot be undone.')) {
      clearWeek();
    }
  };

  return (
    <DashboardLayout title="Weekly Program of Work">
      <WeeklyProgramContent>
        {/* Header Section */}
        <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Weekly Program of Work</h1>
            <p className="text-muted-foreground mt-1">
              Plan and track your weekly sales activities
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleAddActivity()}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Add Activity
            </Button>
            <Button
              onClick={handleExportWeek}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export Week
            </Button>
            {isAdmin && (
              <Button
                onClick={handleClearWeek}
                variant="destructive"
                size="default"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <TrashIcon className="h-5 w-5" />
                Clear All Week Data
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="mb-6 bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Week of {format(weekStart, 'MMMM d, yyyy')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(weekStart, 'MMM d')} - {format(addWeeks(weekStart, 1), 'MMM d, yyyy')}
              </p>
            </div>
            
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <Button
            onClick={handleCurrentWeek}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Current Week
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold text-foreground">{metrics.totalActivities}</p>
            </div>
            <ClipboardDocumentListIcon className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{metrics.completedActivities}</p>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 opacity-20">
              ✓
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics.inProgressActivities}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-primary">{metrics.completionRate}%</p>
            </div>
            <div className="relative h-8 w-8">
              <svg className="h-8 w-8 transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${metrics.completionRate * 0.88} 88`}
                  className="text-primary opacity-20"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Weekly Goals - Sidebar */}
        <div className="xl:col-span-1">
          <WeeklyGoals />
        </div>

        {/* Weekly Calendar - Main Content */}
        <div className="xl:col-span-3">
          <WeeklyCalendar
            onActivityClick={handleActivityClick}
            onAddActivity={handleAddActivity}
          />
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
      </WeeklyProgramContent>
    </DashboardLayout>
  );
};