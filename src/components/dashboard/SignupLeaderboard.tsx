"use client";

import { useState } from "react";
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { SalesRepStats } from "@/utils/rep-stats-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignupLeaderboardProps {
  repStats: SalesRepStats[];
  isLoading?: boolean;
}

export default function SignupLeaderboard({ repStats, isLoading = false }: SignupLeaderboardProps) {
  const [sortBy, setSortBy] = useState<keyof SalesRepStats>("signedUp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: keyof SalesRepStats) => {
    if (column === sortBy) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const sortedData = [...repStats].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    }

    return 0;
  });

  // Helper to render header cell with sort icons
  const renderHeaderCell = (label: string, column: keyof SalesRepStats) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {label}
        {sortBy === column && (sortDirection === "desc" ? <ChevronDownIcon className="w-3 h-3 ml-1" /> : <ChevronUpIcon className="w-3 h-3 ml-1" />)}
      </div>
    </th>
  );

  // Get medal icon based on rank
  const getMedalIcon = (index: number) => {
    if (index === 0) return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <TrophyIcon className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <TrophyIcon className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">{index + 1}</span>;
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Signup Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-800 h-4 w-1/3 rounded mb-2"></div>
                  <div className="bg-gray-100 dark:bg-gray-800 h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-flash-green" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Signup Leaderboard</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-flash-green hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="w-12 px-2 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Rank</th>
                {renderHeaderCell("Rep", "username")}
                {renderHeaderCell("Signups", "signedUp")}
                {renderHeaderCell("Conv. Rate", "conversionRate")}
              </tr>
            </thead>
            <tbody>
              {sortedData.slice(0, 5).map((rep, index) => (
                <tr
                  key={rep.username}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-2 py-3 text-center">{getMedalIcon(index)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{rep.username}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-semibold text-flash-green">{rep.signedUp}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={rep.conversionRate >= 20 ? "success" : "warning"} className="text-xs">
                      {rep.conversionRate.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
