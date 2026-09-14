import { useEffect, useState } from 'react';
import { realtimeClient, ConnectionStatus, RealtimeEventHandler } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export function useWebSocket() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>(realtimeClient.getStatus());

  useEffect(() => {
    // If user or token exists and client is disconnected, ensure connection is active
    if (user || apiClient.getToken()) {
      realtimeClient.connect();
    }

    const unsubscribe = realtimeClient.onStatusChange(setStatus);
    return () => {
      unsubscribe();
    };
  }, [user]);

  return {
    status,
    isConnected: status === 'connected',
    subscribe: (channel: string) => realtimeClient.subscribe(channel),
    unsubscribe: (channel: string) => realtimeClient.unsubscribe(channel),
    on: <T = any>(event: string, handler: RealtimeEventHandler<T>) => realtimeClient.on<T>(event, handler),
  };
}

/**
 * Hook to listen to a specific realtime event with automatic lifecycle cleanup
 */
export function useRealtimeEvent<T = any>(event: string, handler: RealtimeEventHandler<T>) {
  useEffect(() => {
    const unsubscribe = realtimeClient.on<T>(event, handler);
    return () => {
      unsubscribe();
    };
  }, [event, handler]);
}
