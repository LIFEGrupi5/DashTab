'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from '@/lib/api/analytics';

export function useForecast() {
  return useQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: fetchForecast,
    staleTime: 1000 * 60 * 30, // forecast changes slowly; refresh every 30 min
    retry: false,
  });
}
