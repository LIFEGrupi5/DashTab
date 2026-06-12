import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type { ShiftRequest, WorkShift } from './types';

// ── Shifts ────────────────────────────────────────────────────────────────────

export const fetchShifts = (weekStart: string) =>
  apiGet<WorkShift[]>(`/schedule/shifts?weekStart=${weekStart}`);

export const createShift = (body: {
  userId: string;
  weekStartDate: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isDayOff?: boolean;
}) => apiPost<WorkShift>('/schedule/shifts', body);

export const updateShift = (id: string, body: { startTime: string; endTime: string; isDayOff?: boolean }) =>
  apiPut<WorkShift>(`/schedule/shifts/${id}`, body);

export const deleteShift = (id: string) => apiDelete(`/schedule/shifts/${id}`);

export const publishWeek = (weekStart: string) =>
  apiPost<void>(`/schedule/shifts/publish?weekStart=${weekStart}`, {});

// ── Requests ──────────────────────────────────────────────────────────────────

export const fetchShiftRequests = () => apiGet<ShiftRequest[]>('/schedule/requests');

export const submitShiftRequest = (body: {
  type: string;
  requestedDate: string;
  targetUserId?: string;
  targetDate?: string;
  reason?: string;
}) => apiPost<ShiftRequest>('/schedule/requests', body);

export const reviewShiftRequest = (id: string, body: { decision: string; managerNote?: string }) =>
  apiPatch<ShiftRequest>(`/schedule/requests/${id}/review`, body);
