'use client';

import { useState, useMemo } from 'react';
import { LeadWorkflow, LeadStage } from '@/types/lead-qualification';
import { getStageColor, getStageIcon } from '@/utils/lead-qualification';
import { ChevronRightIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

interface LeadWorkflowPipelineProps {
  workflows: LeadWorkflow[];
  onStageClick?: (stage: LeadStage, workflows: LeadWorkflow[]) => void;
}

const STAGES: { key: LeadStage; label: string }[] = [
  { key: 'new', label: 'New Leads' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'customer', label: 'Customer' },
];

export default function LeadWorkflowPipeline({ 
  workflows, 
  onStageClick 
}: LeadWorkflowPipelineProps) {
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);

  const stageData = useMemo(() => {
    const data = STAGES.map(stage => {
      const stageWorkflows = workflows.filter(w => w.currentStage === stage.key);
      const totalValue = stageWorkflows.reduce((sum, w) => {
        // Estimate deal value based on qualification score
        return sum + (w.qualificationScore * 1000);
      }, 0);

      return {
        ...stage,
        count: stageWorkflows.length,
        workflows: stageWorkflows,
        value: totalValue,
        percentage: workflows.length > 0 
          ? (stageWorkflows.length / workflows.length) * 100 
          : 0,
      };
    });

    // Add lost leads separately
    const lostWorkflows = workflows.filter(w => w.currentStage === 'lost');
    if (lostWorkflows.length > 0) {
      data.push({
        key: 'lost',
        label: 'Lost',
        count: lostWorkflows.length,
        workflows: lostWorkflows,
        value: 0,
        percentage: (lostWorkflows.length / workflows.length) * 100,
      });
    }

    return data;
  }, [workflows]);

  const handleStageClick = (stage: typeof stageData[0]) => {
    setSelectedStage(stage.key);
    onStageClick?.(stage.key, stage.workflows);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-light-text-primary">Lead Pipeline</h3>
        <p className="text-sm text-light-text-secondary mt-1">
          Track leads through qualification stages
        </p>
      </div>

      {/* Pipeline visualization */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {stageData.slice(0, 5).map((stage, index) => (
            <div key={stage.key} className="flex-1 relative">
              <div className="flex items-center">
                <button
                  onClick={() => handleStageClick(stage)}
                  className={`
                    relative z-10 w-full group transition-all duration-200
                    ${selectedStage === stage.key ? 'scale-105' : 'hover:scale-105'}
                  `}
                >
                  <div className={`
                    rounded-lg p-4 border-2 transition-all duration-200
                    ${selectedStage === stage.key 
                      ? 'border-flash-green shadow-md' 
                      : 'border-light-border hover:border-flash-green/50'
                    }
                    ${stage.count > 0 ? 'cursor-pointer' : 'opacity-50'}
                  `}>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-2xl">{getStageIcon(stage.key)}</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-light-text-primary">
                        {stage.count}
                      </div>
                      <div className="text-xs text-light-text-secondary mt-1">
                        {stage.label}
                      </div>
                      {stage.value > 0 && (
                        <div className="text-xs text-flash-green mt-1 font-medium">
                          ${(stage.value / 1000).toFixed(0)}k
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-light-bg-tertiary rounded-full h-1.5">
                        <div 
                          className="bg-flash-green h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${stage.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Arrow connector */}
                {index < 4 && (
                  <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 z-0">
                    <ChevronRightIcon className="w-6 h-6 text-light-text-tertiary" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Lost leads indicator */}
        {stageData.find(s => s.key === 'lost') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleStageClick(stageData.find(s => s.key === 'lost')!)}
              className={`
                inline-flex items-center px-4 py-2 rounded-lg border-2 transition-all
                ${selectedStage === 'lost'
                  ? 'border-red-500 bg-red-50'
                  : 'border-light-border hover:border-red-300'
                }
              `}
            >
              <span className="text-lg mr-2">{getStageIcon('lost')}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-light-text-primary">
                  {stageData.find(s => s.key === 'lost')?.count} Lost
                </div>
                <div className="text-xs text-light-text-secondary">
                  {stageData.find(s => s.key === 'lost')?.percentage.toFixed(1)}%
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-light-border">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <UserGroupIcon className="w-5 h-5 text-light-text-tertiary" />
          </div>
          <div className="text-2xl font-bold text-light-text-primary">
            {workflows.length}
          </div>
          <div className="text-xs text-light-text-secondary">Total Leads</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-5 h-5 rounded-full bg-flash-green/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-flash-green" />
            </div>
          </div>
          <div className="text-2xl font-bold text-flash-green">
            {stageData.find(s => s.key === 'customer')?.count || 0}
          </div>
          <div className="text-xs text-light-text-secondary">Conversions</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <ClockIcon className="w-5 h-5 text-light-text-tertiary" />
          </div>
          <div className="text-2xl font-bold text-light-text-primary">
            {workflows.length > 0 
              ? ((stageData.find(s => s.key === 'customer')?.count || 0) / workflows.length * 100).toFixed(1)
              : '0'
            }%
          </div>
          <div className="text-xs text-light-text-secondary">Conversion Rate</div>
        </div>
      </div>
    </div>
  );
}