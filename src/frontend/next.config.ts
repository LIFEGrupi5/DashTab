import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

// Static security headers that never depend on per-request state. The
// Content-Security-Policy is intentionally NOT here — it needs a per-request
// nonce, so it lives in middleware.ts instead.
const securityHeaders = [
  // Stop the browser from MIME-sniffing a response into a different type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Belt-and-suspenders with CSP frame-ancestors: refuse to be framed at all.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Send only the origin (not the full path/query) on cross-origin navigations.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Drop access to powerful APIs the app does not use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Force HTTPS for two years (prod only — pointless over http dev).
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  experimental: {
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-label',
      '@radix-ui/react-avatar',
      '@radix-ui/react-switch',
    ],
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
