import { apiGet, apiPut } from './client';

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export const fetchRestaurant = () => apiGet<Restaurant>('/restaurants/me');

export const updateRestaurant = (name: string) =>
  apiPut<Restaurant>('/restaurants/me', { name });
