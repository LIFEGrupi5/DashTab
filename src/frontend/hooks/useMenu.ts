'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMenuItem, fetchCategories, fetchMenuItems } from '@/lib/api/menu';
import type { MenuItem } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

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
    },
    onError: () => {
      toast.error('Failed to add item. Please try again.');
    },
  });
}
