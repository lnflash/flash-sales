import { 
  ChartBarIcon,
  UsersIcon, 
  CheckCircleIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';
import SalesFunnelChart from '@/components/dashboard/SalesFunnelChart';
import PerformanceHeatMap from '@/components/dashboard/PerformanceHeatMap';
import PredictiveAnalytics from '@/components/dashboard/PredictiveAnalytics';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import DecisionMakersChart from '@/components/dashboard/DecisionMakersChart';
import SalesRepPerformanceChart from '@/components/dashboard/SalesRepPerformanceChart';
import CommonNeedsChart from '@/components/dashboard/CommonNeedsChart';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution, calculateConversionRate } from '@/utils/stats-calculator';
import { calculateEnhancedStats } from '@/utils/enhanced-stats-calculator';
import { calculateAdvancedAnalytics } from '@/utils/advanced-analytics';

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
  
  // Calculate enhanced analytics for traditional charts
  const enhancedStats = calculateEnhancedStats(submissions);
  
  // Calculate advanced analytics for executive insights
  const advancedAnalytics = calculateAdvancedAnalytics(submissions);

  return (
    <DashboardLayout title="Advanced Analytics">
      {/* Executive Summary Row */}
      <section className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Executive Summary</h2>
          <p className="text-gray-400">Strategic insights and performance metrics for data-driven decision making</p>
        </div>
        <ExecutiveDashboard 
          analytics={advancedAnalytics}
          isLoading={isLoadingSubmissions}
        />
      </section>
      
      {/* Strategic Analytics Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SalesFunnelChart 
          submissions={submissions || []}
          isLoading={isLoadingSubmissions}
        />
        <PredictiveAnalytics 
          predictions={advancedAnalytics.predictions}
          historicalData={submissions || []}
          isLoading={isLoadingSubmissions}
        />
      </section>
      
      {/* Performance Analytics Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PerformanceHeatMap 
          submissions={submissions || []}
          isLoading={isLoadingSubmissions}
        />
        <div className="space-y-6">
          <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <TrophyIcon className="h-5 w-5 mr-2 text-flash-yellow" />
              Market Intelligence
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-flash-dark-2 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Market Penetration</div>
                <div className="text-xl font-bold text-flash-green">
                  {advancedAnalytics.marketIntel.opportunitySize.currentPenetration.toFixed(2)}%
                </div>
              </div>
              <div className="bg-flash-dark-2 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                <div className="text-xl font-bold text-blue-400">
                  {advancedAnalytics.marketIntel.competitivePosition.winRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-flash-dark-2 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Growth Rate</div>
                <div className="text-xl font-bold text-purple-400">
                  {advancedAnalytics.marketIntel.opportunitySize.projectedGrowth.toFixed(1)}%
                </div>
              </div>
              <div className="bg-flash-dark-2 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Market Share</div>
                <div className="text-xl font-bold text-amber-400">
                  {advancedAnalytics.marketIntel.competitivePosition.marketShare}%
                </div>
              </div>
            </div>
          </div>
          
          <InterestDistributionChart 
            distribution={interestDistribution}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>
      
      {/* Traditional Analytics Row (for comparison/detail) */}
      <section className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Detailed Analysis</h2>
          <p className="text-gray-400">Traditional analytics and detailed breakdowns</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-flash-dark-3 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-flash-green" />
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
              <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-blue-500" />
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
        </div>
      </section>
    </DashboardLayout>
  );
}