'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createShift, deleteShift, fetchShiftRequests,
  fetchShifts, publishWeek, reviewShiftRequest,
  submitShiftRequest, updateShift,
} from '@/lib/api/schedule';
import { queryKeys } from '@/lib/queryKeys';

// ── Shifts ────────────────────────────────────────────────────────────────────

export function useWeekShifts(weekStart: string) {
  return useQuery({
    queryKey: queryKeys.schedule.shifts(weekStart),
    queryFn: () => fetchShifts(weekStart),
    enabled: !!weekStart,
  });
}

export function useCreateShift(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createShift,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedule.shifts(weekStart) }),
  });
}

export function useUpdateShift(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; startTime: string; endTime: string; isDayOff?: boolean }) =>
      updateShift(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedule.shifts(weekStart) }),
  });
}

export function useDeleteShift(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteShift,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedule.shifts(weekStart) }),
  });
}

export function usePublishWeek(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishWeek(weekStart),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedule.shifts(weekStart) }),
  });
}

// ── Requests ──────────────────────────────────────────────────────────────────

export function useShiftRequests() {
  return useQuery({
    queryKey: queryKeys.schedule.requests,
    queryFn: fetchShiftRequests,
  });
}

export function useSubmitShiftRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitShiftRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedule.requests }),
  });
}

export function useReviewShiftRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; decision: string; managerNote?: string }) =>
      reviewShiftRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedule.requests }),
  });
}
