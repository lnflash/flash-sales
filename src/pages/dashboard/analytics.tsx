import { 
  ChartBarIcon,
  UsersIcon, 
  ReceiptPercentIcon, 
  CheckCircleIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InterestChart from '@/components/dashboard/InterestChart';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import DecisionMakersChart from '@/components/dashboard/DecisionMakersChart';
import SalesRepPerformanceChart from '@/components/dashboard/SalesRepPerformanceChart';
import CommonNeedsChart from '@/components/dashboard/CommonNeedsChart';
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
      <div className="bg-flash-dark-3 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-medium text-white mb-4">Performance Metrics</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start">
            <div className="p-3 rounded-md bg-flash-green/10 mr-4">
              <CheckCircleIcon className="h-6 w-6 text-flash-green" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-white">{conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Prospects to Sign-ups</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-3 rounded-md bg-flash-yellow/10 mr-4">
              <UsersIcon className="h-6 w-6 text-flash-yellow" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Businesses</p>
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-xs text-gray-500">Contacted this year</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-3 rounded-md bg-blue-500/10 mr-4">
              <BuildingStorefrontIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Package Exposure</p>
              <p className="text-2xl font-bold text-white">{stats?.packageSeenPercentage ? stats.packageSeenPercentage.toFixed(1) : 0}%</p>
              <p className="text-xs text-gray-500">Owners who saw the package</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-3 rounded-md bg-purple-500/10 mr-4">
              <ReceiptPercentIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg. Interest Score</p>
              <p className="text-2xl font-bold text-white">{stats?.avgInterestLevel ? stats.avgInterestLevel.toFixed(1) : 0}/5</p>
              <p className="text-xs text-gray-500">From all submissions</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Submissions Over Time</h3>
          <div className="h-80">
            <InterestChart 
              data={stats?.interestedByMonth || []}
              isLoading={isLoadingStats}
            />
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Interest Level Distribution</h3>
          <div className="h-80">
            <InterestDistributionChart 
              distribution={interestDistribution}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-flash-green" />
            Decision-Maker Analysis
          </h3>
          <p className="text-xs text-gray-400 mb-4">Conversion rates by decision-making structure</p>
          <div className="h-80 overflow-y-auto">
            <DecisionMakersChart 
              data={enhancedStats.decisionMakers}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-flash-yellow" />
            Top Sales Rep Performance
          </h3>
          <p className="text-xs text-gray-400 mb-4">Ranked by conversion rate with interest levels</p>
          <div className="h-80 overflow-y-auto">
            <SalesRepPerformanceChart 
              data={enhancedStats.repPerformance}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2 text-blue-500" />
            Most Requested Features
          </h3>
          <p className="text-xs text-gray-400 mb-4">Based on specific needs mentioned in submissions</p>
          <div className="h-80 overflow-y-auto">
            <CommonNeedsChart 
              data={enhancedStats.commonNeeds}
              isLoading={isLoadingSubmissions}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}