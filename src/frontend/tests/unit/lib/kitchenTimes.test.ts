import { enrichOrderKitchenTimes, ensureOrderKitchenTimes } from '@/lib/orders/kitchenTimes';
import type { Order } from '@/lib/api/types';

const baseOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'o1',
  orderNumber: '001',
  tableNumber: 'T-1',
  createdAt: '12:00',
  createdByName: 'Olivia',
  status: 'new',
  totalAmount: 10,
  items: [],
  ...overrides,
});

const NOW = Date.UTC(2026, 5, 14, 12, 0, 0);
const FIVE_MIN_AGO = new Date(NOW - 5 * 60_000).toISOString();

describe('enrichOrderKitchenTimes', () => {
  it('fills missing timestamps with nowMs minus 5 minutes', () => {
    const out = enrichOrderKitchenTimes(baseOrder(), NOW);
    expect(out.placedAtIso).toBe(FIVE_MIN_AGO);
    expect(out.stageEnteredAtIso).toBe(FIVE_MIN_AGO);
  });

  it('keeps timestamps that are already present', () => {
    const out = enrichOrderKitchenTimes(baseOrder({ placedAtIso: '2026-06-14T11:00:00.000Z' }), NOW);
    expect(out.placedAtIso).toBe('2026-06-14T11:00:00.000Z');
  });

  it('does not mutate the input order', () => {
    const input = baseOrder();
    enrichOrderKitchenTimes(input, NOW);
    expect(input.placedAtIso).toBeUndefined();
  });
});

describe('ensureOrderKitchenTimes', () => {
  it('returns the same order untouched when both timestamps are present', () => {
    const o = baseOrder({ placedAtIso: 'a', stageEnteredAtIso: 'b' });
    expect(ensureOrderKitchenTimes(o, NOW)).toBe(o);
  });

  it('defaults stageEnteredAt to placedAt when only the stage time is missing', () => {
    const out = ensureOrderKitchenTimes(baseOrder({ placedAtIso: '2026-06-14T11:00:00.000Z' }), NOW);
    expect(out.stageEnteredAtIso).toBe('2026-06-14T11:00:00.000Z');
  });

  it('enriches both timestamps when placedAt is missing', () => {
    const out = ensureOrderKitchenTimes(baseOrder(), NOW);
    expect(out.placedAtIso).toBe(FIVE_MIN_AGO);
    expect(out.stageEnteredAtIso).toBe(FIVE_MIN_AGO);
  });
});
