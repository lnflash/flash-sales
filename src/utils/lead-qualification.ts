import { 
  LeadStage, 
  LeadQualificationCriteria, 
  QualificationRule,
  LeadWorkflow 
} from '@/types/lead-qualification';
import { Submission } from '@/types/submission';

// BANT (Budget, Authority, Need, Timeline) scoring weights
const SCORING_WEIGHTS = {
  budget: 25,
  authority: 25,
  need: 25,
  timeline: 25,
  bonusFactors: {
    highInterest: 10,
    multipleDecisionMakers: 5,
    specificNeeds: 10,
    previousContact: 5,
  }
};

export const QUALIFICATION_RULES: QualificationRule[] = [
  {
    id: 'high-interest',
    name: 'High Interest Level',
    description: 'Lead has shown interest level of 4 or higher',
    condition: (data: Submission) => data.interestLevel >= 4,
    score: 15,
  },
  {
    id: 'decision-maker',
    name: 'Decision Maker Identified',
    description: 'Lead has identified decision makers',
    condition: (data: Submission) => !!data.decisionMakers && data.decisionMakers.length > 0,
    score: 20,
  },
  {
    id: 'specific-needs',
    name: 'Specific Needs Identified',
    description: 'Lead has expressed specific needs',
    condition: (data: Submission) => !!data.specificNeeds && data.specificNeeds.length > 20,
    score: 15,
  },
  {
    id: 'package-seen',
    name: 'Package Viewed',
    description: 'Lead has viewed the package',
    condition: (data: Submission) => data.packageSeen === true,
    score: 10,
  },
  {
    id: 'auto-qualify-high-score',
    name: 'Auto-Qualify High Score',
    description: 'Automatically qualify leads with score > 70',
    condition: (data: any) => data.qualificationScore > 70,
    score: 0,
    autoTransition: {
      toStage: 'qualified',
      minScore: 70,
    },
  },
];

export function calculateQualificationScore(
  submission: Submission,
  criteria: Partial<LeadQualificationCriteria>
): number {
  let score = 0;

  // BANT scoring
  if (criteria.hasbudget) score += SCORING_WEIGHTS.budget;
  if (criteria.hasAuthority) score += SCORING_WEIGHTS.authority;
  if (criteria.hasNeed) score += SCORING_WEIGHTS.need;
  if (criteria.hasTimeline) score += SCORING_WEIGHTS.timeline;

  // Apply bonus factors
  if (submission.interestLevel >= 4) {
    score += SCORING_WEIGHTS.bonusFactors.highInterest;
  }

  if (submission.decisionMakers && submission.decisionMakers.includes(',')) {
    score += SCORING_WEIGHTS.bonusFactors.multipleDecisionMakers;
  }

  if (submission.specificNeeds && submission.specificNeeds.length > 50) {
    score += SCORING_WEIGHTS.bonusFactors.specificNeeds;
  }

  // Apply qualification rules
  QUALIFICATION_RULES.forEach(rule => {
    if (rule.condition(submission)) {
      score += rule.score;
    }
  });

  return Math.min(100, Math.max(0, score));
}

export function determineLeadStage(
  submission: Submission,
  qualificationScore: number,
  currentStage?: LeadStage
): LeadStage {
  // If already a customer or lost, don't change
  if (currentStage === 'customer' || currentStage === 'lost') {
    return currentStage;
  }

  // Auto-progression based on score and conditions
  if (submission.signedUp) {
    return 'customer';
  }

  if (qualificationScore >= 80 && submission.interestLevel >= 4) {
    return 'opportunity';
  }

  if (qualificationScore >= 60) {
    return 'qualified';
  }

  if (submission.packageSeen || submission.interestLevel >= 3) {
    return 'contacted';
  }

  return 'new';
}

export function getNextActions(workflow: LeadWorkflow): string[] {
  const actions: string[] = [];

  switch (workflow.currentStage) {
    case 'new':
      actions.push('Make initial contact');
      actions.push('Send introductory email');
      actions.push('Schedule discovery call');
      break;

    case 'contacted':
      actions.push('Conduct needs assessment');
      actions.push('Identify decision makers');
      actions.push('Determine budget range');
      actions.push('Establish timeline');
      break;

    case 'qualified':
      actions.push('Schedule product demo');
      actions.push('Prepare custom proposal');
      actions.push('Conduct stakeholder meeting');
      actions.push('Address specific pain points');
      break;

    case 'opportunity':
      actions.push('Finalize proposal');
      actions.push('Negotiate terms');
      actions.push('Get buy-in from all stakeholders');
      actions.push('Schedule closing meeting');
      break;

    case 'customer':
      actions.push('Send onboarding materials');
      actions.push('Schedule implementation');
      actions.push('Assign customer success manager');
      actions.push('Set up regular check-ins');
      break;

    case 'lost':
      actions.push('Conduct loss analysis');
      actions.push('Add to nurture campaign');
      actions.push('Schedule future follow-up');
      break;
  }

  // Add contextual actions based on criteria
  if (!workflow.criteria.hasbudget) {
    actions.push('Discuss budget requirements');
  }

  if (!workflow.criteria.hasAuthority) {
    actions.push('Identify and engage decision makers');
  }

  if (!workflow.criteria.hasTimeline) {
    actions.push('Establish implementation timeline');
  }

  return actions;
}

export function getStageColor(stage: LeadStage): string {
  const colors: Record<LeadStage, string> = {
    new: 'bg-gray-100 text-gray-800 border-gray-300',
    contacted: 'bg-blue-100 text-blue-800 border-blue-300',
    qualified: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    opportunity: 'bg-purple-100 text-purple-800 border-purple-300',
    customer: 'bg-green-100 text-green-800 border-green-300',
    lost: 'bg-red-100 text-red-800 border-red-300',
  };

  return colors[stage] || colors.new;
}

export function getStageIcon(stage: LeadStage): string {
  const icons: Record<LeadStage, string> = {
    new: '🆕',
    contacted: '📞',
    qualified: '✅',
    opportunity: '💼',
    customer: '🎉',
    lost: '❌',
  };

  return icons[stage] || '❓';
}

export function calculateDaysInStage(
  stageHistory: LeadWorkflow['stageHistory'],
  stage: LeadStage
): number {
  const stageTransitions = stageHistory.filter(t => t.fromStage === stage || t.toStage === stage);
  
  if (stageTransitions.length === 0) return 0;

  let totalDays = 0;
  let entryDate: Date | null = null;

  stageTransitions.forEach(transition => {
    if (transition.toStage === stage && !entryDate) {
      entryDate = new Date(transition.transitionDate);
    } else if (transition.fromStage === stage && entryDate !== null) {
      const exitDate = new Date(transition.transitionDate);
      const entryDateValue = entryDate as Date;
      totalDays += Math.floor((exitDate.getTime() - entryDateValue.getTime()) / (1000 * 60 * 60 * 24));
      entryDate = null;
    }
  });

  // If still in stage, calculate from entry to now
  if (entryDate !== null) {
    const entryDateValue = entryDate as Date;
    totalDays += Math.floor((new Date().getTime() - entryDateValue.getTime()) / (1000 * 60 * 60 * 24));
  }

  return totalDays;
}