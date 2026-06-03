import { NextRequest, NextResponse } from 'next/server';

// Flip to `true` to roll the policy out in observe-only mode: the browser
// REPORTS violations to the console but blocks nothing. Use it to confirm the
// policy doesn't break a real click-through, then set back to `false` to enforce.
const REPORT_ONLY = false;

/**
 * Per-request Content-Security-Policy.
 *
 * Uses 'self' + 'unsafe-inline' for script-src rather than strict-dynamic+nonce.
 * Reason: output:'standalone' (needed for Docker) prevents Next.js from auto-stamping
 * the nonce onto its own hydration/RSC inline scripts. Without that, strict-dynamic
 * blocks those scripts and the page hangs. 'self' still blocks scripts from external
 * origins (the main XSS vector); the nonce is kept for any explicit <Script nonce>
 * components added in the future.
 */
export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  // Origins the app actually talks to at runtime: the REST API and the SignalR
  // (KDS) hub. SignalR upgrades to a WebSocket, so connect-src needs the ws(s)
  // variant too or the kitchen board silently fails to connect.
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
  const apiOrigin = new URL(apiBase).origin;
  const hubOrigin = process.env.NEXT_PUBLIC_KDS_HUB_URL
    ? new URL(process.env.NEXT_PUBLIC_KDS_HUB_URL).origin
    : apiOrigin;
  const toWs = (origin: string) => origin.replace(/^http/, 'ws');

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    // Dev only: HMR and React Refresh evaluate code via eval().
    isDev ? "'unsafe-eval'" : '',
  ]
    .filter(Boolean)
    .join(' ');

  const connectSrc = [
    ...new Set([
      "'self'",
      apiOrigin,
      hubOrigin,
      toWs(apiOrigin),
      toWs(hubOrigin),
      // Dev only: the Next dev server's HMR socket.
      ...(isDev ? ['ws:', 'wss:'] : []),
    ]),
  ].join(' ');

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // Tailwind / Radix inject inline styles; nonce-ing every style is impractical
    // and style-injection is far lower risk than script-injection.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: ${apiOrigin}`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    // Prod only: auto-rewrite any stray http:// subresource to https://.
    isDev ? '' : `upgrade-insecure-requests`,
  ]
    .filter(Boolean)
    .join('; ');

  // Pass the nonce + CSP down on the REQUEST so Next can read the nonce and apply
  // it to its own <script> tags. `x-nonce` is also readable from a Server Component
  // via headers() if we ever need to nonce an inline script of our own.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(
    REPORT_ONLY ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    csp,
  );
  return response;
}

export const config = {
  // Run on pages, not on static assets / images / the API passthrough — those
  // don't execute scripts and the nonce would needlessly force them dynamic.
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
