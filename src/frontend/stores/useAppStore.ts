import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/api/types";
import { claimsToAuthUser, decodeJwt } from "@/lib/api/jwt";

type AppState = {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
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
        token: null,
        refreshToken: null,
        user: null,
        setAuth: (user, accessToken, refreshToken) =>
          set({ user, token: accessToken, refreshToken }),
        // Re-derive the user from the new access token so role changes in
        // Keycloak propagate to the frontend on the next token refresh, not
        // only on the next full login.
        setTokens: (accessToken, refreshToken) => {
          try {
            const claims = decodeJwt<Record<string, unknown>>(accessToken);
            const user = claimsToAuthUser(claims);
            set({ token: accessToken, refreshToken, user });
          } catch {
            set({ token: accessToken, refreshToken });
          }
        },
        clearAuth: () => set({ user: null, token: null, refreshToken: null }),
        sidebarOpen: true,
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        darkMode: false,
        setDarkMode: (darkMode) => set({ darkMode }),
      }),
      {
        name: "restaurantos-app",
        partialize: (s) => ({
          token: s.token,
          refreshToken: s.refreshToken,
          user: s.user,
          sidebarOpen: s.sidebarOpen,
          darkMode: s.darkMode,
        }),
      },
    ),
    { name: "RestaurantOS", enabled: process.env.NODE_ENV === "development" },
  ),
);
