import { lazy, Suspense, useState, useEffect } from 'react';
import { 
  ArrowUpIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  SparklesIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution } from '@/utils/stats-calculator';
import { calculateRepStats, calculateSignupLeaderboard, calculateInterestLeaderboard } from '@/utils/rep-stats-calculator';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeDeals';
import { getUserFromStorage } from '@/lib/auth';
import { getUserRole, hasPermission } from '@/types/roles';
import CreateNotificationModal from '@/components/notifications/CreateNotificationModal';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';

// Lazy load heavy components
const SubmissionTrends = lazy(() => import('@/components/dashboard/SubmissionTrends'));
const InterestDistributionChart = lazy(() => import('@/components/dashboard/InterestDistributionChart'));
const RecentSubmissions = lazy(() => import('@/components/dashboard/RecentSubmissions'));
const SalesRepScoreboard = lazy(() => import('@/components/dashboard/SalesRepScoreboard'));
const SignupLeaderboard = lazy(() => import('@/components/dashboard/SignupLeaderboard'));
const InterestLeaderboard = lazy(() => import('@/components/dashboard/InterestLeaderboard'));
const PerformanceReview = lazy(() => 
  import('@/components/dashboard/PerformanceReview').then(module => ({ 
    default: module.PerformanceReview 
  }))
);

// Loading component for suspense
const ChartSkeleton = () => (
  <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
    <div className="h-48 bg-gray-700 rounded"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-700 rounded"></div>
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const { stats, isLoading: isLoadingStats } = useSubmissionStats();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [canCreateNotifications, setCanCreateNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      setUser(currentUser);
      const role = getUserRole(currentUser.username);
      
      // Redirect Sales Reps to their personal dashboard
      if (role === 'Flash Sales Rep') {
        router.replace('/dashboard/rep-dashboard');
        return;
      }
      
      // Only admins can create notifications
      setCanCreateNotifications(hasPermission(role, 'canAssignRoles'));
    }
  }, [router]);
  
  // Filter submissions based on user role
  const getFilters = () => {
    if (user && !hasPermission(user.role, 'canViewAllReps')) {
      return { username: user.username };
    }
    return {};
  };
  
  // Get submissions with appropriate filtering
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions(
    getFilters(), // Apply filters based on role
    { pageIndex: 0, pageSize: 1000 }, // Get all submissions for accurate rep stats
    [{ id: 'timestamp', desc: true }] // Sort by most recent
  );

  // Enable real-time updates
  useRealtimeSubscriptions({
    enableDeals: true,
    enableOrganizations: true,
    enableActivities: false,
    enableNotifications: true
  });

  const interestDistribution = calculateInterestDistribution(submissions);
  const repStats = calculateRepStats(submissions);
  const signupLeaderboard = calculateSignupLeaderboard(submissions);
  const interestLeaderboard = calculateInterestLeaderboard(submissions);

  return (
    <DashboardLayout title="Dashboard">
      {canCreateNotifications && (
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => setShowNotificationModal(true)}
            className="bg-flash-green hover:bg-flash-green-light flex items-center gap-2"
          >
            <BellAlertIcon className="h-5 w-5" />
            Create Notification
          </Button>
        </div>
      )}

      <CreateNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSuccess={() => {
          // Notification created successfully
        }}
      />
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Submissions"
          value={stats?.total || 0}
          icon={<UsersIcon className="h-6 w-6" />}
          change={{ value: 12, positive: true }}
          color="green"
        />
        <StatsCard
          title="Signed Up"
          value={stats?.signedUp || 0}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          change={{ value: 8, positive: true }}
          color="blue"
        />
        <StatsCard
          title="Average Interest"
          value={stats?.avgInterestLevel?.toFixed(1) || '0.0'}
          icon={<SparklesIcon className="h-6 w-6" />}
          subtitle="/10"
          color="purple"
        />
        <StatsCard
          title="Package Views"
          value={`${stats?.packageSeenPercentage?.toFixed(0) || 0}%`}
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
          change={{ value: 5, positive: true }}
          color="yellow"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<ChartSkeleton />}>
          <SubmissionTrends submissions={submissions} isLoading={isLoadingSubmissions} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <InterestDistributionChart distribution={interestDistribution} />
        </Suspense>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Suspense fallback={<TableSkeleton />}>
          <SalesRepScoreboard data={repStats} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <SignupLeaderboard repStats={signupLeaderboard} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <InterestLeaderboard repStats={interestLeaderboard} />
        </Suspense>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<TableSkeleton />}>
          <RecentSubmissions submissions={submissions.slice(0, 10)} isLoading={isLoadingSubmissions} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <PerformanceReview />
        </Suspense>
      </section>
    </DashboardLayout>
  );
}