import { 
  ArrowUpIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import SubmissionTrends from '@/components/dashboard/SubmissionTrends';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import SalesRepScoreboard from '@/components/dashboard/SalesRepScoreboard';
import SignupLeaderboard from '@/components/dashboard/SignupLeaderboard';
import InterestLeaderboard from '@/components/dashboard/InterestLeaderboard';
import { PerformanceReview } from '@/components/dashboard/PerformanceReview';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution } from '@/utils/stats-calculator';
import { calculateRepStats, calculateSignupLeaderboard, calculateInterestLeaderboard } from '@/utils/rep-stats-calculator';

export default function Dashboard() {
  const { stats, isLoading: isLoadingStats } = useSubmissionStats();
  // Get ALL submissions for accurate rep scoreboard calculations
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions(
    {}, // No filters
    { pageIndex: 0, pageSize: 1000 }, // Get all submissions for accurate rep stats
    [{ id: 'timestamp', desc: true }] // Sort by most recent
  );

  const interestDistribution = calculateInterestDistribution(submissions);
  const repStats = calculateRepStats(submissions);
  const signupLeaderboard = calculateSignupLeaderboard(submissions);
  const interestLeaderboard = calculateInterestLeaderboard(submissions);

  return (
    <DashboardLayout title="Dashboard">
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
          color="yellow"
        />
        <StatsCard
          title="Avg. Interest Level"
          value={stats?.avgInterestLevel ? stats.avgInterestLevel.toFixed(1) : '0.0'}
          icon={<SparklesIcon className="h-6 w-6" />}
          change={{ value: 5, positive: true }}
          color="blue"
        />
        <StatsCard
          title="Package Seen"
          value={`${stats?.packageSeenPercentage ? stats.packageSeenPercentage.toFixed(1) : 0}%`}
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
          change={{ value: 3, positive: true }}
          color="purple"
        />
      </section>

      {/* Second row: Three leaderboards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <SalesRepScoreboard
            repStats={repStats}
            isLoading={isLoadingSubmissions}
          />
        </div>
        <div>
          <SignupLeaderboard
            repStats={signupLeaderboard}
            isLoading={isLoadingSubmissions}
          />
        </div>
        <div>
          <InterestLeaderboard
            repStats={interestLeaderboard}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>

      {/* Third row: Submission Trends, Recent Submissions, Interest Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <SubmissionTrends 
            submissions={submissions || []}
            isLoading={isLoadingSubmissions}
          />
        </div>
        <div>
          <RecentSubmissions 
            submissions={submissions}
            isLoading={isLoadingSubmissions}
          />
        </div>
        <div>
          <InterestDistributionChart 
            distribution={interestDistribution}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>

      {/* Fourth row: Performance Review */}
      <section className="mb-8">
        <PerformanceReview />
      </section>
    </DashboardLayout>
  );
}