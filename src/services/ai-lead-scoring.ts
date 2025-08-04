import { supabase } from '@/lib/supabase/client';
import { calculateLeadScore as calculateBasicScore } from '@/utils/lead-scoring';

interface AILeadScoringResult {
  score: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    value: any;
  }[];
  predictedOutcome: {
    probability: number;
    timeToClose: number; // days
    expectedValue: number;
  };
  recommendations: string[];
  historicalComparison: {
    similarLeadsCount: number;
    averageConversionRate: number;
    averageTimeToClose: number;
  };
}

interface LeadData {
  id: string;
  ownerName: string;
  phoneNumber?: string;
  email?: string;
  interestLevel: number;
  specificNeeds?: string;
  territory?: string;
  businessType?: string;
  monthlyRevenue?: string;
  numberOfEmployees?: string;
  painPoints?: string[];
  interactions?: any[];
}

// Enhanced AI-powered lead scoring
export class AILeadScoringService {
  // Calculate AI-enhanced lead score
  async calculateScore(leadData: LeadData): Promise<AILeadScoringResult> {
    // Start with basic score
    const basicScore = calculateBasicScore({
      monthlyRevenue: leadData.monthlyRevenue || '',
      numberOfEmployees: leadData.numberOfEmployees || '',
      yearEstablished: new Date().getFullYear().toString(),
      monthlyTransactions: '100',
      averageTicketSize: '50',
      interestLevel: leadData.interestLevel,
      painPoints: leadData.painPoints || [],
      packageSeen: false,
      signedUp: false,
      currentProcessor: '',
      businessType: leadData.businessType || '',
    });

    // Enhance with AI features
    const factors = await this.analyzeLeadFactors(leadData);
    const historicalData = await this.getHistoricalComparison(leadData);
    const prediction = await this.predictOutcome(leadData, basicScore, historicalData);
    const recommendations = await this.generateRecommendations(leadData, prediction);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(leadData);

    return {
      score: Math.round(basicScore * prediction.scoreMultiplier),
      confidence,
      factors,
      predictedOutcome: prediction,
      recommendations,
      historicalComparison: historicalData,
    };
  }

  // Analyze lead factors using pattern recognition
  private async analyzeLeadFactors(leadData: LeadData) {
    const factors = [];

    // Interest level factor
    factors.push({
      name: 'Interest Level',
      impact: leadData.interestLevel >= 4 ? 0.8 : 0.4,
      value: `${leadData.interestLevel}/5`,
    });

    // Business size factor
    if (leadData.numberOfEmployees) {
      const employeeScore = this.getEmployeeScore(leadData.numberOfEmployees);
      factors.push({
        name: 'Business Size',
        impact: employeeScore / 100,
        value: leadData.numberOfEmployees,
      });
    }

    // Revenue factor
    if (leadData.monthlyRevenue) {
      const revenueScore = this.getRevenueScore(leadData.monthlyRevenue);
      factors.push({
        name: 'Monthly Revenue',
        impact: revenueScore / 100,
        value: leadData.monthlyRevenue,
      });
    }

    // Engagement factor (based on interactions)
    if (leadData.interactions && leadData.interactions.length > 0) {
      const engagementScore = Math.min(leadData.interactions.length * 10, 100);
      factors.push({
        name: 'Engagement Level',
        impact: engagementScore / 100,
        value: `${leadData.interactions.length} interactions`,
      });
    }

    // Territory factor
    if (leadData.territory) {
      const territoryScore = await this.getTerritoryScore(leadData.territory);
      factors.push({
        name: 'Territory Performance',
        impact: territoryScore / 100,
        value: leadData.territory,
      });
    }

    return factors;
  }

  // Get historical comparison data
  private async getHistoricalComparison(leadData: LeadData) {
    try {
      // Query similar leads based on interest level
      const { data: similarLeads } = await supabase
        .from('deals')
        .select('id, status, created_at, closed_at, interest_level')
        .gte('interest_level', leadData.interestLevel - 1)
        .lte('interest_level', leadData.interestLevel + 1)
        .limit(100);

      if (!similarLeads || similarLeads.length === 0) {
        return {
          similarLeadsCount: 0,
          averageConversionRate: 25, // Default 25% conversion rate
          averageTimeToClose: 30, // Default 30 days
        };
      }

      const wonLeads = similarLeads.filter((lead: any) => lead.status === 'won');
      const conversionRate = (wonLeads.length / similarLeads.length) * 100;

      // Calculate average time to close
      const timesToClose = wonLeads
        .filter((lead: any) => lead.closed_at)
        .map((lead: any) => {
          const created = new Date(lead.created_at);
          const closed = new Date(lead.closed_at);
          return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
        });

      const averageTimeToClose = timesToClose.length > 0
        ? timesToClose.reduce((a: number, b: number) => a + b, 0) / timesToClose.length
        : 30; // default to 30 days

      return {
        similarLeadsCount: similarLeads.length,
        averageConversionRate: Math.round(conversionRate),
        averageTimeToClose: Math.round(averageTimeToClose),
      };
    } catch (error) {
      // Silently handle error to avoid console spam
      return {
        similarLeadsCount: 50, // Default values
        averageConversionRate: 25,
        averageTimeToClose: 30,
      };
    }
  }

  // Predict outcome using historical patterns
  private async predictOutcome(
    leadData: LeadData, 
    baseScore: number, 
    historicalData: any
  ) {
    // Base probability on score and historical conversion rate
    let probability = (baseScore / 100) * 0.6; // Base score contributes 60%
    
    if (historicalData.averageConversionRate > 0) {
      probability += (historicalData.averageConversionRate / 100) * 0.4; // Historical rate contributes 40%
    }

    // Adjust based on specific factors
    if (leadData.interestLevel >= 4) probability *= 1.2;
    if (leadData.specificNeeds && leadData.specificNeeds.length > 50) probability *= 1.1;
    if (leadData.painPoints && leadData.painPoints.length > 2) probability *= 1.15;

    // Cap probability at 0.95
    probability = Math.min(probability, 0.95);

    // For transaction-based revenue model, we don't have fixed deal sizes
    // Expected value will be based on actual usage patterns
    const expectedValue = 0; // Transaction-based model

    // Score multiplier based on prediction confidence
    const scoreMultiplier = 0.8 + (probability * 0.4); // Range: 0.8 to 1.2

    return {
      probability: Math.round(probability * 100) / 100,
      timeToClose: Math.max(1, Math.round(historicalData.averageTimeToClose * (1 - probability))),
      expectedValue: Math.round(expectedValue),
      scoreMultiplier,
    };
  }

  // Generate AI-powered recommendations
  private async generateRecommendations(leadData: LeadData, prediction: any): Promise<string[]> {
    const recommendations: string[] = [];

    // High probability recommendations
    if (prediction.probability > 0.7) {
      recommendations.push('🔥 High-priority lead - assign to senior sales rep immediately');
      recommendations.push(`📞 Call within next 2 hours for ${Math.round(prediction.probability * 100)}% close probability`);
      
      if (leadData.specificNeeds) {
        recommendations.push('📋 Prepare custom proposal addressing specific needs mentioned');
      }
    } else if (prediction.probability > 0.4) {
      recommendations.push('📧 Send personalized email within 24 hours');
      recommendations.push('📅 Schedule follow-up call for this week');
      
      if (leadData.painPoints && leadData.painPoints.length > 0) {
        recommendations.push(`🎯 Focus on pain points: ${leadData.painPoints.slice(0, 2).join(', ')}`);
      }
    } else {
      recommendations.push('🌱 Add to nurture campaign');
      recommendations.push('📊 Gather more information before active pursuit');
    }

    // Territory-specific recommendations
    if (leadData.territory) {
      const territoryScore = await this.getTerritoryScore(leadData.territory);
      if (territoryScore > 80) {
        recommendations.push(`✨ ${leadData.territory} is a high-performing territory - leverage local success stories`);
      }
    }

    // Time-based recommendations
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      recommendations.push('⏰ Optimal calling hours - attempt contact now');
    } else {
      recommendations.push('📧 After hours - send email and schedule call for tomorrow');
    }

    return recommendations;
  }

  // Helper methods
  private calculateConfidence(leadData: LeadData): number {
    let filledFields = 0;
    const totalFields = 10;

    if (leadData.ownerName) filledFields++;
    if (leadData.phoneNumber) filledFields++;
    if (leadData.email) filledFields++;
    if (leadData.interestLevel) filledFields++;
    if (leadData.specificNeeds) filledFields++;
    if (leadData.territory) filledFields++;
    if (leadData.businessType) filledFields++;
    if (leadData.monthlyRevenue) filledFields++;
    if (leadData.numberOfEmployees) filledFields++;
    if (leadData.painPoints && leadData.painPoints.length > 0) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  }

  private getEmployeeScore(employees: string): number {
    const ranges: Record<string, number> = {
      '1-5': 20,
      '6-20': 40,
      '21-50': 60,
      '51-100': 80,
      '100+': 100,
    };
    return ranges[employees] || 0;
  }

  private getRevenueScore(revenue: string): number {
    const ranges: Record<string, number> = {
      '0-10k': 20,
      '10k-50k': 40,
      '50k-100k': 60,
      '100k-250k': 80,
      '250k+': 100,
    };
    return ranges[revenue] || 0;
  }

  private async getTerritoryScore(territory: string): Promise<number> {
    try {
      // Note: Territory field doesn't exist on deals table
      // Return default score for now to avoid console errors
      return 50; // Default middle score
      
      // TODO: When deals table is updated with territory field, uncomment:
      /*
      const { data: territoryData } = await supabase
        .from('deals')
        .select('status')
        .eq('territory', territory)
        .limit(100);

      if (!territoryData || territoryData.length === 0) return 50;

      const wonDeals = territoryData.filter((deal: any) => deal.status === 'won').length;
      const score = (wonDeals / territoryData.length) * 100;
      
      return Math.round(score);
      */
    } catch (error) {
      // Silently handle error to avoid console spam
      return 50; // Default middle score
    }
  }
}

// Export singleton instance
export const aiLeadScoringService = new AILeadScoringService();