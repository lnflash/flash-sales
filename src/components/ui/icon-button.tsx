import * as React from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string; // Make aria-label required for icon buttons
  srOnly?: string; // Optional screen reader text
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, srOnly, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "p-2 rounded-lg hover:bg-light-bg-secondary transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-flash-green focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
        {srOnly && <span className="sr-only">{srOnly}</span>}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";