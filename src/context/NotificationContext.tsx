import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { realtimeClient, ConnectionStatus } from '../lib/socket';
import type { AppNotification, NotificationType, Message, Conversation } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  permission: NotificationPermission;
  wsStatus: ConnectionStatus;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  toggleSound: () => void;
  toggleDesktop: () => void;
  requestPermission: () => Promise<NotificationPermission>;
  playChime: () => void;
  addNotification: (notification: {
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    channelType?: string;
    meta?: Record<string, any>;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API synthesized chime sound — zero external assets required
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second higher chime tone (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch (err) {
    console.debug('[NotificationContext] Web Audio chime playback error:', err);
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>(realtimeClient.getStatus());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // User notification preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('omni_notification_sound') !== 'false';
  });

  const [desktopEnabled, setDesktopEnabled] = useState<boolean>(() => {
    return localStorage.getItem('omni_notification_desktop') !== 'false';
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Storage key scoped to current user tenant
  const storageKey = user?.tenantId ? `omni_notifications_${user.tenantId}` : 'omni_notifications_default';

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Persist notifications on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 50)));
      } catch {
        // ignore
      }
    }
  }, [notifications, storageKey]);

  // Sync WebSocket connection with user state
  useEffect(() => {
    if (user) {
      realtimeClient.connect();
    } else {
      realtimeClient.disconnect();
    }

    const unsubscribe = realtimeClient.onStatusChange(setWsStatus);
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Update sound preference
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('omni_notification_sound', String(next));
      return next;
    });
  }, []);

  // Update desktop notification preference
  const toggleDesktop = useCallback(() => {
    setDesktopEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('omni_notification_desktop', String(next));
      return next;
    });
  }, []);

  // Request browser desktop notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        showToast('Desktop notifications enabled!', 'success');
      } else if (result === 'denied') {
        showToast('Desktop notifications blocked in browser settings', 'info');
      }
      return result;
    } catch (err) {
      console.error('[NotificationContext] Permission request failed:', err);
      return 'denied';
    }
  }, [showToast]);

  const playChime = useCallback(() => {
    if (soundEnabled) {
      playNotificationChime();
    }
  }, [soundEnabled]);

  // Helper to trigger desktop notification
  const sendDesktopNotification = useCallback(
    (title: string, body: string, link?: string) => {
      if (
        !desktopEnabled ||
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      ) {
        return;
      }

      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `omni-${Date.now()}`,
        });

        notif.onclick = () => {
          window.focus();
          if (link) {
            window.location.href = link;
          }
          notif.close();
        };
      } catch (err) {
        console.debug('[NotificationContext] Desktop notification failed:', err);
      }
    },
    [desktopEnabled]
  );

  // Add in-app notification
  const addNotification = useCallback(
    (item: {
      type: NotificationType;
      title: string;
      body: string;
      link?: string;
      channelType?: string;
      meta?: Record<string, any>;
    }) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: item.type,
        title: item.title,
        body: item.body,
        read: false,
        createdAt: new Date().toISOString(),
        link: item.link,
        channelType: item.channelType,
        meta: item.meta,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

      // Trigger audio & desktop alerts
      playChime();
      sendDesktopNotification(item.title, item.body, item.link);
    },
    [playChime, sendDesktopNotification]
  );

  // Mark specific notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Delete one notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Real-time Event Subscriptions across the entire application
  useEffect(() => {
    if (!user) return;

    // 1. Incoming Message Handler
    const unbindNewMsg = realtimeClient.on<Message>('message:new', (evt) => {
      const msg = evt.data;
      if (!msg) return;

      const direction = msg.direction || (msg as any).senderType;
      // Trigger notification alert only on inbound messages from customers
      if (direction === 'inbound' || (!msg.senderUserId && !(msg as any).sender_user_id)) {
        const convId = msg.conversationId || (msg as any).conversation_id;
        const previewText = msg.text || (msg.type !== 'text' ? `Sent an attachment (${msg.type})` : 'New incoming message');

        addNotification({
          type: 'message',
          title: 'New Customer Message',
          body: previewText,
          link: convId ? `/inbox?id=${convId}` : '/inbox',
          meta: { conversationId: convId, messageId: msg.id },
        });
      }
    });

    // 2. Conversation Assignment Handler
    const unbindAssigned = realtimeClient.on<{ conversationId: string; assignedAgentUserId: string }>(
      'conversation:assigned',
      (evt) => {
        const data = evt.data;
        if (data?.assignedAgentUserId === user.id || data?.assignedAgentUserId === (user as any).userId) {
          addNotification({
            type: 'conversation',
            title: 'Conversation Assigned',
            body: 'You have been assigned a new customer conversation.',
            link: data.conversationId ? `/inbox?id=${data.conversationId}` : '/inbox',
            meta: { conversationId: data.conversationId },
          });
        }
      }
    );

    // 3. Conversation Status Handler
    const unbindStatus = realtimeClient.on<{ conversationId: string; status: string }>(
      'conversation:status',
      (evt) => {
        const data = evt.data;
        if (data?.status === 'open') {
          addNotification({
            type: 'conversation',
            title: 'Conversation Reopened',
            body: 'A customer conversation has been reopened.',
            link: data.conversationId ? `/inbox?id=${data.conversationId}` : '/inbox',
            meta: { conversationId: data.conversationId },
          });
        }
      }
    );

    return () => {
      unbindNewMsg();
      unbindAssigned();
      unbindStatus();
    };
  }, [user, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        desktopEnabled,
        permission,
        wsStatus,
        isDropdownOpen,
        setIsDropdownOpen,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
        toggleSound,
        toggleDesktop,
        requestPermission,
        playChime,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
