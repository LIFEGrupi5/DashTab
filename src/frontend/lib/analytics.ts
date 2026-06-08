import posthog from 'posthog-js';

// No-op when PostHog has not been initialised (e.g. NEXT_PUBLIC_POSTHOG_KEY not set in CI).
function ready(): boolean {
  return typeof window !== 'undefined' && posthog.__loaded === true;
}

// --- Identity ---

export function identifyUser(user: { id: string; email: string; name: string; role: string }) {
  if (!ready()) return;
  posthog.identify(user.id, { email: user.email, name: user.name, role: user.role });
}

export function resetIdentity() {
  if (!ready()) return;
  posthog.reset();
}

// --- Typed event catalog ---

export const analytics = {
  // Auth
  userSignedIn(role: string) {
    if (!ready()) return;
    posthog.capture('user_signed_in', { role });
  },
  userSignedOut() {
    if (!ready()) return;
    posthog.capture('user_signed_out');
  },

  // Onboarding funnel
  restaurantRegistered(restaurantName: string) {
    if (!ready()) return;
    posthog.capture('restaurant_registered', { restaurant_name: restaurantName });
  },
  subscriptionCheckoutStarted(plan: string, price: string) {
    if (!ready()) return;
    posthog.capture('subscription_checkout_started', { plan, price });
  },
  subscriptionCheckoutCompleted(plan: string, status: string) {
    if (!ready()) return;
    posthog.capture('subscription_checkout_completed', { plan, status });
  },

  // Orders
  orderCreated(props: { tableNumber: string; itemCount: number; totalAmount: number }) {
    if (!ready()) return;
    posthog.capture('order_created', {
      table_number: props.tableNumber,
      item_count: props.itemCount,
      total_amount: props.totalAmount,
    });
  },
  orderStatusChanged(props: { orderId: string; toStatus: string }) {
    if (!ready()) return;
    posthog.capture('order_status_changed', {
      order_id: props.orderId,
      to_status: props.toStatus,
    });
  },

  // Menu
  menuItemCreated(props: { category: string; price: number }) {
    if (!ready()) return;
    posthog.capture('menu_item_created', { category: props.category, price: props.price });
  },
  categoryCreated(name: string) {
    if (!ready()) return;
    posthog.capture('category_created', { name });
  },

  // Web Vitals
  webVital(name: string, value: number, rating: string) {
    if (!ready()) return;
    posthog.capture('$web_vitals', { metric_name: name, value, rating });
  },
};
