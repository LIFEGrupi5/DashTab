import type { PostHog } from 'posthog-js';

// posthog-js (~50KB+ gzipped) is loaded lazily off the critical render path —
// see initAnalytics() / PostHogProvider. Until it resolves, `client` is null and
// any capture/identify call is buffered in `pending` and flushed once it loads,
// so no early funnel events are lost.
let client: PostHog | null = null;
let initialised = false;
const pending: Array<(ph: PostHog) => void> = [];
const MAX_PENDING = 50;

function run(fn: (ph: PostHog) => void): void {
  if (client) {
    fn(client);
  } else if (pending.length < MAX_PENDING) {
    pending.push(fn);
  }
}

// Dynamically import and initialise posthog-js. Safe to call repeatedly — the
// actual load happens once. Resolves to a no-op when there is no window (SSR)
// or no key (e.g. CI without NEXT_PUBLIC_POSTHOG_KEY).
export async function initAnalytics(): Promise<void> {
  if (initialised) return;
  initialised = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (typeof window === 'undefined' || !key) {
    pending.length = 0; // analytics disabled — drop anything buffered
    return;
  }

  const { default: posthog } = await import('posthog-js');
  posthog.init(key, {
    // Production: route through /ingest proxy (same-origin, bypasses ad blockers).
    // Development: connect directly — the Next.js dev server proxy causes ECONNRESET.
    api_host: process.env.NODE_ENV === 'production' ? '/ingest' : 'https://us.i.posthog.com',
    ui_host: 'https://us.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
  client = posthog;
  for (const fn of pending) fn(posthog);
  pending.length = 0;
}

// --- Identity ---

export function identifyUser(user: { id: string; email: string; name: string; role: string }) {
  run(ph => ph.identify(user.id, { email: user.email, name: user.name, role: user.role }));
}

export function resetIdentity() {
  run(ph => ph.reset());
}

// --- Page views ---

export function capturePageview(url: string) {
  run(ph => ph.capture('$pageview', { $current_url: url }));
}

// --- Typed event catalog ---

export const analytics = {
  // Auth
  userSignedIn(role: string) {
    run(ph => ph.capture('user_signed_in', { role }));
  },
  userSignedOut() {
    run(ph => ph.capture('user_signed_out'));
  },

  // Onboarding funnel
  restaurantRegistered(restaurantName: string) {
    run(ph => ph.capture('restaurant_registered', { restaurant_name: restaurantName }));
  },
  subscriptionCheckoutStarted(plan: string, price: string) {
    run(ph => ph.capture('subscription_checkout_started', { plan, price }));
  },
  subscriptionCheckoutCompleted(plan: string, status: string) {
    run(ph => ph.capture('subscription_checkout_completed', { plan, status }));
  },

  // Orders
  orderCreated(props: { tableNumber: string; itemCount: number; totalAmount: number }) {
    run(ph =>
      ph.capture('order_created', {
        table_number: props.tableNumber,
        item_count: props.itemCount,
        total_amount: props.totalAmount,
      }),
    );
  },
  orderStatusChanged(props: { orderId: string; toStatus: string }) {
    run(ph =>
      ph.capture('order_status_changed', {
        order_id: props.orderId,
        to_status: props.toStatus,
      }),
    );
  },

  // ── North Star Metric ─────────────────────────────────────────────────────
  // NSM: completed orders per restaurant per 7-day rolling window.
  // Fired in addition to order_status_changed so PostHog insights can use
  // this single event without filter conditions. See lib/northStarMetric.ts.
  nsmOrderCompleted(props: { orderId: string; totalAmount: number; itemCount: number }) {
    run(ph =>
      ph.capture('nsm_order_completed', {
        order_id: props.orderId,
        total_amount: props.totalAmount,
        item_count: props.itemCount,
      }),
    );
  },

  // Staff
  staffInvited(role: string) {
    run(ph => ph.capture('staff_invited', { role }));
  },

  // Menu
  menuItemCreated(props: { category: string; price: number }) {
    run(ph => ph.capture('menu_item_created', { category: props.category, price: props.price }));
  },
  categoryCreated(name: string) {
    run(ph => ph.capture('category_created', { name }));
  },

  // Web Vitals
  webVital(name: string, value: number, rating: string) {
    run(ph => ph.capture('$web_vitals', { metric_name: name, value, rating }));
  },
};
