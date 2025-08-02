import React from 'react';
import { RepProgramData } from '@/hooks/useAllRepsProgram';
import { 
  PhoneIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface GoalAchievementChartProps {
  repsData: RepProgramData[];
}

export const GoalAchievementChart: React.FC<GoalAchievementChartProps> = ({ repsData }) => {
  // Calculate average achievement per goal type across all reps
  const goalTypes = [
    { 
      key: 'calls', 
      label: 'Calls', 
      icon: PhoneIcon,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    { 
      key: 'meetings', 
      label: 'Meetings', 
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    { 
      key: 'proposals', 
      label: 'Proposals', 
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    { 
      key: 'followUps', 
      label: 'Follow-ups', 
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500',
      lightColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  const aggregatedGoals = goalTypes.map(goalType => {
    const totalCurrent = repsData.reduce((sum, rep) => 
      sum + rep.metrics.goalAchievement[goalType.key as keyof typeof rep.metrics.goalAchievement].current, 0
    );
    const totalTarget = repsData.reduce((sum, rep) => 
      sum + rep.metrics.goalAchievement[goalType.key as keyof typeof rep.metrics.goalAchievement].target, 0
    );
    const avgPercentage = Math.round(
      repsData.reduce((sum, rep) => 
        sum + rep.metrics.goalAchievement[goalType.key as keyof typeof rep.metrics.goalAchievement].percentage, 0
      ) / repsData.length
    );

    return {
      ...goalType,
      totalCurrent,
      totalTarget,
      avgPercentage
    };
  });

  const maxValue = Math.max(...aggregatedGoals.map(g => g.totalTarget));

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Team Goal Achievement</h3>

      <div className="space-y-4">
        {aggregatedGoals.map((goal) => {
          const Icon = goal.icon;
          return (
            <div key={goal.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${goal.lightColor}`}>
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{goal.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {goal.totalCurrent} of {goal.totalTarget} completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    goal.avgPercentage >= 100 ? 'text-green-600 dark:text-green-400' :
                    goal.avgPercentage >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {goal.avgPercentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">avg achievement</p>
                </div>
              </div>
              
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full ${goal.color} transition-all duration-500`}
                  style={{ width: `${Math.min((goal.totalCurrent / goal.totalTarget) * 100, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground">
                    {goal.totalCurrent} / {goal.totalTarget}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">Individual Rep Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {repsData.map(rep => {
            const overallAchievement = Math.round(
              Object.values(rep.metrics.goalAchievement)
                .reduce((sum, goal) => sum + goal.percentage, 0) / 4
            );

            return (
              <div key={rep.userId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">{rep.username}</span>
                <div className="flex items-center gap-3">
                  {goalTypes.map(goalType => {
                    const achievement = rep.metrics.goalAchievement[
                      goalType.key as keyof typeof rep.metrics.goalAchievement
                    ];
                    return (
                      <div
                        key={goalType.key}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          achievement.percentage >= 100 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : achievement.percentage >= 75
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}
                        title={`${goalType.label}: ${achievement.current}/${achievement.target}`}
                      >
                        {achievement.percentage}
                      </div>
                    );
                  })}
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    overallAchievement >= 100 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : overallAchievement >= 75
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    {overallAchievement}% avg
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};