import { useState } from 'react';
import { 
  TrophyIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';
import SalesFunnelChart from '@/components/dashboard/SalesFunnelChart';
import PerformanceHeatMap from '@/components/dashboard/PerformanceHeatMap';
import PredictiveAnalytics from '@/components/dashboard/PredictiveAnalytics';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import TerritoryAnalyticsDashboard from '@/components/analytics/TerritoryAnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution } from '@/utils/stats-calculator';
import { calculateAdvancedAnalytics } from '@/utils/advanced-analytics';
import { subDays } from 'date-fns';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  
  const { stats, isLoading: isLoadingStats } = useSubmissionStats();
  
  // Load more submissions for analytics (up to 1000)
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions(
    {}, // No filters
    { pageIndex: 0, pageSize: 1000 }, // Get more data for analytics
    [{ id: 'timestamp', desc: true }]
  );

  const interestDistribution = calculateInterestDistribution(submissions);
  
  // Calculate advanced analytics for executive insights
  const advancedAnalytics = calculateAdvancedAnalytics(submissions);

  return (
    <DashboardLayout title="Advanced Analytics">
      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="territories" className="flex items-center gap-2">
            <GlobeAmericasIcon className="w-4 h-4" />
            Territory Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Executive Summary Row */}
          <section className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-light-text-primary mb-2">Executive Summary</h2>
              <p className="text-light-text-secondary">Strategic insights and performance metrics for data-driven decision making</p>
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
          <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-light-text-primary flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-flash-green" />
                Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
                  <div className="text-sm text-light-text-secondary mb-1">Market Penetration</div>
                  <div className="text-xl font-bold text-flash-green">
                    {advancedAnalytics.marketIntel.opportunitySize.currentPenetration.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
                  <div className="text-sm text-light-text-secondary mb-1">Win Rate</div>
                  <div className="text-xl font-bold text-blue-600">
                    {advancedAnalytics.marketIntel.competitivePosition.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
                  <div className="text-sm text-light-text-secondary mb-1">Growth Rate</div>
                  <div className="text-xl font-bold text-purple-600">
                    {advancedAnalytics.marketIntel.opportunitySize.projectedGrowth.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
                  <div className="text-sm text-light-text-secondary mb-1">Market Share</div>
                  <div className="text-xl font-bold text-amber-600">
                    {advancedAnalytics.marketIntel.competitivePosition.marketShare}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <InterestDistributionChart 
            distribution={interestDistribution}
            isLoading={isLoadingSubmissions}
          />
        </div>
      </section>
        </TabsContent>

        {/* Territory Analytics Tab */}
        <TabsContent value="territories" className="space-y-6">
          <TerritoryAnalyticsDashboard 
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}