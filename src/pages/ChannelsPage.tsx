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
} from 'lucide-react';
import { channelsApi, whatsappOnboardingApi, flowsApi } from '../api';
import type {
  Channel,
  ChannelSettings,
  WhatsAppOnboardingConfig,
  OnboardingCapacity,
  WhatsAppTemplate,
  Flow,
  DeepLinkResponse,
} from '../types';
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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [config, setConfig] = useState<WhatsAppOnboardingConfig | null>(null);
  const [capacity, setCapacity] = useState<OnboardingCapacity | null>(null);
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
      const [chList, flList, cfg, cap] = await Promise.all([
        channelsApi.list(),
        flowsApi.list(),
        whatsappOnboardingApi.getConfig().catch(() => null),
        whatsappOnboardingApi.getCapacity().catch(() => null),
      ]);
      setChannels(chList);
      setFlows(flList.filter((f) => f.status === 'published'));
      if (cfg) setConfig(cfg);
      if (cap) setCapacity(cap);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Channel Integrations</h1>
          <p className="text-xs text-gray-500 mt-1">
            Connect WhatsApp via Meta Embedded Signup or Telegram bots to receive & send messages.
          </p>
        </div>

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
      </div>

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
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
        {channels.length === 0 ? (
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
          channels.map((channel) => (
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
    </div>
  );
};
