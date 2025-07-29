import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadWorkflowPipeline from '@/components/sales-intelligence/LeadWorkflowPipeline';
import LeadQualificationWizard from '@/components/sales-intelligence/LeadQualificationWizard';
import DealProbabilityAnalyzer from '@/components/sales-intelligence/DealProbabilityAnalyzer';
import FollowUpRecommendations from '@/components/sales-intelligence/FollowUpRecommendations';
import LeadAssignment from '@/components/sales-intelligence/LeadAssignment';
import TerritoryDashboard from '@/components/sales-intelligence/TerritoryDashboard';
import { useSubmissions } from '@/hooks/useSubmissions';
import { LeadWorkflow, LeadStage } from '@/types/lead-qualification';
import { Submission } from '@/types/submission';
import { calculateDealProbability } from '@/utils/deal-probability';
import { JamaicaParish } from '@/types/lead-routing';
import { 
  PlusIcon, 
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Mock workflow data - in production this would come from API
const mockWorkflows: LeadWorkflow[] = [
  {
    id: 1,
    submissionId: 1,
    currentStage: 'qualified',
    qualificationScore: 75,
    criteria: {
      hasbudget: true,
      hasAuthority: true,
      hasNeed: true,
      hasTimeline: false,
    },
    stageHistory: [
      { fromStage: 'new', toStage: 'contacted', transitionDate: '2024-01-15', performedBy: 'John Doe' },
      { fromStage: 'contacted', toStage: 'qualified', transitionDate: '2024-01-18', performedBy: 'John Doe' },
    ],
    nextActions: ['Schedule product demo', 'Prepare custom proposal'],
    assignedTo: 'John Doe',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
  },
  {
    id: 2,
    submissionId: 2,
    currentStage: 'opportunity',
    qualificationScore: 85,
    criteria: {
      hasbudget: true,
      hasAuthority: true,
      hasNeed: true,
      hasTimeline: true,
      budgetRange: { min: 10000, max: 50000 },
      timelineMonths: 3,
    },
    stageHistory: [
      { fromStage: 'new', toStage: 'contacted', transitionDate: '2024-01-10', performedBy: 'Jane Smith' },
      { fromStage: 'contacted', toStage: 'qualified', transitionDate: '2024-01-12', performedBy: 'Jane Smith' },
      { fromStage: 'qualified', toStage: 'opportunity', transitionDate: '2024-01-16', performedBy: 'Jane Smith' },
    ],
    nextActions: ['Finalize proposal', 'Get stakeholder buy-in'],
    assignedTo: 'Jane Smith',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-16',
  },
  {
    id: 3,
    submissionId: 3,
    currentStage: 'new',
    qualificationScore: 40,
    criteria: {
      hasbudget: false,
      hasAuthority: false,
      hasNeed: true,
      hasTimeline: false,
    },
    stageHistory: [],
    nextActions: ['Make initial contact', 'Send introductory email'],
    createdAt: '2024-01-19',
    updatedAt: '2024-01-19',
  },
  {
    id: 4,
    submissionId: 4,
    currentStage: 'customer',
    qualificationScore: 95,
    criteria: {
      hasbudget: true,
      hasAuthority: true,
      hasNeed: true,
      hasTimeline: true,
      budgetRange: { min: 25000, max: 75000 },
      timelineMonths: 2,
    },
    stageHistory: [
      { fromStage: 'new', toStage: 'contacted', transitionDate: '2024-01-05', performedBy: 'Mike Johnson' },
      { fromStage: 'contacted', toStage: 'qualified', transitionDate: '2024-01-07', performedBy: 'Mike Johnson' },
      { fromStage: 'qualified', toStage: 'opportunity', transitionDate: '2024-01-10', performedBy: 'Mike Johnson' },
      { fromStage: 'opportunity', toStage: 'customer', transitionDate: '2024-01-14', performedBy: 'Mike Johnson' },
    ],
    nextActions: ['Send onboarding materials', 'Schedule implementation'],
    assignedTo: 'Mike Johnson',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-14',
  },
  {
    id: 5,
    submissionId: 5,
    currentStage: 'contacted',
    qualificationScore: 55,
    criteria: {
      hasbudget: false,
      hasAuthority: true,
      hasNeed: true,
      hasTimeline: false,
    },
    stageHistory: [
      { fromStage: 'new', toStage: 'contacted', transitionDate: '2024-01-17', performedBy: 'Sarah Lee' },
    ],
    nextActions: ['Determine budget range', 'Establish timeline'],
    assignedTo: 'Sarah Lee',
    createdAt: '2024-01-17',
    updatedAt: '2024-01-17',
  },
];

export default function LeadsPage() {
  const [workflows] = useState<LeadWorkflow[]>(mockWorkflows);
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);
  const [showQualificationWizard, setShowQualificationWizard] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<LeadWorkflow | null>(null);
  const [showProbabilityAnalyzer, setShowProbabilityAnalyzer] = useState(false);
  const [showLeadAssignment, setShowLeadAssignment] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<number | null>(null);
  
  const { submissions } = useSubmissions();

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

  const stats = {
    totalLeads: workflows.length,
    qualifiedLeads: workflows.filter(w => ['qualified', 'opportunity', 'customer'].includes(w.currentStage)).length,
    conversionRate: workflows.length > 0 
      ? (workflows.filter(w => w.currentStage === 'customer').length / workflows.length * 100).toFixed(1)
      : '0',
    avgQualificationScore: workflows.length > 0
      ? Math.round(workflows.reduce((sum, w) => sum + w.qualificationScore, 0) / workflows.length)
      : 0,
  };

  return (
    <DashboardLayout title="Lead Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Total Leads</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.totalLeads}</p>
            </div>
            <FunnelIcon className="w-8 h-8 text-flash-green opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Qualified Leads</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.qualifiedLeads}</p>
            </div>
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Conversion Rate</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.conversionRate}%</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary">Avg Score</p>
              <p className="text-2xl font-bold text-light-text-primary mt-1">{stats.avgQualificationScore}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-flash-green/20 flex items-center justify-center">
              <span className="text-sm font-bold text-flash-green">{stats.avgQualificationScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Territory Dashboard */}
      <div className="mb-8">
        <TerritoryDashboard 
          salesReps={[]} // Using mock data in component
          onTerritoryClick={(parish) => {
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

      {/* Qualified Leads with Probability */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-light-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-light-text-primary">
            Active Opportunities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows
            .filter(w => ['qualified', 'opportunity'].includes(w.currentStage))
            .map(workflow => {
              const submission = submissions.find(s => s.id === workflow.submissionId) || {
                id: workflow.submissionId,
                ownerName: `Lead ${workflow.submissionId}`,
                packageSeen: true,
                interestLevel: 4,
                signedUp: false,
                timestamp: workflow.createdAt,
              };
              const probability = calculateDealProbability(workflow, submission);
              
              return (
                <div
                  key={workflow.id}
                  className="p-4 bg-light-bg-secondary rounded-lg border border-light-border hover:border-flash-green/50 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setSelectedSubmission(submission);
                    setShowProbabilityAnalyzer(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-light-text-primary">
                        {submission.ownerName}
                      </p>
                      <p className="text-xs text-light-text-secondary">
                        {workflow.assignedTo || 'Unassigned'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.currentStage === 'opportunity'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    }`}>
                      {workflow.currentStage}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-light-text-secondary">Close Probability</span>
                      <span className="text-sm font-semibold text-light-text-primary">
                        {probability.finalProbability}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          probability.finalProbability >= 70 ? 'bg-green-500' :
                          probability.finalProbability >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${probability.finalProbability}%` }}
                      />
                    </div>

                    <button className="mt-2 text-xs text-flash-green hover:text-flash-green-light flex items-center">
                      <ChartBarIcon className="w-3 h-3 mr-1" />
                      View Analysis
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Follow-up Recommendations */}
      {workflows.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-light-text-primary mb-4">
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

      {/* Unqualified Leads Section */}
      {unqualifiedSubmissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-light-text-primary">
              Unqualified Leads ({unqualifiedSubmissions.length})
            </h3>
            <button className="text-sm text-flash-green hover:text-flash-green-light">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {unqualifiedSubmissions.slice(0, 5).map(submission => (
              <div 
                key={submission.id}
                className="flex items-center justify-between p-4 bg-light-bg-secondary rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-light-text-primary">{submission.ownerName}</p>
                  <p className="text-sm text-light-text-secondary">
                    Interest: {submission.interestLevel}/5 • 
                    {submission.packageSeen ? ' Package Viewed' : ' Not Viewed'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLeadToAssign(submission.id);
                      setShowLeadAssignment(true);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    Assign
                  </button>
                  <button
                    onClick={() => handleQualifyLead(submission)}
                    className="px-4 py-2 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Qualify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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