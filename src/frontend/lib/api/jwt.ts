import type { AuthUser, Role } from "./types";

export function decodeJwt<T> (token: string): T {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as T;
}

export function claimsToAuthUser(claims: Record<string, unknown>) : AuthUser {
    const roles: string[] = (claims['realm_access'] as {roles: string[]})?.roles ?? [];
    const role = (roles[0] ?? 'waiter').toLowerCase() as Role;
    
    return {
        id: claims['sub'] as string,
        email: claims['email'] as string,
        name: (claims['name'] ?? claims['preferred_username'] ?? claims['email']) as string,
        role
    };
}