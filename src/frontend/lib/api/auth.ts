import { apiPost } from './client';
import type { AuthUser } from './types';

// login now returns the user object — tokens are in httpOnly cookies, never in JS.
export const login = (email: string, password: string) =>
  apiPost<AuthUser>('/auth/login', { email, password });

// logout sends no body — the refresh_token rides the cookie.
export const logoutApi = () => apiPost<void>('/auth/logout', {});

export type RegisterRestaurantPayload = {
  restaurantName: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPassword: string;
};

export type RegisterRestaurantResult = {
  restaurantId: string;
  restaurantName: string;
  slug: string;
};

export const registerRestaurant = (payload: RegisterRestaurantPayload) =>
  apiPost<RegisterRestaurantResult>('/restaurants/register', payload);
