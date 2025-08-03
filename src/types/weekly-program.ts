export type ActivityType = 
  | 'call'
  | 'meeting'
  | 'follow_up'
  | 'proposal'
  | 'prospecting'
  | 'site_visit'
  | 'admin'
  | 'training'
  | 'custom';

export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

export type ActivityPriority = 'high' | 'medium' | 'low';

export interface Activity {
  id: string;
  userId: string; // The user who owns this activity
  date: string; // ISO date string
  time?: string; // HH:mm format
  duration?: number; // in minutes
  type: ActivityType;
  customType?: string; // Custom activity type name when type is 'custom'
  title: string;
  description?: string;
  // Link to CRM entities
  organizationId?: string; // Link to organization
  dealId?: string; // Link to deal
  contactId?: string; // Link to contact
  entityName?: string; // Display name for the linked entity
  status: ActivityStatus;
  priority: ActivityPriority;
  outcome?: string;
  nextSteps?: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoals {
  calls: number;
  meetings: number;
  proposals: number;
  followUps: number;
  newContacts: number;
}

export interface WeeklyMetrics {
  completedCalls: number;
  completedMeetings: number;
  completedProposals: number;
  completedFollowUps: number;
  newContactsMade: number;
  conversionRate: number;
  totalActivities: number;
  completedActivities: number;
}

export interface WeeklyProgram {
  weekStartDate: string; // ISO date of Monday
  userId: string;
  goals: WeeklyGoals;
  activities: Activity[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const ACTIVITY_TYPE_CONFIG = {
  call: {
    label: 'Phone Call',
    icon: 'PhoneIcon',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    darkColor: 'dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
  },
  meeting: {
    label: 'Meeting',
    icon: 'UserGroupIcon',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    darkColor: 'dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
  },
  follow_up: {
    label: 'Follow-up',
    icon: 'ChatBubbleLeftRightIcon',
    color: 'bg-green-100 text-green-800 border-green-200',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
  },
  proposal: {
    label: 'Proposal',
    icon: 'DocumentTextIcon',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    darkColor: 'dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
  },
  prospecting: {
    label: 'Prospecting',
    icon: 'MagnifyingGlassIcon',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
  },
  site_visit: {
    label: 'Site Visit',
    icon: 'MapPinIcon',
    color: 'bg-red-100 text-red-800 border-red-200',
    darkColor: 'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
  },
  admin: {
    label: 'Admin',
    icon: 'ClipboardDocumentListIcon',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    darkColor: 'dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
  },
  training: {
    label: 'Training',
    icon: 'AcademicCapIcon',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
  },
  custom: {
    label: 'Custom',
    icon: 'PlusCircleIcon',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    darkColor: 'dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800'
  }
};

export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    darkColor: 'dark:text-red-400 dark:bg-red-900/20'
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    darkColor: 'dark:text-yellow-400 dark:bg-yellow-900/20'
  },
  low: {
    label: 'Low',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    darkColor: 'dark:text-green-400 dark:bg-green-900/20'
  }
};