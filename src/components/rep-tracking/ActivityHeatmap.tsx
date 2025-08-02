import React from 'react';
import { RepProgramData } from '@/hooks/useAllRepsProgram';
import { format, parseISO } from 'date-fns';

interface ActivityHeatmapProps {
  repsData: RepProgramData[];
  weekStart: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ repsData, weekStart }) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const startDate = parseISO(weekStart);

  // Calculate completion rate for each rep for each day
  const heatmapData = repsData.map(rep => {
    const dailyData = weekDays.map((_, dayIndex) => {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + dayIndex);
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      
      const dayActivities = rep.activities.filter(a => a.date === dateStr);
      const completed = dayActivities.filter(a => a.status === 'completed').length;
      const total = dayActivities.length;
      
      return {
        date: dateStr,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    return {
      username: rep.username,
      dailyData,
      weeklyRate: rep.metrics.completionRate
    };
  });

  const getColorClass = (rate: number) => {
    if (rate === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (rate < 25) return 'bg-red-100 dark:bg-red-900/30';
    if (rate < 50) return 'bg-orange-100 dark:bg-orange-900/30';
    if (rate < 75) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  const getTextColorClass = (rate: number) => {
    if (rate === 0) return 'text-gray-500 dark:text-gray-400';
    if (rate < 25) return 'text-red-700 dark:text-red-400';
    if (rate < 50) return 'text-orange-700 dark:text-orange-400';
    if (rate < 75) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-green-700 dark:text-green-400';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Activity Completion Heatmap</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4 min-w-[120px]">
                Sales Rep
              </th>
              {weekDays.map((day, index) => (
                <th key={day} className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 min-w-[80px]">
                  <div>{day}</div>
                  <div className="text-xs font-normal">
                    {format(new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000), 'MMM d')}
                  </div>
                </th>
              ))}
              <th className="text-center text-sm font-medium text-muted-foreground pb-3 pl-4 min-w-[80px]">
                Week Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((rep, repIndex) => (
              <tr key={repIndex} className="border-t border-border">
                <td className="py-3 pr-4">
                  <span className="text-sm font-medium text-foreground">{rep.username}</span>
                </td>
                {rep.dailyData.map((day, dayIndex) => (
                  <td key={dayIndex} className="p-2">
                    <div 
                      className={`
                        relative w-full h-12 rounded-md flex items-center justify-center
                        ${getColorClass(day.rate)}
                        transition-all hover:scale-105 cursor-pointer
                      `}
                      title={`${day.completed}/${day.total} completed (${day.rate}%)`}
                    >
                      <span className={`text-sm font-semibold ${getTextColorClass(day.rate)}`}>
                        {day.rate}%
                      </span>
                      {day.total > 0 && (
                        <span className={`absolute bottom-1 text-xs ${getTextColorClass(day.rate)}`}>
                          {day.completed}/{day.total}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
                <td className="p-2 pl-4">
                  <div 
                    className={`
                      w-full h-12 rounded-md flex items-center justify-center font-bold
                      ${getColorClass(rep.weeklyRate)}
                    `}
                  >
                    <span className={`text-sm ${getTextColorClass(rep.weeklyRate)}`}>
                      {rep.weeklyRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
        <span>Completion Rate:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800"></div>
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30"></div>
            <span>&lt;25%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30"></div>
            <span>25-49%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30"></div>
            <span>50-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
            <span>75%+</span>
          </div>
        </div>
      </div>
    </div>
  );
};