import { queryKeys } from '@/lib/queryKeys';

describe('queryKeys', () => {
  it('exposes static collection keys', () => {
    expect(queryKeys.orders.all).toEqual(['orders']);
    expect(queryKeys.menu.all).toEqual(['menu']);
    expect(queryKeys.categories.all).toEqual(['categories']);
    expect(queryKeys.users.all).toEqual(['users']);
  });

  it('builds the auth.me key from a token, and from null on logout', () => {
    expect(queryKeys.auth.me('abc')).toEqual(['auth', 'me', 'abc']);
    expect(queryKeys.auth.me(null)).toEqual(['auth', 'me', null]);
  });

  it('builds schedule keys parameterised by week', () => {
    expect(queryKeys.schedule.shifts('2026-06-08')).toEqual(['schedule', 'shifts', '2026-06-08']);
    expect(queryKeys.schedule.requests).toEqual(['schedule', 'requests']);
  });
});
