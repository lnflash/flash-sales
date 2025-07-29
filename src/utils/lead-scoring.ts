// Lead scoring algorithm for intelligent qualification

interface LeadScoringData {
  monthlyRevenue: string;
  numberOfEmployees: string;
  yearEstablished: string;
  monthlyTransactions: string;
  averageTicketSize: string;
  interestLevel: number;
  painPoints: string[];
  packageSeen: boolean;
  signedUp: boolean;
  currentProcessor: string;
  businessType: string;
  formCompletionTime?: number;
  fieldInteractions?: Record<string, number>;
}

// Scoring weights
const SCORING_WEIGHTS = {
  revenue: 25,
  employees: 10,
  transactions: 15,
  interest: 20,
  painPoints: 15,
  engagement: 10,
  businessAge: 5
};

// Revenue score mapping
const REVENUE_SCORES: Record<string, number> = {
  '0-10k': 20,
  '10k-50k': 40,
  '50k-100k': 60,
  '100k-250k': 80,
  '250k+': 100
};

// Employee count score mapping
const EMPLOYEE_SCORES: Record<string, number> = {
  '1-5': 20,
  '6-20': 40,
  '21-50': 60,
  '51-100': 80,
  '100+': 100
};

export function calculateLeadScore(data: LeadScoringData): number {
  let totalScore = 0;
  let totalWeight = 0;

  // Revenue score
  if (data.monthlyRevenue && REVENUE_SCORES[data.monthlyRevenue]) {
    totalScore += (REVENUE_SCORES[data.monthlyRevenue] * SCORING_WEIGHTS.revenue) / 100;
    totalWeight += SCORING_WEIGHTS.revenue;
  }

  // Employee count score
  if (data.numberOfEmployees && EMPLOYEE_SCORES[data.numberOfEmployees]) {
    totalScore += (EMPLOYEE_SCORES[data.numberOfEmployees] * SCORING_WEIGHTS.employees) / 100;
    totalWeight += SCORING_WEIGHTS.employees;
  }

  // Transaction volume score
  if (data.monthlyTransactions) {
    const transactions = parseInt(data.monthlyTransactions);
    let transactionScore = 0;
    if (transactions >= 1000) transactionScore = 100;
    else if (transactions >= 500) transactionScore = 80;
    else if (transactions >= 200) transactionScore = 60;
    else if (transactions >= 50) transactionScore = 40;
    else if (transactions > 0) transactionScore = 20;
    
    totalScore += (transactionScore * SCORING_WEIGHTS.transactions) / 100;
    totalWeight += SCORING_WEIGHTS.transactions;
  }

  // Interest level score (1-5 scale to 0-100)
  totalScore += ((data.interestLevel * 20) * SCORING_WEIGHTS.interest) / 100;
  totalWeight += SCORING_WEIGHTS.interest;

  // Pain points score (more pain points = higher score)
  const painPointScore = Math.min(data.painPoints.length * 20, 100);
  totalScore += (painPointScore * SCORING_WEIGHTS.painPoints) / 100;
  totalWeight += SCORING_WEIGHTS.painPoints;

  // Engagement score
  let engagementScore = 0;
  if (data.packageSeen) engagementScore += 30;
  if (data.signedUp) engagementScore += 50;
  if (data.currentProcessor) engagementScore += 20; // They're actively using a processor
  
  totalScore += (engagementScore * SCORING_WEIGHTS.engagement) / 100;
  totalWeight += SCORING_WEIGHTS.engagement;

  // Business age score
  if (data.yearEstablished) {
    const yearsInBusiness = new Date().getFullYear() - parseInt(data.yearEstablished);
    let ageScore = 0;
    if (yearsInBusiness >= 10) ageScore = 100;
    else if (yearsInBusiness >= 5) ageScore = 80;
    else if (yearsInBusiness >= 3) ageScore = 60;
    else if (yearsInBusiness >= 1) ageScore = 40;
    else ageScore = 20;
    
    totalScore += (ageScore * SCORING_WEIGHTS.businessAge) / 100;
    totalWeight += SCORING_WEIGHTS.businessAge;
  }

  // Calculate final score as percentage of total possible weight
  const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  
  // Apply bonuses
  let bonusMultiplier = 1;
  
  // Quick form completion bonus (under 3 minutes)
  if (data.formCompletionTime && data.formCompletionTime < 180) {
    bonusMultiplier += 0.1;
  }
  
  // High engagement bonus (many field interactions)
  if (data.fieldInteractions) {
    const totalInteractions = Object.values(data.fieldInteractions).reduce((a, b) => a + b, 0);
    if (totalInteractions > 30) {
      bonusMultiplier += 0.05;
    }
  }
  
  // Industry bonus
  const highValueIndustries = ['restaurant', 'retail', 'ecommerce'];
  if (highValueIndustries.includes(data.businessType)) {
    bonusMultiplier += 0.05;
  }

  return Math.min(Math.round(finalScore * bonusMultiplier), 100);
}

// Lead qualification levels
export function getLeadQualification(score: number): {
  level: 'hot' | 'warm' | 'cool' | 'cold';
  label: string;
  color: string;
  priority: number;
} {
  if (score >= 80) {
    return { level: 'hot', label: 'Hot Lead', color: 'red', priority: 1 };
  } else if (score >= 60) {
    return { level: 'warm', label: 'Warm Lead', color: 'orange', priority: 2 };
  } else if (score >= 40) {
    return { level: 'cool', label: 'Cool Lead', color: 'blue', priority: 3 };
  } else {
    return { level: 'cold', label: 'Cold Lead', color: 'gray', priority: 4 };
  }
}

// Calculate days to follow up based on lead score
export function getDaysToFollowUp(score: number): number {
  if (score >= 80) return 0; // Same day
  if (score >= 60) return 1; // Next day
  if (score >= 40) return 3; // Within 3 days
  return 7; // Within a week
}

// Get recommended actions based on lead score and data
export function getRecommendedActions(data: LeadScoringData, score: number): string[] {
  const actions: string[] = [];
  
  if (score >= 80) {
    actions.push('Call immediately - high priority lead');
    if (data.signedUp) {
      actions.push('Send contract within 2 hours');
    }
  } else if (score >= 60) {
    actions.push('Call within 24 hours');
    actions.push('Send personalized follow-up email');
  } else if (score >= 40) {
    actions.push('Add to email nurture campaign');
    actions.push('Schedule follow-up for next week');
  } else {
    actions.push('Add to long-term nurture sequence');
    actions.push('Check in quarterly');
  }
  
  // Specific recommendations based on pain points
  if (data.painPoints.includes('High processing fees')) {
    actions.push('Prepare cost comparison analysis');
  }
  if (data.painPoints.includes('Poor customer support')) {
    actions.push('Highlight 24/7 support availability');
  }
  if (data.painPoints.includes('Limited reporting')) {
    actions.push('Schedule analytics demo');
  }
  
  return actions;
}