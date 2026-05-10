'use client';

import { useAppStore } from "@/stores/useAppStore";

export function useAuth() { 
  const user = useAppStore(s => s.user);
  const token = useAppStore(s => s.token);
  return {user, token , isAuthenticated: !!user};
}