/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'], // Add any domains here that you'll load images from
  },
  // We're disabling the automatic rewrites as we're handling the proxying manually in the API handlers
  // async rewrites() {
  //   return [
  //     {
  //       // Proxy API requests to the intake form API
  //       source: '/api/:path*',
  //       destination: process.env.INTAKE_API_URL || 'http://localhost:3000/api/:path*'
  //     }
  //   ];
  // },
  // Enable environment variables to be accessed in the browser
  env: {
    // Explicitly set NEXT_PUBLIC_APP_ENV to 'production' in production
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV,
  },
  // This ensures environment variables are available at runtime
  publicRuntimeConfig: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE,
  },
};

module.exports = nextConfig;