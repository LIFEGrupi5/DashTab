import { apiPost } from './client';
import type { AuthSession } from './types';

export const login = (email: string, password: string) => apiPost<AuthSession>('/auth/login', {email, password});

export const refreshTokens = (refreshToken: string) => apiPost<AuthSession>('/auth/refresh', {refreshToken});

export const logoutApi = (refreshToken: string) => apiPost<void>('/auth/logout', {refreshToken});

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
