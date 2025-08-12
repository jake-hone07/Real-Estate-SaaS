// next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';
import path from 'path';

const nextConfig: NextConfig = {
  // add any Next options here if needed
  webpack: (config: WebpackConfig) => {
    // make sure alias objects exist
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.join(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
