'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchRestaurant, updateRestaurant } from '@/lib/api/restaurants';
import { fetchSubscription } from '@/lib/api/subscriptions';

export function useRestaurant() {
  return useQuery({ queryKey: ['restaurant', 'me'], queryFn: fetchRestaurant });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateRestaurant(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', 'me'] });
      toast.success('Restaurant details saved');
    },
    onError: () => toast.error('Could not save changes. Please try again.'),
  });
}

export function useSubscription() {
  return useQuery({ queryKey: ['subscription', 'me'], queryFn: fetchSubscription, retry: false });
}
