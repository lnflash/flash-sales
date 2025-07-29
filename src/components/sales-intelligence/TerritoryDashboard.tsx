'use client';

import { useState } from 'react';
import { JamaicaParish, JAMAICA_PARISHES, SalesRep } from '@/types/lead-routing';
import { getParishRegion, calculateRepWorkload } from '@/utils/lead-routing';
import { 
  MapIcon, 
  UserGroupIcon, 
  TrophyIcon,
  ChartBarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface TerritoryStats {
  parish: JamaicaParish;
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  avgDealSize: number;
  assignedReps: number;
  topPerformer?: string;
}

// Mock territory data - in production this would come from API
const mockTerritoryStats: TerritoryStats[] = JAMAICA_PARISHES.map(parish => ({
  parish,
  totalLeads: Math.floor(Math.random() * 100) + 20,
  activeLeads: Math.floor(Math.random() * 30) + 5,
  conversionRate: Math.random() * 0.3 + 0.2,
  avgDealSize: Math.floor(Math.random() * 30000) + 20000,
  assignedReps: Math.floor(Math.random() * 3) + 1,
  topPerformer: ['John Brown', 'Sarah Campbell', 'Michael Thompson'][Math.floor(Math.random() * 3)]
}));

interface TerritoryDashboardProps {
  salesReps: SalesRep[];
  onTerritoryClick?: (parish: JamaicaParish) => void;
}

export default function TerritoryDashboard({ 
  salesReps, 
  onTerritoryClick 
}: TerritoryDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'Eastern' | 'Central' | 'Western'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const regions = ['All', 'Eastern', 'Central', 'Western'] as const;

  const filteredStats = mockTerritoryStats.filter(stat => {
    if (selectedRegion === 'All') return true;
    return getParishRegion(stat.parish) === selectedRegion;
  });

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'Eastern': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Central': return 'bg-green-100 text-green-800 border-green-300';
      case 'Western': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 0.4) return 'text-green-600';
    if (rate >= 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const regionStats = {
    Eastern: mockTerritoryStats.filter(s => getParishRegion(s.parish) === 'Eastern'),
    Central: mockTerritoryStats.filter(s => getParishRegion(s.parish) === 'Central'),
    Western: mockTerritoryStats.filter(s => getParishRegion(s.parish) === 'Western'),
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-light-text-primary flex items-center">
            <MapIcon className="w-5 h-5 mr-2 text-flash-green" />
            Territory Management
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-light-bg-secondary rounded-lg p-1">
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    selectedRegion === region
                      ? 'bg-white shadow-sm text-light-text-primary'
                      : 'text-light-text-secondary hover:text-light-text-primary'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Region Summary Cards */}
        {selectedRegion === 'All' && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(regionStats).map(([region, stats]) => {
              const totalLeads = stats.reduce((sum, s) => sum + s.activeLeads, 0);
              const avgConversion = stats.reduce((sum, s) => sum + s.conversionRate, 0) / stats.length;
              
              return (
                <div 
                  key={region}
                  className="p-4 bg-light-bg-secondary rounded-lg border border-light-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      getRegionColor(region)
                    }`}>
                      {region}
                    </span>
                    <span className="text-2xl font-bold text-light-text-primary">
                      {totalLeads}
                    </span>
                  </div>
                  <p className="text-xs text-light-text-secondary">Active Leads</p>
                  <p className={`text-sm font-medium mt-1 ${getPerformanceColor(avgConversion)}`}>
                    {(avgConversion * 100).toFixed(1)}% conversion
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Territory Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {filteredStats.map(stat => {
          const repsInTerritory = salesReps.filter(rep => 
            rep.territories.includes(stat.parish)
          );
          const hasCapacityIssue = repsInTerritory.some(rep => {
            const workload = calculateRepWorkload(rep);
            return workload.status === 'overloaded' || workload.status === 'busy';
          });

          return (
            <div
              key={stat.parish}
              onClick={() => onTerritoryClick?.(stat.parish)}
              className={`
                p-4 rounded-lg border transition-all cursor-pointer
                ${hasCapacityIssue 
                  ? 'border-amber-300 bg-amber-50 hover:border-amber-400' 
                  : 'border-light-border bg-white hover:border-flash-green/50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-light-text-primary">
                    {stat.parish}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${
                    getRegionColor(getParishRegion(stat.parish))
                  }`}>
                    {getParishRegion(stat.parish)}
                  </span>
                </div>
                
                {hasCapacityIssue && (
                  <ExclamationCircleIcon className="w-5 h-5 text-amber-600" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-light-text-tertiary">Active Leads</p>
                  <p className="font-semibold text-light-text-primary">
                    {stat.activeLeads}
                  </p>
                </div>
                
                <div>
                  <p className="text-light-text-tertiary">Conversion</p>
                  <p className={`font-semibold ${getPerformanceColor(stat.conversionRate)}`}>
                    {(stat.conversionRate * 100).toFixed(0)}%
                  </p>
                </div>
                
                <div>
                  <p className="text-light-text-tertiary">Avg Deal</p>
                  <p className="font-semibold text-light-text-primary">
                    ${(stat.avgDealSize / 1000).toFixed(0)}k
                  </p>
                </div>
                
                <div>
                  <p className="text-light-text-tertiary">Reps</p>
                  <p className="font-semibold text-light-text-primary">
                    {stat.assignedReps}
                  </p>
                </div>
              </div>

              {stat.topPerformer && (
                <div className="mt-3 pt-3 border-t border-light-border">
                  <div className="flex items-center text-xs">
                    <TrophyIcon className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-light-text-secondary">
                      Top: {stat.topPerformer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Territory Coverage Warning */}
      {mockTerritoryStats.filter(s => s.assignedReps === 0).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Territory Coverage Gap
              </p>
              <p className="text-sm text-red-700 mt-1">
                {mockTerritoryStats.filter(s => s.assignedReps === 0).length} territories have no assigned reps
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}