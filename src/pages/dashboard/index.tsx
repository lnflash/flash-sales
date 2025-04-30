import { 
  ArrowUpIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import InterestChart from '@/components/dashboard/InterestChart';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import RecentSubmissions from '@/components/dashboard/RecentSubmissions';
import SalesRepScoreboard from '@/components/dashboard/SalesRepScoreboard';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution } from '@/utils/stats-calculator';
import { calculateRepStats } from '@/utils/rep-stats-calculator';

export default function Dashboard() {
  const { stats, isLoading: isLoadingStats } = useSubmissionStats();
  // Get more submissions for the rep scoreboard than just the recent ones
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions(
    {}, // No filters
    { pageIndex: 0, pageSize: 100 }, // Get more data for accurate rep stats
    [{ id: 'timestamp', desc: true }] // Sort by most recent
  );

  const interestDistribution = calculateInterestDistribution(submissions);
  const repStats = calculateRepStats(submissions);

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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <InterestChart 
            data={stats?.interestedByMonth || []}
            isLoading={isLoadingStats}
          />
        </div>
        <div>
          <InterestDistributionChart 
            distribution={interestDistribution}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <RecentSubmissions 
            submissions={submissions}
            isLoading={isLoadingSubmissions}
          />
        </div>
        <div>
          <SalesRepScoreboard
            repStats={repStats}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>
    </DashboardLayout>
  );
}