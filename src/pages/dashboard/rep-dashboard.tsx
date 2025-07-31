import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSubmissions } from '@/hooks/useSubmissions';
import { getUserFromStorage } from '@/lib/auth';
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

  useEffect(() => {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Always filter by the logged-in user for sales reps
  const { submissions, isLoading } = useSubmissions(
    user ? { username: user.username } : {},
    { pageIndex: 0, pageSize: 1000 }
  );

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

  return (
    <DashboardLayout title={`${user?.username || 'Sales Rep'} Dashboard`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Total Leads</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.totalLeads}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-flash-green opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Hot Leads</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.hotLeads}</p>
              <p className="text-xs text-light-text-tertiary">Interest 4-5</p>
            </div>
            <FireIcon className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Need Follow-up</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.needsFollowUp}</p>
              <p className="text-xs text-light-text-tertiary">Urgent/High</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Closed This Month</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.closedThisMonth}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Conversion Rate</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.conversionRate}%</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${
              stats.conversionRate >= 20 ? 'bg-green-100' : 
              stats.conversionRate >= 10 ? 'bg-yellow-100' : 'bg-red-100'
            } flex items-center justify-center`}>
              <span className={`text-sm font-bold ${
                stats.conversionRate >= 20 ? 'text-green-600' : 
                stats.conversionRate >= 10 ? 'text-yellow-600' : 'text-red-600'
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
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-light-border">
        <h2 className="text-lg font-semibold text-light-text-primary mb-4">Quick Actions</h2>
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
    </DashboardLayout>
  );
}