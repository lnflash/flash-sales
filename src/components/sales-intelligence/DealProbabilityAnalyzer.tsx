'use client';

import { useState } from 'react';
import { LeadWorkflow } from '@/types/lead-qualification';
import { Submission } from '@/types/submission';
import { 
  calculateDealProbability, 
  getDealProbabilityColor, 
  getDealProbabilityLabel 
} from '@/utils/deal-probability';
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DealProbabilityAnalyzerProps {
  workflow: LeadWorkflow;
  submission: Submission;
  onClose?: () => void;
}

export default function DealProbabilityAnalyzer({
  workflow,
  submission,
  onClose
}: DealProbabilityAnalyzerProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const analysis = calculateDealProbability(workflow, submission);
  const probabilityColor = getDealProbabilityColor(analysis.finalProbability);
  const probabilityLabel = getDealProbabilityLabel(analysis.finalProbability);

  const renderProbabilityMeter = () => {
    return (
      <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30" />
        
        {/* Probability indicator */}
        <div 
          className="absolute top-0 left-0 h-full bg-flash-green transition-all duration-500"
          style={{ width: `${analysis.finalProbability}%` }}
        />
        
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-800">
            {analysis.finalProbability}%
          </span>
        </div>
      </div>
    );
  };

  const renderScoreBreakdown = () => {
    const components = [
      { label: 'Base Score', value: analysis.baseScore, icon: ChartBarIcon },
      { label: 'Quality Bonus', value: analysis.qualityBonus, icon: CheckCircleIcon, color: 'text-green-600' },
      { label: 'Engagement', value: analysis.engagementBonus, icon: ArrowTrendingUpIcon, color: 'text-blue-600' },
      { label: 'Business Factors', value: analysis.businessBonus, icon: LightBulbIcon, color: 'text-purple-600' },
      { label: 'Historical', value: analysis.historicalBonus, icon: InformationCircleIcon, color: 'text-gray-600' },
      { label: 'Penalties', value: -analysis.penalties, icon: ExclamationTriangleIcon, color: 'text-red-600' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {components.map((component) => (
          <div key={component.label} className="bg-light-bg-secondary rounded-lg p-3">
            <div className="flex items-center mb-1">
              <component.icon className={`w-4 h-4 mr-1 ${component.color || 'text-light-text-tertiary'}`} />
              <span className="text-xs text-light-text-secondary">{component.label}</span>
            </div>
            <div className={`text-lg font-semibold ${component.value >= 0 ? 'text-light-text-primary' : 'text-red-600'}`}>
              {component.value >= 0 ? '+' : ''}{component.value}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-light-border max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-light-text-primary">Deal Probability Analysis</h3>
          <p className="text-sm text-light-text-secondary mt-1">{submission.ownerName}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-light-text-tertiary hover:text-light-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Main probability display */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-light-text-secondary">Close Probability</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${probabilityColor}`}>
            {probabilityLabel}
          </span>
        </div>
        {renderProbabilityMeter()}
        
        {/* Confidence indicator */}
        <div className="mt-2 flex items-center justify-end">
          <span className="text-xs text-light-text-tertiary">
            Confidence: 
            <span className={`ml-1 font-medium ${
              analysis.confidence === 'high' ? 'text-green-600' :
              analysis.confidence === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {analysis.confidence}
            </span>
          </span>
        </div>
      </div>

      {/* Key insights */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-light-text-primary mb-3">Key Insights</h4>
        <div className="space-y-2">
          {analysis.insights.map((insight, index) => (
            <div key={index} className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-flash-green mt-1.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-light-text-secondary">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="border-t border-light-border pt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center text-sm font-medium text-flash-green hover:text-flash-green-light transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Score Breakdown
          <svg 
            className={`w-4 h-4 ml-1 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-4">
            {renderScoreBreakdown()}
          </div>
        )}
      </div>

      {/* Action recommendations */}
      <div className="mt-6 p-4 bg-flash-green/10 rounded-lg border border-flash-green/20">
        <h4 className="text-sm font-medium text-light-text-primary mb-2">Recommended Actions</h4>
        <div className="space-y-1">
          {analysis.finalProbability >= 70 && (
            <>
              <p className="text-sm text-light-text-secondary">• Schedule closing meeting immediately</p>
              <p className="text-sm text-light-text-secondary">• Prepare contract and pricing details</p>
              <p className="text-sm text-light-text-secondary">• Engage executive sponsor if needed</p>
            </>
          )}
          {analysis.finalProbability >= 40 && analysis.finalProbability < 70 && (
            <>
              <p className="text-sm text-light-text-secondary">• Address any remaining objections</p>
              <p className="text-sm text-light-text-secondary">• Provide ROI analysis or case studies</p>
              <p className="text-sm text-light-text-secondary">• Set clear next steps with timeline</p>
            </>
          )}
          {analysis.finalProbability < 40 && (
            <>
              <p className="text-sm text-light-text-secondary">• Re-qualify lead with BANT criteria</p>
              <p className="text-sm text-light-text-secondary">• Identify and address blockers</p>
              <p className="text-sm text-light-text-secondary">• Consider nurture campaign if not ready</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}