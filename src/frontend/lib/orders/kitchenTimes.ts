import type { Order } from '@/lib/api/types';

export function enrichOrderKitchenTimes(o: Order, nowMs: number): Order {
  return {
    ...o,
    placedAtIso: o.placedAtIso ?? new Date(nowMs - 5 * 60_000).toISOString(),
    stageEnteredAtIso: o.stageEnteredAtIso ?? new Date(nowMs - 5 * 60_000).toISOString(),
  };
}

export function ensureOrderKitchenTimes(o: Order, nowMs: number = Date.now()): Order {
  if (o.placedAtIso && o.stageEnteredAtIso) return o;
  if (!o.placedAtIso) return enrichOrderKitchenTimes(o, nowMs);
  return { ...o, stageEnteredAtIso: o.stageEnteredAtIso ?? o.placedAtIso };
}
