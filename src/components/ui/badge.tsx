import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-flash-green text-white hover:bg-flash-green-dark",
        secondary:
          "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
        destructive: "border-transparent bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700",
        outline: "text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800",
        success: "border-green-200 dark:border-green-700 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200",
        warning: "border-yellow-200 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200",
        info: "border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
