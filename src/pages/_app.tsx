import { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import QueryProvider from '@/lib/query-provider';
import { ApolloProviderWrapper } from '@/lib/apollo-provider';
import AuthGuard from '@/components/auth/AuthGuard';
import '@/styles/globals.css';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <>
      <Head>
        <title>Flash Sales Dashboard</title>
        <meta name="description" content="Admin dashboard for Flash sales management" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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