import { useAppStore } from "@/stores/useAppStore";
import type { AuthUser } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

// Auth endpoints must never trigger the refresh interceptor, otherwise a failing
// /auth/refresh would await its own in-flight refresh promise and deadlock.
const AUTH_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/logout"]);

function failAuth(): never {
  useAppStore.getState().clearAuth();
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
  throw new ApiError(401, { error: "Session expired." });
}

// Single-flight token refresh: concurrent 401s (e.g. every query refetching on
// window focus) share ONE /auth/refresh call instead of each firing its own.
// Tokens now live in httpOnly cookies — the browser sends the refresh_token
// cookie automatically, so the POST body is empty.
let refreshPromise: Promise<void> | null = null;

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",       // browser sends the refresh_token cookie
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new ApiError(401, { error: "Session expired." });
      // Server rotates both cookies and returns the updated user; sync the store.
      const user: AuthUser = await res.json();
      useAppStore.getState().setUser(user);
    })();
    refreshPromise.then(
      () => { refreshPromise = null; },
      () => { refreshPromise = null; },
    );
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",           // browser attaches httpOnly cookies on every call
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && !isRetry && !AUTH_PATHS.has(path)) {
    try {
      await refreshAccessToken();
    } catch {
      failAuth();
    }
    return request<T>(path, init, true);
  }
  if (res.status === 401 && isRetry) failAuth();

  // 402 = no active subscription. Send the user to the plan-selection page.
  if (
    res.status === 402 &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/subscribe")
  ) {
    window.location.replace("/subscribe");
    throw new ApiError(402, { error: "Subscription required." });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string) => request<T>(path);

export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const apiPut = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export const apiDelete = (path: string) =>
  request<void>(path, { method: "DELETE" });
