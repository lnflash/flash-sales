'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <MobileMenuProvider>
      <div className="flex h-screen bg-light-bg-secondary overflow-hidden">
        <Sidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header title={title} />
          
          <main className="flex-1 overflow-y-auto bg-light-bg-secondary">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  );
}