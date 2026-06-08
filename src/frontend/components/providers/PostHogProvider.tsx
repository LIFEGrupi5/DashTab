'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { identifyUser, resetIdentity } from '@/lib/analytics';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    // Production: route through /ingest proxy (same-origin, bypasses ad blockers).
    // Development: connect directly — the Next.js dev server proxy causes ECONNRESET.
    api_host: process.env.NODE_ENV === 'production' ? '/ingest' : 'https://us.i.posthog.com',
    ui_host: 'https://us.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const url = window.location.origin + pathname + (search ? `?${search}` : '');
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

function UserIdentitySync() {
  const user = useAppStore(s => s.user);
  const hydrated = useStoreHydrated();

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      identifyUser(user);
    } else {
      resetIdentity();
    }
  }, [user, hydrated]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <UserIdentitySync />
      {children}
    </PHProvider>
  );
}
