import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface WeeklyProgramContentProps {
  children: React.ReactNode;
}

export const WeeklyProgramContent: React.FC<WeeklyProgramContentProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // During SSR or initial load, show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, show login prompt
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Authentication Required
        </h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          You need to be logged in to access the Weekly Program of Work. 
          Please log in to view and manage your activities.
        </p>
        <Link
          href="/login"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};