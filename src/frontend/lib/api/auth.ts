import { apiGet, apiPost } from './client';
import type { AuthSession, AuthUser } from './types';

export const login = (email: string) => apiPost<AuthSession>('/auth/login', { email });

export const fetchMe = () => apiGet<AuthUser>('/auth/me');
