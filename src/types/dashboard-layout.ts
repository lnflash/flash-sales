export interface LayoutItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  items: LayoutItem[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  layout: LayoutItem[];
}

export type WidgetType = 
  | 'stats-overview'
  | 'recent-leads'
  | 'performance-chart'
  | 'activity-feed'
  | 'quick-actions'
  | 'team-leaderboard'
  | 'upcoming-tasks'
  | 'conversion-funnel'
  | 'revenue-forecast'
  | 'calendar-view';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  config?: Record<string, any>;
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'stats-overview', type: 'stats-overview', title: 'Stats Overview' },
  { id: 'recent-leads', type: 'recent-leads', title: 'Recent Leads' },
  { id: 'performance-chart', type: 'performance-chart', title: 'Performance Chart' },
  { id: 'activity-feed', type: 'activity-feed', title: 'Activity Feed' },
  { id: 'quick-actions', type: 'quick-actions', title: 'Quick Actions' },
  { id: 'team-leaderboard', type: 'team-leaderboard', title: 'Team Leaderboard' },
  { id: 'upcoming-tasks', type: 'upcoming-tasks', title: 'Upcoming Tasks' },
  { id: 'conversion-funnel', type: 'conversion-funnel', title: 'Conversion Funnel' },
  { id: 'revenue-forecast', type: 'revenue-forecast', title: 'Revenue Forecast' },
  { id: 'calendar-view', type: 'calendar-view', title: 'Calendar' }
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: 'Default Layout',
    description: 'Balanced view with all key metrics',
    layout: [
      { id: 'stats-overview', x: 0, y: 0, w: 12, h: 2, minW: 8, minH: 2 },
      { id: 'recent-leads', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
      { id: 'performance-chart', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
      { id: 'activity-feed', x: 0, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
      { id: 'quick-actions', x: 4, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
      { id: 'team-leaderboard', x: 8, y: 6, w: 4, h: 3, minW: 3, minH: 2 }
    ]
  },
  {
    id: 'sales-focused',
    name: 'Sales Focus',
    description: 'Optimized for sales teams with lead and conversion focus',
    layout: [
      { id: 'stats-overview', x: 0, y: 0, w: 12, h: 2, minW: 8, minH: 2 },
      { id: 'recent-leads', x: 0, y: 2, w: 8, h: 5, minW: 6, minH: 4 },
      { id: 'conversion-funnel', x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 4 },
      { id: 'upcoming-tasks', x: 0, y: 7, w: 6, h: 3, minW: 4, minH: 2 },
      { id: 'revenue-forecast', x: 6, y: 7, w: 6, h: 3, minW: 4, minH: 2 }
    ]
  },
  {
    id: 'manager-view',
    name: 'Manager Dashboard',
    description: 'Team performance and analytics focused layout',
    layout: [
      { id: 'team-leaderboard', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { id: 'performance-chart', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { id: 'stats-overview', x: 0, y: 4, w: 12, h: 2, minW: 8, minH: 2 },
      { id: 'activity-feed', x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 2 },
      { id: 'revenue-forecast', x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 2 }
    ]
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Maximized screen space with essential widgets',
    layout: [
      { id: 'stats-overview', x: 0, y: 0, w: 12, h: 2, minW: 8, minH: 2 },
      { id: 'recent-leads', x: 0, y: 2, w: 4, h: 3, minW: 3, minH: 2 },
      { id: 'performance-chart', x: 4, y: 2, w: 4, h: 3, minW: 3, minH: 2 },
      { id: 'quick-actions', x: 8, y: 2, w: 4, h: 3, minW: 3, minH: 2 }
    ]
  }
];