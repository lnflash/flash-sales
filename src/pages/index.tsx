import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isSessionValid } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    if (isSessionValid()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-light-bg-secondary flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-flash-green to-flash-green-light mb-4">
          Flash Sales Dashboard
        </h1>
        <p className="text-light-text-secondary mb-8">
          Loading...
        </p>
      </div>
    </div>
  );
}