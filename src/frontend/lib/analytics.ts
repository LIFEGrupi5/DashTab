import posthog from 'posthog-js';

// --- Identity ---

export function identifyUser(user: { id: string; email: string; name: string; role: string }) {
  posthog.identify(user.id, { email: user.email, name: user.name, role: user.role });
}

export function resetIdentity() {
  posthog.reset();
}

// --- Typed event catalog ---

export const analytics = {
  // Auth
  userSignedIn(role: string) {
    posthog.capture('user_signed_in', { role });
  },
  userSignedOut() {
    posthog.capture('user_signed_out');
  },

  // Onboarding funnel
  restaurantRegistered(restaurantName: string) {
    posthog.capture('restaurant_registered', { restaurant_name: restaurantName });
  },
  subscriptionCheckoutStarted(plan: string, price: string) {
    posthog.capture('subscription_checkout_started', { plan, price });
  },

  // Orders
  orderCreated(props: { tableNumber: string; itemCount: number; totalAmount: number }) {
    posthog.capture('order_created', {
      table_number: props.tableNumber,
      item_count: props.itemCount,
      total_amount: props.totalAmount,
    });
  },
  orderStatusChanged(props: { orderId: string; toStatus: string }) {
    posthog.capture('order_status_changed', {
      order_id: props.orderId,
      to_status: props.toStatus,
    });
  },

  // Menu
  menuItemCreated(props: { category: string; price: number }) {
    posthog.capture('menu_item_created', { category: props.category, price: props.price });
  },
  categoryCreated(name: string) {
    posthog.capture('category_created', { name });
  },

  // Web Vitals
  webVital(name: string, value: number, rating: string) {
    posthog.capture('$web_vitals', { metric_name: name, value, rating });
  },
};
