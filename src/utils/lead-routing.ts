import { 
  SalesRep, 
  RoutingRule, 
  LeadRoutingContext, 
  RoutingAssignment,
  JamaicaParish 
} from '@/types/lead-routing';

// Sample routing rules
export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    id: 'high-value-specialist',
    name: 'High-Value Deal Specialist',
    priority: 1,
    description: 'Route high-value deals to specialized reps',
    condition: (lead) => (lead.dealSize || 0) >= 50000,
    assignmentLogic: (lead, reps) => {
      // Find reps with high average deal size
      const specialists = reps
        .filter(rep => 
          rep.territories.includes(lead.territory) &&
          rep.availability === 'available' &&
          rep.performance.avgDealSize >= 40000
        )
        .sort((a, b) => b.performance.avgDealSize - a.performance.avgDealSize);
      
      return specialists[0] || null;
    }
  },
  {
    id: 'territory-match',
    name: 'Territory-Based Assignment',
    priority: 2,
    description: 'Assign leads to reps in the same territory',
    condition: () => true, // Always applicable
    assignmentLogic: (lead, reps) => {
      // Find available reps in the territory
      const territoryReps = reps
        .filter(rep => 
          rep.territories.includes(lead.territory) &&
          rep.availability === 'available' &&
          rep.currentLoad < rep.maxCapacity
        )
        .sort((a, b) => {
          // Prioritize by capacity and performance
          const aCapacityRatio = a.currentLoad / a.maxCapacity;
          const bCapacityRatio = b.currentLoad / b.maxCapacity;
          
          if (Math.abs(aCapacityRatio - bCapacityRatio) > 0.2) {
            return aCapacityRatio - bCapacityRatio; // Less loaded rep first
          }
          
          return b.performance.conversionRate - a.performance.conversionRate;
        });
      
      return territoryReps[0] || null;
    }
  },
  {
    id: 'round-robin',
    name: 'Round Robin Distribution',
    priority: 3,
    description: 'Evenly distribute leads among available reps',
    condition: () => true,
    assignmentLogic: (lead, reps) => {
      const availableReps = reps
        .filter(rep => 
          rep.territories.includes(lead.territory) &&
          rep.availability === 'available' &&
          rep.currentLoad < rep.maxCapacity
        )
        .sort((a, b) => {
          // Sort by last assignment date (oldest first)
          if (!a.lastAssignment) return -1;
          if (!b.lastAssignment) return 1;
          return new Date(a.lastAssignment).getTime() - new Date(b.lastAssignment).getTime();
        });
      
      return availableReps[0] || null;
    }
  },
  {
    id: 'industry-specialist',
    name: 'Industry Specialization',
    priority: 1,
    description: 'Match leads with industry specialists',
    condition: (lead) => !!lead.industry && !!lead.requiresSpecialization,
    assignmentLogic: (lead, reps) => {
      const specialists = reps
        .filter(rep => 
          rep.territories.includes(lead.territory) &&
          rep.availability === 'available' &&
          rep.specializations?.includes(lead.industry!) &&
          rep.currentLoad < rep.maxCapacity
        )
        .sort((a, b) => b.performance.conversionRate - a.performance.conversionRate);
      
      return specialists[0] || null;
    }
  }
];

export function assignLeadToRep(
  lead: LeadRoutingContext,
  reps: SalesRep[],
  rules: RoutingRule[] = DEFAULT_ROUTING_RULES
): RoutingAssignment | null {
  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  
  // Try each rule in order
  for (const rule of sortedRules) {
    if (rule.condition(lead)) {
      const assignedRep = rule.assignmentLogic(lead, reps);
      
      if (assignedRep) {
        // Find alternative reps for backup
        const alternativeReps = reps
          .filter(rep => 
            rep.id !== assignedRep.id &&
            rep.territories.includes(lead.territory) &&
            rep.availability !== 'unavailable'
          )
          .map(rep => rep.id)
          .slice(0, 2);
        
        return {
          leadId: 0, // To be set by caller
          assignedTo: assignedRep.id,
          assignedBy: 'system',
          reason: `Assigned by ${rule.name}: ${rule.description}`,
          timestamp: new Date().toISOString(),
          territory: lead.territory,
          alternativeReps
        };
      }
    }
  }
  
  // No rep found - try to find any available rep in nearby territories
  const nearbyTerritories = getNearbyParishes(lead.territory);
  const nearbyReps = reps
    .filter(rep => 
      rep.territories.some(t => nearbyTerritories.includes(t)) &&
      rep.availability === 'available' &&
      rep.currentLoad < rep.maxCapacity
    )
    .sort((a, b) => b.performance.conversionRate - a.performance.conversionRate);
  
  if (nearbyReps.length > 0) {
    return {
      leadId: 0,
      assignedTo: nearbyReps[0].id,
      assignedBy: 'system',
      reason: `Assigned to rep from nearby territory due to no available reps in ${lead.territory}`,
      timestamp: new Date().toISOString(),
      territory: lead.territory,
      alternativeReps: nearbyReps.slice(1, 3).map(r => r.id)
    };
  }
  
  return null;
}

// Geographic proximity mapping for Jamaica parishes
export function getNearbyParishes(parish: JamaicaParish): JamaicaParish[] {
  const proximityMap: Record<JamaicaParish, JamaicaParish[]> = {
    'Kingston': ['St. Andrew', 'St. Catherine', 'St. Thomas'],
    'St. Andrew': ['Kingston', 'St. Catherine', 'St. Mary', 'St. Thomas'],
    'St. Catherine': ['Kingston', 'St. Andrew', 'Clarendon', 'St. Mary'],
    'Clarendon': ['St. Catherine', 'Manchester', 'St. Ann'],
    'Manchester': ['Clarendon', 'St. Elizabeth', 'Trelawny', 'St. Ann'],
    'St. Elizabeth': ['Manchester', 'Westmoreland'],
    'Westmoreland': ['St. Elizabeth', 'Hanover', 'St. James'],
    'Hanover': ['Westmoreland', 'St. James'],
    'St. James': ['Hanover', 'Westmoreland', 'Trelawny'],
    'Trelawny': ['St. James', 'St. Ann', 'Manchester'],
    'St. Ann': ['Trelawny', 'St. Mary', 'Clarendon', 'Manchester'],
    'St. Mary': ['St. Ann', 'Portland', 'St. Andrew', 'St. Catherine'],
    'Portland': ['St. Mary', 'St. Thomas'],
    'St. Thomas': ['Portland', 'Kingston', 'St. Andrew']
  };
  
  return proximityMap[parish] || [];
}

export function calculateRepWorkload(rep: SalesRep): {
  loadPercentage: number;
  status: 'underutilized' | 'optimal' | 'busy' | 'overloaded';
} {
  const loadPercentage = (rep.currentLoad / rep.maxCapacity) * 100;
  
  let status: 'underutilized' | 'optimal' | 'busy' | 'overloaded';
  if (loadPercentage < 50) status = 'underutilized';
  else if (loadPercentage < 80) status = 'optimal';
  else if (loadPercentage < 100) status = 'busy';
  else status = 'overloaded';
  
  return { loadPercentage, status };
}

export function getParishRegion(parish: JamaicaParish): 'Eastern' | 'Central' | 'Western' {
  const eastern = ['Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary'];
  const central = ['St. Catherine', 'Clarendon', 'Manchester', 'St. Ann', 'Trelawny'];
  const western = ['St. Elizabeth', 'Westmoreland', 'Hanover', 'St. James'];
  
  if (eastern.includes(parish)) return 'Eastern';
  if (central.includes(parish)) return 'Central';
  return 'Western';
}

export function suggestTerritoryReassignment(
  reps: SalesRep[],
  territories: JamaicaParish[]
): Record<JamaicaParish, string[]> {
  const suggestions: Record<JamaicaParish, string[]> = {} as Record<JamaicaParish, string[]>;
  
  territories.forEach(territory => {
    const territoryReps = reps.filter(rep => rep.territories.includes(territory));
    const avgLoad = territoryReps.reduce((sum, rep) => sum + rep.currentLoad, 0) / territoryReps.length;
    
    // Suggest adding reps if average load is high
    if (avgLoad > 15 || territoryReps.length === 0) {
      const region = getParishRegion(territory);
      const availableReps = reps
        .filter(rep => {
          const repTerritories = rep.territories;
          const repRegions = repTerritories.map(t => getParishRegion(t));
          return repRegions.includes(region) && !rep.territories.includes(territory);
        })
        .sort((a, b) => a.currentLoad - b.currentLoad)
        .slice(0, 2)
        .map(r => r.id);
      
      suggestions[territory] = availableReps;
    }
  });
  
  return suggestions;
}