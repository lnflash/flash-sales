"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/solid";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  change?: {
    value: number;
    positive: boolean;
  };
  color?: "green" | "yellow" | "blue" | "purple";
}

export default function StatsCard({ title, value, icon, subtitle, change, color = "green" }: StatsCardProps) {
  const colorClasses = {
    green: "bg-green-50 dark:bg-green-900/20 text-flash-green dark:text-green-400 border-green-100 dark:border-green-700",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-700",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-700",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-700",
  };

  const iconColorClasses = {
    green: "text-flash-green dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{title}</p>
            <div className="flex items-baseline mt-1 sm:mt-2">
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
              {subtitle && <span className="ml-1 text-base sm:text-lg text-gray-600 dark:text-gray-300">{subtitle}</span>}
            </div>

            {change && (
              <div className="flex items-center mt-2 sm:mt-3 space-x-1">
                {change.positive ? (
                  <ArrowTrendingUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn("text-xs sm:text-sm font-semibold", change.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}
                >
                  {change.positive ? "+" : ""}
                  {change.value}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">vs last month</span>
              </div>
            )}
          </div>

          <div className={cn("p-3 rounded-lg border transition-all duration-200", colorClasses[color], "group-hover:scale-105")}>
            <div className={iconColorClasses[color]}>{icon}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
