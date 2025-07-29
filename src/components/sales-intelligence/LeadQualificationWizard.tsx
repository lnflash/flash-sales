'use client';

import { useState } from 'react';
import { Submission } from '@/types/submission';
import { LeadQualificationCriteria, LeadWorkflow } from '@/types/lead-qualification';
import { calculateQualificationScore, determineLeadStage, getNextActions } from '@/utils/lead-qualification';
import { 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  LightBulbIcon, 
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LeadQualificationWizardProps {
  submission: Submission;
  onComplete: (workflow: Partial<LeadWorkflow>) => void;
  onCancel: () => void;
}

export default function LeadQualificationWizard({
  submission,
  onComplete,
  onCancel
}: LeadQualificationWizardProps) {
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState<Partial<LeadQualificationCriteria>>({
    hasbudget: false,
    hasAuthority: false,
    hasNeed: false,
    hasTimeline: false,
  });
  const [additionalInfo, setAdditionalInfo] = useState({
    budgetMin: '',
    budgetMax: '',
    timelineMonths: '',
    painPoints: '',
    notes: '',
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const qualificationScore = calculateQualificationScore(submission, criteria);
    const stage = determineLeadStage(submission, qualificationScore);
    
    const workflow: Partial<LeadWorkflow> = {
      submissionId: submission.id,
      currentStage: stage,
      qualificationScore,
      criteria: {
        ...criteria,
        budgetRange: additionalInfo.budgetMin && additionalInfo.budgetMax
          ? { min: parseInt(additionalInfo.budgetMin), max: parseInt(additionalInfo.budgetMax) }
          : undefined,
        timelineMonths: additionalInfo.timelineMonths 
          ? parseInt(additionalInfo.timelineMonths) 
          : undefined,
        painPoints: additionalInfo.painPoints 
          ? additionalInfo.painPoints.split(',').map(p => p.trim())
          : undefined,
      } as LeadQualificationCriteria,
      notes: additionalInfo.notes,
    };

    onComplete(workflow);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Budget
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-light-text-primary">Budget Assessment</h3>
              <p className="text-light-text-secondary mt-2">
                Does {submission.ownerName} have budget allocated for this solution?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setCriteria({ ...criteria, hasbudget: true })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    criteria.hasbudget
                      ? 'border-flash-green bg-flash-green/10'
                      : 'border-light-border hover:border-flash-green/50'
                  }`}
                >
                  <CheckCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    criteria.hasbudget ? 'text-flash-green' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">Yes, Budget Confirmed</span>
                </button>

                <button
                  onClick={() => setCriteria({ ...criteria, hasbudget: false })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !criteria.hasbudget
                      ? 'border-red-500 bg-red-50'
                      : 'border-light-border hover:border-red-300'
                  }`}
                >
                  <XCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    !criteria.hasbudget ? 'text-red-500' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">No Budget Yet</span>
                </button>
              </div>

              {criteria.hasbudget && (
                <div className="mt-4 p-4 bg-light-bg-secondary rounded-lg">
                  <label className="block text-sm font-medium text-light-text-primary mb-2">
                    Budget Range (Optional)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={additionalInfo.budgetMin}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, budgetMin: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                    />
                    <span className="text-light-text-secondary">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={additionalInfo.budgetMax}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, budgetMax: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Authority
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-light-text-primary">Decision Authority</h3>
              <p className="text-light-text-secondary mt-2">
                Have you identified the decision maker(s)?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setCriteria({ ...criteria, hasAuthority: true })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    criteria.hasAuthority
                      ? 'border-flash-green bg-flash-green/10'
                      : 'border-light-border hover:border-flash-green/50'
                  }`}
                >
                  <CheckCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    criteria.hasAuthority ? 'text-flash-green' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">Yes, Identified</span>
                </button>

                <button
                  onClick={() => setCriteria({ ...criteria, hasAuthority: false })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !criteria.hasAuthority
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-light-border hover:border-amber-300'
                  }`}
                >
                  <XCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    !criteria.hasAuthority ? 'text-amber-500' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">Not Yet</span>
                </button>
              </div>

              {submission.decisionMakers && (
                <div className="mt-4 p-4 bg-light-bg-secondary rounded-lg">
                  <p className="text-sm text-light-text-secondary mb-1">Decision makers mentioned:</p>
                  <p className="text-sm font-medium text-light-text-primary">{submission.decisionMakers}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Need
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <LightBulbIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-light-text-primary">Business Need</h3>
              <p className="text-light-text-secondary mt-2">
                Does {submission.ownerName} have a clear need for our solution?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setCriteria({ ...criteria, hasNeed: true })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    criteria.hasNeed
                      ? 'border-flash-green bg-flash-green/10'
                      : 'border-light-border hover:border-flash-green/50'
                  }`}
                >
                  <CheckCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    criteria.hasNeed ? 'text-flash-green' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">Clear Need</span>
                </button>

                <button
                  onClick={() => setCriteria({ ...criteria, hasNeed: false })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !criteria.hasNeed
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-light-border hover:border-amber-300'
                  }`}
                >
                  <XCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    !criteria.hasNeed ? 'text-amber-500' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">Unclear Need</span>
                </button>
              </div>

              <div className="mt-4 p-4 bg-light-bg-secondary rounded-lg">
                <label className="block text-sm font-medium text-light-text-primary mb-2">
                  Pain Points Identified (comma-separated)
                </label>
                <textarea
                  value={additionalInfo.painPoints}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, painPoints: e.target.value })}
                  rows={3}
                  placeholder="e.g., Manual processes, High costs, Poor integration"
                  className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                />
              </div>

              {submission.specificNeeds && (
                <div className="mt-2 p-4 bg-light-bg-secondary rounded-lg">
                  <p className="text-sm text-light-text-secondary mb-1">Specific needs mentioned:</p>
                  <p className="text-sm text-light-text-primary">{submission.specificNeeds}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Timeline
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-light-text-primary">Implementation Timeline</h3>
              <p className="text-light-text-secondary mt-2">
                Does {submission.ownerName} have a timeline for implementation?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setCriteria({ ...criteria, hasTimeline: true })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    criteria.hasTimeline
                      ? 'border-flash-green bg-flash-green/10'
                      : 'border-light-border hover:border-flash-green/50'
                  }`}
                >
                  <CheckCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    criteria.hasTimeline ? 'text-flash-green' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">Has Timeline</span>
                </button>

                <button
                  onClick={() => setCriteria({ ...criteria, hasTimeline: false })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !criteria.hasTimeline
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-light-border hover:border-amber-300'
                  }`}
                >
                  <XCircleIcon className={`w-6 h-6 mx-auto mb-2 ${
                    !criteria.hasTimeline ? 'text-amber-500' : 'text-light-text-tertiary'
                  }`} />
                  <span className="block text-sm font-medium">No Timeline</span>
                </button>
              </div>

              {criteria.hasTimeline && (
                <div className="mt-4 p-4 bg-light-bg-secondary rounded-lg">
                  <label className="block text-sm font-medium text-light-text-primary mb-2">
                    Timeline (months)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 3"
                    value={additionalInfo.timelineMonths}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, timelineMonths: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 5: // Summary & Notes
        const score = calculateQualificationScore(submission, criteria);
        const stage = determineLeadStage(submission, score);
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-flash-green/20 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-flash-green" />
              </div>
              <h3 className="text-xl font-semibold text-light-text-primary">Qualification Summary</h3>
              <p className="text-light-text-secondary mt-2">
                Lead qualification score and recommended actions
              </p>
            </div>

            {/* Score display */}
            <div className="bg-light-bg-secondary rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-flash-green">{score}</div>
                <div className="text-sm text-light-text-secondary">Qualification Score</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-sm text-light-text-secondary mb-1">Recommended Stage</div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-flash-green/10 text-flash-green border border-flash-green/20">
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-light-text-secondary mb-1">Interest Level</div>
                  <div className="text-lg font-semibold text-light-text-primary">
                    {submission.interestLevel}/5
                  </div>
                </div>
              </div>

              {/* BANT Summary */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className={`flex items-center ${criteria.hasbudget ? 'text-green-600' : 'text-red-500'}`}>
                  {criteria.hasbudget ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                  <span className="text-sm">Budget</span>
                </div>
                <div className={`flex items-center ${criteria.hasAuthority ? 'text-green-600' : 'text-red-500'}`}>
                  {criteria.hasAuthority ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                  <span className="text-sm">Authority</span>
                </div>
                <div className={`flex items-center ${criteria.hasNeed ? 'text-green-600' : 'text-red-500'}`}>
                  {criteria.hasNeed ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                  <span className="text-sm">Need</span>
                </div>
                <div className={`flex items-center ${criteria.hasTimeline ? 'text-green-600' : 'text-red-500'}`}>
                  {criteria.hasTimeline ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                  <span className="text-sm">Timeline</span>
                </div>
              </div>
            </div>

            {/* Additional notes */}
            <div>
              <label className="block text-sm font-medium text-light-text-primary mb-2">
                Additional Notes
              </label>
              <textarea
                value={additionalInfo.notes}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, notes: e.target.value })}
                rows={4}
                placeholder="Any additional context or next steps..."
                className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-light-border max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-light-text-secondary">Step {step} of {totalSteps}</span>
          <span className="text-sm text-light-text-secondary">{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-light-bg-tertiary rounded-full h-2">
          <div 
            className="bg-flash-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-light-border">
        <button
          onClick={step === 1 ? onCancel : handleBack}
          className="px-4 py-2 text-light-text-secondary hover:text-light-text-primary transition-colors"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-2 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors flex items-center"
        >
          {step === totalSteps ? 'Complete' : 'Next'}
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}