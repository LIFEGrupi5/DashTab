'use client';

import dynamic from 'next/dynamic';

const KitchenBoard = dynamic(() => import('@/components/KitchenBoard'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full min-h-0 bg-neutral-100 dark:bg-background animate-pulse">
      <div className="h-20 border-b border-neutral-200 dark:border-border bg-white dark:bg-card" />
      <div className="flex-1 p-4 w-full max-w-6xl">
        <div className="flex flex-wrap gap-3">
          <div className="w-80 max-w-full shrink-0 min-h-[150px] h-40 rounded-xl bg-neutral-200/70 dark:bg-muted/40" />
          <div className="w-80 max-w-full shrink-0 min-h-[150px] h-40 rounded-xl bg-neutral-200/70 dark:bg-muted/40" />
          <div className="w-80 max-w-full shrink-0 min-h-[150px] h-40 rounded-xl bg-neutral-200/70 dark:bg-muted/40" />
        </div>
      </div>
    </div>
  ),
});

export default KitchenBoard;
