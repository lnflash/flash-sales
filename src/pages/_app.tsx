import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import QueryProvider from '@/lib/query-provider';
import { ApolloProviderWrapper } from '@/lib/apollo-provider';
import AuthGuard from '@/components/auth/AuthGuard';
import { fetchRuntimeConfig } from '@/lib/supabase/runtime-config';
import '@/styles/globals.css';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(router.pathname);
  
  // Fetch runtime config on app mount and register service worker
  useEffect(() => {
    fetchRuntimeConfig();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
            
            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Check every hour
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Flash Sales Dashboard</title>
        <meta name="description" content="Admin dashboard for Flash sales management" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <ApolloProviderWrapper>
        <QueryProvider>
          {isPublicRoute ? (
            <Component {...pageProps} />
          ) : (
            <AuthGuard>
              <Component {...pageProps} />
            </AuthGuard>
          )}
        </QueryProvider>
      </ApolloProviderWrapper>
    </>
  );
}