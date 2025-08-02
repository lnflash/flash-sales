import { StatsOverviewWidget } from './StatsOverviewWidget';
import { RecentLeadsWidget } from './RecentLeadsWidget';
import { PerformanceChartWidget } from './PerformanceChartWidget';
import { ActivityFeedWidget } from './ActivityFeedWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { TeamLeaderboardWidget } from './TeamLeaderboardWidget';
import { WidgetType } from '@/types/dashboard-layout';

export const widgetComponents: Record<WidgetType, React.FC<any>> = {
  'stats-overview': StatsOverviewWidget,
  'recent-leads': RecentLeadsWidget,
  'performance-chart': PerformanceChartWidget,
  'activity-feed': ActivityFeedWidget,
  'quick-actions': QuickActionsWidget,
  'team-leaderboard': TeamLeaderboardWidget,
  'upcoming-tasks': () => <div className="p-4 text-center text-muted-foreground">Upcoming Tasks Widget</div>,
  'conversion-funnel': () => <div className="p-4 text-center text-muted-foreground">Conversion Funnel Widget</div>,
  'revenue-forecast': () => <div className="p-4 text-center text-muted-foreground">Revenue Forecast Widget</div>,
  'calendar-view': () => <div className="p-4 text-center text-muted-foreground">Calendar View Widget</div>
};

export {
  StatsOverviewWidget,
  RecentLeadsWidget,
  PerformanceChartWidget,
  ActivityFeedWidget,
  QuickActionsWidget,
  TeamLeaderboardWidget
};