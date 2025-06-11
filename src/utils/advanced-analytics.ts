import { Submission } from '@/types/submission';

/**
 * Advanced Analytics for Mature Sales Teams
 * Provides enterprise-level insights, predictive metrics, and strategic KPIs
 */

export interface SalesVelocityMetrics {
  avgTimeToConversion: number; // in days
  velocityTrend: number; // percentage change
  conversionsByTimeframe: {
    '0-7days': number;
    '8-30days': number;
    '31-90days': number;
    '90+days': number;
  };
}

export interface PipelineHealthMetrics {
  totalPipeline: number;
  qualifiedLeads: number; // interest level >= 3
  hotProspects: number; // interest level >= 4
  bottleneckStage: string;
  predictedConversions: number;
  pipelineVelocity: number;
}

export interface PerformanceBenchmarks {
  topPerformer: {
    username: string;
    conversionRate: number;
    efficiency: number;
  };
  teamAverage: {
    conversionRate: number;
    avgInterestLevel: number;
    dailySubmissions: number;
  };
  performanceDistribution: {
    high: number; // top 20%
    medium: number; // middle 60%
    low: number; // bottom 20%
  };
}

export interface MarketIntelligence {
  segmentAnalysis: {
    segment: string;
    count: number;
    conversionRate: number;
    avgInterestLevel: number;
    growthRate: number;
  }[];
  opportunitySize: {
    totalAddressable: number;
    currentPenetration: number;
    projectedGrowth: number;
  };
  competitivePosition: {
    winRate: number;
    avgSalescycle: number;
    marketShare: number;
  };
}

export interface PredictiveInsights {
  forecastedConversions: {
    next7Days: number;
    next30Days: number;
    next90Days: number;
  };
  trendAnalysis: {
    direction: 'up' | 'down' | 'stable';
    strength: number; // 0-100
    confidence: number; // 0-100
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    insight: string;
    action: string;
    expectedImpact: string;
  }[];
}

export interface AdvancedAnalytics {
  salesVelocity: SalesVelocityMetrics;
  pipelineHealth: PipelineHealthMetrics;
  benchmarks: PerformanceBenchmarks;
  marketIntel: MarketIntelligence;
  predictions: PredictiveInsights;
  executiveSummary: {
    keyMetrics: { label: string; value: string; trend: number }[];
    alerts: { type: 'success' | 'warning' | 'danger'; message: string }[];
    nextActions: string[];
  };
}

/**
 * Calculate sales velocity metrics
 */
function calculateSalesVelocity(submissions: Submission[]): SalesVelocityMetrics {
  const conversions = submissions.filter(s => s.signedUp);
  const now = new Date();
  
  // Calculate time to conversion for each converted submission
  const conversionTimes = conversions.map(submission => {
    const submissionDate = new Date(submission.timestamp);
    const timeDiff = now.getTime() - submissionDate.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // days
  });
  
  const avgTimeToConversion = conversionTimes.length > 0 
    ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length 
    : 0;
  
  // Calculate velocity trend (comparing last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentConversions = submissions.filter(s => 
    s.signedUp && new Date(s.timestamp) >= thirtyDaysAgo
  ).length;
  
  const previousConversions = submissions.filter(s => 
    s.signedUp && 
    new Date(s.timestamp) >= sixtyDaysAgo && 
    new Date(s.timestamp) < thirtyDaysAgo
  ).length;
  
  const velocityTrend = previousConversions > 0 
    ? ((recentConversions - previousConversions) / previousConversions) * 100 
    : 0;
  
  // Categorize conversions by timeframe
  const conversionsByTimeframe = {
    '0-7days': conversionTimes.filter(t => t <= 7).length,
    '8-30days': conversionTimes.filter(t => t > 7 && t <= 30).length,
    '31-90days': conversionTimes.filter(t => t > 30 && t <= 90).length,
    '90+days': conversionTimes.filter(t => t > 90).length,
  };
  
  return {
    avgTimeToConversion,
    velocityTrend,
    conversionsByTimeframe
  };
}

/**
 * Calculate pipeline health metrics
 */
function calculatePipelineHealth(submissions: Submission[]): PipelineHealthMetrics {
  const activeSubmissions = submissions.filter(s => !s.signedUp);
  const totalPipeline = activeSubmissions.length;
  const qualifiedLeads = activeSubmissions.filter(s => s.interestLevel >= 3).length;
  const hotProspects = activeSubmissions.filter(s => s.interestLevel >= 4).length;
  
  // Identify bottleneck stage based on package exposure
  const packageNotSeen = activeSubmissions.filter(s => !s.packageSeen).length;
  const bottleneckStage = packageNotSeen > totalPipeline * 0.3 
    ? 'Package Presentation' 
    : 'Final Decision';
  
  // Predict conversions based on historical patterns
  const historicalConversionRate = submissions.length > 0 
    ? submissions.filter(s => s.signedUp).length / submissions.length 
    : 0;
  
  const predictedConversions = Math.round(qualifiedLeads * historicalConversionRate);
  
  // Calculate pipeline velocity (submissions per day)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSubmissions = submissions.filter(s => new Date(s.timestamp) >= thirtyDaysAgo).length;
  const pipelineVelocity = recentSubmissions / 30;
  
  return {
    totalPipeline,
    qualifiedLeads,
    hotProspects,
    bottleneckStage,
    predictedConversions,
    pipelineVelocity
  };
}

/**
 * Calculate performance benchmarks
 */
function calculatePerformanceBenchmarks(submissions: Submission[]): PerformanceBenchmarks {
  // Group by rep
  const repStats = new Map<string, { submissions: number; conversions: number; totalInterest: number }>();
  
  submissions.forEach(submission => {
    const username = submission.username || 'Unknown';
    if (!repStats.has(username)) {
      repStats.set(username, { submissions: 0, conversions: 0, totalInterest: 0 });
    }
    
    const stats = repStats.get(username)!;
    stats.submissions++;
    stats.totalInterest += submission.interestLevel;
    if (submission.signedUp) stats.conversions++;
  });
  
  const repPerformance = Array.from(repStats.entries()).map(([username, stats]) => ({
    username,
    conversionRate: stats.submissions > 0 ? (stats.conversions / stats.submissions) * 100 : 0,
    efficiency: stats.submissions > 0 ? (stats.totalInterest / stats.submissions) * (stats.conversions / stats.submissions) : 0,
    submissions: stats.submissions,
    avgInterestLevel: stats.submissions > 0 ? stats.totalInterest / stats.submissions : 0
  }));
  
  // Find top performer
  const topPerformer = repPerformance.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best, 
    repPerformance[0] || { username: 'N/A', conversionRate: 0, efficiency: 0 }
  );
  
  // Calculate team averages
  const totalSubmissions = submissions.length;
  const totalConversions = submissions.filter(s => s.signedUp).length;
  const totalInterest = submissions.reduce((sum, s) => sum + s.interestLevel, 0);
  
  const teamAverage = {
    conversionRate: totalSubmissions > 0 ? (totalConversions / totalSubmissions) * 100 : 0,
    avgInterestLevel: totalSubmissions > 0 ? totalInterest / totalSubmissions : 0,
    dailySubmissions: totalSubmissions / Math.max(1, getDateRangeInDays(submissions))
  };
  
  // Performance distribution
  const conversionRates = repPerformance.map(r => r.conversionRate).sort((a, b) => b - a);
  const distribution = {
    high: conversionRates.slice(0, Math.ceil(conversionRates.length * 0.2)).length,
    medium: conversionRates.slice(Math.ceil(conversionRates.length * 0.2), Math.ceil(conversionRates.length * 0.8)).length,
    low: conversionRates.slice(Math.ceil(conversionRates.length * 0.8)).length
  };
  
  return {
    topPerformer,
    teamAverage,
    performanceDistribution: distribution
  };
}

/**
 * Calculate market intelligence
 */
function calculateMarketIntelligence(submissions: Submission[]): MarketIntelligence {
  // Segment analysis based on decision makers
  const segments = ['Owner Only', 'Multiple Decision Makers', 'Committee', 'Unknown'];
  const segmentAnalysis = segments.map(segment => {
    const segmentSubmissions = submissions.filter(s => {
      const decisionMakers = s.decisionMakers?.toLowerCase() || '';
      switch (segment) {
        case 'Owner Only':
          return decisionMakers.includes('owner only') || decisionMakers.includes('just me');
        case 'Multiple Decision Makers':
          return decisionMakers.includes('partner') || decisionMakers.includes('and');
        case 'Committee':
          return decisionMakers.includes('committee') || decisionMakers.includes('board');
        default:
          return !decisionMakers || decisionMakers === '';
      }
    });
    
    const conversions = segmentSubmissions.filter(s => s.signedUp).length;
    const avgInterest = segmentSubmissions.length > 0 
      ? segmentSubmissions.reduce((sum, s) => sum + s.interestLevel, 0) / segmentSubmissions.length 
      : 0;
    
    return {
      segment,
      count: segmentSubmissions.length,
      conversionRate: segmentSubmissions.length > 0 ? (conversions / segmentSubmissions.length) * 100 : 0,
      avgInterestLevel: avgInterest,
      growthRate: calculateSegmentGrowthRate(segmentSubmissions)
    };
  }).filter(s => s.count > 0);
  
  // Opportunity sizing (hypothetical)
  const totalAddressable = 10000; // Market estimate
  const currentPenetration = (submissions.length / totalAddressable) * 100;
  const projectedGrowth = calculateGrowthRate(submissions);
  
  return {
    segmentAnalysis,
    opportunitySize: {
      totalAddressable,
      currentPenetration,
      projectedGrowth
    },
    competitivePosition: {
      winRate: submissions.length > 0 ? (submissions.filter(s => s.signedUp).length / submissions.length) * 100 : 0,
      avgSalescycle: 30, // Average sales cycle in days
      marketShare: 15 // Estimated market share percentage
    }
  };
}

/**
 * Generate predictive insights
 */
function generatePredictiveInsights(submissions: Submission[]): PredictiveInsights {
  const recentTrend = calculateGrowthRate(submissions);
  const conversionRate = submissions.length > 0 
    ? submissions.filter(s => s.signedUp).length / submissions.length 
    : 0;
  
  const dailySubmissionRate = submissions.length / Math.max(1, getDateRangeInDays(submissions));
  
  // Forecast based on current trends
  const forecastedConversions = {
    next7Days: Math.round(dailySubmissionRate * 7 * conversionRate),
    next30Days: Math.round(dailySubmissionRate * 30 * conversionRate),
    next90Days: Math.round(dailySubmissionRate * 90 * conversionRate)
  };
  
  // Trend analysis
  const trendDirection = recentTrend > 5 ? 'up' : recentTrend < -5 ? 'down' : 'stable';
  const trendStrength = Math.min(100, Math.abs(recentTrend) * 2);
  const confidence = Math.min(100, submissions.length > 50 ? 85 : submissions.length * 1.5);
  
  // Generate recommendations
  const recommendations = generateRecommendations(submissions, {
    conversionRate: conversionRate * 100,
    trendDirection,
    pipelineSize: submissions.filter(s => !s.signedUp).length
  });
  
  return {
    forecastedConversions,
    trendAnalysis: {
      direction: trendDirection,
      strength: trendStrength,
      confidence
    },
    recommendations
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(submissions: Submission[], context: {
  conversionRate: number;
  trendDirection: string;
  pipelineSize: number;
}): PredictiveInsights['recommendations'] {
  const recommendations: PredictiveInsights['recommendations'] = [];
  
  // Conversion rate recommendations
  if (context.conversionRate < 15) {
    recommendations.push({
      priority: 'high',
      category: 'Conversion Optimization',
      insight: 'Conversion rate is below industry benchmark (15-25%)',
      action: 'Focus on qualifying leads better and improving package presentation',
      expectedImpact: '+3-5% conversion rate improvement'
    });
  }
  
  // Pipeline size recommendations
  if (context.pipelineSize < 20) {
    recommendations.push({
      priority: 'high',
      category: 'Lead Generation',
      insight: 'Pipeline size is critically low',
      action: 'Increase prospecting activities and marketing campaigns',
      expectedImpact: '2x pipeline size within 30 days'
    });
  }
  
  // Trend-based recommendations
  if (context.trendDirection === 'down') {
    recommendations.push({
      priority: 'medium',
      category: 'Performance Recovery',
      insight: 'Negative trend detected in recent performance',
      action: 'Analyze recent changes and implement corrective measures',
      expectedImpact: 'Reverse negative trend within 2 weeks'
    });
  }
  
  return recommendations;
}

/**
 * Helper functions
 */
function getDateRangeInDays(submissions: Submission[]): number {
  if (submissions.length === 0) return 1;
  
  const dates = submissions.map(s => new Date(s.timestamp).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  
  return Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
}

function calculateGrowthRate(submissions: Submission[]): number {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentCount = submissions.filter(s => new Date(s.timestamp) >= thirtyDaysAgo).length;
  const previousCount = submissions.filter(s => 
    new Date(s.timestamp) >= sixtyDaysAgo && new Date(s.timestamp) < thirtyDaysAgo
  ).length;
  
  return previousCount > 0 ? ((recentCount - previousCount) / previousCount) * 100 : 0;
}

function calculateSegmentGrowthRate(segmentSubmissions: Submission[]): number {
  return calculateGrowthRate(segmentSubmissions);
}

/**
 * Main function to calculate all advanced analytics
 */
export function calculateAdvancedAnalytics(submissions: Submission[]): AdvancedAnalytics {
  if (!submissions || submissions.length === 0) {
    return {
      salesVelocity: {
        avgTimeToConversion: 0,
        velocityTrend: 0,
        conversionsByTimeframe: { '0-7days': 0, '8-30days': 0, '31-90days': 0, '90+days': 0 }
      },
      pipelineHealth: {
        totalPipeline: 0,
        qualifiedLeads: 0,
        hotProspects: 0,
        bottleneckStage: 'N/A',
        predictedConversions: 0,
        pipelineVelocity: 0
      },
      benchmarks: {
        topPerformer: { username: 'N/A', conversionRate: 0, efficiency: 0 },
        teamAverage: { conversionRate: 0, avgInterestLevel: 0, dailySubmissions: 0 },
        performanceDistribution: { high: 0, medium: 0, low: 0 }
      },
      marketIntel: {
        segmentAnalysis: [],
        opportunitySize: { totalAddressable: 0, currentPenetration: 0, projectedGrowth: 0 },
        competitivePosition: { winRate: 0, avgSalescycle: 0, marketShare: 0 }
      },
      predictions: {
        forecastedConversions: { next7Days: 0, next30Days: 0, next90Days: 0 },
        trendAnalysis: { direction: 'stable', strength: 0, confidence: 0 },
        recommendations: []
      },
      executiveSummary: {
        keyMetrics: [],
        alerts: [],
        nextActions: []
      }
    };
  }
  
  const salesVelocity = calculateSalesVelocity(submissions);
  const pipelineHealth = calculatePipelineHealth(submissions);
  const benchmarks = calculatePerformanceBenchmarks(submissions);
  const marketIntel = calculateMarketIntelligence(submissions);
  const predictions = generatePredictiveInsights(submissions);
  
  // Generate executive summary
  const conversionRate = submissions.filter(s => s.signedUp).length / submissions.length * 100;
  const avgInterestLevel = submissions.reduce((sum, s) => sum + s.interestLevel, 0) / submissions.length;
  
  const executiveSummary = {
    keyMetrics: [
      { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, trend: salesVelocity.velocityTrend },
      { label: 'Pipeline Size', value: pipelineHealth.totalPipeline.toString(), trend: 5 },
      { label: 'Avg. Interest', value: `${avgInterestLevel.toFixed(1)}/5`, trend: 2 },
      { label: 'Hot Prospects', value: pipelineHealth.hotProspects.toString(), trend: 8 }
    ],
    alerts: [
      ...(conversionRate < 15 ? [{ type: 'warning' as const, message: 'Conversion rate below benchmark' }] : []),
      ...(pipelineHealth.totalPipeline < 20 ? [{ type: 'danger' as const, message: 'Pipeline critically low' }] : []),
      ...(predictions.trendAnalysis.direction === 'up' ? [{ type: 'success' as const, message: 'Positive growth trend detected' }] : [])
    ],
    nextActions: [
      'Review pipeline health metrics',
      'Implement top recommendations',
      'Monitor key performance indicators',
      'Schedule team performance review'
    ]
  };
  
  return {
    salesVelocity,
    pipelineHealth,
    benchmarks,
    marketIntel,
    predictions,
    executiveSummary
  };
}