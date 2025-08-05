"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionValid } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = () => {
      if (!isSessionValid()) {
        router.push('/login-v2');
      }
    };

    // Check auth on mount
    checkAuth();

    // Check auth every minute
    const interval = setInterval(checkAuth, 60000);

    return () => clearInterval(interval);
  }, [router]);
  
  return <>{children}</>;
}