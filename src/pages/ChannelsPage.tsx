import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Radio,
  Plus,
  QrCode,
  FileText,
  Workflow,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Copy,
  Download,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Zap,
  Globe,
  Shield,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Settings,
  Trash2,
  Phone,
  Bot,
  Key,
  Clock,
  XCircle,
  Info,
  MessageSquare,
  MessageCircle,
  Palette,
  Code,
  Share2,
  Check,
  Layers,
} from 'lucide-react';
import { channelsApi, whatsappOnboardingApi, flowsApi, webchatApi } from '../api';
import {
  Channel,
  ChannelSettings,
  WhatsAppOnboardingConfig,
  OnboardingCapacity,
  WhatsAppTemplate,
  Flow,
  DeepLinkResponse,
  WebchatWidget as IWebchatWidget,
  WebchatBusinessHours,
  PublicWidgetConfig,
} from '../types';
import { WebchatWidget as LiveWebchatWidgetPreview } from '../components/webchat/WebchatWidget';
import { cn } from '../lib/utils';
import { getTierInfo, ALL_TIERS } from '../lib/whatsapp-tiers';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export const ChannelsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'messaging' | 'webchat'>('messaging');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [config, setConfig] = useState<WhatsAppOnboardingConfig | null>(null);
  const [capacity, setCapacity] = useState<OnboardingCapacity | null>(null);
  const [webchatWidgets, setWebchatWidgets] = useState<IWebchatWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFbSdkLoaded, setIsFbSdkLoaded] = useState(false);
  const [isLaunchingFb, setIsLaunchingFb] = useState(false);

  // Modals
  const [isEmbeddedModalOpen, setIsEmbeddedModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  // Webchat Modals & State
  const [isCreateWidgetModalOpen, setIsCreateWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<IWebchatWidget | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [selectedWidgetForEmbed, setSelectedWidgetForEmbed] = useState<IWebchatWidget | null>(null);
  const [embedModalTab, setEmbedModalTab] = useState<'script' | 'link' | 'iframe'>('script');
  const [isDeleteWidgetModalOpen, setIsDeleteWidgetModalOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<IWebchatWidget | null>(null);
  const [isDeletingWidget, setIsDeletingWidget] = useState(false);
  const [isSubmittingWidget, setIsSubmittingWidget] = useState(false);

  const defaultWidgetForm = {
    displayName: 'Website Live Chat',
    defaultFlowId: '',
    title: 'Customer Support',
    subtitle: 'We typically reply within minutes',
    primaryColor: '#4f46e5',
    greetingMessage: 'Hello! How can we help you today?',
    placeholderText: 'Type your message here...',
    launcherText: 'Chat with us',
    launcherIcon: 'chat',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    requireEmail: false,
    requireName: false,
    allowedOrigins: '',
    isActive: true,
    offlineMessage: 'We are currently away. Leave us a message and we will get back to you soon!',
    businessHoursEnabled: false,
    businessHoursTimezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
  };
  const [widgetForm, setWidgetForm] = useState(defaultWidgetForm);

  // Active channel for QR / Templates / Settings / Disconnect
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSyncingSettings, setIsSyncingSettings] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [channelToDisconnect, setChannelToDisconnect] = useState<Channel | null>(null);

  const [deepLinkData, setDeepLinkData] = useState<DeepLinkResponse | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Embedded signup form state
  const [embeddedForm, setEmbeddedForm] = useState({
    code: '',
    wabaId: '',
    phoneNumberId: '',
    displayName: '',
  });
  const [isSubmittingEmbedded, setIsSubmittingEmbedded] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const metaDataRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  // Manual channel form state
  const [manualForm, setManualForm] = useState({
    type: 'telegram' as 'telegram' | 'whatsapp',
    displayName: '',
    botToken: '',
    secretToken: '',
    wabaId: '',
    phoneNumberId: '',
    accessToken: '',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Create template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    bodyText: '',
  });

  const { showToast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [chList, flList, cfg, cap, wcList] = await Promise.all([
        channelsApi.list(),
        flowsApi.list(),
        whatsappOnboardingApi.getConfig().catch(() => null),
        whatsappOnboardingApi.getCapacity().catch(() => null),
        webchatApi.listWidgets().catch(() => ({ widgets: [] })),
      ]);
      setChannels(chList);
      setFlows(flList.filter((f) => f.status === 'published'));
      if (cfg) setConfig(cfg);
      if (cap) setCapacity(cap);
      if (wcList?.widgets) setWebchatWidgets(wcList.widgets);
    } catch (err) {
      showToast('Failed to load channels', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize and load Facebook JavaScript SDK
  useEffect(() => {
    if (!config?.appId) return;

    if (window.FB) {
      try {
        window.FB.init({
          appId: config.appId,
          cookie: true,
          xfbml: true,
          version: 'v21.0',
        });
        setIsFbSdkLoaded(true);
      } catch (err) {
        console.error('Failed to init FB SDK:', err);
      }
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      setIsFbSdkLoaded(true);
    };

    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const js = document.createElement('script');
      js.id = scriptId;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      js.onload = () => {
        if (window.FB) {
          try {
            window.FB.init({
              appId: config.appId,
              cookie: true,
              xfbml: true,
              version: 'v21.0',
            });
            setIsFbSdkLoaded(true);
          } catch (e) {
            console.error('FB init error:', e);
          }
        }
      };
      document.body.appendChild(js);
    }
  }, [config?.appId]);

  // Auto-connect WhatsApp channel immediately upon receiving OAuth code
  const autoConnectWhatsApp = async (
    code: string,
    explicitWabaId?: string,
    explicitPhoneId?: string,
    explicitName?: string
  ) => {
    const wabaId = explicitWabaId || metaDataRef.current.wabaId || embeddedForm.wabaId;
    const phoneNumberId = explicitPhoneId || metaDataRef.current.phoneNumberId || embeddedForm.phoneNumberId;
    const displayName = explicitName || embeddedForm.displayName;

    setIsSubmittingEmbedded(true);
    try {
      showToast('Connecting your WhatsApp Business Account to Omni Platform...', 'info');
      const newChannel = await whatsappOnboardingApi.completeCallback({
        code,
        wabaId: wabaId || undefined,
        phoneNumberId: phoneNumberId || undefined,
        displayName: displayName || undefined,
      });

      const channelName = newChannel.displayName || newChannel.display_name || 'WhatsApp Channel';
      showToast(`Connected "${channelName}" successfully!`, 'success');
      setIsEmbeddedModalOpen(false);
      setEmbeddedForm({ code: '', wabaId: '', phoneNumberId: '', displayName: '' });
      metaDataRef.current = {};
      await loadData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Onboarding failed');
      if (errMsg.includes('used') || errMsg.includes('36009') || errMsg.includes('OAuthException')) {
        setEmbeddedForm((prev) => ({ ...prev, code: '' }));
        showToast('This Meta authorization code was already used or expired. Please click "Launch Meta Embedded Signup" to generate a fresh one-time code.', 'error');
      } else {
        showToast(errMsg, 'error');
      }
    } finally {
      setIsSubmittingEmbedded(false);
    }
  };

  // Listen to postMessage from Meta Embedded Signup popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow only facebook origin events
      if (
        typeof event.origin === 'string' &&
        !event.origin.includes('facebook.com') &&
        !event.origin.includes('meta.com')
      ) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (
          data &&
          (data.type === 'WA_EMBEDDED_SIGNUP' ||
            data.event === 'FINISH' ||
            data.event === 'finish')
        ) {
          console.log('[Meta Embedded Signup] postMessage event:', data);
          const signupData = data.data || data;
          const phoneId = signupData.phone_number_id || signupData.phoneNumberId;
          const wabaId = signupData.waba_id || signupData.wabaId;

          if (phoneId || wabaId) {
            if (phoneId) metaDataRef.current.phoneNumberId = String(phoneId);
            if (wabaId) metaDataRef.current.wabaId = String(wabaId);

            setEmbeddedForm((prev) => ({
              ...prev,
              phoneNumberId: phoneId ? String(phoneId) : prev.phoneNumberId,
              wabaId: wabaId ? String(wabaId) : prev.wabaId,
            }));
            showToast('WhatsApp Account & Phone Number received from Meta!', 'success');
          }
        }
      } catch (e) {
        // Non-JSON message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [showToast]);

  // Launch official Meta Embedded Signup popup
  const launchEmbeddedSignup = () => {
    if (!config?.configId) {
      showToast('Meta Configuration ID is not configured in backend/.env', 'error');
      return;
    }

    if (!window.FB) {
      showToast('Meta Facebook SDK is still loading. Please try again in a few seconds.', 'info');
      return;
    }

    // Reset previous code so we don't accidentally reuse an expired/burned one
    setEmbeddedForm((prev) => ({ ...prev, code: '' }));
    metaDataRef.current = {};
    setIsLaunchingFb(true);

    try {
      window.FB.login(
        (response: any) => {
          setIsLaunchingFb(false);
          console.log('[Meta FB.login response]:', response);

          if (response?.authResponse?.code) {
            const authCode = response.authResponse.code;
            setEmbeddedForm((prev) => ({
              ...prev,
              code: authCode,
            }));
            // Automatically complete onboarding and save the channel without requiring a button click!
            autoConnectWhatsApp(authCode);
          } else {
            console.warn('[Meta FB.login] User did not complete login or cancelled:', response);
          }
        },
        {
          config_id: config.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: '',
            sessionInfoVersion: '2',
          },
        }
      );
    } catch (err: any) {
      setIsLaunchingFb(false);
      showToast(err?.message || 'Failed to open Meta signup popup', 'error');
    }
  };

  // Handle Set Default Flow
  const handleSetDefaultFlow = async (channelId: string, flowId: string) => {
    try {
      await channelsApi.setDefaultFlow(channelId, flowId ? flowId : null);
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId
            ? { ...c, defaultFlowId: flowId || null, default_flow_id: flowId || null }
            : c
        )
      );
      showToast('Default automation flow updated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to set flow', 'error');
    }
  };

  // Open Settings modal
  const handleOpenSettingsModal = async (channel: Channel) => {
    setActiveChannel(channel);
    setChannelSettings(null);
    setIsSettingsModalOpen(true);
    setIsLoadingSettings(true);
    try {
      const settings = await channelsApi.getSettings(channel.id);
      setChannelSettings(settings);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to load channel settings');
      showToast(errMsg, 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Live Sync metadata from Meta / Telegram
  const handleSyncChannelMetadata = async () => {
    if (!activeChannel) return;
    setIsSyncingSettings(true);
    try {
      const updatedSettings = await channelsApi.sync(activeChannel.id);
      setChannelSettings(updatedSettings);

      // Update channels list in state
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id !== activeChannel.id) return c;
          const meta = updatedSettings.metadata;
          return {
            ...c,
            verifiedName: meta.verifiedName,
            verified_name: meta.verifiedName,
            displayPhoneNumber: meta.displayPhoneNumber || meta.businessPhoneNumber,
            display_phone_number: meta.displayPhoneNumber || meta.businessPhoneNumber,
            qualityRating: meta.qualityRating,
            quality_rating: meta.qualityRating,
            nameStatus: meta.nameStatus,
            name_status: meta.nameStatus,
            codeVerificationStatus: meta.codeVerificationStatus,
            code_verification_status: meta.codeVerificationStatus,
            botUsername: meta.botUsername,
            bot_username: meta.botUsername,
            botFirstName: meta.botFirstName,
            bot_first_name: meta.botFirstName,
            messagingLimitTier: meta.messagingLimitTier || meta.messaging_limit_tier,
            messaging_limit_tier: meta.messagingLimitTier || meta.messaging_limit_tier,
          };
        })
      );

      const providerLabel = activeChannel.type === 'whatsapp' ? 'Meta WhatsApp Cloud API' : 'Telegram Bot API';
      showToast(`Channel live status synced with ${providerLabel}!`, 'success');
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to sync channel metadata');
      showToast(errMsg, 'error');
    } finally {
      setIsSyncingSettings(false);
    }
  };

  // Open Disconnect Modal
  const handleOpenDisconnectModal = (channel: Channel) => {
    setChannelToDisconnect(channel);
    setIsDisconnectModalOpen(true);
  };

  // Confirm Disconnect
  const handleConfirmDisconnect = async () => {
    if (!channelToDisconnect) return;
    setIsDisconnecting(true);
    try {
      await channelsApi.delete(channelToDisconnect.id);
      setChannels((prev) => prev.filter((c) => c.id !== channelToDisconnect.id));
      const name = channelToDisconnect.displayName || channelToDisconnect.display_name || 'Channel';
      showToast(`Disconnected "${name}" successfully`, 'success');
      setIsDisconnectModalOpen(false);
      if (isSettingsModalOpen && activeChannel?.id === channelToDisconnect.id) {
        setIsSettingsModalOpen(false);
      }
      setChannelToDisconnect(null);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to disconnect channel');
      showToast(errMsg, 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Open QR Code modal
  const handleOpenQrModal = async (channel: Channel) => {
    setActiveChannel(channel);
    setDeepLinkData(null);
    setIsQrModalOpen(true);
    try {
      const data = await channelsApi.getDeepLink(channel.id);
      setDeepLinkData(data);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to generate deep link');
      showToast(errMsg, 'error');
    }
  };

  // Open Templates modal
  const handleOpenTemplatesModal = async (channel: Channel) => {
    setActiveChannel(channel);
    setIsTemplatesModalOpen(true);
    setIsLoadingTemplates(true);
    try {
      const list = await channelsApi.getTemplates(channel.id);
      setTemplates(list);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to fetch templates');
      showToast(errMsg, 'error');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Submit Embedded Signup Callback (Manual / Advanced fallback)
  const handleEmbeddedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!embeddedForm.code) {
      showToast('Meta authorization code is required. Please launch signup popup or enter code.', 'error');
      return;
    }
    await autoConnectWhatsApp(
      embeddedForm.code,
      embeddedForm.wabaId || undefined,
      embeddedForm.phoneNumberId || undefined,
      embeddedForm.displayName || undefined
    );
  };

  // Submit Manual Channel
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const credentials: Record<string, any> =
        manualForm.type === 'telegram'
          ? { botToken: manualForm.botToken, secretToken: manualForm.secretToken }
          : {
              wabaId: manualForm.wabaId,
              phoneNumberId: manualForm.phoneNumberId,
              accessToken: manualForm.accessToken,
            };

      const newChannel = await channelsApi.create({
        type: manualForm.type,
        displayName: manualForm.displayName,
        credentials,
      });

      setChannels((prev) => [...prev, newChannel]);
      setIsManualModalOpen(false);
      setManualForm({
        type: 'telegram',
        displayName: '',
        botToken: '',
        secretToken: '',
        wabaId: '',
        phoneNumberId: '',
        accessToken: '',
      });
      showToast(`${manualForm.displayName} connected successfully!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create channel', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Submit Template Creation
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel) return;

    try {
      await channelsApi.createTemplate(activeChannel.id, {
        name: newTemplate.name.toLowerCase().replace(/\s+/g, '_'),
        category: newTemplate.category,
        language: newTemplate.language,
        components: [
          {
            type: 'BODY',
            text: newTemplate.bodyText,
          },
        ],
      });
      showToast('Template submitted to Meta for approval!', 'success');
      setIsCreateTemplateModalOpen(false);
      handleOpenTemplatesModal(activeChannel);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create template', 'error');
    }
  };

  // ==================== WEBCHAT WIDGET HANDLERS ====================
  const handleOpenCreateWidgetModal = () => {
    setEditingWidget(null);
    setWidgetForm({
      ...defaultWidgetForm,
      displayName: `Website Live Chat ${webchatWidgets.length + 1}`,
    });
    setIsCreateWidgetModalOpen(true);
  };

  const handleOpenEditWidgetModal = (widget: IWebchatWidget) => {
    setEditingWidget(widget);
    setWidgetForm({
      displayName: widget.displayName || widget.channelDisplayName || widget.channel?.displayName || widget.title || 'Website Live Chat',
      defaultFlowId: widget.defaultFlowId || widget.channel?.defaultFlowId || '',
      title: widget.title || 'Customer Support',
      subtitle: widget.subtitle || '',
      primaryColor: widget.primaryColor || '#4f46e5',
      greetingMessage: widget.greetingMessage || '',
      placeholderText: widget.placeholderText || 'Type your message here...',
      launcherText: widget.launcherText || '',
      launcherIcon: widget.launcherIcon || 'chat',
      position: (widget.position as any) || 'bottom-right',
      requireEmail: !!widget.requireEmail,
      requireName: !!widget.requireName,
      allowedOrigins: (widget.allowedOrigins || []).join(', '),
      isActive: widget.isActive !== false,
      offlineMessage:
        widget.offlineMessage ||
        'We are currently away. Leave us a message and we will get back to you soon!',
      businessHoursEnabled: !!widget.businessHours?.enabled,
      businessHoursTimezone:
        widget.businessHours?.timezone ||
        (typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          : 'UTC'),
    });
    setIsCreateWidgetModalOpen(true);
  };

  const handleSaveWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWidget(true);
    try {
      const allowedOriginsArray = widgetForm.allowedOrigins
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        displayName: widgetForm.displayName,
        defaultFlowId: widgetForm.defaultFlowId || null,
        title: widgetForm.title,
        subtitle: widgetForm.subtitle,
        primaryColor: widgetForm.primaryColor,
        greetingMessage: widgetForm.greetingMessage,
        placeholderText: widgetForm.placeholderText,
        launcherText: widgetForm.launcherText,
        position: widgetForm.position,
        requireEmail: widgetForm.requireEmail,
        requireName: widgetForm.requireName,
        allowedOrigins: allowedOriginsArray.length > 0 ? allowedOriginsArray : undefined,
        isActive: widgetForm.isActive,
        offlineMessage: widgetForm.offlineMessage,
        businessHours: widgetForm.businessHoursEnabled
          ? {
              enabled: true,
              timezone: widgetForm.businessHoursTimezone,
            }
          : { enabled: false },
      };

      if (editingWidget) {
        const res = await webchatApi.updateWidget(editingWidget.id, payload);
        showToast('Webchat widget updated successfully', 'success');
        setWebchatWidgets((prev) =>
          prev.map((w) => (w.id === editingWidget.id ? res.widget : w))
        );
      } else {
        const res = await webchatApi.createWidget(payload);
        showToast('Webchat widget created successfully!', 'success');
        setWebchatWidgets((prev) => [res.widget, ...prev]);
        setSelectedWidgetForEmbed(res.widget);
        setIsEmbedModalOpen(true);
      }
      setIsCreateWidgetModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save webchat widget', 'error');
    } finally {
      setIsSubmittingWidget(false);
    }
  };

  const handleToggleWidgetActive = async (widget: IWebchatWidget) => {
    try {
      const nextActive = !widget.isActive;
      const res = await webchatApi.updateWidget(widget.id, { isActive: nextActive });
      setWebchatWidgets((prev) =>
        prev.map((w) => (w.id === widget.id ? res.widget : w))
      );
      showToast(`Widget ${nextActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle widget status', 'error');
    }
  };

  const handleSetWidgetDefaultFlow = async (widgetId: string, flowId: string) => {
    try {
      const res = await webchatApi.updateWidget(widgetId, {
        defaultFlowId: flowId || null,
      });
      setWebchatWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? res.widget : w))
      );
      showToast('Webchat automation flow updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update automation flow', 'error');
    }
  };

  const handleOpenEmbedModal = (widget: IWebchatWidget) => {
    setSelectedWidgetForEmbed(widget);
    setEmbedModalTab('script');
    setIsEmbedModalOpen(true);
  };

  const handleOpenDeleteWidgetModal = (widget: IWebchatWidget) => {
    setWidgetToDelete(widget);
    setIsDeleteWidgetModalOpen(true);
  };

  const handleConfirmDeleteWidget = async () => {
    if (!widgetToDelete) return;
    setIsDeletingWidget(true);
    try {
      await webchatApi.deleteWidget(widgetToDelete.id);
      setWebchatWidgets((prev) => prev.filter((w) => w.id !== widgetToDelete.id));
      showToast('Webchat widget deleted successfully', 'success');
      setIsDeleteWidgetModalOpen(false);
      setWidgetToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete webchat widget', 'error');
    } finally {
      setIsDeletingWidget(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation Tabs (Messaging Channels vs Webchat Widgets) */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('messaging')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'messaging'
              ? 'bg-primary-50 text-primary-700 shadow-xs border border-primary-200/60'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Messaging Channels
          <span
            className={cn(
              'px-2 py-0.5 text-xs rounded-full font-bold',
              activeTab === 'messaging' ? 'bg-primary-200/70 text-primary-800' : 'bg-gray-200 text-gray-700'
            )}
          >
            {channels.filter((c) => c.type !== 'webchat').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webchat')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer',
            activeTab === 'webchat'
              ? 'bg-primary-50 text-primary-700 shadow-xs border border-primary-200/60'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Globe className="w-4 h-4" />
          Live Webchat Widgets
          <span
            className={cn(
              'px-2 py-0.5 text-xs rounded-full font-bold',
              activeTab === 'webchat' ? 'bg-primary-200/70 text-primary-800' : 'bg-gray-200 text-gray-700'
            )}
          >
            {webchatWidgets.length}
          </span>
        </button>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {activeTab === 'messaging' ? 'Channel Integrations' : 'Live Webchat Widgets'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'messaging'
              ? 'Connect WhatsApp via Meta Embedded Signup or Telegram bots to receive & send messages.'
              : 'Configure, preview, and embed real-time live chat widgets on external websites.'}
          </p>
        </div>

        {activeTab === 'messaging' ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              icon={<Radio className="w-4 h-4 text-blue-600" />}
            >
              Connect Telegram Bot
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEmbeddedModalOpen(true)}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Connect WhatsApp (Meta Signup)
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateWidgetModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Webchat Widget
            </Button>
          </div>
        )}
      </div>

      {/* ==================== TAB 1: MESSAGING CHANNELS ==================== */}
      {activeTab === 'messaging' && (
        <div className="space-y-6">
          {/* Meta Tech Provider Capacity Banner */}
          {capacity && (
            <Card className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white border-0 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Tech Provider Capacity Status
                    </span>
                    <Badge variant="purple" size="sm" className="bg-purple-900 text-purple-200 border-purple-700">
                      {capacity.remaining} Available
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    Meta rolling limit: {capacity.used} used / {capacity.limit} maximum in {capacity.windowDays} days.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Refresh capacity"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.filter((c) => c.type !== 'webchat').length === 0 ? (
              <div className="col-span-full">
                <Card className="text-center py-16">
                  <Radio className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-base font-bold text-gray-900">No channels connected yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                    Connect your WhatsApp Business Account or Telegram bot to start receiving customer conversations.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setIsEmbeddedModalOpen(true)}
                      icon={<Sparkles className="w-4 h-4" />}
                    >
                      Connect WhatsApp
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              channels
                .filter((c) => c.type !== 'webchat')
                .map((channel) => (
                  <Card key={channel.id} hover className="flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md ${
                              channel.type === 'whatsapp'
                                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                                : 'bg-gradient-to-tr from-blue-600 to-sky-500 shadow-blue-500/20'
                            }`}
                          >
                            {channel.type === 'whatsapp' ? 'W' : 'T'}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">{channel.displayName || channel.display_name}</h3>
                            <p className="text-xs text-gray-500 capitalize">{channel.type}</p>
                          </div>
                        </div>

                        <Badge variant={channel.status === 'active' ? 'success' : 'danger'} size="sm">
                          {channel.status}
                        </Badge>
                      </div>

                      {/* Provider Metadata Preview */}
                      {channel.type === 'whatsapp' && (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {channel.displayPhoneNumber || channel.display_phone_number || 'Phone number'}
                            </span>
                            {channel.verifiedName || channel.verified_name ? (
                              <span className="font-semibold text-gray-800 text-[11px] truncate max-w-[140px]" title={channel.verifiedName || channel.verified_name || ''}>
                                {channel.verifiedName || channel.verified_name}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {/* Name Status Badge */}
                            {(channel.nameStatus || channel.name_status) && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  (channel.nameStatus || channel.name_status) === 'APPROVED' ||
                                  (channel.nameStatus || channel.name_status) === 'AVAILABLE_WITHOUT_REVIEW'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : (channel.nameStatus || channel.name_status) === 'PENDING_REVIEW'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {(channel.nameStatus || channel.name_status) === 'APPROVED' ||
                                (channel.nameStatus || channel.name_status) === 'AVAILABLE_WITHOUT_REVIEW' ? (
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                ) : (channel.nameStatus || channel.name_status) === 'PENDING_REVIEW' ? (
                                  <Clock className="w-2.5 h-2.5" />
                                ) : (
                                  <XCircle className="w-2.5 h-2.5" />
                                )}
                                Name: {channel.nameStatus || channel.name_status}
                              </span>
                            )}

                            {/* Quality Rating */}
                            {(channel.qualityRating || channel.quality_rating) && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  (channel.qualityRating || channel.quality_rating) === 'GREEN'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : (channel.qualityRating || channel.quality_rating) === 'YELLOW'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    (channel.qualityRating || channel.quality_rating) === 'GREEN'
                                      ? 'bg-emerald-500'
                                      : (channel.qualityRating || channel.quality_rating) === 'YELLOW'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                />
                                Quality: {channel.qualityRating || channel.quality_rating}
                              </span>
                            )}

                            {/* WhatsApp 24h Messaging Limit Tier Badge */}
                            {(() => {
                              const tierInfo = getTierInfo(channel.messagingLimitTier || channel.messaging_limit_tier);
                              return (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                                  title={`Meta 24-Hour Messaging Limit: ${tierInfo.label}`}
                                >
                                  <Zap className="w-2.5 h-2.5 text-purple-600" />
                                  Tier: {tierInfo.shortLabel}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {channel.type === 'telegram' && (channel.botUsername || channel.bot_username) && (
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-medium flex items-center gap-1">
                            <Bot className="w-3 h-3 text-blue-600" />
                            @{channel.botUsername || channel.bot_username}
                          </span>
                          {channel.botFirstName || channel.bot_first_name ? (
                            <span className="text-[11px] text-gray-600">{channel.botFirstName || channel.bot_first_name}</span>
                          ) : null}
                        </div>
                      )}

                      {/* Default Flow Assignment */}
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Workflow className="w-3 h-3 text-primary-600" />
                          Default Flow
                        </label>
                        <select
                          value={channel.defaultFlowId || channel.default_flow_id || ''}
                          onChange={(e) => handleSetDefaultFlow(channel.id, e.target.value)}
                          className="w-full text-xs rounded-xl border border-gray-200 py-1.5 px-2.5 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary-500 transition-colors"
                        >
                          <option value="">None (Human inbox only)</option>
                          {flows
                            .filter((flow) => flow.status === 'published')
                            .map((flow) => (
                              <option key={flow.id} value={flow.id}>
                                {flow.name} (v{flow.version})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSettingsModal(channel)}
                        icon={<Settings className="w-3.5 h-3.5 text-gray-600" />}
                        title="Channel Settings & Status"
                      >
                        Settings
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenQrModal(channel)}
                        icon={<QrCode className="w-3.5 h-3.5 text-gray-600" />}
                      >
                        QR & Link
                      </Button>

                      {channel.type === 'whatsapp' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenTemplatesModal(channel)}
                          icon={<FileText className="w-3.5 h-3.5 text-gray-600" />}
                        >
                          Templates
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDisconnectModal(channel)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 hover:border-red-200"
                        title="Disconnect Channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: LIVE WEBCHAT WIDGETS ==================== */}
      {activeTab === 'webchat' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <Card className="bg-gradient-to-r from-indigo-950 via-primary-950 to-slate-900 text-white border-0 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Zero-Setup Embeddable Live Webchat
                  </span>
                  <Badge variant="purple" size="sm" className="bg-emerald-950 text-emerald-300 border-emerald-800">
                    WebSocket Real-Time
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Embed on any website with a single <code className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-indigo-300 text-[11px]">&lt;script&gt;</code> tag or share direct standalone links. Includes stateless visitor authentication, visual flow automations, media uploads, and live agent typing indicators.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateWidgetModal}
                icon={<Plus className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shrink-0"
              >
                Create New Widget
              </Button>
            </div>
          </Card>

          {/* Webchat Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webchatWidgets.length === 0 ? (
              <div className="col-span-full">
                <Card className="text-center py-16">
                  <Globe className="w-12 h-12 mx-auto text-indigo-300 mb-3" />
                  <h3 className="text-base font-bold text-gray-900">No Webchat widgets created yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                    Create your first custom live webchat widget to connect with website visitors and automate support with visual bot flows.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleOpenCreateWidgetModal}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Create First Webchat Widget
                  </Button>
                </Card>
              </div>
            ) : (
              webchatWidgets.map((widget) => {
                const channel = widget.channel;
                return (
                  <Card
                    key={widget.id}
                    className={cn(
                      'flex flex-col justify-between hover:shadow-md transition-all border',
                      widget.isActive ? 'border-gray-200' : 'border-gray-200 opacity-80 bg-gray-50/50'
                    )}
                  >
                    <div className="space-y-4">
                      {/* Header: Icon, Name & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
                            style={{ backgroundColor: widget.primaryColor || '#4f46e5' }}
                          >
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {widget.displayName || widget.channelDisplayName || widget.channel?.displayName || widget.title || 'Live Chat'}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {widget.title ? `${widget.title} • ${widget.subtitle || 'Live Chat'}` : (widget.subtitle || 'Webchat Widget')}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleWidgetActive(widget)}
                          className="shrink-0 cursor-pointer"
                          title={widget.isActive ? 'Click to deactivate widget' : 'Click to activate widget'}
                        >
                          <Badge
                            variant={widget.isActive ? 'success' : 'secondary'}
                            size="sm"
                            className="cursor-pointer"
                          >
                            {widget.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </div>

                      {/* Widget Key & Quick Links */}
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Widget Key
                          </span>
                          <div className="flex items-center gap-1">
                            <code className="font-mono text-[11px] font-semibold text-gray-800 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                              {widget.widgetKey}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(widget.widgetKey);
                                showToast('Widget key copied to clipboard', 'success');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                              title="Copy Widget Key"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Standalone URL */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Direct Link
                          </span>
                          <div className="flex items-center gap-1">
                            <a
                              href={`/chat/${widget.widgetKey}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                            >
                              Open Chat
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const url = `${window.location.origin}/chat/${widget.widgetKey}`;
                                navigator.clipboard.writeText(url);
                                showToast('Direct chat link copied', 'success');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                              title="Copy direct link"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Allowed Origins / Position */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px] text-gray-600">
                          <span className="text-gray-500">Position:</span>
                          <span className="font-medium text-gray-800 capitalize">
                            {widget.position?.replace('-', ' ') || 'Bottom Right'}
                          </span>
                        </div>

                        {widget.businessHours?.enabled && (
                          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px] text-gray-600">
                            <span className="text-gray-500">Business Hours:</span>
                            <Badge variant="purple" size="sm" className="text-[10px] py-0">
                              {widget.businessHours.timezone || 'Active'}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Default Flow Assignment */}
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Workflow className="w-3 h-3 text-primary-600" />
                          Default Flow
                        </label>
                        <select
                          value={widget.defaultFlowId || channel?.defaultFlowId || ''}
                          onChange={(e) => handleSetWidgetDefaultFlow(widget.id, e.target.value)}
                          className="w-full text-xs rounded-xl border border-gray-200 py-1.5 px-2.5 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary-500 transition-colors"
                        >
                          <option value="">None (Human inbox only)</option>
                          {flows
                            .filter((flow) => flow.status === 'published')
                            .map((flow) => (
                              <option key={flow.id} value={flow.id}>
                                {flow.name} (v{flow.version})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Ready-to-Use Website Embed Script Snippet */}
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <Code className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Website Embed Script</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const script = `<script src="${window.location.origin}/api/webchat/embed.js?key=${widget.widgetKey}" async defer></script>`;
                              navigator.clipboard.writeText(script);
                              showToast('Embed script copied! Paste inside website <head> or <body>', 'success');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                            title="Copy HTML script tag"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Script</span>
                          </button>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[10.5px] text-indigo-300 break-all select-all leading-relaxed">
                          {`<script src="${window.location.origin}/api/webchat/embed.js?key=${widget.widgetKey}" async defer></script>`}
                        </div>
                        <p className="text-[10.5px] text-slate-400 flex items-center gap-1">
                          <span>💡</span> Paste inside your website <code className="text-slate-300 font-mono">&lt;head&gt;</code> or before <code className="text-slate-300 font-mono">&lt;/body&gt;</code>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenEmbedModal(widget)}
                        icon={<Code className="w-3.5 h-3.5" />}
                      >
                        Embed Code
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditWidgetModal(widget)}
                        icon={<Settings className="w-3.5 h-3.5 text-gray-600" />}
                        title="Customize Widget Style & Copy"
                      >
                        Customize
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteWidgetModal(widget)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 hover:border-red-200"
                        title="Delete Webchat Widget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: Meta Embedded Signup ==================== */}
      <Modal
        isOpen={isEmbeddedModalOpen}
        onClose={() => setIsEmbeddedModalOpen(false)}
        title="Connect WhatsApp via Meta Embedded Signup"
        description="One-click official Meta Tech Provider onboarding"
        maxWidth="lg"
      >
        <div className="space-y-5">
          {isSubmittingEmbedded ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Connecting your WhatsApp Business Channel...</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Exchanging credentials, fetching verified business profile from Meta, and subscribing webhooks automatically.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50/60 border border-primary-200/80 text-xs text-primary-950 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-primary-950">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    Official Meta Tech Provider Onboarding Flow
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isFbSdkLoaded
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isFbSdkLoaded ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {isFbSdkLoaded ? 'Meta SDK Ready' : 'Loading SDK...'}
                  </span>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  Click the button below to launch Meta's official WhatsApp signup popup. Select your Meta Business Account and phone number — Omni Platform will <strong>automatically fetch your verified business name, phone number, and save the channel without any manual steps</strong>.
                </p>

                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={launchEmbeddedSignup}
                    disabled={isLaunchingFb}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm text-white bg-[#1877F2] hover:bg-[#166fe5] shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isLaunchingFb ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Opening Meta Popup...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Launch Meta Embedded Signup
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced / Manual Overrides Toggle */}
              <div className="pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-700 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Advanced / Manual Configuration (Optional)
                  </span>
                  {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvancedOptions && (
                  <form onSubmit={handleEmbeddedSubmit} className="space-y-4 pt-3">
                    <Input
                      label="Channel Display Name (Optional override)"
                      placeholder="Leave empty to use official Meta verified name"
                      value={embeddedForm.displayName}
                      onChange={(e) => setEmbeddedForm({ ...embeddedForm, displayName: e.target.value })}
                    />

                    <div className="space-y-1">
                      <Input
                        label="Authorization Code"
                        placeholder="Autofilled by Meta SDK or enter manually"
                        value={embeddedForm.code}
                        onChange={(e) => setEmbeddedForm({ ...embeddedForm, code: e.target.value })}
                      />
                      {embeddedForm.code && (
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Code received from Meta SDK
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Input
                          label="WhatsApp Business Account (WABA ID)"
                          placeholder="Auto-discovered from Meta token"
                          value={embeddedForm.wabaId}
                          onChange={(e) => setEmbeddedForm({ ...embeddedForm, wabaId: e.target.value })}
                        />
                        {embeddedForm.wabaId && (
                          <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            WABA ID captured
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Input
                          label="Phone Number ID"
                          placeholder="Auto-discovered from Meta token"
                          value={embeddedForm.phoneNumberId}
                          onChange={(e) => setEmbeddedForm({ ...embeddedForm, phoneNumberId: e.target.value })}
                        />
                        {embeddedForm.phoneNumberId && (
                          <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Phone ID captured
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="primary"
                        type="submit"
                        isLoading={isSubmittingEmbedded}
                        disabled={!embeddedForm.code}
                      >
                        Save Channel Manually
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ==================== MODAL: Manual Telegram / WhatsApp Connect ==================== */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Connect Channel Manually"
        description="Add a Telegram Bot or direct WhatsApp Cloud API channel"
        maxWidth="lg"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Channel Type
            </label>
            <select
              value={manualForm.type}
              onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as any })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
            >
              <option value="telegram">Telegram Bot</option>
              <option value="whatsapp">WhatsApp Cloud API (Direct)</option>
            </select>
          </div>

          <Input
            label="Channel Display Name"
            placeholder="e.g. Support Telegram Bot"
            value={manualForm.displayName}
            onChange={(e) => setManualForm({ ...manualForm, displayName: e.target.value })}
            required
          />

          {manualForm.type === 'telegram' ? (
            <>
              <Input
                label="Telegram Bot Token"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={manualForm.botToken}
                onChange={(e) => setManualForm({ ...manualForm, botToken: e.target.value })}
                helperText="Get this from @BotFather on Telegram"
                required
              />

              <Input
                label="Secret Token (Webhook Verification)"
                placeholder="random-secret-string-here"
                value={manualForm.secretToken}
                onChange={(e) => setManualForm({ ...manualForm, secretToken: e.target.value })}
                required
              />
            </>
          ) : (
            <>
              <Input
                label="WABA ID"
                placeholder="Meta WhatsApp Business Account ID"
                value={manualForm.wabaId}
                onChange={(e) => setManualForm({ ...manualForm, wabaId: e.target.value })}
                required
              />
              <Input
                label="Phone Number ID"
                placeholder="Meta Phone Number ID"
                value={manualForm.phoneNumberId}
                onChange={(e) => setManualForm({ ...manualForm, phoneNumberId: e.target.value })}
                required
              />
              <Input
                label="Permanent System User Access Token"
                type="password"
                placeholder="EAAG..."
                value={manualForm.accessToken}
                onChange={(e) => setManualForm({ ...manualForm, accessToken: e.target.value })}
                required
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingManual}>
              Connect Channel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: QR Code & Deep Link ==================== */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`${activeChannel?.displayName || activeChannel?.display_name || 'Channel'} - QR Code & Deep Link`}
        description="Share this link or QR code with your customers to start conversations"
      >
        <div className="space-y-6 text-center">
          {deepLinkData ? (
            <>
              <div className="p-4 bg-white rounded-2xl border border-gray-200 inline-block shadow-sm">
                <img
                  src={deepLinkData.qrCodeDataUrl}
                  alt="Channel QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Deep Link URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={deepLinkData.link}
                    className="flex-1 text-xs bg-gray-100 rounded-xl px-3 py-2 border border-gray-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(deepLinkData.link);
                      showToast('Link copied to clipboard', 'success');
                    }}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Spinner size="md" />
          )}

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setIsQrModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: WhatsApp Templates ==================== */}
      <Modal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        title={`${activeChannel?.displayName || activeChannel?.display_name || 'WhatsApp'} - Templates`}
        description="View approved message templates from Meta"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Templates are required for outbound broadcast campaigns outside the 24-hour window.
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateTemplateModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Template
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
            {isLoadingTemplates ? (
              <div className="py-12">
                <Spinner size="md" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No templates found on this WABA.
              </div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id || tpl.name} className="p-4 space-y-1.5 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{tpl.name}</span>
                    <Badge
                      variant={
                        tpl.status === 'APPROVED' ? 'success' : tpl.status === 'PENDING' ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
                      {tpl.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Category: <span className="font-semibold">{tpl.category}</span> • Language:{' '}
                    <span className="font-semibold">{tpl.language}</span>
                  </p>
                  <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-1">
                    {tpl.components?.find((c) => c.type === 'BODY')?.text || 'Template Body'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsTemplatesModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: Create New Template ==================== */}
      <Modal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        title="Create WhatsApp Template"
        description="Submit a new template to Meta for review"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g. order_confirmation"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            helperText="Lowercase alphanumeric and underscores only"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
              >
                <option value="MARKETING">MARKETING</option>
                <option value="UTILITY">UTILITY</option>
                <option value="AUTHENTICATION">AUTHENTICATION</option>
              </select>
            </div>

            <Input
              label="Language"
              value={newTemplate.language}
              onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Body Text
            </label>
            <textarea
              rows={4}
              placeholder="Hi {{1}}, thank you for your order #{{2}}."
              value={newTemplate.bodyText}
              onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs bg-white focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit to Meta
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: Channel Settings & Provider Status ==================== */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={`${activeChannel?.displayName || activeChannel?.display_name || 'Channel'} - Channel Settings & Status`}
        description="Upstream provider verification status, identifiers, and configuration"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {isLoadingSettings ? (
            <div className="py-12">
              <Spinner size="lg" />
            </div>
          ) : channelSettings ? (
            <>
              {/* Top Sync & Status Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                      channelSettings.type === 'whatsapp'
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                        : 'bg-gradient-to-tr from-blue-600 to-sky-500'
                    }`}
                  >
                    {channelSettings.type === 'whatsapp' ? 'W' : 'T'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{channelSettings.displayName}</h4>
                    <p className="text-xs text-gray-500 capitalize">{channelSettings.type} Channel • Status: <span className="font-semibold text-emerald-600">{channelSettings.status}</span></p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncChannelMetadata}
                  isLoading={isSyncingSettings}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingSettings ? 'animate-spin' : ''}`} />}
                  className="bg-white hover:bg-gray-50 border-gray-200 shadow-xs text-xs font-semibold"
                >
                  {isSyncingSettings ? 'Syncing with Provider...' : `Sync from ${channelSettings.type === 'whatsapp' ? 'Meta' : 'Telegram'}`}
                </Button>
              </div>

              {/* WhatsApp Meta Provider Metadata */}
              {channelSettings.type === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Meta WhatsApp Business Account (WABA) Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Verified Name */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Verified Business Name
                      </label>
                      <span className="text-sm font-semibold text-gray-900 block truncate">
                        {channelSettings.metadata.verifiedName || 'Not configured'}
                      </span>
                    </div>

                    {/* Display Phone Number */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Display Phone Number
                      </label>
                      <span className="text-sm font-semibold text-gray-900 block truncate">
                        {channelSettings.metadata.displayPhoneNumber || channelSettings.metadata.businessPhoneNumber || 'Not configured'}
                      </span>
                    </div>

                    {/* Name Approval Status */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Meta Name Approval Status
                      </label>
                      <div className="pt-0.5">
                        {channelSettings.metadata.nameStatus ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              channelSettings.metadata.nameStatus === 'APPROVED' ||
                              channelSettings.metadata.nameStatus === 'AVAILABLE_WITHOUT_REVIEW'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : channelSettings.metadata.nameStatus === 'PENDING_REVIEW'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {channelSettings.metadata.nameStatus === 'APPROVED' ||
                            channelSettings.metadata.nameStatus === 'AVAILABLE_WITHOUT_REVIEW' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : channelSettings.metadata.nameStatus === 'PENDING_REVIEW' ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {channelSettings.metadata.nameStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Unknown / Pending</span>
                        )}
                      </div>
                    </div>

                    {/* Quality Rating */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Phone Number Quality Rating
                      </label>
                      <div className="pt-0.5">
                        {channelSettings.metadata.qualityRating ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              channelSettings.metadata.qualityRating === 'GREEN'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : channelSettings.metadata.qualityRating === 'YELLOW'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                channelSettings.metadata.qualityRating === 'GREEN'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : channelSettings.metadata.qualityRating === 'YELLOW'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {channelSettings.metadata.qualityRating === 'GREEN'
                              ? 'HIGH (Green)'
                              : channelSettings.metadata.qualityRating === 'YELLOW'
                              ? 'MEDIUM (Yellow)'
                              : 'LOW (Red)'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Unknown</span>
                        )}
                      </div>
                    </div>

                    {/* Phone Number ID */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Phone Number ID
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-gray-800 truncate">
                          {channelSettings.metadata.phoneNumberId || '—'}
                        </span>
                        {channelSettings.metadata.phoneNumberId && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(channelSettings.metadata.phoneNumberId!);
                              showToast('Phone Number ID copied to clipboard', 'success');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                            title="Copy Phone ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* WABA ID */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        WhatsApp Business Account (WABA) ID
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-gray-800 truncate">
                          {channelSettings.metadata.wabaId || '—'}
                        </span>
                        {channelSettings.metadata.wabaId && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(channelSettings.metadata.wabaId!);
                              showToast('WABA ID copied to clipboard', 'success');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                            title="Copy WABA ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* WABA Name / Account Details */}
                    {channelSettings.metadata.wabaName && (
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          WABA Account Name
                        </label>
                        <span className="text-xs font-semibold text-gray-800 block truncate">
                          {channelSettings.metadata.wabaName}
                        </span>
                      </div>
                    )}

                    {/* Currency & Timezone */}
                    {channelSettings.metadata.currency && (
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Currency & Timezone
                        </label>
                        <span className="text-xs font-medium text-gray-700 block truncate">
                          {channelSettings.metadata.currency} • {channelSettings.metadata.timezoneId || 'UTC'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta 24-Hour Messaging Limit Tier & Scaling Progression */}
                  {(() => {
                    const activeTier = getTierInfo(
                      channelSettings.metadata.messagingLimitTier ||
                      channelSettings.metadata.messaging_limit_tier
                    );
                    return (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40 border border-purple-200/80 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900">
                                24-Hour Messaging Limit Tier
                              </h5>
                              <p className="text-[11px] text-gray-500">
                                Unique business-initiated customer conversations permitted per rolling 24 hours.
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
                            <Zap className="w-3.5 h-3.5 text-purple-600" />
                            {activeTier.label}
                          </span>
                        </div>

                        {/* Progression Stepper */}
                        <div className="pt-2">
                          <div className="grid grid-cols-6 gap-1.5">
                            {ALL_TIERS.map((t) => {
                              const isCurrent = t.levelNumber === activeTier.levelNumber;
                              const isPast = t.levelNumber < activeTier.levelNumber;
                              return (
                                <div
                                  key={t.tier}
                                  className={`p-2 rounded-lg text-center transition-all border ${
                                    isCurrent
                                      ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                                      : isPast
                                      ? 'bg-purple-100/70 text-purple-900 border-purple-200'
                                      : 'bg-gray-50 text-gray-400 border-gray-100 opacity-60'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">
                                    {t.formattedLimit}
                                  </div>
                                  <div
                                    className={`text-[9px] font-medium leading-none truncate ${
                                      isCurrent ? 'text-purple-100' : isPast ? 'text-purple-700' : 'text-gray-400'
                                    }`}
                                  >
                                    {isCurrent ? 'Active' : isPast ? 'Completed' : 'Locked'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active Tier Description & Upgrade Strategy */}
                        <div className="p-3 rounded-lg bg-white border border-purple-100 space-y-1.5 text-xs">
                          <div className="flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-800">
                                {activeTier.description}
                              </p>
                              <p className="text-gray-600 text-[11px] leading-relaxed">
                                <span className="font-bold text-purple-700">Scaling Next Tier:</span>{' '}
                                {activeTier.upgradeTip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Access Token Security Status */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-slate-600" />
                        System User Access Token
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {channelSettings.metadata.hasAccessToken ? 'Securely Encrypted (AES-256)' : 'Missing'}
                      </span>
                    </div>
                    {channelSettings.metadata.maskedAccessToken && (
                      <p className="text-xs font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                        {channelSettings.metadata.maskedAccessToken}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Telegram Provider Metadata */}
              {channelSettings.type === 'telegram' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Telegram Bot Configuration
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Bot Username
                      </label>
                      <span className="text-sm font-semibold text-gray-900 block truncate">
                        {channelSettings.metadata.botUsername ? `@${channelSettings.metadata.botUsername}` : 'Not detected'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Bot First Name
                      </label>
                      <span className="text-sm font-semibold text-gray-900 block truncate">
                        {channelSettings.metadata.botFirstName || 'Not set'}
                      </span>
                    </div>

                    {channelSettings.metadata.botId && (
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Telegram Bot ID
                        </label>
                        <span className="text-xs font-mono text-gray-800 block truncate">
                          {channelSettings.metadata.botId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bot Token Status */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-slate-600" />
                        Bot API Token
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {channelSettings.metadata.hasBotToken ? 'Encrypted (AES-256)' : 'Missing'}
                      </span>
                    </div>
                    {channelSettings.metadata.maskedBotToken && (
                      <p className="text-xs font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                        {channelSettings.metadata.maskedBotToken}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Danger Zone: Disconnect */}
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-red-600">Disconnect Channel</h5>
                  <p className="text-[11px] text-gray-500">
                    Remove webhook registrations and disconnect this {channelSettings.type} integration.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeChannel) {
                      handleOpenDisconnectModal(activeChannel);
                    }
                  }}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Disconnect Channel
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500">
              No settings found for this channel.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: Disconnect Channel Confirmation ==================== */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title="Disconnect Channel"
        description="Are you sure you want to disconnect this channel?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Disconnecting "{channelToDisconnect?.displayName || channelToDisconnect?.display_name || 'Channel'}"
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-800 text-[11px]">
              <li>Omni Platform will immediately stop receiving incoming messages on this channel.</li>
              <li>The default automation flow will be unlinked automatically.</li>
              <li>Historical message logs and past conversations will remain safely archived.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-600">
            You can reconnect this {channelToDisconnect?.type} channel at any time in the future.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsDisconnectModalOpen(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleConfirmDisconnect}
              isLoading={isDisconnecting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Disconnect Channel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: Create / Edit Live Webchat Widget ==================== */}
      <Modal
        isOpen={isCreateWidgetModalOpen}
        onClose={() => setIsCreateWidgetModalOpen(false)}
        title={editingWidget ? 'Customize Webchat Widget' : 'Create Live Webchat Widget'}
        description="Configure branding, style colors, welcome greeting, business hours, and preview in real time"
        maxWidth="5xl"
      >
        <form onSubmit={handleSaveWidget} className="flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-6">
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* General Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                  <MessageSquare className="w-3.5 h-3.5 text-primary-600" />
                  General & Channel Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Channel / Widget Name (Internal)"
                    placeholder="e.g. Main Website Live Chat"
                    value={widgetForm.displayName}
                    onChange={(e) => setWidgetForm({ ...widgetForm, displayName: e.target.value })}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Default Bot Flow
                    </label>
                    <select
                      value={widgetForm.defaultFlowId}
                      onChange={(e) => setWidgetForm({ ...widgetForm, defaultFlowId: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">None (Human inbox only)</option>
                      {flows
                        .filter((flow) => flow.status === 'published')
                        .map((flow) => (
                          <option key={flow.id} value={flow.id}>
                            {flow.name} (v{flow.version})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Branding & Style */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                  <Palette className="w-3.5 h-3.5 text-primary-600" />
                  Branding & Styling
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Chat Window Header Title"
                    placeholder="e.g. Customer Support"
                    value={widgetForm.title}
                    onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })}
                    required
                  />

                  <Input
                    label="Subheader Text"
                    placeholder="e.g. We typically reply in minutes"
                    value={widgetForm.subtitle}
                    onChange={(e) => setWidgetForm({ ...widgetForm, subtitle: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={widgetForm.primaryColor}
                        onChange={(e) => setWidgetForm({ ...widgetForm, primaryColor: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={widgetForm.primaryColor}
                        onChange={(e) => setWidgetForm({ ...widgetForm, primaryColor: e.target.value })}
                        className="w-full text-xs font-mono rounded-xl border border-gray-200 px-2.5 py-1.5 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Widget Position
                    </label>
                    <select
                      value={widgetForm.position}
                      onChange={(e) => setWidgetForm({ ...widgetForm, position: e.target.value as any })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>

                  <Input
                    label="Launcher Button Text"
                    placeholder="e.g. Chat with us"
                    value={widgetForm.launcherText}
                    onChange={(e) => setWidgetForm({ ...widgetForm, launcherText: e.target.value })}
                  />
                </div>
              </div>

              {/* Messages & Prompts */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                  <Bot className="w-3.5 h-3.5 text-primary-600" />
                  Greeting & Prompts
                </h4>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Initial Bot Greeting Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Hi there! 👋 How can we help you today?"
                    value={widgetForm.greetingMessage}
                    onChange={(e) => setWidgetForm({ ...widgetForm, greetingMessage: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Input Box Placeholder"
                    placeholder="e.g. Type your message..."
                    value={widgetForm.placeholderText}
                    onChange={(e) => setWidgetForm({ ...widgetForm, placeholderText: e.target.value })}
                  />

                  <Input
                    label="Offline Fallback Message"
                    placeholder="e.g. We're currently away. Leave a message!"
                    value={widgetForm.offlineMessage}
                    onChange={(e) => setWidgetForm({ ...widgetForm, offlineMessage: e.target.value })}
                  />
                </div>
              </div>

              {/* Visitor Identity & Lead Capture */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                  <Shield className="w-3.5 h-3.5 text-primary-600" />
                  Visitor Lead Capture & Security
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetForm.requireName}
                      onChange={(e) => setWidgetForm({ ...widgetForm, requireName: e.target.checked })}
                      className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Prompt for Visitor Name</span>
                      <span className="text-[11px] text-gray-500 block">
                        Ask visitor for their name upon starting a conversation.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetForm.requireEmail}
                      onChange={(e) => setWidgetForm({ ...widgetForm, requireEmail: e.target.checked })}
                      className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Prompt for Visitor Email</span>
                      <span className="text-[11px] text-gray-500 block">
                        Collect visitor email for follow-up notifications.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Allowed Domains / Origins (CORS Security)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="https://example.com, https://app.example.com (Leave empty to allow all origins)"
                    value={widgetForm.allowedOrigins}
                    onChange={(e) => setWidgetForm({ ...widgetForm, allowedOrigins: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white font-mono focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-[10px] text-gray-400">
                    Separate multiple domains with commas or newlines.
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-600" />
                    Business Hours Schedule
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetForm.businessHoursEnabled}
                      onChange={(e) => setWidgetForm({ ...widgetForm, businessHoursEnabled: e.target.checked })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs font-semibold text-gray-700">Enable Schedule</span>
                  </label>
                </div>

                {widgetForm.businessHoursEnabled && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-700">
                        Timezone
                      </label>
                      <input
                        type="text"
                        value={widgetForm.businessHoursTimezone}
                        onChange={(e) => setWidgetForm({ ...widgetForm, businessHoursTimezone: e.target.value })}
                        placeholder="e.g. America/New_York or UTC"
                        className="w-full text-xs rounded-xl border border-gray-200 px-3 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Live Preview (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-between border border-slate-800 shadow-inner">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Preview</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Interactive</span>
              </div>

              {/* Render Preview Mockup */}
              <div className="w-full py-4 flex items-center justify-center">
                <LiveWebchatWidgetPreview
                  mode="preview"
                  previewConfig={{
                    widgetKey: 'preview_mode',
                    title: widgetForm.title || 'Chat with us',
                    subtitle: widgetForm.subtitle || 'We usually reply in minutes',
                    primaryColor: widgetForm.primaryColor || '#2563eb',
                    greetingMessage: widgetForm.greetingMessage || 'Hello! How can we help you today?',
                    placeholderText: widgetForm.placeholderText || 'Type your message...',
                    launcherText: widgetForm.launcherText || 'Chat with us',
                    launcherIcon: widgetForm.launcherIcon || 'chat',
                    position: widgetForm.position || 'bottom-right',
                    requireEmail: widgetForm.requireEmail,
                    requireName: widgetForm.requireName,
                    isActive: widgetForm.isActive,
                    showAgentAvatar: true,
                    offlineMessage: widgetForm.offlineMessage,
                    isOnline: !widgetForm.businessHoursEnabled,
                    allowedOrigins: widgetForm.allowedOrigins ? widgetForm.allowedOrigins.split(',').map((s) => s.trim()) : ['*'],
                  }}
                />
              </div>

              <div className="w-full pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                Changes update in real-time as you customize fields on the left.
              </div>
            </div>
          </div>

          {/* Sticky footer action bar */}
          <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 z-20 shadow-sm">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsCreateWidgetModalOpen(false)}
              disabled={isSubmittingWidget}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingWidget}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {editingWidget ? 'Save Widget Changes' : 'Create Webchat Widget'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: Embed Code & Direct Link ==================== */}
      <Modal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        title={`${selectedWidgetForEmbed?.title || selectedWidgetForEmbed?.displayName || 'Webchat'} - Embed Code`}
        description="Add the live chat widget to your website or share direct standalone link"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {selectedWidgetForEmbed && (
            <>
              {/* Option 1: Single-line Script Tag */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-primary-600" />
                    Option 1: Embed Script Tag (Recommended)
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const script = `<script src="${window.location.origin}/api/webchat/embed.js?key=${selectedWidgetForEmbed.widgetKey}" async defer></script>`;
                      navigator.clipboard.writeText(script);
                      showToast('Embed script copied to clipboard', 'success');
                    }}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy Script
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Paste this snippet right before the closing <code className="font-mono text-[11px] bg-gray-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on any web page:
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  <code>{`<script src="${window.location.origin}/api/webchat/embed.js?key=${selectedWidgetForEmbed.widgetKey}" async defer></script>`}</code>
                </div>
              </div>

              {/* Option 2: Direct Shareable Chat Link */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    Option 2: Direct Shareable Link
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/chat/${selectedWidgetForEmbed.widgetKey}`;
                      navigator.clipboard.writeText(url);
                      showToast('Direct chat link copied', 'success');
                    }}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy Link
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Send this standalone URL directly to customers via email, SMS, or bio links:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/chat/${selectedWidgetForEmbed.widgetKey}`}
                    className="flex-1 text-xs bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 font-mono"
                  />
                  <a
                    href={`/chat/${selectedWidgetForEmbed.widgetKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1"
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Option 3: Standard Iframe Embed */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Option 3: Full-Page Iframe Embed
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const iframe = `<iframe src="${window.location.origin}/chat/${selectedWidgetForEmbed.widgetKey}?embed=true" width="100%" height="600px" frameborder="0"></iframe>`;
                      navigator.clipboard.writeText(iframe);
                      showToast('Iframe embed code copied', 'success');
                    }}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Copy Iframe
                  </Button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                  <code>{`<iframe src="${window.location.origin}/chat/${selectedWidgetForEmbed.widgetKey}?embed=true" width="100%" height="600px" frameborder="0"></iframe>`}</code>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="primary" onClick={() => setIsEmbedModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================== MODAL: Delete Webchat Widget Confirmation ==================== */}
      <Modal
        isOpen={isDeleteWidgetModalOpen}
        onClose={() => setIsDeleteWidgetModalOpen(false)}
        title="Delete Webchat Widget"
        description="Are you sure you want to permanently delete this webchat widget?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-950">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              Deleting "{widgetToDelete?.title || widgetToDelete?.displayName || 'Webchat Widget'}"
            </div>
            <ul className="list-disc pl-5 space-y-1 text-red-800 text-[11px]">
              <li>The embed script will immediately stop loading on all external websites.</li>
              <li>Direct standalone chat links will return a 404 Not Found error.</li>
              <li>The associated channel integration and automated bot flows will be unlinked.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsDeleteWidgetModalOpen(false)}
              disabled={isDeletingWidget}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleConfirmDeleteWidget}
              isLoading={isDeletingWidget}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Widget
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
