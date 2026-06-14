import { decodeJwt, claimsToAuthUser } from '@/lib/api/jwt';

// Build an unsigned JWT (header.payload.signature) whose payload is base64url-encoded,
// matching what decodeJwt expects to parse.
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${b64}.signature`;
}

describe('decodeJwt', () => {
  it('decodes the base64url payload segment', () => {
    const token = makeJwt({ sub: '123', email: 'a@b.com' });
    expect(decodeJwt<{ sub: string; email: string }>(token)).toEqual({ sub: '123', email: 'a@b.com' });
  });
});

describe('claimsToAuthUser', () => {
  it('maps sub/email/name and the first realm role (lowercased)', () => {
    const user = claimsToAuthUser({
      sub: 'u1',
      email: 'owner@x.com',
      name: 'Olivia',
      realm_access: { roles: ['Owner'] },
    });
    expect(user).toEqual({ id: 'u1', email: 'owner@x.com', name: 'Olivia', role: 'owner' });
  });

  it('defaults role to waiter when there are no realm roles', () => {
    expect(claimsToAuthUser({ sub: 'u2', email: 'e@x.com', name: 'E' }).role).toBe('waiter');
    expect(claimsToAuthUser({ sub: 'u3', email: 'e@x.com', name: 'E', realm_access: { roles: [] } }).role).toBe('waiter');
  });

  it('falls back name to preferred_username, then email', () => {
    expect(claimsToAuthUser({ sub: '1', email: 'e@x.com', preferred_username: 'puser' }).name).toBe('puser');
    expect(claimsToAuthUser({ sub: '1', email: 'e@x.com' }).name).toBe('e@x.com');
  });
});
