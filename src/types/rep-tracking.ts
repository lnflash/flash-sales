export interface RepWeeklyData {
  id: string;
  repName: string;
  weekStartDate: string; // ISO date string for the Monday of the week
  submittedMondayUpdate: boolean;
  attendedTuesdayCall: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepPerformanceStats {
  repName: string;
  totalWeeks: number;
  mondayUpdatesSubmitted: number;
  tuesdayCallsAttended: number;
  mondayUpdateRate: number; // percentage
  tuesdayCallRate: number; // percentage
  currentStreak: {
    mondayUpdates: number;
    tuesdayCall: number;
  };
  lastFourWeeks: {
    mondayUpdates: number;
    tuesdayCalls: number;
  };
}

export interface RepTrackingFilters {
  repName?: string;
  startDate?: string;
  endDate?: string;
}

export interface RepTrackingFormData {
  repName: string;
  weekStartDate: string;
  submittedMondayUpdate: boolean;
  attendedTuesdayCall: boolean;
}