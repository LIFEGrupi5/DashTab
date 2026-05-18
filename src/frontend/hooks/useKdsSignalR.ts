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

export function useKdsSignalR() {
  const queryClient = useQueryClient();
  const token = useAppStore(s => s.token);

  useEffect(() => {
    if (!token) return;

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => useAppStore.getState().token ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

    connection.on('orderPlaced', invalidate);
    connection.on('orderStatusChanged', invalidate);
    connection.on('orderCancelled', invalidate);

    connection.start().catch(err => {
      console.error('KDS SignalR connect failed:', err);
    });

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, [token, queryClient]);
}
