import { LeadWorkflow } from '@/types/lead-qualification';
import { Submission } from '@/types/submission';

interface DealFactors {
  // Lead quality factors
  qualificationScore: number;
  interestLevel: number;
  hasAllBantCriteria: boolean;
  
  // Engagement factors
  packageViewed: boolean;
  multipleContacts: number;
  responseTime: number; // hours
  
  // Business factors
  budgetConfirmed: boolean;
  timelineUrgency: 'immediate' | 'quarter' | 'year' | 'none';
  competitorMentioned: boolean;
  
  // Historical factors
  previousCustomer: boolean;
  referralSource: boolean;
  industryMatch: boolean;
}

interface ProbabilityBreakdown {
  baseScore: number;
  qualityBonus: number;
  engagementBonus: number;
  businessBonus: number;
  historicalBonus: number;
  penalties: number;
  finalProbability: number;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
}

export function calculateDealProbability(
  workflow: LeadWorkflow,
  submission: Submission,
  additionalFactors?: Partial<DealFactors>
): ProbabilityBreakdown {
  const insights: string[] = [];
  
  // Base probability from stage
  const stageBaseProbability: Record<string, number> = {
    new: 5,
    contacted: 15,
    qualified: 35,
    opportunity: 65,
    customer: 95,
    lost: 0,
  };
  
  let baseScore = stageBaseProbability[workflow.currentStage] || 5;
  
  // Quality bonus (up to 20 points)
  let qualityBonus = 0;
  
  // Qualification score bonus
  if (workflow.qualificationScore >= 80) {
    qualityBonus += 10;
    insights.push('High qualification score indicates strong fit');
  } else if (workflow.qualificationScore >= 60) {
    qualityBonus += 5;
  }
  
  // Interest level bonus
  if (submission.interestLevel >= 4) {
    qualityBonus += 10;
    insights.push('Very high interest level');
  } else if (submission.interestLevel >= 3) {
    qualityBonus += 5;
  }
  
  // BANT criteria bonus
  const bantCount = [
    workflow.criteria.hasbudget,
    workflow.criteria.hasAuthority,
    workflow.criteria.hasNeed,
    workflow.criteria.hasTimeline,
  ].filter(Boolean).length;
  
  if (bantCount === 4) {
    qualityBonus += 5;
    insights.push('All BANT criteria met');
  }
  
  // Engagement bonus (up to 15 points)
  let engagementBonus = 0;
  
  if (submission.packageSeen) {
    engagementBonus += 5;
    insights.push('Engaged with marketing materials');
  }
  
  // Multiple decision makers is positive
  if (submission.decisionMakers && submission.decisionMakers.includes(',')) {
    engagementBonus += 5;
    insights.push('Multiple stakeholders involved');
  }
  
  // Specific needs identified
  if (submission.specificNeeds && submission.specificNeeds.length > 50) {
    engagementBonus += 5;
    insights.push('Clear pain points identified');
  }
  
  // Business factors bonus (up to 15 points)
  let businessBonus = 0;
  
  if (workflow.criteria.hasbudget) {
    businessBonus += 5;
    
    // Budget range bonus
    if (workflow.criteria.budgetRange && workflow.criteria.budgetRange.min >= 25000) {
      businessBonus += 5;
      insights.push('Significant budget available');
    }
  }
  
  if (workflow.criteria.hasTimeline && workflow.criteria.timelineMonths) {
    if (workflow.criteria.timelineMonths <= 3) {
      businessBonus += 5;
      insights.push('Urgent timeline increases close probability');
    }
  }
  
  // Historical bonus (up to 10 points)
  let historicalBonus = 0;
  
  // Stage progression velocity
  if (workflow.stageHistory.length >= 2) {
    const progressionDays = Math.floor(
      (new Date(workflow.stageHistory[workflow.stageHistory.length - 1].transitionDate).getTime() -
        new Date(workflow.stageHistory[0].transitionDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    
    if (progressionDays <= 7) {
      historicalBonus += 5;
      insights.push('Fast progression through sales stages');
    }
  }
  
  // Apply additional factors if provided
  if (additionalFactors) {
    if (additionalFactors.previousCustomer) {
      historicalBonus += 5;
      insights.push('Previous customer relationship');
    }
    
    if (additionalFactors.referralSource) {
      historicalBonus += 5;
      insights.push('Referral leads have higher close rates');
    }
  }
  
  // Calculate penalties
  let penalties = 0;
  
  if (!workflow.criteria.hasbudget) {
    penalties += 10;
    insights.push('No budget identified (major risk)');
  }
  
  if (!workflow.criteria.hasAuthority) {
    penalties += 5;
    insights.push('Decision maker not identified');
  }
  
  if (workflow.currentStage === 'contacted' && workflow.stageHistory.length > 0) {
    const daysInContacted = Math.floor(
      (new Date().getTime() - new Date(workflow.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysInContacted > 14) {
      penalties += 5;
      insights.push('Stalled in contact stage');
    }
  }
  
  // Calculate final probability
  const totalBonus = qualityBonus + engagementBonus + businessBonus + historicalBonus;
  const finalProbability = Math.max(0, Math.min(100, baseScore + totalBonus - penalties));
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (workflow.stageHistory.length >= 3 && bantCount >= 3) {
    confidence = 'high';
  } else if (workflow.stageHistory.length >= 2 && bantCount >= 2) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Add probability-based insights
  if (finalProbability >= 70) {
    insights.unshift('🔥 Hot deal - prioritize immediate action');
  } else if (finalProbability >= 50) {
    insights.unshift('💼 Good opportunity - maintain momentum');
  } else if (finalProbability >= 30) {
    insights.unshift('🌱 Needs nurturing - focus on qualification');
  } else {
    insights.unshift('❄️ Cold lead - consider re-qualification');
  }
  
  return {
    baseScore,
    qualityBonus,
    engagementBonus,
    businessBonus,
    historicalBonus,
    penalties,
    finalProbability,
    confidence,
    insights,
  };
}

export function getDealProbabilityColor(probability: number): string {
  if (probability >= 70) return 'text-green-600 bg-green-100 border-green-300';
  if (probability >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
  if (probability >= 30) return 'text-orange-600 bg-orange-100 border-orange-300';
  return 'text-red-600 bg-red-100 border-red-300';
}

export function getDealProbabilityLabel(probability: number): string {
  if (probability >= 80) return 'Very Likely';
  if (probability >= 60) return 'Likely';
  if (probability >= 40) return 'Possible';
  if (probability >= 20) return 'Unlikely';
  return 'Very Unlikely';
}