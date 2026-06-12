import type { MetadataRoute } from 'next';

// Serves /robots.txt (addresses ZAP 10049). Public marketing pages stay
// indexable; the authenticated app + auth/billing flows are kept out of search
// indexes (they're behind login anyway, but this is explicit).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/orders',
        '/menu',
        '/kitchen',
        '/overview',
        '/reports',
        '/staff',
        '/schedule',
        '/settings',
        '/subscribe',
        '/login',
        '/register',
      ],
    },
  };
}
