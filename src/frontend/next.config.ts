import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
