export type JamaicaParish = 
  | 'Kingston'
  | 'St. Andrew'
  | 'St. Catherine'
  | 'Clarendon'
  | 'Manchester'
  | 'St. Elizabeth'
  | 'Westmoreland'
  | 'Hanover'
  | 'St. James'
  | 'Trelawny'
  | 'St. Ann'
  | 'St. Mary'
  | 'Portland'
  | 'St. Thomas';

export const JAMAICA_PARISHES: JamaicaParish[] = [
  'Kingston',
  'St. Andrew',
  'St. Catherine',
  'Clarendon',
  'Manchester',
  'St. Elizabeth',
  'Westmoreland',
  'Hanover',
  'St. James',
  'Trelawny',
  'St. Ann',
  'St. Mary',
  'Portland',
  'St. Thomas'
];

export type CaymanRegion = 
  | 'George Town'
  | 'West Bay'
  | 'Bodden Town'
  | 'North Side'
  | 'East End'
  | 'Sister Islands';

export const CAYMAN_REGIONS: CaymanRegion[] = [
  'George Town',
  'West Bay',
  'Bodden Town',
  'North Side',
  'East End',
  'Sister Islands'
];

export type CuracaoRegion = 
  | 'Willemstad'
  | 'Westpunt'
  | 'Sint Michiel'
  | 'Barber'
  | 'Jan Thiel'
  | 'Nieuwpoort';

export const CURACAO_REGIONS: CuracaoRegion[] = [
  'Willemstad',
  'Westpunt',
  'Sint Michiel',
  'Barber',
  'Jan Thiel',
  'Nieuwpoort'
];

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  territories: JamaicaParish[];
  currentLoad: number; // Number of active leads
  maxCapacity: number; // Maximum leads they can handle
  specializations?: string[]; // Industry specializations
  performance: {
    conversionRate: number;
    avgTimeToClose: number; // in days
  };
  availability: 'available' | 'busy' | 'unavailable';
  lastAssignment?: string; // Date of last lead assignment
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number; // Lower number = higher priority
  condition: (lead: LeadRoutingContext) => boolean;
  assignmentLogic: (lead: LeadRoutingContext, reps: SalesRep[]) => SalesRep | null;
  description: string;
}

export interface LeadRoutingContext {
  territory: JamaicaParish;
  industry?: string;
  dealSize?: number;
  urgency: 'low' | 'medium' | 'high';
  source?: string;
  previousRep?: string;
  requiresSpecialization?: string[];
}

export interface RoutingAssignment {
  leadId: number;
  assignedTo: string; // rep id
  assignedBy: 'system' | string; // system or user id
  reason: string;
  timestamp: string;
  territory: JamaicaParish;
  alternativeReps?: string[]; // backup reps if primary is unavailable
}

export interface TerritoryStats {
  parish: JamaicaParish;
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  assignedReps: string[];
  topPerformer?: string;
}