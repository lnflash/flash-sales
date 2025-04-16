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
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_BASE_URL: '/api', // Use relative URL for API endpoints
    INTAKE_API_URL: process.env.INTAKE_API_URL || 'https://flash-intake-form-3xgvo.ondigitalocean.app/api',
  },
};

module.exports = nextConfig;