/**
 * DashTab North Star Metric
 * ─────────────────────────
 * NSM: Completed orders per restaurant per 7-day rolling window
 *
 * ── Definition ───────────────────────────────────────────────────────────────
 * A single order reaches "completed" when a waiter marks it delivered to the
 * customer. This is the terminal state: food left the kitchen, money was owed.
 * We count distinct completed orders (not items, not revenue) because it
 * normalises across menu price differences and table sizes.
 *
 * PostHog event:  nsm_order_completed
 * PostHog insight: Trends → count of nsm_order_completed, rolling 7 days,
 *                  broken down by restaurant_id (group analytics).
 *
 * ── Why this metric, not another ─────────────────────────────────────────────
 * Candidate              Rejected reason
 * ─────────────────────────────────────────────────────────────────────────────
 * Revenue (€)            Varies by menu price; a cheap-menu restaurant doing
 *                        100 orders/week looks worse than an expensive one doing
 *                        30, even though it's driving more product engagement.
 *
 * Active users (DAU)     A waiter who logs in but takes no orders adds noise.
 *                        Presence ≠ value delivered.
 *
 * Orders created         Includes orders that were later cancelled or stalled
 *                        in kitchen. Creation is intent, not delivery.
 *
 * Sessions / pageviews   Engagement proxy, not outcome. Tells us nothing about
 *                        whether the restaurant is actually running.
 *
 * Completed orders       ✓ Directly measures value delivered to end customers.
 *                        ✓ Correlates with every product pillar: menu richness
 *                          (more items → higher order frequency), order
 *                          management (faster creation), KDS (faster kitchen
 *                          throughput), staff (more hands → more orders served).
 *                        ✓ Flat, actionable: any feature that does NOT improve
 *                          this number is a candidate for cutting.
 *
 * ── Instrumentation ──────────────────────────────────────────────────────────
 * Fired from:  hooks/useSetOrderStatus.ts → analytics.nsmOrderCompleted()
 * Defined in:  lib/analytics.ts → analytics.nsmOrderCompleted()
 *
 * Properties captured per event:
 *   order_id     – idempotency key (dedup in PostHog if needed)
 *   total_amount – revenue attached to this completion (for revenue correlation)
 *   item_count   – number of line items (for menu engagement correlation)
 *
 * ── Targets (to be reviewed monthly) ─────────────────────────────────────────
 * Baseline (launch):     ≥ 50 completed orders / restaurant / week
 * Growth target (M+3):   ≥ 100 completed orders / restaurant / week
 * Retention signal:      Any restaurant below 20 completed orders / week for
 *                        two consecutive weeks → trigger churn-risk alert.
 *
 * ── PostHog setup instructions ───────────────────────────────────────────────
 * 1. Insights → New Insight → Trends
 *    Event: nsm_order_completed   Aggregation: Total count
 *    Date range: Rolling 7 days   Interval: Day
 *
 * 2. Group analytics (restaurant-level):
 *    Enable Groups in PostHog project settings.
 *    Identify restaurant group when the owner logs in:
 *      posthog.group('restaurant', restaurantId, { plan, name })
 *    Then break down the NSM insight by group property "restaurant".
 *
 * 3. Dashboards → Stakeholder KPIs → add the NSM insight as the top card.
 */

export const NSM = {
  eventName: 'nsm_order_completed' as const,
  label: 'Completed orders / restaurant / week',
  baselineTarget: 50,
  growthTarget: 100,
  churnRiskThreshold: 20,
} as const;
