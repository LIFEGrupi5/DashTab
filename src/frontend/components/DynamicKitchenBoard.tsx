'use client'

import dynamic from 'next/dynamic'

const KitchenBoard = dynamic(() => import('@/components/KitchenBoard'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-neutral-50 dark:bg-card rounded-xl border border-neutral-200 dark:border-border h-64 animate-pulse"
        />
      ))}
    </div>
  ),
})

export default KitchenBoard
