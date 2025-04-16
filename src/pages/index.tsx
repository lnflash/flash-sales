import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  // Redirect to dashboard
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-flash-dark-1 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-flash-green to-flash-yellow mb-4">
          Flash Sales Dashboard
        </h1>
        <p className="text-gray-400 mb-8">
          Loading dashboard...
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}