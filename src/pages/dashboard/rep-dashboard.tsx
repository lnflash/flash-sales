import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserSubmissions } from '@/hooks/useUserSubmissions';
import { getUserFromStorage } from '@/lib/auth';
import { hasPermission } from '@/types/roles';
import { Submission, LeadStatus } from '@/types/submission';
import { 
  PhoneIcon, 
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  FireIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDate } from '@/utils/date-formatter';
import LeadStatusCard from '@/components/rep-dashboard/LeadStatusCard';
import FollowUpPriorities from '@/components/rep-dashboard/FollowUpPriorities';
import PerformanceSnapshot from '@/components/rep-dashboard/PerformanceSnapshot';
import RepFilter from '@/components/rep-dashboard/RepFilter';

// Lead status priority order
const leadStatusOrder: LeadStatus[] = ['opportunity', 'prospect', 'contacted', 'canvas', 'signed_up'];

// Group submissions by lead status
const groupByLeadStatus = (submissions: Submission[]) => {
  const groups: Record<LeadStatus | 'unassigned', Submission[]> = {
    canvas: [],
    contacted: [],
    prospect: [],
    opportunity: [],
    signed_up: [],
    unassigned: []
  };

  submissions.forEach(submission => {
    const status = submission.leadStatus || 'unassigned';
    if (status in groups) {
      groups[status as LeadStatus | 'unassigned'].push(submission);
    } else {
      groups.unassigned.push(submission);
    }
  });

  // Sort each group by interest level (descending)
  Object.keys(groups).forEach(status => {
    groups[status as LeadStatus | 'unassigned'].sort((a, b) => b.interestLevel - a.interestLevel);
  });

  return groups;
};

// Calculate follow-up priorities
const getFollowUpPriority = (submission: Submission): 'urgent' | 'high' | 'medium' | 'low' => {
  const daysSinceContact = Math.floor(
    (new Date().getTime() - new Date(submission.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (submission.leadStatus === 'opportunity' && daysSinceContact > 2) return 'urgent';
  if (submission.leadStatus === 'prospect' && daysSinceContact > 5) return 'high';
  if (submission.interestLevel >= 4 && daysSinceContact > 3) return 'high';
  if (daysSinceContact > 7) return 'medium';
  return 'low';
};

// Get today's follow-ups with priority info
const getTodaysFollowUps = (submissions: Submission[]) => {
  // In a real app, this would check actual scheduled follow-up dates
  // For now, we'll use business logic based on lead status and last contact
  return submissions
    .map(submission => {
      const priority = getFollowUpPriority(submission);
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(submission.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      );
      return { submission, priority, daysSince };
    })
    .filter(({ priority }) => priority === 'urgent' || priority === 'high')
    .sort((a, b) => {
      // Sort by priority then by days since contact
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.daysSince - a.daysSince;
    })
    .slice(0, 5); // Top 5 follow-ups
};

export default function RepDashboard() {
  const [user, setUser] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState<string>('');

  useEffect(() => {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      setUser(currentUser);
      console.log('Rep Dashboard - Current user:', currentUser.username);
    }
    setIsUserLoading(false);
  }, []);

  // Filter by username unless user has permission to view all reps
  const canViewAllReps = user?.role && hasPermission(user.role, 'canViewAllReps');
  
  // Determine which username to filter by
  // For non-admin users, always filter by their username
  // For admin users, filter by selected username if provided, otherwise their own username
  const usernameToFilter = canViewAllReps && selectedUsername ? selectedUsername : user?.username;
  
  // Debug logging
  console.log('Rep Dashboard Debug:', {
    user: user,
    canViewAllReps,
    selectedUsername,
    usernameToFilter
  });
  
  // Use the new hook that directly queries by username
  const { data, isLoading } = useUserSubmissions(usernameToFilter);
  const submissions = data?.submissions || [];
  const totalCount = data?.count || 0;
  
  console.log('[RepDashboard] useUserSubmissions returned:', {
    data,
    submissionsLength: submissions.length,
    totalCount,
    isLoading,
    usernameToFilter
  });

  // For admins, we'll use a different approach to get available reps
  const [availableReps, setAvailableReps] = useState<string[]>([]);
  
  useEffect(() => {
    // Only fetch available reps if user is admin
    if (canViewAllReps && user) {
      // For now, use a hardcoded list. In production, this would be a separate API call
      setAvailableReps(['charms', 'Tatiana_1', 'rogimon', 'Chala', 'seakah', 'flash'].sort());
    }
  }, [canViewAllReps, user]);

  // Log for debugging
  useEffect(() => {
    console.log('Rep Dashboard - Submissions loaded:', {
      isLoading,
      submissionsCount: submissions.length,
      totalCount,
      user: user?.username,
      usernameToFilter,
      firstSubmission: submissions[0]
    });
  }, [submissions, isLoading, user, usernameToFilter, totalCount]);

  const groupedSubmissions = groupByLeadStatus(submissions);
  const todaysFollowUps = getTodaysFollowUps(submissions);

  // Calculate stats
  const stats = {
    totalLeads: submissions.length,
    hotLeads: submissions.filter(s => s.interestLevel >= 4 && s.leadStatus !== 'signed_up').length,
    needsFollowUp: submissions.filter(s => {
      const priority = getFollowUpPriority(s);
      return priority === 'urgent' || priority === 'high';
    }).length,
    closedThisMonth: submissions.filter(s => {
      if (s.leadStatus !== 'signed_up') return false;
      const submissionDate = new Date(s.timestamp);
      const now = new Date();
      return submissionDate.getMonth() === now.getMonth() && 
             submissionDate.getFullYear() === now.getFullYear();
    }).length,
    conversionRate: submissions.length > 0 
      ? Math.round((submissions.filter(s => s.leadStatus === 'signed_up').length / submissions.length) * 100)
      : 0
  };

  const leadStatusConfig = {
    canvas: { color: 'gray', label: 'Canvas', icon: MapPinIcon },
    contacted: { color: 'yellow', label: 'Contacted', icon: PhoneIcon },
    prospect: { color: 'blue', label: 'Prospect', icon: DocumentTextIcon },
    opportunity: { color: 'purple', label: 'Opportunity', icon: FireIcon },
    signed_up: { color: 'green', label: 'Signed Up', icon: CheckCircleIcon }
  };

  // Show loading state while user data is loading
  if (isUserLoading || isLoading) {
    return (
      <DashboardLayout title="Loading Dashboard...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
            <p className="mt-4 text-light-text-secondary dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show message if no user is logged in
  if (!user) {
    return (
      <DashboardLayout title="Sales Rep Dashboard">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-400">Please log in to view your dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Determine display name for dashboard
  const displayUsername = (canViewAllReps && selectedUsername) ? selectedUsername : user.username;
  const isViewingOwnDashboard = !canViewAllReps || !selectedUsername || selectedUsername === user.username;

  return (
    <DashboardLayout title={`${displayUsername}'s Dashboard`}>
      {/* Rep Filter for Admins */}
      <RepFilter
        currentUsername={user.username}
        selectedUsername={selectedUsername}
        onUsernameChange={setSelectedUsername}
        canViewAllReps={canViewAllReps}
        availableReps={availableReps}
      />

      {/* User Info Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-light-border dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-flash-green to-flash-green-light flex items-center justify-center text-white font-semibold">
            {displayUsername.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-light-text-primary dark:text-white">
              {isViewingOwnDashboard ? `Welcome back, ${user.username}!` : `Viewing ${displayUsername}'s Dashboard`}
            </p>
            <p className="text-xs text-light-text-secondary dark:text-gray-400">
              {canViewAllReps && selectedUsername && selectedUsername !== user.username ? `Admin view of ${selectedUsername}'s data` : 
               'Viewing your personal dashboard'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-light-text-secondary dark:text-gray-400">
            Your Submissions
          </p>
          <p className="text-lg font-semibold text-light-text-primary dark:text-white">{submissions.length}</p>
        </div>
      </div>

      {/* Empty state if no submissions */}
      {submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 border border-light-border dark:border-gray-700 text-center">
          <div className="max-w-md mx-auto">
            <DocumentTextIcon className="w-16 h-16 text-light-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-white mb-2">
              No Leads Yet
            </h3>
            <p className="text-light-text-secondary dark:text-gray-400 mb-6">
              Start building your pipeline by adding your first lead!
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center px-6 py-3 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors"
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Add Your First Lead
            </Link>
          </div>
        </div>
      ) : (
        <>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-light-text-secondary dark:text-gray-400 truncate">Total Leads</p>
              <p className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-white mt-1">{stats.totalLeads}</p>
            </div>
            <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-flash-green opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-light-text-secondary dark:text-gray-400 truncate">Hot Leads</p>
              <p className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-white mt-1">{stats.hotLeads}</p>
              <p className="text-xs text-light-text-tertiary dark:text-gray-500 hidden sm:block">Interest 4-5</p>
            </div>
            <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-light-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-light-text-secondary dark:text-gray-400 truncate">Follow-up</p>
              <p className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-white mt-1">{stats.needsFollowUp}</p>
              <p className="text-xs text-light-text-tertiary dark:text-gray-500 hidden sm:block">Urgent/High</p>
            </div>
            <ExclamationTriangleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-light-border dark:border-gray-700 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-light-text-secondary dark:text-gray-400 truncate">Closed/Month</p>
              <p className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-white mt-1">{stats.closedThisMonth}</p>
            </div>
            <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-50 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-light-border dark:border-gray-700 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-light-text-secondary dark:text-gray-400 truncate">Conversion</p>
              <p className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-white mt-1">{stats.conversionRate}%</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 ml-2 ${
              stats.conversionRate >= 20 ? 'bg-green-100 dark:bg-green-900/30' : 
              stats.conversionRate >= 10 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
            } flex items-center justify-center`}>
              <span className={`text-sm font-bold ${
                stats.conversionRate >= 20 ? 'text-green-600 dark:text-green-400' : 
                stats.conversionRate >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.conversionRate >= 20 ? '🎯' : stats.conversionRate >= 10 ? '📈' : '⚠️'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Snapshot */}
      <PerformanceSnapshot submissions={submissions} />

      {/* Today's Priority Follow-ups */}
      <div className="mb-8">
        <FollowUpPriorities followUps={todaysFollowUps} />
      </div>

      {/* Leads by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {leadStatusOrder.filter(status => status !== 'signed_up').map(status => {
          const leads = groupedSubmissions[status];
          const config = leadStatusConfig[status];
          
          return (
            <LeadStatusCard
              key={status}
              status={status}
              leads={leads}
              config={config}
            />
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-light-border dark:border-gray-700">
        <h2 className="text-lg font-semibold text-light-text-primary dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/intake"
            className="flex items-center justify-center px-4 py-3 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Add New Lead
          </Link>
          <Link
            href="/dashboard/submissions"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            View All Submissions
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <MapPinIcon className="w-5 h-5 mr-2" />
            Update Territory
          </Link>
        </div>
      </div>
      </>
      )}
    </DashboardLayout>
  );
}