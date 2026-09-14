import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Paperclip,
  X,
  Minus,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  FileText,
  Download,
  AlertCircle,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { webchatVisitorApi } from '../../api';
import type { PublicWidgetConfig, VisitorSessionInitResponse, Message } from '../../types';

export interface WebchatWidgetProps {
  widgetKey?: string;
  mode?: 'floating' | 'standalone' | 'preview';
  previewConfig?: Partial<PublicWidgetConfig>;
  onClose?: () => void;
  className?: string;
}

export const WebchatWidget: React.FC<WebchatWidgetProps> = ({
  widgetKey = '',
  mode = 'floating',
  previewConfig,
  onClose,
  className = '',
}) => {
  // Widget Configuration State
  const [config, setConfig] = useState<PublicWidgetConfig | null>(
    previewConfig ? (previewConfig as PublicWidgetConfig) : null
  );
  const [loadingConfig, setLoadingConfig] = useState(!previewConfig);
  const [configError, setConfigError] = useState<string | null>(null);

  // Widget Open / Minimized State
  const [isOpen, setIsOpen] = useState(mode !== 'floating');
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Visitor Session State
  const [session, setSession] = useState<VisitorSessionInitResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);

  // Visitor Info Form (if required)
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');

  // Lightbox / Image Preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const isSendingRef = useRef<boolean>(false);

  const primaryColor = config?.primaryColor || '#2563eb';

  // --------------------------------------------------------------------------
  // 1. Load Widget Public Configuration
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (previewConfig) {
      setConfig(previewConfig as PublicWidgetConfig);
      setLoadingConfig(false);
      if (mode === 'preview') {
        setMessages([
          {
            id: 'prev-1',
            tenantId: 'preview',
            conversationId: 'preview',
            direction: 'outbound',
            senderType: 'system',
            type: 'text',
            content: { text: previewConfig.greetingMessage || 'Hello! How can we help you today?' },
            status: 'delivered',
            createdAt: new Date(Date.now() - 60000).toISOString(),
            updatedAt: new Date(Date.now() - 60000).toISOString(),
          } as Message,
          {
            id: 'prev-2',
            tenantId: 'preview',
            conversationId: 'preview',
            direction: 'inbound',
            senderType: 'customer',
            type: 'text',
            content: { text: 'Hi! I have a question about your products.' },
            status: 'read',
            createdAt: new Date(Date.now() - 30000).toISOString(),
            updatedAt: new Date(Date.now() - 30000).toISOString(),
          } as Message,
          {
            id: 'prev-3',
            tenantId: 'preview',
            conversationId: 'preview',
            direction: 'outbound',
            senderType: 'agent',
            type: 'text',
            content: { text: 'We would be happy to help! What are you looking for?' },
            status: 'delivered',
            createdAt: new Date(Date.now() - 5000).toISOString(),
            updatedAt: new Date(Date.now() - 5000).toISOString(),
          } as Message,
        ]);
      }
      return;
    }

    if (!widgetKey) return;

    let isMounted = true;
    setLoadingConfig(true);
    setConfigError(null);

    webchatVisitorApi
      .getConfig(widgetKey)
      .then((cfg) => {
        if (isMounted) {
          setConfig(cfg);
          setLoadingConfig(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setConfigError(err.message || 'Failed to load live chat widget');
          setLoadingConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [widgetKey, previewConfig]);

  // --------------------------------------------------------------------------
  // 2. Initialize or Resume Visitor Session
  // --------------------------------------------------------------------------
  const initSession = useCallback(
    async (contactData?: { name?: string; email?: string }) => {
      if (!widgetKey) return;

      const storageKey = `omni_webchat_session_${widgetKey}`;
      const savedSessionId = localStorage.getItem(`${storageKey}_sid`) || undefined;
      const savedName = localStorage.getItem(`${storageKey}_name`) || contactData?.name;
      const savedEmail = localStorage.getItem(`${storageKey}_email`) || contactData?.email;

      try {
        const res = await webchatVisitorApi.initSession({
          widgetKey,
          visitorSessionId: savedSessionId,
          contactName: savedName,
          contactEmail: savedEmail,
          metadata: {
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            url: typeof window !== 'undefined' ? window.location.href : '',
          },
        });

        setSession(res);
        setToken(res.token);
        setMessages(res.messages || []);

        if (res.visitorSessionId) {
          localStorage.setItem(`${storageKey}_sid`, res.visitorSessionId);
        }
        if (savedName) localStorage.setItem(`${storageKey}_name`, savedName);
        if (savedEmail) localStorage.setItem(`${storageKey}_email`, savedEmail);

        return res;
      } catch (err: any) {
        console.error('[Webchat] Session initialization failed:', err);
      }
    },
    [widgetKey]
  );

  useEffect(() => {
    if (config && !session && mode !== 'preview') {
      // Check if visitor info is required before chatting
      const storageKey = `omni_webchat_session_${widgetKey}`;
      const savedName = localStorage.getItem(`${storageKey}_name`);
      const savedEmail = localStorage.getItem(`${storageKey}_email`);

      if ((config.requireName && !savedName) || (config.requireEmail && !savedEmail)) {
        setShowInfoForm(true);
      } else {
        initSession();
      }
    }
  }, [config, session, widgetKey, mode, initSession]);

  // --------------------------------------------------------------------------
  // 3. Setup Real-time WebSocket Connection
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!token || !session || mode === 'preview') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              channel: `conversation:${session.conversationId}`,
            })
          );
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);

            if (data.type === 'event') {
              if (
                (data.event === 'conversation:message' || data.event === 'message:new') &&
                (data.data?.message || data.data?.id || data.data)
              ) {
                const incomingMsg = (data.data?.message || data.data) as Message;
                const incId = incomingMsg?.id || (incomingMsg as any)?._id;
                if (incId) {
                  setMessages((prev) => {
                    // 1. Skip if message is already present by confirmed ID
                    if (prev.some((m) => (m.id && m.id === incId) || ((m as any)._id && (m as any)._id === incId))) {
                      return prev;
                    }
                    // 2. Reconcile against pending optimistic message if same direction & text/type
                    const tempIndex = prev.findIndex(
                      (m) => m.id?.startsWith('temp_') && m.direction === incomingMsg.direction
                    );
                    if (tempIndex !== -1) {
                      const copy = [...prev];
                      copy[tempIndex] = incomingMsg;
                      return copy;
                    }
                    return [...prev, incomingMsg];
                  });

                  // Play notification sound if message from agent/bot
                  if (incomingMsg.direction === 'outbound' && soundEnabled) {
                    playNotificationSound();
                  }

                  // Increment unread count if widget is minimized
                  if (!isOpen) {
                    setUnreadCount((c) => c + 1);
                  }
                }
              } else if (data.event === 'conversation:typing') {
                if (data.data?.sender === 'agent' || data.data?.sender === 'bot') {
                  setAgentTyping(Boolean(data.data?.isTyping));
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    setAgentTyping(false);
                  }, 4000);
                }
              } else if (data.event === 'conversation:status') {
                if (data.data?.messageId && data.data?.status) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === data.data.messageId ? { ...m, status: data.data.status } : m
                    )
                  );
                }
              }
            }
          } catch (e) {
            console.error('[Webchat] WebSocket message parsing error:', e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {}
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [token, session, isOpen, soundEnabled, mode]);

  // --------------------------------------------------------------------------
  // 4. Auto-Scroll to Bottom on Message Updates
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, agentTyping, isOpen]);

  // --------------------------------------------------------------------------
  // 5. Notify Parent Iframe of Dimensions (Embed Mode Support)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (mode === 'floating' && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'omni-webchat-resize',
          isExpanded: isOpen,
          position: config?.position || 'bottom-right',
          width: isOpen ? '420px' : '70px',
          height: isOpen ? '680px' : '70px',
        },
        '*'
      );
    }
  }, [isOpen, mode, config?.position]);

  // --------------------------------------------------------------------------
  // 6. Audio Notification Helper
  // --------------------------------------------------------------------------
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {}
  };

  // --------------------------------------------------------------------------
  // 7. Typing Indicator Dispatcher
  // --------------------------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Rate-limit typing broadcast to once every 2.5 seconds
    const now = Date.now();
    if (token && now - lastTypingSentRef.current > 2500) {
      lastTypingSentRef.current = now;
      webchatVisitorApi.sendTyping(token, true).catch(() => {});
    }
  };

  // --------------------------------------------------------------------------
  // 8. Send Visitor Message Handler
  // --------------------------------------------------------------------------
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend || isSendingRef.current) return;

    if (!session || !token) {
      if (showInfoForm) return;
      await initSession();
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);
    setInputText('');

    // Optimistic message append
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: session.conversationId,
      direction: 'inbound',
      type: 'text',
      content: { text: textToSend },
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await webchatVisitorApi.sendMessage(token, {
        text: textToSend,
        type: 'text',
      });

      // Deduplicate: If WebSocket event arrived concurrently and already appended or reconciled,
      // remove tempId if server message is already present; otherwise replace tempId with confirmed message.
      setMessages((prev) => {
        const serverId = res.message.id || (res.message as any)._id;
        const alreadyExists = prev.some(
          (m) => (m.id && m.id === serverId) || ((m as any)._id && (m as any)._id === serverId)
        );
        if (alreadyExists) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? res.message : m));
      });
    } catch (err: any) {
      console.error('[Webchat] Failed to send message:', err);
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  // --------------------------------------------------------------------------
  // 9. File & Media Upload Handler
  // --------------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !session) return;

    setIsUploading(true);

    try {
      const uploadRes = await webchatVisitorApi.uploadMedia(token, file);
      const isImage = file.type.startsWith('image/');

      const msgRes = await webchatVisitorApi.sendMessage(token, {
        mediaUrl: uploadRes.url,
        mediaStorageKey: uploadRes.key,
        type: isImage ? 'image' : 'document',
        text: file.name,
      });

      setMessages((prev) => {
        const msgId = msgRes.message.id || (msgRes.message as any)._id;
        if (prev.some((m) => (m.id && m.id === msgId) || ((m as any)._id && (m as any)._id === msgId))) {
          return prev;
        }
        return [...prev, msgRes.message];
      });
    } catch (err: any) {
      console.error('[Webchat] Media upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --------------------------------------------------------------------------
  // 10. Visitor Info Form Submit
  // --------------------------------------------------------------------------
  const handleInfoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config?.requireName && !visitorName.trim()) return;
    if (config?.requireEmail && !visitorEmail.trim()) return;

    setShowInfoForm(false);
    await initSession({ name: visitorName.trim(), email: visitorEmail.trim() });
  };

  // --------------------------------------------------------------------------
  // 11. Format Message Timestamp
  // --------------------------------------------------------------------------
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // --------------------------------------------------------------------------
  // RENDER: Loading or Error States
  // --------------------------------------------------------------------------
  if (loadingConfig) {
    return (
      <div className={`flex items-center justify-center p-8 text-sm text-slate-500 ${className}`}>
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Loading Live Chat...
      </div>
    );
  }

  if (configError) {
    return (
      <div className={`p-6 text-center text-sm text-slate-600 bg-slate-50 rounded-xl border border-slate-200 ${className}`}>
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="font-medium text-slate-800 mb-1">Live Chat Unavailable</p>
        <p className="text-xs text-slate-500">{configError}</p>
      </div>
    );
  }

  if (!config) return null;

  const isOnline = config.isOnline !== false;
  const isBottomLeft = config.position === 'bottom-left';

  // --------------------------------------------------------------------------
  // RENDER: Chat Window Box
  // --------------------------------------------------------------------------
  const chatWindow = (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full h-full rounded-2xl ${className}`}
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      {/* HEADER */}
      <div
        className="px-4 py-3.5 text-white flex items-center justify-between shrink-0 shadow-sm relative z-10 transition-colors"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center space-x-3 min-w-0">
          {config.showAgentAvatar ? (
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base leading-tight truncate text-white">
              {config.title || 'Chat with us'}
            </h3>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnline ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <p className="text-xs text-white/90 truncate leading-none">
                {isOnline ? config.subtitle || 'Typically replies in minutes' : 'Currently Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {mode === 'floating' && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Minimize chat"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 px-4 py-2 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-200 shrink-0">
          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="leading-snug">
            {config.offlineMessage ||
              'We are currently offline. Leave a message and we will respond once back online.'}
          </p>
        </div>
      )}

      {/* BODY: VISITOR INFO FORM OR MESSAGE LIST */}
      {showInfoForm ? (
        <div className="flex-1 p-6 flex flex-col justify-center bg-slate-50 dark:bg-slate-900/60">
          <div className="text-center mb-6">
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-base">
              Welcome to Live Chat
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Please introduce yourself to start chatting with our team.
            </p>
          </div>

          <form onSubmit={handleInfoFormSubmit} className="space-y-4">
            {config.requireName && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />
              </div>
            )}

            {config.requireEmail && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane@example.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm shadow-md hover:opacity-95 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Start Conversation
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-900/40">
          {/* Greeting message bubble */}
          {config.greetingMessage && (
            <div className="flex items-start space-x-2.5 max-w-[88%]">
              {config.showAgentAvatar && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 text-xs shadow-sm mt-0.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div>
                <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm shadow-sm border border-slate-200/70 dark:border-slate-700 leading-relaxed">
                  {config.greetingMessage}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block px-1">
                  {formatTime(session?.messages?.[0]?.createdAt || new Date().toISOString())}
                </span>
              </div>
            </div>
          )}

          {/* Conversation messages */}
          {messages.map((msg) => {
            const isVisitor = msg.direction === 'inbound';
            const textContent =
              typeof msg.content === 'object' ? msg.content?.text : msg.content;
            const mediaUrl = typeof msg.content === 'object' ? msg.content?.mediaUrl : null;
            const buttons =
              typeof msg.content === 'object' && Array.isArray(msg.content?.buttons)
                ? msg.content.buttons
                : [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex items-end space-x-2 max-w-[88%] ${
                    isVisitor ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  {!isVisitor && config.showAgentAvatar && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 text-xs shadow-sm mb-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 text-sm rounded-2xl shadow-sm leading-relaxed overflow-hidden break-words ${
                      isVisitor
                        ? 'text-white rounded-tr-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200/70 dark:border-slate-700'
                    }`}
                    style={isVisitor ? { backgroundColor: primaryColor } : {}}
                  >
                    {/* Media render */}
                    {msg.type === 'image' && mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden cursor-pointer">
                        <img
                          src={mediaUrl}
                          alt="Attachment"
                          className="max-h-56 max-w-full object-cover hover:scale-105 transition-transform"
                          onClick={() => setPreviewImage(mediaUrl)}
                        />
                      </div>
                    )}

                    {msg.type === 'document' && mediaUrl && (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 p-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 transition-colors text-xs mb-1"
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 font-medium">
                          {textContent || 'Download attachment'}
                        </span>
                        <Download className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}

                    {msg.type === 'audio' && mediaUrl && (
                      <div className="mb-2">
                        <audio controls src={mediaUrl} className="max-w-full h-8" />
                      </div>
                    )}

                    {/* Text content */}
                    {textContent && msg.type !== 'document' && (
                      <p className="whitespace-pre-wrap">{textContent}</p>
                    )}

                    {/* Interactive Choice Buttons (from Flow Bot) */}
                    {buttons.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                        {buttons.map((btn: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(btn.title || btn.text || btn.payload)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/80 hover:bg-indigo-50 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-300 transition-colors border border-slate-200/80 dark:border-slate-600"
                          >
                            {btn.title || btn.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp and delivery status */}
                <div
                  className={`flex items-center space-x-1 mt-1 px-1 text-[10px] text-slate-400 ${
                    isVisitor ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{formatTime(msg.sentAt || msg.createdAt)}</span>
                  {isVisitor && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3 h-3 text-indigo-500 inline" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3 h-3 text-slate-400 inline" />
                      ) : msg.status === 'failed' ? (
                        <AlertCircle className="w-3 h-3 text-rose-500 inline" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-400 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Agent is typing indicator */}
          {agentTyping && (
            <div className="flex items-center space-x-2 max-w-[80%]">
              {config.showAgentAvatar && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 text-xs shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* FOOTER INPUT AREA */}
      {!showInfoForm && (
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
              title="Attach photo or document"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            {/* Textarea Input */}
            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={config.placeholderText || 'Type your message...'}
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none max-h-24 py-1"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="p-2 rounded-lg text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shrink-0"
              style={{ backgroundColor: primaryColor }}
              title="Send message"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400 tracking-tight">
              Powered by <strong className="font-semibold text-slate-500 dark:text-slate-400">Omni Chat</strong>
            </span>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={previewImage} alt="Full preview" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // --------------------------------------------------------------------------
  // RENDER: STANDALONE & PREVIEW MODES
  // --------------------------------------------------------------------------
  if (mode === 'standalone' || mode === 'preview') {
    return chatWindow;
  }

  // --------------------------------------------------------------------------
  // RENDER: FLOATING LAUNCHER & EXPANDABLE POPUP (IFRAME EMBED)
  // --------------------------------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* EXPANDED CHAT WINDOW */}
      {isOpen && <div className="w-full h-full animate-in fade-in zoom-in-95 duration-200">{chatWindow}</div>}

      {/* LAUNCHER BUBBLE BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          style={{ backgroundColor: primaryColor }}
          title={config.launcherText || 'Chat with us'}
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-7 h-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

export default WebchatWidget;
