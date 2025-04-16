import { AppProps } from 'next/app';
import Head from 'next/head';
import QueryProvider from '@/lib/query-provider';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Flash Sales Dashboard</title>
        <meta name="description" content="Admin dashboard for Flash sales management" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <QueryProvider>
        <Component {...pageProps} />
      </QueryProvider>
    </>
  );
}