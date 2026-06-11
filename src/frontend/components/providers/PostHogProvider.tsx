'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { initAnalytics, identifyUser, resetIdentity, capturePageview } from '@/lib/analytics';

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const url = window.location.origin + pathname + (search ? `?${search}` : '');
    capturePageview(url);
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
  // Load posthog-js once the browser is idle so it stays off the critical
  // render path. Any pageview/identify fired before it resolves is buffered in
  // lib/analytics and flushed on load, so nothing is lost. Dropping the
  // posthog-js/react <PHProvider> too — nothing in the app uses usePostHog().
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => void initAnalytics());
    } else {
      const t = setTimeout(() => void initAnalytics(), 1);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <UserIdentitySync />
      {children}
    </>
  );
}
