'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal';
import { CommandPalette } from '@/components/ui/command-palette';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import HelpMenu from '@/components/onboarding/HelpMenu';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { shortcuts } = useKeyboardShortcuts();
  
  return (
    <ErrorBoundary>
      <MobileMenuProvider>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar />
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header title={title} />
            
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
        
        {/* Global UI components */}
        <CommandPalette />
        <KeyboardShortcutsModal shortcuts={shortcuts} />
        <OnboardingFlow />
      </MobileMenuProvider>
    </ErrorBoundary>
  );
}