# DashTab — Product Definition

**Rubric:** PM-1 (Product Definition) · M1.1 · Team: Group 5

---

## Problem statement

Independent restaurants run on a patchwork of disconnected tools — a legacy POS, paper tickets to the kitchen, a spreadsheet for staff rotas, a separate card terminal, and no real analytics. Orders get lost between the floor and the kitchen, owners can't see performance until the month closes, and onboarding a new venue means re-buying and re-wiring everything. There is no single, affordable, modern operating system that covers the whole front-to-back-of-house flow for a small multi-location group.

## Target users

| Persona | Role | Core need |
|---|---|---|
| **Owner** | Runs one or more restaurants | Revenue/performance visibility, staffing control, low setup cost, multi-location |
| **Manager** | Runs a shift / venue | Build rotas, manage menu & staff, approve time-off, see live operations |
| **Waiter** | Floor staff | Take orders fast, see their own schedule, request swaps/days off |
| **Kitchen staff** | Back of house | A real-time kitchen display of what to cook next, in order |
| **Diner** *(secondary)* | Restaurant customer | Browse the menu and get an AI recommendation via a QR code at the table |

## Jobs-to-be-Done

- *When a diner orders,* the restaurant wants the order to reach the kitchen instantly and accurately, **so that** food goes out fast and correct.
- *When the dinner rush hits,* the kitchen wants to see the queue in priority order, **so that** nothing is missed.
- *When a manager plans the week,* they want to build and publish a rota and handle swap/rest-day requests in one place, **so that** the floor is always covered.
- *When an owner checks in,* they want live revenue, order, and staffing metrics plus a forward forecast, **so that** they can act before the month ends.
- *When a new venue joins,* the owner wants to self-onboard and pay by subscription in minutes, **so that** there's no integration project.
- *When a diner is undecided,* they want a recommendation matched to their craving, **so that** they order something they'll enjoy.

## Competitive landscape

| Competitor | Strength | Gap DashTab exploits |
|---|---|---|
| **Toast / Square for Restaurants** | Mature POS + hardware | Expensive, hardware-locked, US-centric; weak multi-tenant self-serve onboarding |
| **Lightspeed** | Strong inventory/analytics | Heavy, costly for small venues; no AI layer |
| **Paper + spreadsheets** | Free, familiar | No real-time kitchen, no analytics, no scale |
| **Generic POS apps** | Cheap | No kitchen display, no scheduling, no AI, single-tenant |

**DashTab's wedge:** a single, cloud-native, multi-tenant SaaS that bundles POS + real-time KDS + staff scheduling + analytics + subscription onboarding + an **AI menu recommendation** — at a subscription price a small group can afford, with no hardware lock-in.

## Hypothesis-driven framing

> **We believe** small multi-location restaurant groups **will** adopt a single subscription SaaS that unifies orders, kitchen, staff, and analytics **because** their current tool sprawl loses orders and hides performance. **We'll know we're right when** trial→paid conversion exceeds 15% and active KDS usage (the North Star Metric) grows week over week.

## What's in / out (MVP boundary)

**In:** multi-tenant auth & onboarding, menu management, order taking, real-time KDS, staff management + scheduling, analytics dashboard + forecast, Stripe subscriptions, AI menu recommendation.
**Out (for now):** inventory/stock control, table-reservation system, native mobile apps, payment-terminal hardware integration, loyalty programs.
