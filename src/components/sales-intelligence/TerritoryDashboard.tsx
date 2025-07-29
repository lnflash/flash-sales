'use client';

import { useState, useMemo } from 'react';
import { JamaicaParish, JAMAICA_PARISHES } from '@/types/lead-routing';
import { getParishRegion } from '@/utils/lead-routing';
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

interface SimpleSalesRep {
  id: string;
  name: string;
  territory: JamaicaParish | 'Unassigned';
  activeLeads: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TerritoryDashboardProps {
  salesReps: SimpleSalesRep[];
  onTerritoryClick?: (parish: JamaicaParish) => void;
}

export default function TerritoryDashboard({ 
  salesReps, 
  onTerritoryClick 
}: TerritoryDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<'All' | 'Eastern' | 'Central' | 'Western'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const regions = ['All', 'Eastern', 'Central', 'Western'] as const;

  // Calculate territory stats from real sales rep data
  const territoryStats = useMemo(() => {
    const statsMap = new Map<JamaicaParish, TerritoryStats>();

    // Initialize stats for all parishes
    JAMAICA_PARISHES.forEach(parish => {
      statsMap.set(parish, {
        parish,
        totalLeads: 0,
        activeLeads: 0,
        conversionRate: 0,
        avgDealSize: 0,
        assignedReps: 0,
        topPerformer: undefined
      });
    });

    // Group reps by territory and calculate stats
    salesReps.forEach(rep => {
      const territory = rep.territory;
      if (territory && territory !== 'Unassigned' && JAMAICA_PARISHES.includes(territory as JamaicaParish)) {
        const stats = statsMap.get(territory as JamaicaParish)!;
        stats.totalLeads += 1;
        stats.activeLeads += rep.activeLeads || 0;
        stats.assignedReps += 1;
        
        // Track top performer by revenue
        if (!stats.topPerformer || rep.totalRevenue > (salesReps.find(r => r.name === stats.topPerformer)?.totalRevenue || 0)) {
          stats.topPerformer = rep.name;
        }
      }
    });

    // Calculate averages
    statsMap.forEach((stats, parish) => {
      if (stats.assignedReps > 0) {
        const repsInTerritory = salesReps.filter(rep => rep.territory === parish);
        const totalRevenue = repsInTerritory.reduce((sum, rep) => sum + (rep.totalRevenue || 0), 0);
        const conversions = repsInTerritory.filter(rep => rep.conversionRate > 0).length;
        
        stats.conversionRate = conversions / stats.assignedReps;
        stats.avgDealSize = stats.activeLeads > 0 ? totalRevenue / stats.activeLeads : 0;
      }
    });

    return Array.from(statsMap.values());
  }, [salesReps]);

  const filteredStats = territoryStats.filter(stat => {
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
    Eastern: territoryStats.filter(s => getParishRegion(s.parish) === 'Eastern'),
    Central: territoryStats.filter(s => getParishRegion(s.parish) === 'Central'),
    Western: territoryStats.filter(s => getParishRegion(s.parish) === 'Western'),
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
            rep.territory === stat.parish
          );
          const hasCapacityIssue = stat.assignedReps > 5; // Simple check: more than 5 reps per territory might be an issue

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
      {territoryStats.filter(s => s.assignedReps === 0).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Territory Coverage Gap
              </p>
              <p className="text-sm text-red-700 mt-1">
                {territoryStats.filter(s => s.assignedReps === 0).length} territories have no assigned reps
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}