import { 
  ChartBarIcon,
  UsersIcon, 
  ReceiptPercentIcon, 
  CheckCircleIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  CreditCardIcon,
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import InterestChart from '@/components/dashboard/InterestChart';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import DecisionMakersChart from '@/components/dashboard/DecisionMakersChart';
import SalesRepPerformanceChart from '@/components/dashboard/SalesRepPerformanceChart';
import CommonNeedsChart from '@/components/dashboard/CommonNeedsChart';
import SubmissionTrends from '@/components/dashboard/SubmissionTrends';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution, calculateConversionRate } from '@/utils/stats-calculator';
import { calculateEnhancedStats } from '@/utils/enhanced-stats-calculator';

export default function AnalyticsPage() {
  const { stats, isLoading: isLoadingStats } = useSubmissionStats();
  
  // Load more submissions for analytics (up to 1000)
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions(
    {}, // No filters
    { pageIndex: 0, pageSize: 1000 }, // Get more data for analytics
    [{ id: 'timestamp', desc: true }]
  );

  const interestDistribution = calculateInterestDistribution(submissions);
  const conversionRate = calculateConversionRate(submissions);
  
  // Calculate enhanced analytics for the bottom charts
  const enhancedStats = calculateEnhancedStats(submissions);

  return (
    <DashboardLayout title="Analytics">
      {/* Top row: Analytics-specific stats cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          change={{ value: 2.3, positive: true }}
          color="green"
        />
        <StatsCard
          title="Total Businesses"
          value={stats?.total || 0}
          icon={<UsersIcon className="h-6 w-6" />}
          change={{ value: 8, positive: true }}
          color="yellow"
        />
        <StatsCard
          title="Package Exposure"
          value={`${stats?.packageSeenPercentage ? stats.packageSeenPercentage.toFixed(1) : 0}%`}
          icon={<BuildingStorefrontIcon className="h-6 w-6" />}
          change={{ value: 12, positive: true }}
          color="blue"
        />
        <StatsCard
          title="Avg. Interest Score"
          value={`${stats?.avgInterestLevel ? stats.avgInterestLevel.toFixed(1) : 0}/5`}
          icon={<SparklesIcon className="h-6 w-6" />}
          change={{ value: 0.2, positive: true }}
          color="purple"
        />
      </section>
      
      {/* Second row: Charts and trends */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <SubmissionTrends 
            submissions={submissions || []}
            isLoading={isLoadingSubmissions}
          />
        </div>
        <div className="bg-flash-dark-3 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-white mb-4">Submissions Over Time</h3>
          <div className="h-64">
            <InterestChart 
              data={stats?.interestedByMonth || []}
              isLoading={isLoadingStats}
            />
          </div>
        </div>
        <div>
          <InterestDistributionChart 
            distribution={interestDistribution}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>
      
      {/* Third row: Detailed analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-flash-dark-3 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-flash-green" />
            Decision-Maker Analysis
          </h3>
          <p className="text-xs text-gray-400 mb-4">Conversion rates by decision-making structure</p>
          <div className="h-64 overflow-y-auto">
            <DecisionMakersChart 
              data={enhancedStats.decisionMakers}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-flash-yellow" />
            Sales Rep Performance
          </h3>
          <p className="text-xs text-gray-400 mb-4">Ranked by conversion rate with interest levels</p>
          <div className="h-64 overflow-y-auto">
            <SalesRepPerformanceChart 
              data={enhancedStats.repPerformance}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2 text-blue-500" />
            Most Requested Features
          </h3>
          <p className="text-xs text-gray-400 mb-4">Based on specific needs mentioned in submissions</p>
          <div className="h-64 overflow-y-auto">
            <CommonNeedsChart 
              data={enhancedStats.commonNeeds}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}