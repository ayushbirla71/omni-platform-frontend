import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Radio,
  Check,
  CheckCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  Phone,
  FileText,
  Download,
  Image as ImageIcon,
  Music,
  Film,
  ExternalLink,
  ShoppingBag,
  ShoppingCart,
  Package,
  X,
  Sparkles,
  Brain,
  Wand2,
  Bot,
  Zap,
  CheckCircle2,
  ListChecks,
  ArrowRight,
  CornerDownLeft,
  Flame,
  ShieldAlert,
  Copy,
  RotateCcw,
  Wifi,
  WifiOff,
  Paperclip,
  Clock,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { conversationsApi, contactsApi, dealsApi, ordersApi, aiCopilotApi, channelsApi } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import type {
  Conversation,
  Message,
  Contact,
  Deal,
  Order,
  ReplySuggestion,
  ConversationSummary,
  IntentClassification,
  WhatsAppTemplate,
  TemplateComponent,
} from '../types';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { formatDateTime, formatRelativeTime, cn } from '../lib/utils';
import { WhatsAppTemplateCard } from '../components/chat/WhatsAppTemplateCard';
import { APPROVED_TEMPLATES_CATALOG, registerDynamicTemplates } from '../utils/whatsapp-templates';

export const InboxPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConvId = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [messageText, setMessageText] = useState('');

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  // Smart Reply suggestions & AI Copilot drawer state
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [rightPaneTab, setRightPaneTab] = useState<'crm' | 'copilot'>('crm');
  const [copilotTab, setCopilotTab] = useState<'summary' | 'rephrase' | 'classify'>('summary');

  // AI Summary State
  const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // AI Rephrase State
  const [rephraseInput, setRephraseInput] = useState('');
  const [rephraseTone, setRephraseTone] = useState<'professional' | 'friendly' | 'concise' | 'bullet_points' | 'sales_pitch'>('professional');
  const [rephraseResult, setRephraseResult] = useState<string | null>(null);
  const [isRephrasing, setIsRephrasing] = useState(false);

  // AI Intent Classifier State
  const [classifyText, setClassifyText] = useState('');
  const [intentClassification, setIntentClassification] = useState<IntentClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Media preview modal / lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // WhatsApp 24-Hour Customer Care Session Window Countdown State
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number | null>(null);

  // Media Attachment Upload Modal State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp Quick Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [channelTemplates, setChannelTemplates] = useState<WhatsAppTemplate[]>(APPROVED_TEMPLATES_CATALOG);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [templateHeaderValue, setTemplateHeaderValue] = useState('');
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);

  // Modals
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('10000'); // in cents ($100)
  const [newDealStage, setNewDealStage] = useState('Lead');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const getMediaUrl = (msg: Message): string | null => {
    const key = msg.mediaStorageKey || msg.content?.mediaStorageKey;
    if (key) {
      const token = localStorage.getItem('auth_token') || '';
      return `/api/media/file?key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;
    }
    if (msg.mediaUrl && (msg.mediaUrl.startsWith('http://') || msg.mediaUrl.startsWith('https://') || msg.mediaUrl.startsWith('/api/'))) {
      return msg.mediaUrl;
    }
    if (msg.content?.mediaUrl && (msg.content.mediaUrl.startsWith('http://') || msg.content.mediaUrl.startsWith('https://') || msg.content.mediaUrl.startsWith('/api/'))) {
      return msg.content.mediaUrl;
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations list
  const loadConversations = async () => {
    setIsLoadingList(true);
    try {
      const data = await conversationsApi.list(filterStatus === 'all' ? undefined : filterStatus);
      setConversations(data);

      if (data.length > 0 && !selectedConvId) {
        setSearchParams({ id: data[0].id });
      }
    } catch (err) {
      showToast('Failed to load conversations', 'error');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [filterStatus]);

  // Keep active conversation updated from list when conversations list refreshes
  useEffect(() => {
    if (selectedConvId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === selectedConvId);
      if (conv) setActiveConversation(conv);
    }
  }, [selectedConvId, conversations]);

  // Load messages & contact when selectedConvId changes
  useEffect(() => {
    if (!selectedConvId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    const loadMessagesAndContact = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await conversationsApi.getMessages(selectedConvId);
        setMessages(msgs);
        setTimeout(scrollToBottom, 50);

        // Load contact details, deals & orders
        const currentConv = conversations.find((c) => c.id === selectedConvId);
        if (currentConv?.contactId) {
          const contactList = await contactsApi.list(100, 0);
          const currentContact = contactList.find((c) => c.id === currentConv.contactId);
          if (currentContact) setContact(currentContact);

          const allDeals = await dealsApi.list();
          setDeals(allDeals.filter((d) => d.contactId === currentConv.contactId));

          try {
            const ordersRes = await ordersApi.list({ contactId: currentConv.contactId });
            setOrders(ordersRes.orders || []);
          } catch {
            setOrders([]);
          }
        } else {
          setDeals([]);
          setOrders([]);
        }
      } catch (err) {
        showToast('Failed to load messages', 'error');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessagesAndContact();
  }, [selectedConvId]);

  // Fetch Smart Reply suggestions for active conversation
  const fetchSmartReplies = async (convId?: string) => {
    const id = convId || selectedConvId;
    if (!id) return;
    setIsLoadingSuggestions(true);
    try {
      const res = await aiCopilotApi.suggestReplies({ conversationId: id });
      setReplySuggestions(res.suggestions || []);
    } catch {
      // Non-critical background feature
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Auto-fetch suggestions when switching conversations
  useEffect(() => {
    if (selectedConvId) {
      setConversationSummary(null);
      setIntentClassification(null);
      setRephraseResult(null);
      fetchSmartReplies(selectedConvId);
    } else {
      setReplySuggestions([]);
    }
  }, [selectedConvId]);

  // Generate 1-click conversation summary
  const handleGenerateSummary = async () => {
    if (!selectedConvId) return;
    setIsLoadingSummary(true);
    try {
      const res = await aiCopilotApi.summarizeConversation({ conversationId: selectedConvId });
      setConversationSummary(res);
      showToast('Conversation summary generated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate summary', 'error');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Rephrase message tone
  const handleRephraseMessage = async () => {
    const textToRephrase = rephraseInput.trim() || messageText.trim();
    if (!textToRephrase) {
      showToast('Please enter text to rephrase', 'error');
      return;
    }
    setIsRephrasing(true);
    try {
      const res = await aiCopilotApi.rephraseMessage({
        text: textToRephrase,
        tone: rephraseTone,
      });
      setRephraseResult(res.rephrased);
      showToast('Draft rephrased successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to rephrase text', 'error');
    } finally {
      setIsRephrasing(false);
    }
  };

  // Classify message intent & urgency
  const handleClassifyIntent = async (customText?: string) => {
    const textToClassify = customText || classifyText.trim() || messages.slice().reverse().find(m => m.direction === 'inbound')?.text || '';
    if (!textToClassify) {
      showToast('No customer message found to classify', 'error');
      return;
    }
    setIsClassifying(true);
    try {
      const res = await aiCopilotApi.classifyIntent({ text: textToClassify });
      setIntentClassification(res);
      setClassifyText(textToClassify);
      showToast('Message classified', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to classify message', 'error');
    } finally {
      setIsClassifying(false);
    }
  };

  // Realtime WebSocket integration
  const { isConnected, status: wsStatus, on: onRealtimeEvent } = useWebSocket();

  // Listen for realtime message and conversation events
  useEffect(() => {
    // 1. New incoming/outgoing messages
    const unbindNewMsg = onRealtimeEvent<Message>('message:new', (evt) => {
      const msg = evt.data;
      if (!msg) return;

      const convId = msg.conversationId || (msg as any).conversation_id;

      // If active conversation matches, append message
      if (convId === selectedConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);

        if (msg.direction === 'inbound') {
          const inTime = msg.sentAt || msg.createdAt || (msg as any).sent_at || (msg as any).created_at || new Date().toISOString();
          setActiveConversation((prev) => (prev ? {
            ...prev,
            lastInboundAt: inTime,
            last_inbound_at: inTime,
          } : null));
        }
      }

      // Update conversations list preview
      setConversations((prev) => {
        const found = prev.find((c) => c.id === convId);
        if (found) {
          const msgTime = msg.sentAt || msg.createdAt || (msg as any).sent_at || (msg as any).created_at || new Date().toISOString();
          const updated = {
            ...found,
            lastMessageText: msg.text || (msg as any).last_message_text || 'New message',
            lastMessageAt: msgTime,
            ...(msg.direction === 'inbound' ? {
              lastInboundAt: msgTime,
              last_inbound_at: msgTime,
            } : {}),
          };
          return [updated, ...prev.filter((c) => c.id !== convId)];
        } else {
          // New conversation arrived from a customer — reload conversation list
          loadConversations();
          return prev;
        }
      });
    });

    // 2. Message delivery status changes (sent, delivered, read, failed)
    const unbindMsgStatus = onRealtimeEvent<{
      id?: string;
      messageId?: string;
      status: any;
      errorCode?: string;
      errorMessage?: string;
      error_code?: string;
      error_message?: string;
    }>('message:status', (evt) => {
      const statusData = evt.data;
      const targetId = statusData?.id || statusData?.messageId;
      if (!targetId) return;

      setMessages((prev) =>
        prev.map((m) =>
          (m.id === targetId || m._id === targetId)
            ? {
                ...m,
                status: statusData.status,
                errorCode: statusData.errorCode || statusData.error_code || m.errorCode,
                errorMessage: statusData.errorMessage || statusData.error_message || m.errorMessage,
                error_code: statusData.errorCode || statusData.error_code || m.error_code,
                error_message: statusData.errorMessage || statusData.error_message || m.error_message,
              }
            : m
        )
      );
    });

    // 3. Conversation updates (status changes, assignment)
    const unbindConvUpdate = onRealtimeEvent<Conversation>('conversation:update', (evt) => {
      const conv = evt.data;
      if (!conv?.id) return;

      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
      );
      if (selectedConvId === conv.id) {
        setActiveConversation((prev) => (prev ? { ...prev, ...conv } : null));
      }
    });

    return () => {
      unbindNewMsg();
      unbindMsgStatus();
      unbindConvUpdate();
    };
  }, [selectedConvId, onRealtimeEvent]);

  // Periodic background polling fallback for live incoming messages (15s resilient heartbeat)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const convList = await conversationsApi.list(filterStatus === 'all' ? undefined : filterStatus);
        setConversations(convList);
      } catch {}

      if (selectedConvId && !isSendingRef.current) {
        try {
          const msgs = await conversationsApi.getMessages(selectedConvId);
          setMessages((prev) => {
            if (msgs.length !== prev.length || JSON.stringify(msgs) !== JSON.stringify(prev)) {
              return msgs;
            }
            return prev;
          });
        } catch {}
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [selectedConvId, filterStatus]);

  // Helper to format countdown seconds into HH:MM:SS
  const formatCountdown = (secs: number | null) => {
    if (secs === null) return null;
    if (secs <= 0) return '00:00:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Real-time calculation and tick of 24h WhatsApp session window
  useEffect(() => {
    if (!activeConversation) {
      setSessionSecondsLeft(null);
      return;
    }

    const channelType = activeConversation.channelType || (activeConversation as any).channel_type;
    if (channelType !== 'whatsapp') {
      setSessionSecondsLeft(null); // non-WhatsApp channels have no 24h limit
      return;
    }

    const calculateRemaining = () => {
      let lastInboundTimeMs: number | null = null;

      const convInbound = activeConversation.lastInboundAt || (activeConversation as any).last_inbound_at;
      if (convInbound) {
        const t = new Date(convInbound).getTime();
        if (!isNaN(t) && t > 0) {
          lastInboundTimeMs = t;
        }
      }

      // Check messages array to ensure latest inbound customer message is reflected
      const latestInboundMsg = [...messages].reverse().find(
        (m) => m.direction === 'inbound' || (m as any).senderType === 'customer'
      );
      if (latestInboundMsg) {
        const msgTime =
          latestInboundMsg.sentAt ||
          latestInboundMsg.createdAt ||
          (latestInboundMsg as any).sent_at ||
          (latestInboundMsg as any).created_at;
        if (msgTime) {
          const mt = new Date(msgTime).getTime();
          if (!isNaN(mt) && mt > 0) {
            if (lastInboundTimeMs === null || mt > lastInboundTimeMs) {
              lastInboundTimeMs = mt;
            }
          }
        }
      }

      if (lastInboundTimeMs === null) {
        return 0;
      }

      const expiresTime = lastInboundTimeMs + 24 * 60 * 60 * 1000;
      const now = Date.now();
      return Math.max(0, Math.floor((expiresTime - now) / 1000));
    };

    setSessionSecondsLeft(calculateRemaining());

    const timer = setInterval(() => {
      setSessionSecondsLeft(calculateRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeConversation, messages]);

  // Media attachment handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      showToast('File size exceeds 50MB limit', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedMediaFile(file);
    if (file.type.startsWith('image/')) {
      setMediaPreviewUrl(URL.createObjectURL(file));
    } else {
      setMediaPreviewUrl(null);
    }
    setMediaCaption('');
    setIsMediaModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMedia = async () => {
    if (!selectedConvId || !selectedMediaFile) return;

    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', selectedMediaFile);
    if (mediaCaption.trim()) {
      formData.append('caption', mediaCaption.trim());
    }

    try {
      const sentMsg = await conversationsApi.sendMedia(selectedConvId, formData);
      setMessages((prev) => [...prev, sentMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                lastMessageText: mediaCaption.trim() ? `[Media] ${mediaCaption.trim()}` : `[Media: ${selectedMediaFile.name}]`,
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
      setTimeout(scrollToBottom, 50);
      setIsMediaModalOpen(false);
      setSelectedMediaFile(null);
      setMediaPreviewUrl(null);
      setMediaCaption('');
      showToast('Media sent successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send media', 'error');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // WhatsApp Quick Template Selector & Dispatch Handlers
  const openTemplateModal = async () => {
    if (!activeConversation) return;
    const channelId = activeConversation.channelId || (activeConversation as any).channel_id;

    setIsTemplateModalOpen(true);
    setIsLoadingTemplates(true);
    setSelectedTemplate(null);
    setTemplateParams({});
    setTemplateHeaderValue('');

    try {
      if (channelId) {
        const templates = await channelsApi.getTemplates(channelId);
        const approved = templates.filter((t) => !t.status || t.status.toUpperCase() === 'APPROVED');
        const listToShow = approved.length > 0 ? approved : templates;
        if (listToShow && listToShow.length > 0) {
          setChannelTemplates(listToShow);
          registerDynamicTemplates(listToShow);
          handleSelectTemplate(listToShow[0]);
        } else {
          setChannelTemplates(APPROVED_TEMPLATES_CATALOG);
          registerDynamicTemplates(APPROVED_TEMPLATES_CATALOG);
          handleSelectTemplate(APPROVED_TEMPLATES_CATALOG[0]);
        }
      } else {
        setChannelTemplates(APPROVED_TEMPLATES_CATALOG);
        registerDynamicTemplates(APPROVED_TEMPLATES_CATALOG);
        handleSelectTemplate(APPROVED_TEMPLATES_CATALOG[0]);
      }
    } catch (err) {
      console.warn('Using catalog fallback templates:', err);
      setChannelTemplates(APPROVED_TEMPLATES_CATALOG);
      registerDynamicTemplates(APPROVED_TEMPLATES_CATALOG);
      handleSelectTemplate(APPROVED_TEMPLATES_CATALOG[0]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl);
    const newParams: Record<string, string> = {};

    const headerComp = tpl.components?.find((c) => c.type === 'HEADER');
    let defaultHeaderValue = '';
    if (headerComp?.example?.header_handle?.[0]) {
      defaultHeaderValue = headerComp.example.header_handle[0];
    }

    tpl.components?.forEach((comp) => {
      if (comp.type === 'BODY' && comp.text) {
        const matches = comp.text.match(/\{\{([0-9]+)\}\}/g);
        if (matches) {
          matches.forEach((m) => {
            const num = m.replace(/[\{\}]/g, '');
            if (num === '1' && (activeConversation?.contactName || contact?.name)) {
              newParams[num] = activeConversation?.contactName || contact?.name || '';
            } else {
              newParams[num] = '';
            }
          });
        }
      }
    });

    setTemplateParams(newParams);
    setTemplateHeaderValue(defaultHeaderValue);
  };

  const handleSendTemplate = async () => {
    if (!selectedConvId || !selectedTemplate) return;

    setIsSendingTemplate(true);

    const headerComp = selectedTemplate.components?.find((c) => c.type === 'HEADER');
    const headerType = headerComp?.format as any;
    const finalHeaderValue = templateHeaderValue.trim() || headerComp?.example?.header_handle?.[0] || undefined;

    try {
      const sentMsg = await conversationsApi.sendTemplate(selectedConvId, {
        templateName: selectedTemplate.name,
        templateLanguage: selectedTemplate.language || 'en',
        templateParams,
        headerType: headerType && ['TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerType) ? headerType : undefined,
        headerValue: finalHeaderValue,
      });

      setMessages((prev) => [...prev, sentMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? {
                ...c,
                lastMessageText: `[Template: ${selectedTemplate.name}]`,
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
      setTimeout(scrollToBottom, 50);
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      setTemplateParams({});
      setTemplateHeaderValue('');
      showToast(`Template "${selectedTemplate.name}" sent successfully`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send template', 'error');
    } finally {
      setIsSendingTemplate(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingRef.current || !messageText.trim() || !selectedConvId) return;

    const textToSend = messageText.trim();
    isSendingRef.current = true;
    setIsSending(true);
    setMessageText('');

    try {
      const sentMsg = await conversationsApi.sendMessage(selectedConvId, textToSend);
      setMessages((prev) => [...prev, sentMsg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, lastMessageText: textToSend, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
      setTimeout(scrollToBottom, 50);
      showToast('Message sent', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
      setMessageText(textToSend); // restore on error
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  // Create Deal from conversation
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation?.contactId || !newDealTitle.trim()) return;

    try {
      const deal = await dealsApi.create({
        contactId: activeConversation.contactId,
        title: newDealTitle.trim(),
        stage: newDealStage,
        value: Number(newDealValue) || 0,
      });
      setDeals((prev) => [...prev, deal]);
      setIsDealModalOpen(false);
      setNewDealTitle('');
      showToast('Deal created successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create deal', 'error');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      (c.contactName && c.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.contactExternalId && c.contactExternalId.includes(searchQuery)) ||
      (c.lastMessageText && c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChannel = channelFilter === 'all' || c.channelType === channelFilter;

    return matchesSearch && matchesChannel;
  });

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-200/80 shadow-sm flex overflow-hidden">
      {/* ==================== LEFT PANE: Conversations List ==================== */}
      <div className="w-80 lg:w-96 border-r border-gray-200 flex flex-col shrink-0 bg-slate-50/50">
        {/* Header & Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                Inbox ({conversations.length})
              </h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors',
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : wsStatus === 'connecting' || wsStatus === 'reconnecting'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                )}
                title={`WebSocket: ${wsStatus}`}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isConnected
                      ? 'bg-emerald-500 animate-pulse'
                      : wsStatus === 'connecting' || wsStatus === 'reconnecting'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-gray-400'
                  )}
                />
                {isConnected ? 'Live' : wsStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
              </span>
            </div>
            <button
              onClick={loadConversations}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-100 border border-transparent focus:bg-white focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Status & Channel Filters */}
          <div className="flex items-center gap-1.5 pt-1">
            {(['all', 'open', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors',
                  filterStatus === status
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status}
              </button>
            ))}

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="ml-auto text-[11px] bg-gray-100 font-semibold text-gray-700 px-2 py-1 rounded-lg border-0 focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-hide">
          {isLoadingList ? (
            <div className="py-12">
              <Spinner size="md" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSearchParams({ id: conv.id })}
                  className={cn(
                    'p-3.5 cursor-pointer transition-all duration-150 flex items-start gap-3 hover:bg-white',
                    isSelected ? 'bg-white border-l-4 border-l-primary-600 shadow-xs' : 'bg-transparent'
                  )}
                >
                  {/* Channel/Avatar Icon */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 uppercase">
                      {conv.contactName ? conv.contactName.substring(0, 2) : 'CT'}
                    </div>
                    <span
                      className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold ring-2 ring-white',
                        conv.channelType === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'
                      )}
                    >
                      {conv.channelType === 'whatsapp' ? 'W' : 'T'}
                    </span>
                  </div>

                  {/* Conversation details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          'text-xs font-semibold truncate',
                          isSelected ? 'text-primary-900' : 'text-gray-900'
                        )}
                      >
                        {conv.contactName || conv.contactExternalId || 'Unknown'}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatRelativeTime(conv.lastMessageAt || conv.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {conv.lastMessageText || 'No message preview'}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge
                        variant={conv.status === 'open' ? 'success' : 'secondary'}
                        size="sm"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {conv.status}
                      </Badge>
                      {conv.channelDisplayName && (
                        <span className="text-[10px] text-gray-400 truncate">
                          {conv.channelDisplayName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== MIDDLE PANE: Active Chat Messages ==================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs uppercase">
                  {activeConversation.contactName ? activeConversation.contactName.substring(0, 2) : 'CT'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {activeConversation.contactName || activeConversation.contactExternalId}
                    </h3>
                    <Badge variant={activeConversation.channelType === 'whatsapp' ? 'success' : 'primary'} size="sm">
                      {activeConversation.channelType}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {activeConversation.contactExternalId || 'No external phone'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRightPaneTab(rightPaneTab === 'copilot' ? 'crm' : 'copilot')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs border',
                    rightPaneTab === 'copilot'
                      ? 'bg-violet-600 text-white border-violet-600 shadow-violet-500/20'
                      : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'
                  )}
                  title="Toggle AI Copilot Drawer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Copilot</span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDealModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5 text-primary-600" />}
                >
                  Add Deal
                </Button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-hide">
              {isLoadingMessages ? (
                <div className="py-12">
                  <Spinner size="md" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center text-gray-400 text-xs">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  No messages in this conversation yet. Send the first message below.
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOutbound = msg.direction === 'outbound';
                  const mediaUrl = getMediaUrl(msg);
                  const msgType = msg.type || msg.content?.type || 'text';
                  const isImage = msgType === 'image' || msgType === 'sticker';
                  const isDocument = msgType === 'document';
                  const isAudio = msgType === 'audio';
                  const isVideo = msgType === 'video';
                  const isTemplate =
                    msgType === 'template' ||
                    !!msg.content?.templateName ||
                    !!msg.content?.template_name ||
                    (typeof msg.text === 'string' && msg.text.startsWith('[Template:'));
                  const isOrder = msgType === 'order' || !!(msg.raw as any)?.order || !!msg.content?.order;
                  const rawOrderData = (msg.raw as any)?.order || msg.content?.order;
                  const orderProductItems: Array<{ product_retailer_id?: string; sku?: string; name?: string; quantity?: number; item_price?: number; unitPrice?: number; currency?: string }> =
                    rawOrderData?.product_items || msg.content?.product_items || msg.content?.items || [];
                  const orderCustomerNote = rawOrderData?.text || msg.content?.customerNote || msg.content?.text;
                  const orderCurrency = orderProductItems[0]?.currency || 'INR';
                  const orderTotal = orderProductItems.reduce(
                    (acc, item) => acc + (Number(item.item_price || item.unitPrice || 0) * Number(item.quantity || 1)),
                    0
                  );

                  return (
                    <div
                      key={msg._id || msg.id || index}
                      className={cn('flex flex-col', isOutbound ? 'items-end' : 'items-start')}
                    >
                      {isTemplate ? (
                        <div className={cn('flex flex-col max-w-[420px]', isOutbound ? 'items-end' : 'items-start')}>
                          <WhatsAppTemplateCard
                            message={msg}
                            knownTemplates={channelTemplates}
                            isOutbound={isOutbound}
                            onQuickReplyClick={(replyText) => {
                              setMessageText(replyText);
                            }}
                          />
                          {/* Message Timestamp & Status Ticks */}
                          <div
                            className={cn(
                              'flex items-center gap-1 text-[10px] pt-1 px-1',
                              isOutbound ? 'text-gray-400 justify-end' : 'text-gray-400 justify-start'
                            )}
                          >
                            <span>{formatDateTime(msg.createdAt || msg.sentAt)}</span>
                            {isOutbound && (
                              <span className="flex items-center ml-0.5" title={`Status: ${msg.status || 'sent'}`}>
                                {msg.status === 'failed' ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                ) : msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* Failure Error Callout Banner for Templates */}
                          {msg.status === 'failed' && (
                            <div className="mt-1.5 flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-400 w-full shadow-xs">
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-[11px] uppercase tracking-wide text-rose-800 dark:text-rose-300">
                                  Delivery Failed {msg.errorCode || msg.error_code ? `(Error #${msg.errorCode || msg.error_code})` : ''}
                                </p>
                                <p className="text-xs text-rose-700 dark:text-rose-400 leading-snug mt-0.5 break-words">
                                  {msg.errorMessage || msg.error_message || (msg.errorCode || msg.error_code ? `Meta Error Code: ${msg.errorCode || msg.error_code}` : 'Message delivery failed. Please verify your WhatsApp channel connection.')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'max-w-md px-3.5 py-2.5 rounded-2xl shadow-xs text-xs space-y-1.5',
                            isOutbound
                              ? 'bg-primary-600 text-white rounded-tr-none'
                              : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-none'
                          )}
                        >
                          {/* 1. Image / Sticker Attachment */}
                          {isImage && mediaUrl && (
                            <div className="relative group overflow-hidden rounded-xl border border-black/5 mb-1.5">
                              <img
                                src={mediaUrl}
                                alt={msg.text || 'Received image'}
                                className="max-h-64 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => setPreviewImage(mediaUrl)}
                                loading="lazy"
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(mediaUrl)}
                                  className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs"
                                  title="View full image"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 2. Document / PDF Attachment */}
                          {isDocument && (
                            <div
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border mb-1.5',
                                isOutbound
                                  ? 'bg-primary-700/40 border-primary-400/30 text-white'
                                  : 'bg-gray-50 border-gray-200 text-gray-800'
                              )}
                            >
                              <div className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                isOutbound ? 'bg-primary-500/50' : 'bg-red-50 text-red-600'
                              )}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs truncate">
                                  {msg.content?.filename || (msg.text?.startsWith('[Document') ? msg.text.replace(/^\[Document:?\s*|\]$/g, '') : msg.text) || 'Document'}
                                </p>
                                <p className={cn('text-[10px]', isOutbound ? 'text-primary-200' : 'text-gray-400')}>
                                  {msg.content?.filesize ? `${Math.round(msg.content.filesize / 1024)} KB` : 'Attachment'}
                                </p>
                              </div>
                              {mediaUrl && (
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className={cn(
                                    'p-2 rounded-lg transition-colors shrink-0',
                                    isOutbound
                                      ? 'bg-white/20 hover:bg-white/30 text-white'
                                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                                  )}
                                  title="Download document"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* 3. Audio / Voice Note */}
                          {isAudio && (
                            <div className="pt-1 pb-0.5 min-w-[240px]">
                              {mediaUrl ? (
                                <audio
                                  controls
                                  src={mediaUrl}
                                  className="w-full h-8"
                                  preload="metadata"
                                />
                              ) : (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-black/10 text-xs">
                                  <Music className="w-4 h-4" />
                                  <span>Voice / Audio message</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. Video Player */}
                          {isVideo && mediaUrl && (
                            <div className="rounded-xl overflow-hidden mb-1.5 border border-black/5">
                              <video
                                controls
                                src={mediaUrl}
                                className="max-h-64 w-full rounded-xl"
                                preload="metadata"
                              />
                            </div>
                          )}

                          {/* 5. WhatsApp Inbound Cart / Order */}
                          {isOrder && (
                            <div
                              className={cn(
                                'p-3 rounded-xl border mb-1.5 space-y-2 min-w-[240px]',
                                isOutbound
                                  ? 'bg-primary-700/40 border-primary-400/30 text-white'
                                  : 'bg-emerald-50/80 border-emerald-200 text-gray-900'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                  <span>WhatsApp Cart Order</span>
                                </div>
                                <Badge variant="success" size="sm">
                                  Cart
                                </Badge>
                              </div>

                              {/* Product Items */}
                              <div className="space-y-1 pt-0.5">
                                {orderProductItems.length > 0 ? (
                                  orderProductItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <div className="truncate max-w-[180px]">
                                        <span className="font-semibold text-gray-800">
                                          {item.name || item.product_retailer_id || item.sku || `Item #${idx + 1}`}
                                        </span>
                                        <span className="text-[11px] text-gray-500 ml-1.5 font-medium">
                                          x{item.quantity || 1}
                                        </span>
                                      </div>
                                      <span className="font-semibold text-gray-900 shrink-0 ml-2">
                                        {item.currency || 'INR'}{' '}
                                        {(
                                          Number(item.item_price || item.unitPrice || 0) * Number(item.quantity || 1)
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs italic text-gray-500">Cart items received from customer</p>
                                )}
                              </div>

                              {/* Total Amount & Notes */}
                              {orderProductItems.length > 0 && (
                                <div className="border-t border-emerald-200/60 pt-1.5 flex items-center justify-between text-xs font-bold">
                                  <span>Estimated Total:</span>
                                  <span className="text-emerald-700 font-extrabold text-sm">
                                    {orderCurrency} {orderTotal.toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {orderCustomerNote && (
                                <p className="text-[11px] text-gray-600 italic bg-white/70 p-1.5 rounded-lg border border-emerald-100">
                                  Note: "{orderCustomerNote}"
                                </p>
                              )}

                              <div className="pt-0.5">
                                <Link
                                  to="/orders"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                >
                                  <span>Manage in Orders</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          )}

                          {/* Message Text (Hide placeholder [Image]/[Audio] if media is rendered directly) */}
                          {(!mediaUrl || (!isImage && !isVideo && !isAudio && !isDocument) || (msg.text && !['[Image]', '[Audio]', '[Video]', '[Sticker]', '[Document]'].includes(msg.text.trim()) && !msg.text.startsWith('[Template:'))) && !isOrder && (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          )}

                          {/* Message Timestamp & Status Ticks */}
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 text-[10px] pt-1',
                              isOutbound ? 'text-primary-100' : 'text-gray-400'
                            )}
                          >
                            <span>{formatDateTime(msg.createdAt || msg.sentAt)}</span>
                            {isOutbound && (
                              <span className="flex items-center ml-0.5" title={`Status: ${msg.status || 'sent'}`}>
                                {msg.status === 'failed' ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                                ) : msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-primary-200" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-primary-200" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Outbound Failure Error Callout Banner for Regular Messages */}
                      {isOutbound && !isTemplate && msg.status === 'failed' && (
                        <div className="mt-1.5 flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-400 max-w-md shadow-xs">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[11px] uppercase tracking-wide text-rose-800 dark:text-rose-300">
                              Delivery Failed {msg.errorCode || msg.error_code ? `(Error #${msg.errorCode || msg.error_code})` : ''}
                            </p>
                            <p className="text-xs text-rose-700 dark:text-rose-400 leading-snug mt-0.5 break-words">
                              {msg.errorMessage || msg.error_message || (msg.errorCode || msg.error_code ? `Meta Error Code: ${msg.errorCode || msg.error_code}` : 'Message delivery failed. Please verify your WhatsApp channel connection.')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Reply Suggestions Bar */}
            {activeConversation && showSuggestions && (
              <div className="px-4 py-2 bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-indigo-50/80 border-t border-violet-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-800 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
                  <span>Smart Reply:</span>
                </div>

                {isLoadingSuggestions ? (
                  <div className="flex items-center gap-2 text-xs text-violet-600 py-0.5">
                    <Spinner size="sm" />
                    <span className="text-[11px] font-medium">Generating AI suggestions...</span>
                  </div>
                ) : replySuggestions.length > 0 ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {replySuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMessageText(suggestion.text)}
                        className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-violet-600 hover:text-white border border-violet-200/90 text-xs font-medium text-gray-800 transition-all shadow-2xs hover:shadow-xs shrink-0 max-w-[280px]"
                        title={suggestion.text}
                      >
                        <span className="truncate">{suggestion.text}</span>
                        {suggestion.confidence ? (
                          <span className="text-[9px] font-bold px-1 rounded bg-violet-100 group-hover:bg-violet-700 group-hover:text-white text-violet-800 shrink-0">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fetchSmartReplies()}
                    className="text-[11px] text-violet-700 hover:text-violet-950 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>Get suggestions</span>
                    <Wand2 className="w-3 h-3" />
                  </button>
                )}

                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchSmartReplies()}
                    disabled={isLoadingSuggestions}
                    className="p-1 rounded-lg text-violet-600 hover:text-violet-900 hover:bg-violet-100/60 transition-colors"
                    title="Refresh Suggestions"
                  >
                    <RefreshCw className={cn("w-3 h-3", isLoadingSuggestions && "animate-spin")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    title="Hide Suggestions"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Composer Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              {/* Hidden File Input for Media Uploads */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,application/pdf,text/*,.doc,.docx,.xls,.xlsx,.zip"
              />

              {activeConversation.channelType === 'whatsapp' && sessionSecondsLeft === 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-2.5 text-rose-800 text-xs">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">24-Hour Customer Care Window Expired</span>
                      <span className="text-[11px] text-rose-700">
                        Meta blocks freeform text & media after 24 hours of inactivity. Re-engage this customer by sending an approved WhatsApp Business template.
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white shrink-0 font-semibold"
                    onClick={openTemplateModal}
                    icon={<FileCheck className="w-4 h-4" />}
                  >
                    Send Template Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    title="Attach Media (Image, PDF, Document, Video, Audio)"
                    className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {activeConversation.channelType === 'whatsapp' && (
                    <button
                      type="button"
                      onClick={openTemplateModal}
                      disabled={isSending}
                      title="Send WhatsApp Business Template"
                      className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                    >
                      <FileCheck className="w-4 h-4" />
                    </button>
                  )}

                  <input
                    type="text"
                    placeholder={isSending ? "Sending message..." : "Type a reply..."}
                    value={messageText}
                    disabled={isSending}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-gray-100 border border-transparent focus:bg-white focus:border-primary-500 focus:outline-none disabled:opacity-60"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!messageText.trim() || isSending}
                    isLoading={isSending}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Send
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-400">
            <div>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Select a conversation</h3>
              <p className="text-xs text-gray-500 mt-1">Choose a chat from the left pane to view messages.</p>
            </div>
          </div>
        )}
      </div>

      {/* ==================== RIGHT PANE: Contact Details, CRM Deals & AI Copilot ==================== */}
      {activeConversation && (
        <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto hidden xl:block space-y-4">
          {/* Dual-Tab Navigation: Profile & CRM vs AI Copilot */}
          <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setRightPaneTab('crm')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all',
                rightPaneTab === 'crm'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <User className="w-3.5 h-3.5 text-primary-600" />
              <span>CRM & Deals</span>
            </button>
            <button
              onClick={() => setRightPaneTab('copilot')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all',
                rightPaneTab === 'copilot'
                  ? 'bg-white text-violet-700 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-violet-700'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Copilot</span>
            </button>
          </div>

          {rightPaneTab === 'crm' ? (
            <div className="space-y-6">
              {/* Contact Details */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Contact Details
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-900">
                      {contact?.name || activeConversation.contactName || 'No Name Set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Radio className="w-3.5 h-3.5 text-gray-400" />
                    <span className="capitalize">{activeConversation.channelType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{contact?.externalId || activeConversation.contactExternalId}</span>
                  </div>
                  {contact?.attributes?.email && (
                    <div className="text-xs text-gray-600 truncate">
                      ✉️ {contact.attributes.email}
                    </div>
                  )}
                  {contact?.attributes?.tags && contact.attributes.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {contact.attributes.tags.map((t: string) => (
                        <Badge key={t} variant="secondary" size="sm">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CRM Deals associated with this contact */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Deals ({deals.length})
                  </h4>
                  <button
                    onClick={() => setIsDealModalOpen(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-2">
                  {deals.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No deals attached to this contact.</p>
                  ) : (
                    deals.map((deal) => (
                      <div key={deal.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{deal.title}</span>
                          <Badge variant="warning" size="sm">
                            {deal.stage}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-primary-700">
                          ${((Number(deal.value) || 0) / 100).toLocaleString('en-US')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Customer Orders */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Orders ({orders.length})
                  </h4>
                  <Link
                    to="/orders"
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {orders.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No orders found for this contact.</p>
                  ) : (
                    orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{ord.orderNumber}</span>
                          <Badge
                            variant={
                              ord.status === 'completed'
                                ? 'success'
                                : ord.status === 'cancelled' || ord.status === 'refunded'
                                ? 'danger'
                                : ord.status === 'paid' || ord.status === 'processing'
                                ? 'purple'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {ord.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ord.items?.length || 0} items</span>
                          <span className="font-bold text-emerald-700">
                            {ord.currency} {(ord.totalAmount ?? ord.total_amount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-0.5 text-[10px] text-gray-400">
                          <span>
                            Payment:{' '}
                            <strong className={(ord.paymentStatus || ord.payment_status) === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                              {ord.paymentStatus || ord.payment_status}
                            </strong>
                          </span>
                          <span>
                            {ord.createdAt || ord.created_at ? new Date(ord.createdAt || ord.created_at || '').toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* AI Copilot Suite */
            <div className="space-y-4">
              {/* Copilot Sub-Navigation */}
              <div className="flex items-center gap-1 p-0.5 bg-violet-50/80 rounded-xl border border-violet-200/60">
                <button
                  type="button"
                  onClick={() => setCopilotTab('summary')}
                  className={cn(
                    'flex-1 py-1 text-[11px] font-bold rounded-lg transition-all',
                    copilotTab === 'summary' ? 'bg-white text-violet-800 shadow-2xs' : 'text-violet-600 hover:text-violet-900'
                  )}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCopilotTab('rephrase');
                    if (!rephraseInput && messageText) {
                      setRephraseInput(messageText);
                    }
                  }}
                  className={cn(
                    'flex-1 py-1 text-[11px] font-bold rounded-lg transition-all',
                    copilotTab === 'rephrase' ? 'bg-white text-violet-800 shadow-2xs' : 'text-violet-600 hover:text-violet-900'
                  )}
                >
                  Rephrase
                </button>
                <button
                  type="button"
                  onClick={() => setCopilotTab('classify')}
                  className={cn(
                    'flex-1 py-1 text-[11px] font-bold rounded-lg transition-all',
                    copilotTab === 'classify' ? 'bg-white text-violet-800 shadow-2xs' : 'text-violet-600 hover:text-violet-900'
                  )}
                >
                  Classifier
                </button>
              </div>

              {/* 1. Summary Sub-Tool */}
              {copilotTab === 'summary' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-violet-600" />
                      Thread Summary
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSummary}
                      isLoading={isLoadingSummary}
                      icon={<Sparkles className="w-3 h-3 text-violet-600" />}
                    >
                      {conversationSummary ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>

                  {isLoadingSummary ? (
                    <div className="p-6 rounded-2xl bg-violet-50/50 border border-violet-100 text-center space-y-2">
                      <Spinner size="sm" />
                      <p className="text-xs text-violet-700 font-medium">Analyzing conversation context & sentiment...</p>
                    </div>
                  ) : conversationSummary ? (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {/* Sentiment & Intent Badges */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-violet-50/70 border border-violet-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-violet-900">Sentiment:</span>
                          <Badge
                            variant={
                              conversationSummary.sentiment === 'positive'
                                ? 'success'
                                : conversationSummary.sentiment === 'negative'
                                ? 'danger'
                                : conversationSummary.sentiment === 'mixed'
                                ? 'warning'
                                : 'secondary'
                            }
                            size="sm"
                          >
                            {conversationSummary.sentiment || 'neutral'}
                          </Badge>
                        </div>
                        {(conversationSummary.mainIntent || conversationSummary.intent) && (
                          <div className="flex items-center gap-1">
                            <Badge variant="purple" size="sm" className="font-mono">
                              {conversationSummary.mainIntent || conversationSummary.intent}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Summary Text */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-gray-200/70 text-xs text-gray-800 leading-relaxed">
                        <p className="font-medium">{conversationSummary.summary}</p>
                      </div>

                      {/* Key Bullets */}
                      {conversationSummary.keyPoints && conversationSummary.keyPoints.length > 0 && (
                        <div className="space-y-1.5">
                          <h5 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                            Key Details
                          </h5>
                          <ul className="space-y-1">
                            {conversationSummary.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-violet-500 font-bold">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items / Suggested Action */}
                      {((conversationSummary.actionItems && conversationSummary.actionItems.length > 0) || conversationSummary.suggestedAction) && (
                        <div className="space-y-1.5">
                          <h5 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Next Action Items
                          </h5>
                          <div className="space-y-1">
                            {(conversationSummary.actionItems || (conversationSummary.suggestedAction ? [conversationSummary.suggestedAction] : [])).map((item, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between gap-2 text-xs text-emerald-950"
                              >
                                <span className="truncate">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => setMessageText(item)}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 shrink-0 hover:underline"
                                  title="Insert item into composer"
                                >
                                  Use
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center space-y-2">
                      <Brain className="w-8 h-8 mx-auto text-violet-400 opacity-60" />
                      <p className="text-xs text-gray-600 font-medium">No summary generated yet.</p>
                      <p className="text-[11px] text-gray-400">Click the button above to analyze this chat.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Rephrase Sub-Tool */}
              {copilotTab === 'rephrase' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-800">Draft Message</label>
                      {messageText && (
                        <button
                          type="button"
                          onClick={() => setRephraseInput(messageText)}
                          className="text-[10px] text-violet-600 hover:text-violet-900 font-semibold"
                        >
                          Copy from Composer
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={rephraseInput}
                      onChange={(e) => setRephraseInput(e.target.value)}
                      placeholder="Type or paste your draft reply here..."
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  {/* Tone Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Select Tone Persona
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'professional', label: '👔 Professional' },
                        { id: 'friendly', label: '😊 Friendly' },
                        { id: 'concise', label: '⚡ Concise' },
                        { id: 'bullet_points', label: '📋 Bullet Points' },
                        { id: 'sales_pitch', label: '🎯 Sales Pitch' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setRephraseTone(t.id as any)}
                          className={cn(
                            'py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all border text-left truncate',
                            rephraseTone === t.id
                              ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-violet-50 hover:border-violet-200'
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    onClick={handleRephraseMessage}
                    isLoading={isRephrasing}
                    icon={<Wand2 className="w-3.5 h-3.5" />}
                  >
                    Rephrase with AI
                  </Button>

                  {/* Rephrased Result Card */}
                  {rephraseResult && (
                    <div className="p-3 bg-violet-50/80 rounded-xl border border-violet-200 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-violet-900 uppercase tracking-wider">
                          Rephrased Output
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(rephraseResult);
                              showToast('Copied to clipboard', 'success');
                            }}
                            className="p-1 rounded text-violet-600 hover:text-violet-900 hover:bg-violet-100"
                            title="Copy text"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-lg border border-violet-100">
                        {rephraseResult}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white hover:bg-violet-50 text-violet-700 border-violet-300 font-bold"
                        onClick={() => {
                          setMessageText(rephraseResult);
                          showToast('Inserted into composer', 'success');
                        }}
                        icon={<CornerDownLeft className="w-3.5 h-3.5" />}
                      >
                        Insert into Composer
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Intent & Urgency Classifier Sub-Tool */}
              {copilotTab === 'classify' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      Customer Message to Classify
                    </label>
                    <textarea
                      rows={3}
                      value={classifyText}
                      onChange={(e) => setClassifyText(e.target.value)}
                      placeholder="Paste incoming message to detect intent and urgency..."
                      className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-700"
                    onClick={() => handleClassifyIntent()}
                    isLoading={isClassifying}
                    icon={<Zap className="w-3.5 h-3.5" />}
                  >
                    Classify Intent & Urgency
                  </Button>

                  {intentClassification && (
                    <div className="p-3 bg-fuchsia-50/70 rounded-xl border border-fuchsia-200 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-fuchsia-900 uppercase tracking-wider">
                          Classification Result
                        </span>
                        <Badge
                          variant={
                            intentClassification.urgency === 'critical'
                              ? 'danger'
                              : intentClassification.urgency === 'high'
                              ? 'warning'
                              : 'secondary'
                          }
                          size="sm"
                        >
                          Urgency: {intentClassification.urgency || 'medium'}
                        </Badge>
                      </div>

                      <div className="space-y-1 bg-white p-2.5 rounded-lg border border-fuchsia-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Detected Intent:</span>
                          <span className="font-mono font-bold text-fuchsia-900">
                            {intentClassification.intent}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Sentiment:</span>
                          <Badge variant="secondary" size="sm">
                            {intentClassification.sentiment || 'neutral'}
                          </Badge>
                        </div>
                        {intentClassification.confidence ? (
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>Confidence:</span>
                              <span className="font-mono font-bold">
                                {Math.round(intentClassification.confidence * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-fuchsia-600 rounded-full"
                                style={{ width: `${Math.round(intentClassification.confidence * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {intentClassification.entities && Object.keys(intentClassification.entities).length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            Extracted Entities:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(intentClassification.entities).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-fuchsia-200 font-mono text-fuchsia-950">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Send Media Modal */}
      <Modal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setSelectedMediaFile(null);
          setMediaPreviewUrl(null);
          setMediaCaption('');
        }}
        title="Send Media Attachment"
        description={`Attach and send a file to ${activeConversation?.contactName || 'contact'}`}
      >
        <div className="space-y-4">
          {selectedMediaFile && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              {mediaPreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden bg-black/5 max-h-60 flex items-center justify-center">
                  <img src={mediaPreviewUrl} alt="Upload preview" className="max-h-60 max-w-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <FileText className="w-8 h-8 text-primary-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{selectedMediaFile.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {(selectedMediaFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedMediaFile.type || 'Document'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Add an optional caption to your media..."
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              disabled={isUploadingMedia}
              onClick={() => {
                setIsMediaModalOpen(false);
                setSelectedMediaFile(null);
                setMediaPreviewUrl(null);
                setMediaCaption('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={!selectedMediaFile || isUploadingMedia}
              isLoading={isUploadingMedia}
              onClick={handleSendMedia}
              icon={<Send className="w-4 h-4" />}
            >
              Send Attachment
            </Button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp Quick Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Send WhatsApp Template Message"
        description="Re-engage customers or send structured notifications using pre-approved Meta HSM templates."
      >
        <div className="space-y-4">
          {isLoadingTemplates ? (
            <div className="p-8 text-center space-y-2">
              <Spinner size="md" />
              <p className="text-xs text-gray-500">Loading approved WhatsApp templates...</p>
            </div>
          ) : channelTemplates.length === 0 ? (
            <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-xs font-bold text-amber-900">No Approved Templates Found</h4>
              <p className="text-xs text-amber-700">
                This WhatsApp channel doesn't have any approved templates yet. Sync templates in Channel Settings or create new templates in Meta Business Suite.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Template Selector Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Choose Template
                </label>
                <select
                  value={selectedTemplate?.name || ''}
                  onChange={(e) => {
                    const tpl = channelTemplates.find((t) => t.name === e.target.value);
                    if (tpl) handleSelectTemplate(tpl);
                  }}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 bg-white font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none"
                >
                  {channelTemplates.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} ({t.language}) {t.category ? `• ${t.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Parameter Inputs */}
              {selectedTemplate && (
                <div className="space-y-3">
                  {/* Header parameter if applicable for text variables */}
                  {selectedTemplate.components?.some((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text?.includes('{{1}}')) && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Header Variable {'{{1}}'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Order #1234"
                        value={templateHeaderValue}
                        onChange={(e) => setTemplateHeaderValue(e.target.value)}
                        className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  )}

                  {/* Header Media URL for IMAGE / VIDEO / DOCUMENT */}
                  {selectedTemplate.components?.some((c) => c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format || '')) && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Header Media URL (Optional — Pre-filled with Meta approved asset)
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={templateHeaderValue}
                        onChange={(e) => setTemplateHeaderValue(e.target.value)}
                        className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500 font-mono text-[11px]"
                      />
                    </div>
                  )}

                  {Object.keys(templateParams).length > 0 && (
                    <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Fill Template Variables:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.keys(templateParams).map((paramKey) => (
                          <div key={paramKey}>
                            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                              Variable {'{{' + paramKey + '}}'}
                            </label>
                            <input
                              type="text"
                              placeholder={`Value for {{${paramKey}}}`}
                              value={templateParams[paramKey] || ''}
                              onChange={(e) =>
                                setTemplateParams((prev) => ({ ...prev, [paramKey]: e.target.value }))
                              }
                              className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live WhatsApp Bubble Preview */}
                  <div>
                    <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Live WhatsApp Chat Preview:
                    </span>
                    <div className="p-3 bg-[#EFEAE2] dark:bg-gray-900/80 rounded-xl border border-[#D1D7DB] dark:border-gray-700 flex justify-center">
                      <WhatsAppTemplateCard
                        message={{
                          type: 'template',
                          direction: 'outbound',
                          content: {
                            templateName: selectedTemplate.name,
                            templateParams,
                            headerType: selectedTemplate.components?.find((c) => c.type === 'HEADER')?.format as any,
                            headerValue: templateHeaderValue.trim() || selectedTemplate.components?.find((c) => c.type === 'HEADER')?.example?.header_handle?.[0],
                            mediaUrl: templateHeaderValue.trim() || selectedTemplate.components?.find((c) => c.type === 'HEADER')?.example?.header_handle?.[0],
                            bodyText: selectedTemplate.components?.find((c) => c.type === 'BODY')?.text,
                            footerText: selectedTemplate.components?.find((c) => c.type === 'FOOTER')?.text,
                            buttons: (selectedTemplate.components?.find((c) => c.type === 'BUTTONS') as any)?.buttons,
                          },
                        }}
                        knownTemplates={channelTemplates}
                        isOutbound={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsTemplateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  disabled={!selectedTemplate || isSendingTemplate}
                  isLoading={isSendingTemplate}
                  onClick={handleSendTemplate}
                  icon={<Send className="w-4 h-4" />}
                >
                  Send Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Deal Modal */}
      <Modal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        title="Create New Deal"
        description="Attach a CRM deal to this contact"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input
            label="Deal Title"
            placeholder="e.g. Enterprise License"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
            required
          />

          <Input
            label="Deal Value (in Cents)"
            type="number"
            placeholder="10000 = $100.00"
            value={newDealValue}
            onChange={(e) => setNewDealValue(e.target.value)}
            helperText="Stored in cents. 10000 = $100.00"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Stage
            </label>
            <select
              value={newDealStage}
              onChange={(e) => setNewDealStage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
            >
              <option value="Lead">Lead</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsDealModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Deal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Media Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex gap-2">
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium backdrop-blur-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download full size
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
