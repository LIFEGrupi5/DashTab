import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/api/types";

// Tokens live in httpOnly cookies — never in JS/localStorage.
// This store only holds the decoded user (non-sensitive: id, email, name, role)
// plus UI preferences (sidebar, dark mode).
type AppState = {
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        setAuth:  (user) => set({ user }),
        setUser:  (user) => set({ user }),
        clearAuth: () => set({ user: null }),
        sidebarOpen: true,
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        darkMode: false,
        setDarkMode: (darkMode) => set({ darkMode }),
      }),
      {
        name: "restaurantos-app",
        partialize: (s) => ({
          user: s.user,
          sidebarOpen: s.sidebarOpen,
          darkMode: s.darkMode,
        }),
      },
    ),
    { name: "RestaurantOS", enabled: process.env.NODE_ENV === "development" },
  ),
);
