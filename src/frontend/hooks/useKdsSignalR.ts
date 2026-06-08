'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { useAppStore } from '@/stores/useAppStore';
import { queryKeys } from '@/lib/queryKeys';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';
const HUB_URL =
  process.env.NEXT_PUBLIC_KDS_HUB_URL ??
  API_BASE.replace(/\/api\/v\d+\/?$/, '') + '/hubs/kds';

// Window to wait for KDS events to settle before refetching orders once.
const INVALIDATE_DEBOUNCE_MS = 400;
// Ceiling on how stale the board may get during a sustained event stream:
// force a refetch at least this often even if events keep arriving.
const INVALIDATE_MAX_WAIT_MS = 1500;

export function useKdsSignalR() {
  const queryClient = useQueryClient();
  // Tokens are now in httpOnly cookies — the browser sends the access_token
  // cookie automatically on the WebSocket upgrade request. The backend's
  // OnMessageReceived reads it from Request.Cookies["access_token"].
  // We still gate on user being present so we only connect when authenticated.
  const user = useAppStore(s => s.user);

  useEffect(() => {
    if (!user) return;

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        withCredentials: true,         // tells SignalR to include cookies on WS/SSE
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Coalesce bursts of KDS events into a single refetch: invalidate once events
    // settle for INVALIDATE_DEBOUNCE_MS, but force a refetch at least every
    // INVALIDATE_MAX_WAIT_MS so a sustained stream can't starve the debounce and
    // freeze the board on stale data.
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let maxWaitTimer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      clearTimeout(debounceTimer);
      clearTimeout(maxWaitTimer);
      debounceTimer = undefined;
      maxWaitTimer = undefined;
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    };

    const invalidate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, INVALIDATE_DEBOUNCE_MS);
      // Started on the first event of a burst and deliberately not reset by later
      // events, so it caps worst-case staleness during a continuous stream.
      if (!maxWaitTimer) maxWaitTimer = setTimeout(flush, INVALIDATE_MAX_WAIT_MS);
    };

    connection.on('orderPlaced', invalidate);
    connection.on('orderStatusChanged', invalidate);
    connection.on('orderCancelled', invalidate);

    connection.start().catch(err => {
      console.error('KDS SignalR connect failed:', err);
    });

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(maxWaitTimer);
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, [user, queryClient]);
}
