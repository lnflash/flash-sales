import React from 'react';
import { RepProgramData } from '@/hooks/useAllRepsProgram';
import { 
  TrophyIcon, 
  FireIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface PerformanceLeaderboardProps {
  repsData: RepProgramData[];
}

export const PerformanceLeaderboard: React.FC<PerformanceLeaderboardProps> = ({ repsData }) => {
  // Sort reps by completion rate
  const sortedReps = [...repsData].sort((a, b) => 
    b.metrics.completionRate - a.metrics.completionRate
  );

  const getRankIcon = (position: number) => {
    if (position === 0) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    if (position === 1) return <div className="h-5 w-5 text-gray-400 font-bold flex items-center justify-center">2</div>;
    if (position === 2) return <div className="h-5 w-5 text-orange-600 font-bold flex items-center justify-center">3</div>;
    return <div className="h-5 w-5 text-muted-foreground flex items-center justify-center">{position + 1}</div>;
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Performance Leaderboard</h3>
        <span className="text-sm text-muted-foreground">
          Week of {new Date(sortedReps[0]?.currentWeek || new Date()).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-3">
        {sortedReps.map((rep, index) => {
          const goalAchievements = Object.values(rep.metrics.goalAchievement);
          const avgGoalAchievement = Math.round(
            goalAchievements.reduce((sum, goal) => sum + goal.percentage, 0) / goalAchievements.length
          );

          return (
            <div
              key={rep.userId}
              className={`
                p-4 rounded-lg border transition-all
                ${index === 0 
                  ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700' 
                  : 'bg-background border-border hover:border-muted-foreground'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{rep.username}</h4>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Completion Rate</p>
                        <p className={`font-semibold ${getPerformanceColor(rep.metrics.completionRate)}`}>
                          {rep.metrics.completionRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Activities</p>
                        <p className="font-medium text-foreground">
                          {rep.metrics.completedActivities}/{rep.metrics.totalActivities}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Goal Achievement</p>
                        <p className={`font-medium ${getPerformanceColor(avgGoalAchievement)}`}>
                          {avgGoalAchievement}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Daily Avg</p>
                        <p className="font-medium text-foreground">
                          {rep.metrics.averageActivitiesPerDay.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rep.metrics.completionRate >= 80 && (
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg" title="High Performer">
                      <FireIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  {avgGoalAchievement >= 100 && (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg" title="Goals Achieved">
                      <ChartBarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Activity breakdown */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">Activities:</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                      {rep.metrics.completedActivities} Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      {rep.metrics.inProgressActivities} In Progress
                    </span>
                    <span className="text-muted-foreground">
                      {rep.metrics.plannedActivities} Planned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};