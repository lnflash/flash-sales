"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isSessionValid } from '@/lib/auth';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isSessionValid()) {
      router.replace('/dashboard');
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-light-bg-secondary flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}