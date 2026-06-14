# A/B Test: Pricing Page Plan Highlight

## Overview

| Field | Value |
|-------|-------|
| Milestone | M6.4 |
| Owner | Product Lead (Jeta) |
| Feature flag | `pricing-highlight-variant` |
| Status | Ready to launch |
| Start date | TBD |

---

## Hypothesis

**Stating the assumption being tested:**

The current pricing page highlights the Pro plan with a "Most Popular" badge and a stronger card border. We assume this social proof anchors users toward Pro and increases overall click-through on any "Get started" CTA.

The counter-hypothesis: the badge creates implicit pressure, making users feel they are being steered rather than choosing freely. Removing it may reduce decision friction and increase total CTA clicks — even if the plan distribution shifts.

> **If we remove the "Most Popular" highlight from the Pro plan, the total rate of users clicking any "Get started" CTA will increase by ≥ 25% relative to the control, because users are no longer anchored to a single plan and self-select more confidently.**

---

## Variants

| Variant key | Description | Change |
|-------------|-------------|--------|
| `control` | Pro plan highlighted — "Most Popular" badge, stronger border, white CTA button | Current state (baseline) |
| `no-highlight` | All three plans shown identically — no badge, same border, same CTA button style on all cards | Remove social proof anchoring |

Rollout: **50 / 50** random split on anonymous distinct ID.

---

## Metrics

### Primary
| Metric | Type | Event | Goal |
|--------|------|-------|------|
| Pricing CTA click rate | Funnel | `pricing_cta_clicked` | Variant CTR statistically significantly higher than control |

Properties captured on `pricing_cta_clicked`:
- `plan` — which plan the user clicked (basic / pro / enterprise)
- `experiment_variant` — which variant they were in (for manual cross-checks)

### Secondary
| Metric | Type | Event | Purpose |
|--------|------|-------|---------|
| Checkout started | Funnel | `subscription_checkout_started` | Did the click lead to actual Stripe intent? |
| Plan distribution | Breakdown | `pricing_cta_clicked` by `plan` | Did the variant shift users toward cheaper or more expensive plans? |

### Guardrail
| Metric | Threshold | Reason |
|--------|-----------|--------|
| Pro plan click share | Must not drop > 30% relative | Avoid cannibalising our most valuable plan |

---

## Sample Size Calculation

**Inputs:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Baseline CTR (p₁) | 8% | Estimated pricing page → CTA click rate |
| Minimum detectable effect | 25% relative | Smallest improvement worth acting on |
| Target CTR (p₂) | 10% | p₁ × 1.25 |
| Significance level (α) | 0.05 | Two-tailed, industry standard |
| Statistical power (1 − β) | 80% | Standard for product experiments |

**Formula (two-proportion z-test):**

```
n = (z_α/2 + z_β)² × (p₁(1 − p₁) + p₂(1 − p₂)) / (p₁ − p₂)²

z_α/2 = 1.96   (α = 0.05, two-tailed)
z_β   = 0.84   (power = 80%)

n = (1.96 + 0.84)² × (0.08 × 0.92 + 0.10 × 0.90) / (0.10 − 0.08)²
  = (2.80)²    × (0.0736 + 0.0900)                / (0.02)²
  = 7.84       × 0.1636                            / 0.0004
  ≈ 3,206 per variant
  ≈ 6,412 total unique visitors
```

**Estimated duration:**

| Weekly pricing page visitors | Duration to significance |
|------------------------------|--------------------------|
| 250 | ~26 weeks |
| 500 | ~13 weeks |
| 1,000 | ~7 weeks |

> If traffic is below 250/week, consider raising the MDE to 40% (reduces required n to ~1,150 per variant) and accepting a wider confidence interval.

---

## Success Criteria

The experiment is a **win for the variant** if, at ≥ 95% posterior probability (PostHog Bayesian):

1. `pricing_cta_clicked` rate in `no-highlight` > `control`, AND
2. `subscription_checkout_started` rate in `no-highlight` is not statistically significantly lower than `control` (no downstream harm), AND
3. Pro plan click share does not drop more than 30% relative.

The experiment is a **win for the control** if:

1. `pricing_cta_clicked` rate in `control` > `no-highlight` at ≥ 95% confidence.

The experiment is **inconclusive** if neither variant reaches significance by the end of the planned run. In that case: ship the control (no change), document, revisit with higher-traffic growth.

---

## Instrumentation

### Feature flag
- **Key:** `pricing-highlight-variant`
- **Evaluated by:** `useFeatureFlag('pricing-highlight-variant')` in `PricingCards.tsx`
- **Exposure tracking:** automatic via PostHog `getFeatureFlag()` → `$feature_flag_called` event

### Event firing
- `pricing_cta_clicked` fires on every "Get started" click in `PricingCards.tsx`
  - `plan`: which plan card was clicked
  - `experiment_variant`: variant at time of click (for manual verification)

### Files
| File | Role |
|------|------|
| `src/frontend/lib/experiment.ts` | `useFeatureFlag` hook |
| `src/frontend/app/(marketing)/pricing/_components/PricingCards.tsx` | Renders variant UI, fires click event |
| `src/frontend/lib/analytics.ts` | `analytics.pricingCtaClicked()` |

---

## PostHog Setup

1. **Experiments → New experiment**
   - Name: `Pricing page — plan highlight`
   - Flag key: `pricing-highlight-variant`
   - Variants: `control` 50% / `no-highlight` 50%

2. **Primary metric**
   - Type: Funnel
   - Name: `Pricing CTA clicked`
   - Step 1: `pricing_cta_clicked`

3. **Secondary metric**
   - Type: Funnel
   - Name: `Checkout started`
   - Step 1: `subscription_checkout_started`

4. **Minimum acceptable improvement:** 25%

5. Launch — PostHog handles anonymous bucketing and profile merge on sign-up automatically.

---

## Decision Framework

```
Experiment ends (significance reached or run duration elapsed)
         │
         ├── Variant wins on primary + no guardrail breach
         │     → Ship no-highlight, update plans.ts (remove highlight: true)
         │
         ├── Control wins on primary
         │     → Keep current design, consider stronger highlight treatment
         │
         ├── Inconclusive
         │     → Keep control, document null result, revisit at higher traffic
         │
         └── Variant wins on clicks but loses on checkout
               → Deeper investigation: which plan shift is causing drop?
                 Possibly highlight Enterprise instead of Pro as follow-up test.
```
