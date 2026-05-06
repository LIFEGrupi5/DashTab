import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type { StaffUser } from './types';

export const fetchStaff = () => apiGet<StaffUser[]>('/users');

export const fetchStaffMember = (id: string) => apiGet<StaffUser>(`/users/${id}`);

export const createStaffMember = (req: {
  fullName: string;
  email: string;
  role: string;
  startDate?: string;
  bio?: string;
}) => apiPost<StaffUser>('/users', req);

export const updateStaffMember = (
  id: string,
  req: { fullName: string; email: string; role: string; bio?: string; photoUrl?: string },
) => apiPut<StaffUser>(`/users/${id}`, req);

export const setStaffActive = (id: string, active: boolean) =>
  apiPatch<StaffUser>(`/users/${id}/active`, { active });

export const deleteStaffMember = (id: string) => apiDelete(`/users/${id}`);
