import { useAppStore } from "@/stores/useAppStore";

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
// This avoids a refresh storm that both trips Keycloak's rate limit (429) and
// invalidates our own rotated refresh token mid-flight, which otherwise logs the
// user out on return to a stale tab.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = useAppStore.getState();
      if (!refreshToken) throw new ApiError(401, { error: "Session expired." });
      const { refreshTokens } = await import("./auth");
      const session = await refreshTokens(refreshToken);
      useAppStore
        .getState()
        .setTokens(session.accessToken, session.refreshToken);
      return session.accessToken;
    })();
    // Reset the gate once settled so a later expiry can refresh again.
    refreshPromise.then(
      () => {
        refreshPromise = null;
      },
      () => {
        refreshPromise = null;
      },
    );
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = useAppStore.getState().token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && !AUTH_PATHS.has(path)) {
    if (isRetry) failAuth();
    try {
      await refreshAccessToken();
    } catch {
      failAuth();
    }
    return request<T>(path, init, true);
  }

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
