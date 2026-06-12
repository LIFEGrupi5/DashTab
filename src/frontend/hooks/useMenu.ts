'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCategory, createMenuItem, deleteMenuItem, fetchCategories, fetchMenuItems, updateMenuItem } from '@/lib/api/menu';
import type { MenuCategory, MenuItem } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { analytics } from '@/lib/analytics';

export function useMenu() {
  return useQuery({ queryKey: queryKeys.menu.all, queryFn: () => fetchMenuItems() });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories.all, queryFn: fetchCategories });
}

type NewMenuItem = {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  available: boolean;
};

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: NewMenuItem) => createMenuItem(req),
    onSuccess: (item: MenuItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      toast.success(`${item.name} added to the menu`);
      analytics.menuItemCreated({ category: item.category, price: item.price });
    },
    onError: () => {
      toast.error('Failed to add item. Please try again.');
    },
  });
}

type UpdateMenuItem = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  description: string;
  available: boolean;
};

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateMenuItem) => updateMenuItem(id, req),
    onSuccess: (item: MenuItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      toast.success(`${item.name} updated`);
    },
    onError: () => {
      toast.error('Failed to update item. Please try again.');
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.all });
      toast.success('Item removed from menu');
    },
    onError: () => {
      toast.error('Failed to delete item. Please try again.');
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createCategory(name),
    // Optimistically add a placeholder chip immediately — the chip appears the
    // moment the user hits "Add Category" with no waiting for the server.
    onMutate: async (name: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previous = queryClient.getQueryData<MenuCategory[]>(queryKeys.categories.all);
      queryClient.setQueryData<MenuCategory[]>(queryKeys.categories.all, old => [
        ...(old ?? []),
        { id: `optimistic-${Date.now()}`, name, displayOrder: 0 },
      ]);
      return { previous };
    },
    // On success replace the placeholder with the real record from the server.
    onSuccess: (category: MenuCategory) => {
      queryClient.setQueryData<MenuCategory[]>(queryKeys.categories.all, old =>
        (old ?? []).map(c => (c.id.startsWith('optimistic-') ? category : c)),
      );
      toast.success(`Category "${category.name}" added`);
      analytics.categoryCreated(category.name);
    },
    // On error roll back the optimistic chip.
    onError: (_err, _name, ctx) => {
      queryClient.setQueryData(queryKeys.categories.all, ctx?.previous);
      toast.error('Failed to add category. Please try again.');
    },
  });
}
