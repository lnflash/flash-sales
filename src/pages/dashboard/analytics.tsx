import { 
  ChartBarIcon,
  UsersIcon, 
  ReceiptPercentIcon, 
  CheckCircleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InterestChart from '@/components/dashboard/InterestChart';
import InterestDistributionChart from '@/components/dashboard/InterestDistributionChart';
import { useSubmissionStats } from '@/hooks/useSubmissionStats';
import { useSubmissions } from '@/hooks/useSubmissions';
import { calculateInterestDistribution, calculateConversionRate } from '@/utils/stats-calculator';

export default function AnalyticsPage() {
  const { stats, isLoading: isLoadingStats } = useSubmissionStats();
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions();

  const interestDistribution = calculateInterestDistribution(submissions);
  const conversionRate = calculateConversionRate(submissions);

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
              <p className="text-2xl font-bold text-white">{stats?.packageSeenPercentage.toFixed(1) || 0}%</p>
              <p className="text-xs text-gray-500">Owners who saw the package</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-3 rounded-md bg-purple-500/10 mr-4">
              <ReceiptPercentIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg. Interest Score</p>
              <p className="text-2xl font-bold text-white">{stats?.avgInterestLevel.toFixed(1) || 0}/5</p>
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
          <h3 className="text-lg font-medium text-white mb-4">Top Business Categories</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Retail</span>
                <span className="text-sm text-gray-400">35%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-green h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Food & Beverage</span>
                <span className="text-sm text-gray-400">28%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-green h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Services</span>
                <span className="text-sm text-gray-400">20%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-green h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Tourism</span>
                <span className="text-sm text-gray-400">12%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-green h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Other</span>
                <span className="text-sm text-gray-400">5%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-green h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Sales Rep Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">flash</span>
                <span className="text-sm text-gray-400">42%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-yellow h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">sales</span>
                <span className="text-sm text-gray-400">38%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-yellow h-2 rounded-full" style={{ width: '38%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">admin</span>
                <span className="text-sm text-gray-400">20%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-flash-yellow h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-flash-dark-3 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Most Requested Features</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Mobile Payments</span>
                <span className="text-sm text-gray-400">45%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">POS Integration</span>
                <span className="text-sm text-gray-400">32%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Bitcoin Processing</span>
                <span className="text-sm text-gray-400">28%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Staff Training</span>
                <span className="text-sm text-gray-400">20%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Other</span>
                <span className="text-sm text-gray-400">15%</span>
              </div>
              <div className="w-full bg-flash-dark-2 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}