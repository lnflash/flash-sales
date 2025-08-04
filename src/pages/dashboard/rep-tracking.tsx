import { NextPage } from 'next';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { RepTrackingForm } from '../../components/rep-tracking/RepTrackingForm';
import { RepTrackingTable } from '../../components/rep-tracking/RepTrackingTable';
import { useRepTracking } from '../../hooks/useRepTracking';
import { useState, useEffect } from 'react';
import { getUserFromStorage } from '@/lib/auth';
import { getUserRole, hasPermission } from '@/types/roles';
import { useAllRepsProgram } from '@/hooks/useAllRepsProgram';
import { ActivityHeatmap } from '@/components/rep-tracking/ActivityHeatmap';
import { PerformanceLeaderboard } from '@/components/rep-tracking/PerformanceLeaderboard';
import { GoalAchievementChart } from '@/components/rep-tracking/GoalAchievementChart';
import { ProgramSummaryStats } from '@/components/rep-tracking/ProgramSummaryStats';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format, startOfWeek, subWeeks } from 'date-fns';

const RepTrackingPage: NextPage = () => {
  const [filters, setFilters] = useState<{ repName?: string }>({});
  const [canViewAllReps, setCanViewAllReps] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');
  const [weekOffset, setWeekOffset] = useState(0);
  
  const { data: trackingData = [], isLoading } = useRepTracking(filters);
  const { repsData, aggregateMetrics, isLoading: isProgramLoading } = useAllRepsProgram(weekOffset);
  
  const currentWeek = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekLabel = weekOffset === 0 ? 'This Week' : 
                    weekOffset === 1 ? 'Last Week' : 
                    `${weekOffset} Weeks Ago`;

  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      const role = getUserRole(user.username);
      const canViewAll = hasPermission(role, 'canViewAllReps');
      setCanViewAllReps(canViewAll);
      
      // If user can only view their own data, filter by their username
      if (!canViewAll) {
        setFilters({ repName: user.username });
      }
    }
  }, []);

  const handlePreviousWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  const handleNextWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset(weekOffset - 1);
    }
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  return (
    <DashboardLayout title="Rep Performance Tracking">
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-border" data-tour="rep-tracking-tabs">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'attendance'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5" />
              Attendance Tracking
            </div>
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'program'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Program of Work Analytics
            </div>
          </button>
        </nav>
      </div>

      {/* Attendance Tracking Tab */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1" data-tour="rep-tracking-form">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Track Weekly Performance
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Record whether reps submitted their Monday update and attended the Tuesday call.
              </p>
            </div>
            <RepTrackingForm />
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2" data-tour="rep-tracking-history">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Performance History
                </h2>
                {canViewAllReps && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Viewing: All Reps
                  </span>
                )}
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : trackingData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tracking data available. Start by adding rep performance data.
                </div>
              ) : (
                <RepTrackingTable data={trackingData} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Program of Work Analytics Tab */}
      {activeTab === 'program' && (
        <div className="space-y-6">
          {/* Week Navigation */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Previous week"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-foreground">
                    {weekLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {format(currentWeek, 'MMM d')} - {format(new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <button
                  onClick={handleNextWeek}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  disabled={weekOffset === 0}
                  title="Next week"
                >
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCurrentWeek}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Current Week
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div data-tour="program-analytics-stats">
            <ProgramSummaryStats 
              aggregateMetrics={aggregateMetrics} 
              weekOffset={weekOffset}
            />
          </div>

          {/* Main Content Grid */}
          {isProgramLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading program data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Activity Heatmap */}
              <div className="xl:col-span-2" data-tour="activity-heatmap">
                <ActivityHeatmap 
                  repsData={repsData} 
                  weekStart={format(currentWeek, 'yyyy-MM-dd')}
                />
              </div>

              {/* Performance Leaderboard */}
              <div>
                <PerformanceLeaderboard repsData={repsData} />
              </div>

              {/* Goal Achievement Chart */}
              <div>
                <GoalAchievementChart repsData={repsData} />
              </div>
            </div>
          )}

          {/* Admin Notice */}
          {canViewAllReps && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Admin View:</strong> You are viewing aggregated program of work data for all sales reps. 
                Individual reps can only see their own data on their Weekly Program page.
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default RepTrackingPage;