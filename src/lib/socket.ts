import { apiClient } from '../api/client';
import type { RealtimeMessageEvent } from '../types';

export type RealtimeEventHandler<T = any> = (event: RealtimeMessageEvent<T>) => void;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed = false;
  private activeSubscriptions: Set<string> = new Set(['*']);

  constructor() {
    // Auto-connect if token exists
    if (typeof window !== 'undefined') {
      const token = apiClient.getToken();
      if (token) {
        this.connect();
      }
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (err) {
        console.error('[RealtimeClient] Status listener error:', err);
      }
    });
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public connect(): void {
    const token = apiClient.getToken();
    if (!token) {
      this.setStatus('disconnected');
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Start ping heartbeat
        this.startHeartbeat();

        // Resubscribe to channels
        this.activeSubscriptions.forEach((channel) => {
          this.send({ type: 'subscribe', channel });
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'event' && payload.event) {
            this.dispatchEvent(payload.event, payload);
          } else if (payload.type === 'pong') {
            // Heartbeat ACK
          }
        } catch (err) {
          console.error('[RealtimeClient] Error parsing incoming WebSocket frame:', err);
        }
      };

      this.socket.onclose = (event) => {
        this.stopHeartbeat();
        this.setStatus('disconnected');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[RealtimeClient] WebSocket error:', err);
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (err) {
      console.error('[RealtimeClient] Failed to initialize WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  public subscribe(channel: string): void {
    this.activeSubscriptions.add(channel);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: 'subscribe', channel });
    }
  }

  public unsubscribe(channel: string): void {
    this.activeSubscriptions.delete(channel);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: 'unsubscribe', channel });
    }
  }

  public on<T = any>(event: string, handler: RealtimeEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private dispatchEvent(event: string, payload: RealtimeMessageEvent): void {
    // Specific event listeners
    const specificHandlers = this.listeners.get(event);
    if (specificHandlers) {
      specificHandlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[RealtimeClient] Error in handler for event "${event}":`, err);
        }
      });
    }

    // Wildcard listeners
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[RealtimeClient] Error in wildcard handler:`, err);
        }
      });
    }
  }

  private send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: new Date().toISOString() });
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[RealtimeClient] Max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export const realtimeClient = new RealtimeClient();
