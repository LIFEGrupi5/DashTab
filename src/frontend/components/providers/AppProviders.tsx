'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(m => m.ReactQueryDevtools),
  { ssr: false }
);
import { useAuth } from '@/hooks/useAuth';

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

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeRoot />
      <AuthQueryWarmup />
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
