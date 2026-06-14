import { useEffect } from 'react';
import { useRestaurant, useSubscription } from '@/hooks/useRestaurant';
import { identifyRestaurant } from '@/lib/analytics';

/**
 * Fires posthog.group() once restaurant + subscription data are loaded.
 * This enables per-restaurant breakdown of the NSM and other PostHog insights.
 * Called from the dashboard layout so it runs on every authenticated page load.
 */
export function useRestaurantIdentity() {
  const { data: restaurant } = useRestaurant();
  const { data: subscription } = useSubscription();

  useEffect(() => {
    if (!restaurant || !subscription) return;
    identifyRestaurant(restaurant.id, {
      name: restaurant.name,
      plan: subscription.plan,
    });
  }, [restaurant?.id, subscription?.plan]);
}
