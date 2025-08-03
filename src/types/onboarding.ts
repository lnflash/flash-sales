export interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
  disableOverlay?: boolean;
  spotlightClicks?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

export interface TourSection {
  id: string;
  name: string;
  steps: TourStep[];
}

// Dashboard Tour Steps
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to Your Dashboard! 🎉',
    content: 'This is your central hub for managing leads and tracking performance. Let me show you around.',
    placement: 'center',
    disableBeacon: true
  },
  {
    target: '[data-tour="performance-widget"]',
    title: 'Performance Metrics',
    content: 'Track your conversion rates, deal values, and response times at a glance.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="funnel-widget"]',
    title: 'Sales Funnel',
    content: 'Visualize your leads as they progress through the sales pipeline.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="trends-widget"]',
    title: 'Trends & Analytics',
    content: 'Monitor lead volume trends and identify patterns over time.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="activity-feed"]',
    title: 'Recent Activity',
    content: 'Stay updated with the latest lead activities and updates from your team.',
    placement: 'left'
  },
  {
    target: '[data-tour="navigation"]',
    title: 'Navigation Menu',
    content: 'Access all features including Leads, Rep Tracking, and Program of Work.',
    placement: 'right'
  }
];

// Leads Tour Steps
export const LEADS_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="leads-table"]',
    title: 'Lead Management Table',
    content: 'View and manage all your leads in one place. Click on any lead to see details.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="leads-filters"]',
    title: 'Smart Filters',
    content: 'Filter leads by status, territory, date range, and more to find exactly what you need.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="bulk-actions"]',
    title: 'Bulk Actions',
    content: 'Select multiple leads and perform actions like status updates or assignments in bulk.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="lead-search"]',
    title: 'Quick Search',
    content: 'Search leads by name, email, phone, or any other field instantly.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="export-button"]',
    title: 'Export Data',
    content: 'Export your filtered leads to CSV for reporting or analysis.',
    placement: 'left'
  }
];

// Program of Work Tour Steps  
export const PROGRAM_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="weekly-calendar"]',
    title: 'Weekly Calendar View',
    content: 'Plan and track your activities for the week. Click any day to add new activities.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="activity-types"]',
    title: 'Activity Types',
    content: 'Choose from calls, meetings, proposals, follow-ups, and more. You can even create custom types!',
    placement: 'right'
  },
  {
    target: '[data-tour="weekly-goals"]',
    title: 'Weekly Goals',
    content: 'Set and track your weekly targets for different activity types.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="progress-tracker"]',
    title: 'Progress Tracking',
    content: 'Monitor your progress towards weekly goals with visual indicators.',
    placement: 'left'
  },
  {
    target: '[data-tour="sync-indicator"]',
    title: 'Offline Support',
    content: 'Work offline and your data will sync automatically when you reconnect.',
    placement: 'bottom'
  }
];

// Role-specific feature highlights
export const MANAGER_SPECIFIC_STEPS: TourStep[] = [
  {
    target: '[data-tour="rep-tracking"]',
    title: 'Rep Tracking Dashboard',
    content: 'Monitor all your sales reps\' performance and activities in real-time.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="territory-management"]',
    title: 'Territory Management',
    content: 'View and manage territory assignments, identify gaps, and optimize coverage.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="team-analytics"]',
    title: 'Team Analytics',
    content: 'Access detailed analytics for your entire team\'s performance.',
    placement: 'bottom'
  }
];

// Welcome messages by role
export const WELCOME_MESSAGES = {
  'sales-rep': {
    title: 'Welcome, Sales Champion! 🚀',
    description: 'Ready to boost your sales performance? Let\'s get you familiar with your new tools.',
    benefits: [
      'Track and manage your leads efficiently',
      'Plan your week with Program of Work',
      'Monitor your performance metrics',
      'Work offline with automatic sync'
    ]
  },
  'sales-manager': {
    title: 'Welcome, Sales Leader! 📊',
    description: 'Empower your team with powerful management tools. Let\'s explore your dashboard.',
    benefits: [
      'Monitor team performance in real-time',
      'Manage territory assignments',
      'Track individual rep progress',
      'Access comprehensive analytics'
    ]
  },
  'admin': {
    title: 'Welcome, Administrator! ⚙️',
    description: 'You have full access to all features. Let\'s set up your system.',
    benefits: [
      'Full system configuration access',
      'User and role management',
      'Advanced analytics and reporting',
      'System health monitoring'
    ]
  }
};