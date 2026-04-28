'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChefHat, Clock3, LogOut, Moon, Sun } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useSetOrderStatus } from '@/hooks/useSetOrderStatus';
import { useAppStore } from '@/stores/useAppStore';
import type { Order, OrderStatus } from '@/lib/api/mock';

/** Fixed width for flex row + wrap (20rem); no grow so row fills then wraps. */
const KITCHEN_CARD_WRAP = 'w-full min-h-[150px]';

const KITCHEN_STATUSES: OrderStatus[] = ['new', 'preparing', 'ready'];

/** Red bell when the order has been waiting at least this long since `placedAtIso`. */
const KITCHEN_OVERDUE_PLACED_MS = 30 * 60_000;

/** Relative “ago” copy: minutes under 1h, then `Hh Mmin ago`. */
function formatRelativeAgo(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  if (totalMin < 60) {
    if (totalMin === 1) return '1 min ago';
    return `${totalMin} mins ago`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}min ago`;
}

function orderWaitExceedsKitchenSla(order: Order, nowMs: number): boolean {
  const placed = order.placedAtIso;
  if (!placed) return false;
  const t = new Date(placed).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t >= KITCHEN_OVERDUE_PLACED_MS;
}

function headlineDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function headlineClock() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const SECTION_META = [
  {
    status: 'new' as const,
    title: 'New Orders',
    Icon: Clock3,
    cardBorder: 'border-blue-300 dark:border-blue-700/70',
    tableBox:
      'bg-blue-50/90 dark:bg-blue-950/35 border border-blue-200/90 dark:border-blue-800/60 text-neutral-900 dark:text-foreground',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500',
    actionLabel: 'Tap to Start Preparing',
    next: 'preparing' as const,
  },
  {
    status: 'preparing' as const,
    title: 'Preparing',
    Icon: ChefHat,
    cardBorder: 'border-amber-300 dark:border-amber-700/60',
    tableBox:
      'bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 text-neutral-900 dark:text-foreground',
    actionClass: 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-500',
    actionLabel: 'Tap to Mark Ready',
    next: 'ready' as const,
  },
  {
    status: 'ready' as const,
    title: 'Ready for Pickup',
    Icon: CheckCircle2,
    cardBorder: 'border-green-300 dark:border-green-700/60',
    tableBox:
      'bg-green-50/90 dark:bg-green-950/30 border border-green-200/90 dark:border-green-800/50 text-neutral-900 dark:text-foreground',
    actionClass: 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-500',
    actionLabel: 'Tap to Complete',
    next: 'completed' as const,
  },
];

export default function KitchenBoard() {
  const { data: orders = [], isLoading } = useOrders();
  const setStatus = useSetOrderStatus();
  const user = useAppStore(s => s.user);
  const darkMode = useAppStore(s => s.darkMode);
  const setDarkMode = useAppStore(s => s.setDarkMode);
  const clearAuth = useAppStore(s => s.clearAuth);
  const isKitchenStaff = user?.role === 'kitchen';

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(
    () => orders.filter(o => KITCHEN_STATUSES.includes(o.status)),
    [orders]
  );

  const counts = useMemo(() => {
    const n = (s: OrderStatus) => visible.filter(o => o.status === s).length;
    return { new: n('new'), preparing: n('preparing'), ready: n('ready') };
  }, [visible]);

  const byStatus = (s: OrderStatus) => visible.filter(o => o.status === s);

  const onAdvance = (orderId: string, next: OrderStatus) => {
    if (!isKitchenStaff) return;
    setStatus(orderId, next);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-100 dark:bg-background text-neutral-900 dark:text-foreground">
      <header className="shrink-0 border-b border-neutral-200 dark:border-border bg-white dark:bg-card px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full w-[95%] mx-auto">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-sm">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Kitchen Display Board</h1>
              <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-0.5">
                {headlineDate()} • {headlineClock()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200 px-2.5 py-1 border border-blue-100 dark:border-blue-900/50">
                <span className="text-blue-600 dark:text-blue-300">{counts.new}</span> NEW
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/35 text-amber-800 dark:text-amber-200 px-2.5 py-1 border border-amber-100 dark:border-amber-900/45">
                <span className="text-amber-600 dark:text-amber-300">{counts.preparing}</span> PREPARING
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/35 text-green-800 dark:text-green-200 px-2.5 py-1 border border-green-100 dark:border-green-900/50">
                <span className="text-green-600 dark:text-green-300">{counts.ready}</span> READY
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-secondary px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-muted/30 transition"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {darkMode ? 'Light' : 'Dark'}
              </button>
              {isKitchenStaff ? (
                <Link
                  href="/login"
                  onClick={() => clearAuth()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-foreground hover:bg-neutral-50 dark:hover:bg-muted/25 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="w-[95%] mx-auto">
          {!isKitchenStaff ? (
            <p className="text-left text-xs text-neutral-500 dark:text-muted-foreground mb-4">
              Read-only view. Stage changes are available when signed in as kitchen staff.
            </p>
          ) : null}

          {isLoading ? (
            <div className="grid grid-cols-3 gap-4 animate-pulse">
              <div className="h-40 rounded-xl bg-neutral-200/80 dark:bg-muted/40" />
              <div className="h-40 rounded-xl bg-neutral-200/80 dark:bg-muted/40" />
              <div className="h-40 rounded-xl bg-neutral-200/80 dark:bg-muted/40" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {SECTION_META.map(section => {
                const list = byStatus(section.status);
                const Icon = section.Icon;
                return (
                  <div key={section.status} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 shrink-0 text-neutral-600 dark:text-muted-foreground" />
                      <h2 className="text-sm font-bold text-neutral-800 dark:text-foreground">
                        {section.title}{' '}
                        <span className="font-semibold text-neutral-500 dark:text-muted-foreground">
                          ({list.length})
                        </span>
                      </h2>
                    </div>

                    {list.length === 0 ? (
                      <p className="min-h-[120px] text-sm text-neutral-500 dark:text-muted-foreground py-8 text-left rounded-xl border border-dashed border-neutral-200 dark:border-border bg-white/60 dark:bg-card/40 px-4 flex items-center">
                        No orders in this stage
                      </p>
                    ) : (
                      list.map(order => (
                        <KitchenOrderCard
                          key={order.id}
                          order={order}
                          section={section}
                          interactive={isKitchenStaff}
                          onAdvance={() => onAdvance(order.id, section.next)}
                          now={now}
                        />
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KitchenOrderTiming({ order, now }: { order: Order; now: number }) {
  const placedAt = order.placedAtIso;
  if (!placedAt) return null;

  const placedMs = new Date(placedAt).getTime();
  const waitMs = Math.max(0, now - placedMs);

  const orderedTime = new Date(placedAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="mt-1.5 flex w-full min-w-0 flex-col items-end gap-0.5 text-right leading-snug tabular-nums">
      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{formatRelativeAgo(waitMs)}</p>
      <p className="text-[10px] sm:text-[11px] font-normal text-neutral-500 dark:text-muted-foreground">{orderedTime}</p>
    </div>
  );
}

function KitchenOrderCard({
  order,
  section,
  interactive,
  onAdvance,
  now,
}: {
  order: Order;
  section: (typeof SECTION_META)[number];
  interactive: boolean;
  onAdvance: () => void;
  now: number;
}) {
  const showOverdueBell = useMemo(
    () => orderWaitExceedsKitchenSla(order, now),
    [order, now]
  );

  return (
    <div className={KITCHEN_CARD_WRAP}>
      <div
        onClick={interactive ? onAdvance : undefined}
        className={`h-full rounded-xl bg-white dark:bg-card p-3 sm:p-4 border-2 ${section.cardBorder} shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)] flex flex-col ${interactive ? 'cursor-pointer hover:brightness-[0.97] active:scale-[0.99] transition-transform' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`shrink-0 rounded-lg px-3 py-2 min-h-[3.5rem] min-w-[4.25rem] flex items-center justify-center ${section.tableBox}`}
          >
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none">
              {order.tableNumber}
            </span>
          </div>

          <div className="min-w-0 flex-1 text-right">
            <div className="inline-flex max-w-full min-w-0 flex-col items-end gap-0.5">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-neutral-900 dark:text-foreground">
                  Order #{order.orderNumber}
                </span>
                {showOverdueBell ? (
                  <Bell
                    className="w-4 h-4 text-red-500 shrink-0"
                    fill="currentColor"
                    aria-label="Order waiting over 30 minutes"
                  />
                ) : null}
              </div>
              <span className="text-sm text-neutral-600 dark:text-muted-foreground">{order.createdByName}</span>
              <KitchenOrderTiming order={order} now={now} />
            </div>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 flex-1">
          {order.items.map((item, i) => (
            <li
              key={`${order.id}-${i}-${item.menuItemName}`}
              className="w-full rounded-md bg-neutral-100 dark:bg-muted/35 border border-neutral-200/90 dark:border-border px-2.5 py-2 text-xs font-semibold text-neutral-800 dark:text-foreground"
            >
              {item.quantity} {item.menuItemName}
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
