import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadWorkflowPipeline from '@/components/sales-intelligence/LeadWorkflowPipeline';
import LeadQualificationWizard from '@/components/sales-intelligence/LeadQualificationWizard';
import DealProbabilityAnalyzer from '@/components/sales-intelligence/DealProbabilityAnalyzer';
import FollowUpRecommendations from '@/components/sales-intelligence/FollowUpRecommendations';
import LeadAssignment from '@/components/sales-intelligence/LeadAssignment';
import TerritoryDashboard from '@/components/sales-intelligence/TerritoryDashboard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { useUserSubmissions } from '@/hooks/useUserSubmissions';
import { LeadWorkflow, LeadStage } from '@/types/lead-qualification';
import { Submission } from '@/types/submission';
import { calculateDealProbability } from '@/utils/deal-probability';
import { JamaicaParish } from '@/types/lead-routing';
import { getUserFromStorage } from '@/lib/auth';
import { hasPermission } from '@/types/roles';
import { 
  PlusIcon, 
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Lead status options that should replace the signed up checkbox
export type LeadStatus = 'canvas' | 'contacted' | 'prospect' | 'opportunity' | 'signed_up';

// Helper function to determine if a lead is active (created/edited in last 30 days)
const isActiveLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return submissionDate >= thirtyDaysAgo && submission.signedUp !== true;
};

// Helper function to determine if a lead is new (created in last 7 days)
const isNewLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return submissionDate >= sevenDaysAgo;
};

// Helper function to determine if a lead is stale (30+ days old and not signed up)
const isStaleLead = (submission: Submission): boolean => {
  const submissionDate = new Date(submission.timestamp);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return submissionDate < thirtyDaysAgo && submission.signedUp !== true;
};

// Helper function to determine lead stage based on submission data
const getLeadStage = (submission: Submission): LeadStage => {
  // TODO: Once we add the status field, use that instead
  if (submission.signedUp) return 'customer';
  if (submission.interestLevel >= 4 && submission.packageSeen) return 'opportunity';
  if (submission.interestLevel >= 3) return 'qualified';
  if (submission.phoneNumber) return 'contacted';
  return 'new';
};

// Helper function to calculate qualification score
const calculateQualificationScore = (submission: Submission): number => {
  let score = 0;
  
  // Interest level (0-50 points)
  score += (submission.interestLevel / 5) * 50;
  
  // Package seen (20 points)
  if (submission.packageSeen) score += 20;
  
  // Has decision makers (10 points)
  if (submission.decisionMakers) score += 10;
  
  // Signed up (20 points)
  if (submission.signedUp) score += 20;
  
  return Math.round(score);
};

// Helper function to convert submission to workflow
const submissionToWorkflow = (submission: Submission): LeadWorkflow => {
  const stage = getLeadStage(submission);
  const score = calculateQualificationScore(submission);
  
  const workflow: LeadWorkflow = {
    id: submission.id,
    submissionId: submission.id,
    currentStage: stage,
    qualificationScore: score,
    criteria: {
      hasbudget: submission.interestLevel >= 3,
      hasAuthority: !!submission.decisionMakers,
      hasNeed: submission.interestLevel >= 2,
      hasTimeline: submission.interestLevel >= 4,
    },
    stageHistory: [],
    nextActions: [],
    assignedTo: submission.username || 'Unassigned',
    createdAt: submission.timestamp,
    updatedAt: submission.timestamp,
  };
  
  // Add stage history based on current stage
  if (stage !== 'new') {
    workflow.stageHistory.push({
      fromStage: 'new',
      toStage: 'contacted',
      transitionDate: submission.timestamp,
      performedBy: submission.username || 'System',
    });
  }
  
  if (stage === 'qualified' || stage === 'opportunity' || stage === 'customer') {
    workflow.stageHistory.push({
      fromStage: 'contacted',
      toStage: 'qualified',
      transitionDate: submission.timestamp,
      performedBy: submission.username || 'System',
    });
  }
  
  if (stage === 'opportunity' || stage === 'customer') {
    workflow.stageHistory.push({
      fromStage: 'qualified',
      toStage: 'opportunity',
      transitionDate: submission.timestamp,
      performedBy: submission.username || 'System',
    });
  }
  
  if (stage === 'customer') {
    workflow.stageHistory.push({
      fromStage: 'opportunity',
      toStage: 'customer',
      transitionDate: submission.timestamp,
      performedBy: submission.username || 'System',
    });
  }
  
  // Add next actions based on stage
  switch (stage) {
    case 'new':
      workflow.nextActions = ['Make initial contact', 'Send introductory email'];
      break;
    case 'contacted':
      workflow.nextActions = ['Schedule discovery call', 'Send product information'];
      break;
    case 'qualified':
      workflow.nextActions = ['Schedule product demo', 'Prepare custom proposal'];
      break;
    case 'opportunity':
      workflow.nextActions = ['Finalize proposal', 'Get stakeholder buy-in'];
      break;
    case 'customer':
      workflow.nextActions = ['Send onboarding materials', 'Schedule implementation'];
      break;
  }
  
  return workflow;
};

export default function LeadsPage() {
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);
  const [showQualificationWizard, setShowQualificationWizard] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<LeadWorkflow | null>(null);
  const [showProbabilityAnalyzer, setShowProbabilityAnalyzer] = useState(false);
  const [showLeadAssignment, setShowLeadAssignment] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<number | string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');
  
  useEffect(() => {
    const currentUser = getUserFromStorage();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);
  
  // Determine which username to filter by
  const canViewAllReps = user?.role && hasPermission(user.role, 'canViewAllReps');
  const usernameToFilter = canViewAllReps ? undefined : user?.username;
  
  // Debug logging
  console.log('Lead Management Debug:', {
    user: user,
    canViewAllReps,
    usernameToFilter,
  });
  
  // Fetch all submissions for lead management
  const { data, isLoading } = useUserSubmissions(usernameToFilter);
  const submissions = data?.submissions || [];
  const totalCount = data?.count || 0;
  
  console.log('[LeadManagement] useUserSubmissions returned:', {
    data,
    submissionsLength: submissions.length,
    totalCount,
    isLoading,
    usernameToFilter
  });
  
  // Convert submissions to workflows
  const workflows = submissions.map(submissionToWorkflow);

  // Filter workflows by selected stage
  const filteredWorkflows = selectedStage
    ? workflows.filter(w => w.currentStage === selectedStage)
    : workflows;

  // Get unqualified submissions (those without workflows)
  const unqualifiedSubmissions = submissions.filter(
    sub => !workflows.find(w => w.submissionId === sub.id)
  );

  const handleQualifyLead = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowQualificationWizard(true);
  };

  const handleQualificationComplete = (workflow: Partial<LeadWorkflow>) => {
    console.log('New workflow created:', workflow);
    // In production, this would save to API
    setShowQualificationWizard(false);
    setSelectedSubmission(null);
  };

  // Calculate lead statistics
  const activeLeads = submissions.filter(isActiveLead);
  const newLeads = submissions.filter(isNewLead);
  const staleLeads = submissions.filter(isStaleLead);
  const signedUpLeads = submissions.filter(s => s.signedUp);
  
  const stats = {
    totalLeads: submissions.length,
    activeLeads: activeLeads.length,
    newLeads: newLeads.length,
    staleLeads: staleLeads.length,
    conversionRate: submissions.length > 0 
      ? (signedUpLeads.length / submissions.length * 100).toFixed(1)
      : '0',
  };

  // Show loading state while user data or submissions are loading
  if (!user || isLoading) {
    return (
      <DashboardLayout title="Lead Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-flash-green"></div>
            <p className="mt-4 text-light-text-secondary">Loading lead data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lead Management">
      {/* Admin viewing all leads banner */}
      {canViewAllReps && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Admin View:</span> Viewing leads from all sales representatives ({totalCount} total leads)
            </p>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalLeads}</p>
            </div>
            <FunnelIcon className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Leads</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.activeLeads}</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Leads</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.newLeads}</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <PlusIcon className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stale Leads</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.staleLeads}</p>
              <p className="text-xs text-muted-foreground">30+ days</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-yellow-600">!</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.conversionRate}%</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Territory Dashboard */}
      <div className="mb-8">
        <TerritoryDashboard 
          salesReps={(() => {
            // Group active submissions by rep and territory
            const repMap = new Map<string, any>();
            
            // Only process active leads for territory dashboard
            activeLeads.forEach(sub => {
              const repName = sub.username || 'Unassigned';
              const territory = sub.territory || 'Unassigned';
              const key = `${repName}-${territory}`;
              
              if (!repMap.has(key)) {
                repMap.set(key, {
                  id: key,
                  name: repName,
                  territory: territory as JamaicaParish | 'Unassigned',
                  activeLeads: 0,
                  conversionRate: 0,
                });
              }
              
              const rep = repMap.get(key)!;
              rep.activeLeads += 1;
            });
            
            // Calculate conversion rates based on all submissions
            repMap.forEach(rep => {
              const repSubmissions = submissions.filter(s => 
                (s.username || 'Unassigned') === rep.name && 
                (s.territory || 'Unassigned') === rep.territory
              );
              const conversions = repSubmissions.filter(s => s.signedUp).length;
              rep.conversionRate = repSubmissions.length > 0 
                ? (conversions / repSubmissions.length) * 100 
                : 0;
            });
            
            // Filter out territories with zero active leads
            return Array.from(repMap.values()).filter(rep => rep.activeLeads > 0);
          })()}
          onTerritoryClick={(parish) => {
            setSelectedTerritory(parish);
            console.log(`Selected territory: ${parish}`);
          }}
        />
      </div>

      {/* Lead Pipeline */}
      <div className="mb-8">
        <LeadWorkflowPipeline 
          workflows={workflows}
          onStageClick={(stage, stageWorkflows) => {
            setSelectedStage(stage);
            console.log(`Selected ${stage} with ${stageWorkflows.length} leads`);
          }}
        />
      </div>


      {/* Follow-up Recommendations */}
      {workflows.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Today's Priority Actions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows
              .filter(w => ['contacted', 'qualified', 'opportunity'].includes(w.currentStage))
              .slice(0, 2)
              .map(workflow => {
                const submission = submissions.find(s => s.id === workflow.submissionId) || {
                  id: workflow.submissionId,
                  ownerName: `Lead ${workflow.submissionId}`,
                  packageSeen: true,
                  interestLevel: 4,
                  signedUp: false,
                  timestamp: workflow.createdAt,
                };
                
                return (
                  <FollowUpRecommendations
                    key={workflow.id}
                    workflow={workflow}
                    submission={submission}
                    onActionTaken={(action) => {
                      console.log('Action taken:', action);
                    }}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* All Leads Table */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              All Leads ({submissions.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage and track all your leads in one place
            </p>
          </div>
          <button
            onClick={() => {
              const event = new CustomEvent('createNewLead');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Lead
          </button>
        </div>
        <div data-tour="leads-table">
          <LeadsTable 
            submissions={submissions} 
            onRefresh={() => window.location.reload()} 
          />
        </div>
      </div>


      {/* Qualification Wizard Modal */}
      {showQualificationWizard && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <LeadQualificationWizard
              submission={selectedSubmission}
              onComplete={handleQualificationComplete}
              onCancel={() => {
                setShowQualificationWizard(false);
                setSelectedSubmission(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Deal Probability Analyzer Modal */}
      {showProbabilityAnalyzer && selectedWorkflow && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <DealProbabilityAnalyzer
              workflow={selectedWorkflow}
              submission={selectedSubmission}
              onClose={() => {
                setShowProbabilityAnalyzer(false);
                setSelectedWorkflow(null);
                setSelectedSubmission(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Lead Assignment Modal */}
      {showLeadAssignment && leadToAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <LeadAssignment
              leadId={leadToAssign}
              onAssign={(repId, territory) => {
                console.log(`Assigned lead ${leadToAssign} to ${repId} in ${territory}`);
                setShowLeadAssignment(false);
                setLeadToAssign(null);
                // In production, this would update the lead assignment via API
              }}
              onCancel={() => {
                setShowLeadAssignment(false);
                setLeadToAssign(null);
              }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}