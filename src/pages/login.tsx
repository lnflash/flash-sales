"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to new PIN-enabled login page
    router.replace('/login-v2');
  }, [router]);
  
  return null;
}