import { LeadWorkflow, LeadStage } from '@/types/lead-qualification';
import { Submission } from '@/types/submission';

export interface FollowUpRecommendation {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'task' | 'content';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  suggestedTiming: string;
  template?: string;
  icon: string;
}

interface LeadContext {
  workflow: LeadWorkflow;
  submission: Submission;
  daysSinceLastContact?: number;
  daysInCurrentStage?: number;
}

export function generateFollowUpRecommendations(context: LeadContext): FollowUpRecommendation[] {
  const recommendations: FollowUpRecommendation[] = [];
  const { workflow, submission } = context;

  // Calculate days in current stage
  const daysInStage = context.daysInCurrentStage || calculateDaysInCurrentStage(workflow);
  
  // Stage-specific recommendations
  switch (workflow.currentStage) {
    case 'new':
      recommendations.push({
        id: 'initial-contact',
        type: 'email',
        priority: 'high',
        action: 'Send introductory email',
        reason: 'First contact establishes relationship',
        suggestedTiming: 'Within 24 hours',
        template: `Hi ${submission.ownerName},\n\nI noticed you expressed interest in our solution. I'd love to learn more about your business needs and show you how we can help.\n\nDo you have 15 minutes this week for a quick call?`,
        icon: '📧',
      });
      break;

    case 'contacted':
      if (daysInStage > 3) {
        recommendations.push({
          id: 'follow-up-call',
          type: 'call',
          priority: 'urgent',
          action: 'Schedule discovery call',
          reason: 'Lead has been contacted but not qualified for 3+ days',
          suggestedTiming: 'Today',
          icon: '📞',
        });
      }

      if (!workflow.criteria.hasbudget) {
        recommendations.push({
          id: 'budget-discussion',
          type: 'meeting',
          priority: 'high',
          action: 'Discuss budget requirements',
          reason: 'Budget not yet identified',
          suggestedTiming: 'Next meeting',
          icon: '💰',
        });
      }

      if (!workflow.criteria.hasAuthority) {
        recommendations.push({
          id: 'identify-dm',
          type: 'task',
          priority: 'high',
          action: 'Identify decision makers',
          reason: 'Decision maker not yet identified',
          suggestedTiming: 'Before next call',
          icon: '👥',
        });
      }
      break;

    case 'qualified':
      recommendations.push({
        id: 'demo-schedule',
        type: 'meeting',
        priority: 'high',
        action: 'Schedule product demonstration',
        reason: 'Qualified leads should see the product quickly',
        suggestedTiming: 'Within 48 hours',
        icon: '🖥️',
      });

      if (submission.specificNeeds) {
        recommendations.push({
          id: 'custom-proposal',
          type: 'task',
          priority: 'medium',
          action: 'Prepare customized proposal',
          reason: 'Lead has specific needs that require tailored solution',
          suggestedTiming: 'Before demo',
          icon: '📋',
        });
      }
      break;

    case 'qualified':
      if (daysInStage > 7) {
        recommendations.push({
          id: 'close-urgency',
          type: 'call',
          priority: 'urgent',
          action: 'Address any remaining concerns',
          reason: 'Opportunity has been open for 7+ days',
          suggestedTiming: 'Today',
          icon: '🚨',
        });
      }

      recommendations.push({
        id: 'roi-analysis',
        type: 'content',
        priority: 'high',
        action: 'Share ROI analysis or case study',
        reason: 'Build confidence in solution value',
        suggestedTiming: 'This week',
        icon: '📊',
      });

      if (workflow.criteria.budgetRange && workflow.criteria.budgetRange.min >= 25000) {
        recommendations.push({
          id: 'executive-involvement',
          type: 'meeting',
          priority: 'medium',
          action: 'Involve executive sponsor',
          reason: 'High-value deal benefits from executive alignment',
          suggestedTiming: 'Final negotiation',
          icon: '👔',
        });
      }
      break;

    case 'customer':
      recommendations.push({
        id: 'onboarding',
        type: 'task',
        priority: 'urgent',
        action: 'Begin onboarding process',
        reason: 'Quick onboarding improves customer satisfaction',
        suggestedTiming: 'Immediately',
        icon: '🎯',
      });

      recommendations.push({
        id: 'success-checkin',
        type: 'meeting',
        priority: 'medium',
        action: 'Schedule 30-day success check-in',
        reason: 'Early engagement prevents churn',
        suggestedTiming: '30 days post-sale',
        icon: '✅',
      });
      break;

    case 'lost':
      recommendations.push({
        id: 'loss-analysis',
        type: 'task',
        priority: 'medium',
        action: 'Conduct loss analysis',
        reason: 'Learn from lost opportunities',
        suggestedTiming: 'This week',
        icon: '📝',
      });

      recommendations.push({
        id: 'nurture-campaign',
        type: 'email',
        priority: 'low',
        action: 'Add to nurture campaign',
        reason: 'Keep relationship warm for future opportunities',
        suggestedTiming: 'Quarterly',
        icon: '🌱',
      });
      break;
  }

  // Interest-based recommendations
  if (submission.interestLevel >= 4 && workflow.currentStage !== 'customer') {
    recommendations.push({
      id: 'high-interest-fast-track',
      type: 'call',
      priority: 'high',
      action: 'Fast-track high-interest lead',
      reason: `Interest level ${submission.interestLevel}/5 indicates strong buying intent`,
      suggestedTiming: 'Within 24 hours',
      icon: '🔥',
    });
  }

  // Package not seen but qualified
  if (!submission.packageSeen && ['qualified', 'qualified'].includes(workflow.currentStage)) {
    recommendations.push({
      id: 'share-materials',
      type: 'email',
      priority: 'medium',
      action: 'Share marketing materials',
      reason: 'Qualified lead hasn\'t seen our package yet',
      suggestedTiming: 'Today',
      icon: '📦',
    });
  }

  // Multiple decision makers
  if (submission.decisionMakers && submission.decisionMakers.includes(',')) {
    recommendations.push({
      id: 'stakeholder-meeting',
      type: 'meeting',
      priority: 'medium',
      action: 'Organize stakeholder alignment meeting',
      reason: 'Multiple decision makers need to be aligned',
      suggestedTiming: 'Before closing',
      icon: '🤝',
    });
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

function calculateDaysInCurrentStage(workflow: LeadWorkflow): number {
  const lastTransition = workflow.stageHistory[workflow.stageHistory.length - 1];
  const stageStartDate = lastTransition 
    ? new Date(lastTransition.transitionDate)
    : new Date(workflow.createdAt);
  
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - stageStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff;
}

export function getRecommendationColor(priority: FollowUpRecommendation['priority']): string {
  const colors = {
    urgent: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  
  return colors[priority];
}

export function formatSuggestedTiming(timing: string): string {
  const now = new Date();
  
  switch (timing.toLowerCase()) {
    case 'today':
      return `Today by ${new Date(now.setHours(17, 0, 0, 0)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    case 'within 24 hours':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return `By ${tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    case 'within 48 hours':
      const twoDays = new Date(now);
      twoDays.setDate(twoDays.getDate() + 2);
      return `By ${twoDays.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    case 'this week':
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (5 - now.getDay()));
      return `By ${endOfWeek.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    default:
      return timing;
  }
}