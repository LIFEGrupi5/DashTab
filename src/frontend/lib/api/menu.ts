import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type { MenuCategory, MenuItem } from './types';

export const fetchMenuItems = (params?: { categoryId?: string; search?: string; available?: boolean }) => {
  const q = new URLSearchParams();
  if (params?.categoryId) q.set('categoryId', params.categoryId);
  if (params?.search) q.set('search', params.search);
  if (params?.available !== undefined) q.set('available', String(params.available));
  const qs = q.toString();
  return apiGet<MenuItem[]>(qs ? `/menu-items?${qs}` : '/menu-items');
};

export const createMenuItem = (req: Omit<MenuItem, 'id' | 'category'> & { categoryId: string }) =>
  apiPost<MenuItem>('/menu-items', req);

export const updateMenuItem = (
  id: string,
  req: Omit<MenuItem, 'id' | 'category'> & { categoryId: string },
) => apiPut<MenuItem>(`/menu-items/${id}`, req);

export const toggleMenuItemAvailability = (id: string, available: boolean) =>
  apiPatch<MenuItem>(`/menu-items/${id}/availability`, { available });

export const deleteMenuItem = (id: string) => apiDelete(`/menu-items/${id}`);

export const fetchCategories = () => apiGet<MenuCategory[]>('/menu-categories');

export const createCategory = (name: string, displayOrder = 0) =>
  apiPost<MenuCategory>('/menu-categories', { name, displayOrder });

export const updateCategory = (id: string, name: string, displayOrder: number) =>
  apiPut<MenuCategory>(`/menu-categories/${id}`, { name, displayOrder });

export const deleteCategory = (id: string) => apiDelete(`/menu-categories/${id}`);
