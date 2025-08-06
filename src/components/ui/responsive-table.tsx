import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-4 sm:mx-0", className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">{children}</div>
      </div>
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 border-b border-light-border dark:border-gray-700 last:border-b-0", className)}>
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-center py-1", className)}>
      <span className="text-sm font-medium text-light-text-secondary dark:text-gray-400">{label}</span>
      <span className="text-sm text-light-text-primary dark:text-white">{value}</span>
    </div>
  );
}
