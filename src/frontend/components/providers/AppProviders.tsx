'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(m => m.ReactQueryDevtools),
  { ssr: false }
);
import { useAuth } from '@/hooks/useAuth';
import { PostHogProvider } from '@/components/providers/PostHogProvider';

function DarkModeRoot() {
  const darkMode = useAppStore(s => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  return null;
}

function AuthQueryWarmup() {
  useAuth();
  return null;
}

// Drop ALL cached query data when the signed-in identity changes — i.e. on
// logout, or when switching to another account/restaurant. Without this the
// generically-keyed caches (orders.all, users.all, …) survive the switch, so the
// new session briefly shows the PREVIOUS tenant's data until its own fetch lands
// (a cross-tenant leak). Only fires when leaving a known user, so a fresh login
// or a same-user refresh doesn't needlessly wipe the cache.
function AuthCacheReset() {
  const queryClient = useQueryClient();
  const userId = useAppStore(s => s.user?.id);
  const prev = useRef(userId);
  useEffect(() => {
    if (prev.current && prev.current !== userId) {
      queryClient.clear();
    }
    prev.current = userId;
  }, [userId, queryClient]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      })
  );

  return (
    <PostHogProvider>
      <QueryClientProvider client={queryClient}>
        <DarkModeRoot />
        <AuthCacheReset />
        <AuthQueryWarmup />
        {children}
        {process.env.NODE_ENV === 'development' ? (
          <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </PostHogProvider>
  );
}
