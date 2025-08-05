import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    
    if (open) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "bg-background rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col",
      className
    )}>
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn("p-6 pb-4", className)}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => {
  return (
    <h2 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h2>
  );
};

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <p className={cn("text-sm text-light-text-secondary dark:text-dark-text-secondary", className)}>
      {children}
    </p>
  );
};

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild, onClick }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        onClick?.();
      }
    });
  }

  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
};