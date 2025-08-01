'use client';

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export function AsyncErrorBoundary({ children, onRetry }: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white border-light-border">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <WifiIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-light-text-primary">
                Failed to load data
              </h3>
              <p className="mt-2 text-sm text-light-text-secondary">
                We couldn't fetch the data. Please check your connection and try again.
              </p>
              <div className="mt-4">
                <Button
                  onClick={onRetry || (() => window.location.reload())}
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Component-specific error boundaries
export function ChartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-light-border">
          <div className="text-center">
            <p className="text-sm text-light-text-secondary">Unable to display chart</p>
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Refresh page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function TableErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="border border-light-border rounded-lg p-8 text-center bg-white">
          <p className="text-sm text-light-text-secondary mb-4">
            Unable to display table data
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Reload page
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}