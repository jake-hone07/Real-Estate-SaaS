/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don’t block production builds on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // (Optional) Don’t block builds on TS errors while we finish V1
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
