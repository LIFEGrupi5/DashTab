'use client';

import { useAppStore } from "@/stores/useAppStore";

export function useAuth() {
  const user = useAppStore(s => s.user);
  return { user, isAuthenticated: !!user };
}