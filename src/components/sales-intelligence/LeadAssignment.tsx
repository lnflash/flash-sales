'use client';

import { useState, useMemo } from 'react';
import { SalesRep, JamaicaParish, JAMAICA_PARISHES } from '@/types/lead-routing';
import { assignLeadToRep, calculateRepWorkload, getParishRegion } from '@/utils/lead-routing';
import { useSubmissions } from '@/hooks/useSubmissions';
import { 
  UserGroupIcon, 
  MapPinIcon,
  ChartBarIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface LeadAssignmentProps {
  leadId: number | string;
  currentTerritory?: JamaicaParish;
  onAssign: (repId: string, territory: JamaicaParish) => void;
  onCancel: () => void;
}

export default function LeadAssignment({
  leadId,
  currentTerritory,
  onAssign,
  onCancel
}: LeadAssignmentProps) {
  const [selectedTerritory, setSelectedTerritory] = useState<JamaicaParish | ''>(
    currentTerritory || ''
  );
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');

  // Get all submissions to build sales rep data
  const { submissions } = useSubmissions({});

  // Create sales rep data from submissions
  const salesReps = useMemo(() => {
    const repMap = new Map<string, SalesRep>();

    // Group submissions by username and territory
    submissions.forEach(submission => {
      if (!submission.username || !submission.territory) return;

      const repId = submission.username;
      if (!repMap.has(repId)) {
        repMap.set(repId, {
          id: repId,
          name: submission.username,
          email: `${submission.username.toLowerCase()}@flash.com`,
          territories: [],
          currentLoad: 0,
          maxCapacity: 20,
          specializations: ['General'],
          performance: {
            conversionRate: 0,
            avgTimeToClose: 14
          },
          availability: 'available' as const
        });
      }

      const rep = repMap.get(repId)!;
      
      // Add territory if not already included
      const territory = submission.territory as JamaicaParish;
      if (!rep.territories.includes(territory)) {
        rep.territories.push(territory);
      }

      // Update stats
      rep.currentLoad += 1;
      if (submission.signedUp) {
        rep.performance.conversionRate = (rep.performance.conversionRate * (rep.currentLoad - 1) + 1) / rep.currentLoad;
      }

      // Update availability based on load
      if (rep.currentLoad >= rep.maxCapacity) {
        rep.availability = 'unavailable';
      } else if (rep.currentLoad >= rep.maxCapacity * 0.8) {
        rep.availability = 'busy';
      }
    });

    return Array.from(repMap.values());
  }, [submissions]);

  const handleAutoAssign = () => {
    if (!selectedTerritory) return;

    const leadContext = {
      territory: selectedTerritory,
      urgency: 'medium' as const,
    };

    const assignment = assignLeadToRep(leadContext, salesReps);
    
    if (assignment) {
      setSelectedRep(assignment.assignedTo);
    }
  };

  const handleConfirmAssignment = () => {
    if (selectedRep && selectedTerritory) {
      onAssign(selectedRep, selectedTerritory);
    }
  };

  const getRepsByTerritory = (territory: JamaicaParish) => {
    return salesReps.filter(rep => rep.territories.includes(territory));
  };

  const selectedRepData = salesReps.find(rep => rep.id === selectedRep);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-light-border max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-light-text-primary mb-2">
          Assign Lead #{leadId}
        </h3>
        <p className="text-sm text-light-text-secondary">
          Select territory and assignment method
        </p>
      </div>

      {/* Territory Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-light-text-primary mb-2">
          <MapPinIcon className="w-4 h-4 inline mr-1" />
          Territory
        </label>
        <select
          value={selectedTerritory}
          onChange={(e) => {
            setSelectedTerritory(e.target.value as JamaicaParish);
            setSelectedRep('');
          }}
          className="w-full px-3 py-2 bg-white border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-flash-green"
        >
          <option value="">Select a parish...</option>
          {JAMAICA_PARISHES.map(parish => (
            <option key={parish} value={parish}>
              {parish} ({getParishRegion(parish)} Region)
            </option>
          ))}
        </select>
      </div>

      {selectedTerritory && (
        <>
          {/* Assignment Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-light-text-primary mb-2">
              Assignment Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setAssignmentMode('auto')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assignmentMode === 'auto'
                    ? 'border-flash-green bg-flash-green/10'
                    : 'border-light-border hover:border-flash-green/50'
                }`}
              >
                <UserGroupIcon className="w-6 h-6 mx-auto mb-2 text-flash-green" />
                <span className="block text-sm font-medium">Auto-Assign</span>
                <span className="block text-xs text-light-text-secondary mt-1">
                  System selects best rep
                </span>
              </button>

              <button
                onClick={() => setAssignmentMode('manual')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assignmentMode === 'manual'
                    ? 'border-flash-green bg-flash-green/10'
                    : 'border-light-border hover:border-flash-green/50'
                }`}
              >
                <UserIcon className="w-6 h-6 mx-auto mb-2 text-flash-green" />
                <span className="block text-sm font-medium">Manual Select</span>
                <span className="block text-xs text-light-text-secondary mt-1">
                  Choose specific rep
                </span>
              </button>
            </div>
          </div>

          {/* Auto-Assignment */}
          {assignmentMode === 'auto' && (
            <div className="mb-6">
              <button
                onClick={handleAutoAssign}
                className="w-full px-4 py-3 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors"
              >
                Find Best Available Rep
              </button>
            </div>
          )}

          {/* Manual Selection */}
          {assignmentMode === 'manual' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-light-text-primary mb-2">
                Available Reps in {selectedTerritory}
              </label>
              <div className="space-y-3">
                {getRepsByTerritory(selectedTerritory).map(rep => {
                  const workload = calculateRepWorkload(rep);
                  
                  return (
                    <button
                      key={rep.id}
                      onClick={() => setSelectedRep(rep.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedRep === rep.id
                          ? 'border-flash-green bg-flash-green/10'
                          : 'border-light-border hover:border-flash-green/50'
                      }`}
                      disabled={rep.availability === 'unavailable'}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-light-text-primary">
                            {rep.name}
                          </p>
                          <p className="text-sm text-light-text-secondary">
                            {rep.specializations?.join(', ') || 'General'}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            rep.availability === 'available' 
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : rep.availability === 'busy'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}>
                            {rep.availability}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-light-text-tertiary">Load</span>
                          <div className="flex items-center mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  workload.status === 'underutilized' ? 'bg-blue-500' :
                                  workload.status === 'optimal' ? 'bg-green-500' :
                                  workload.status === 'busy' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${workload.loadPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {rep.currentLoad}/{rep.maxCapacity}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-light-text-tertiary">Conv. Rate</span>
                          <p className="font-medium text-light-text-primary">
                            {(rep.performance.conversionRate * 100).toFixed(0)}%
                          </p>
                        </div>
                        
                      </div>
                    </button>
                  );
                })}
                
                {getRepsByTerritory(selectedTerritory).length === 0 && (
                  <div className="text-center py-8 text-light-text-tertiary">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No reps assigned to this territory</p>
                    <p className="text-sm mt-1">Consider assigning from nearby territories</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Rep Summary */}
          {selectedRepData && (
            <div className="mb-6 p-4 bg-flash-green/10 rounded-lg border border-flash-green/20">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="w-5 h-5 text-flash-green mr-2" />
                <span className="font-medium text-light-text-primary">
                  Selected: {selectedRepData.name}
                </span>
              </div>
              <p className="text-sm text-light-text-secondary">
                This lead will be assigned to {selectedRepData.name} in {selectedTerritory}
              </p>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-light-text-secondary hover:text-light-text-primary transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleConfirmAssignment}
          disabled={!selectedRep || !selectedTerritory}
          className={`px-6 py-2 rounded-md transition-colors ${
            selectedRep && selectedTerritory
              ? 'bg-flash-green text-white hover:bg-flash-green-light'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Assign Lead
        </button>
      </div>
    </div>
  );
}