export type LeadStage = 'new' | 'contacted' | 'qualified' | 'customer' | 'lost';

export interface LeadQualificationCriteria {
  hasbudget: boolean;
  hasAuthority: boolean;
  hasNeed: boolean;
  hasTimeline: boolean;
  budgetRange?: {
    min: number;
    max: number;
  };
  timelineMonths?: number;
  painPoints?: string[];
  decisionMakerIdentified?: boolean;
}

export interface LeadWorkflow {
  id: number | string;
  submissionId: number | string;
  currentStage: LeadStage;
  previousStage?: LeadStage;
  qualificationScore: number;
  criteria: LeadQualificationCriteria;
  stageHistory: StageTransition[];
  nextActions: string[];
  assignedTo?: string;
  lastContact?: string;
  nextFollowUp?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageTransition {
  fromStage: LeadStage;
  toStage: LeadStage;
  transitionDate: string;
  reason?: string;
  performedBy?: string;
}

export interface WorkflowStats {
  totalLeads: number;
  byStage: Record<LeadStage, number>;
  averageTimeInStage: Record<LeadStage, number>; // in days
  conversionRates: {
    newToContacted: number;
    contactedToQualified: number;
    qualifiedToCustomer: number;
    overallConversion: number;
  };
  topPerformers: {
    name: string;
    conversions: number;
    averageDealSize: number;
  }[];
}

export interface QualificationRule {
  id: string;
  name: string;
  description: string;
  condition: (data: any) => boolean;
  score: number;
  autoTransition?: {
    toStage: LeadStage;
    minScore: number;
  };
}