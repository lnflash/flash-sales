/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'], // Add any domains here that you'll load images from
  },
  async rewrites() {
    return [
      {
        // Proxy API requests to the intake form API
        source: '/api/:path*',
        destination: process.env.INTAKE_API_URL || 'http://localhost:3000/api/:path*'
      }
    ];
  },
  // Enable environment variables to be accessed in the browser
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },
};

module.exports = nextConfig;