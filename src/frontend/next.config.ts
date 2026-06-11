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
  // Cross-origin isolation (ZAP 90004). COOP severs this page from cross-origin
  // windows. COEP is set to `credentialless` rather than `require-corp` on
  // purpose: the app loads cross-origin subresources (e.g. API/MinIO images)
  // that don't all send CORP headers — `require-corp` would block them, whereas
  // `credentialless` loads them without ambient credentials. CORP keeps our own
  // resources embeddable only same-origin.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // Force HTTPS for two years (prod only — pointless over http dev).
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

// Sensitive pages must never be cached by the browser or a shared proxy — they
// can reflect per-session state (ZAP 10015). Scoped to auth/billing routes only;
// applying no-store globally would defeat static-asset caching.
const noStore = [
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't advertise the framework to attackers (ZAP 10037).
  poweredByHeader: false,
  // Required for PostHog /ingest proxy — prevents Next.js stripping the trailing slash
  // which breaks the PostHog event endpoint matching.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/login', headers: noStore },
      { source: '/register', headers: noStore },
    ];
  },
  async rewrites() {
    return [
      // Proxy PostHog through /ingest so requests are same-origin (bypasses ad
      // blockers that block app.posthog.com, and avoids CSP connect-src issues).
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
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
