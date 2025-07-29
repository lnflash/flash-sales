'use client';

import { useState } from 'react';
import { LeadWorkflow } from '@/types/lead-qualification';
import { Submission } from '@/types/submission';
import { 
  generateFollowUpRecommendations, 
  getRecommendationColor,
  formatSuggestedTiming,
  FollowUpRecommendation
} from '@/utils/follow-up-recommendations';
import { 
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface FollowUpRecommendationsProps {
  workflow: LeadWorkflow;
  submission: Submission;
  onActionTaken?: (recommendation: FollowUpRecommendation) => void;
}

export default function FollowUpRecommendations({
  workflow,
  submission,
  onActionTaken
}: FollowUpRecommendationsProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  const recommendations = generateFollowUpRecommendations({
    workflow,
    submission,
  });

  const activeRecommendations = recommendations.filter(
    rec => !completedActions.has(rec.id)
  );

  const handleMarkComplete = (recommendation: FollowUpRecommendation) => {
    setCompletedActions(prev => new Set(Array.from(prev).concat(recommendation.id)));
    onActionTaken?.(recommendation);
  };

  const toggleExpand = (id: string) => {
    setExpandedRecommendation(expandedRecommendation === id ? null : id);
  };

  if (activeRecommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-light-text-secondary">All follow-up actions completed!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-light-text-primary flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-flash-green" />
            Smart Follow-Up Recommendations
          </h3>
          <p className="text-sm text-light-text-secondary mt-1">
            AI-powered suggestions for {submission.ownerName}
          </p>
        </div>
        <div className="text-sm text-light-text-tertiary">
          {activeRecommendations.length} action{activeRecommendations.length !== 1 ? 's' : ''} recommended
        </div>
      </div>

      <div className="space-y-3">
        {activeRecommendations.map((recommendation) => {
          const isExpanded = expandedRecommendation === recommendation.id;
          
          return (
            <div
              key={recommendation.id}
              className={`border rounded-lg transition-all ${
                isExpanded ? 'shadow-md' : 'hover:shadow-sm'
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(recommendation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <span className="text-2xl mr-3 flex-shrink-0">
                      {recommendation.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          getRecommendationColor(recommendation.priority)
                        }`}>
                          {recommendation.priority}
                        </span>
                        <span className="ml-2 text-xs text-light-text-tertiary flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatSuggestedTiming(recommendation.suggestedTiming)}
                        </span>
                      </div>
                      <h4 className="font-medium text-light-text-primary">
                        {recommendation.action}
                      </h4>
                      <p className="text-sm text-light-text-secondary mt-1">
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className={`w-5 h-5 text-light-text-tertiary transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-light-border">
                  <div className="pt-4 space-y-4">
                    {recommendation.template && (
                      <div>
                        <p className="text-sm font-medium text-light-text-primary mb-2">
                          Suggested Template:
                        </p>
                        <div className="bg-light-bg-secondary rounded-lg p-3">
                          <pre className="text-sm text-light-text-secondary whitespace-pre-wrap font-sans">
                            {recommendation.template}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(recommendation);
                        }}
                        className="px-4 py-2 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors flex items-center"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Mark Complete
                      </button>
                      
                      {recommendation.type === 'email' && (
                        <button className="px-4 py-2 border border-light-border text-light-text-primary rounded-md hover:bg-light-bg-secondary transition-colors">
                          Copy Template
                        </button>
                      )}
                      
                      {recommendation.type === 'meeting' && (
                        <button className="px-4 py-2 border border-light-border text-light-text-primary rounded-md hover:bg-light-bg-secondary transition-colors">
                          Schedule Meeting
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedActions.size > 0 && (
        <div className="mt-4 pt-4 border-t border-light-border">
          <button
            onClick={() => setCompletedActions(new Set())}
            className="text-sm text-light-text-tertiary hover:text-light-text-primary transition-colors"
          >
            Show {completedActions.size} completed action{completedActions.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}