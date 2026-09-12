import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Globe,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Radio,
  Copy,
  Check,
  Layers,
  ChevronRight,
  ExternalLink,
  Activity,
  Users,
  MessageSquare,
  DollarSign,
  ShoppingCart,
  Trash2,
  Info,
} from 'lucide-react';
import { analyticsApi, webhooksApi } from '../api';
import type {
  AnalyticsOverview,
  SlaPerformanceMetrics,
  TrafficHeatmapCell,
  FunnelStage,
  WebhookSubscription,
  WebhookDeliveryLog,
} from '../types';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Tabs, Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'sla' | 'traffic' | 'funnel' | 'webhooks'>('overview');

  // ==================== STATE ====================
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [slaData, setSlaData] = useState<SlaPerformanceMetrics | null>(null);
  const [heatmap, setHeatmap] = useState<TrafficHeatmapCell[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Webhook Modal & Testing state
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['*']);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isSubmittingWebhook, setIsSubmittingWebhook] = useState(false);

  // Webhook Delivery Logs Modal
  const [selectedSubForLogs, setSelectedSubForLogs] = useState<WebhookSubscription | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Testing webhook
  const [testingSubId, setTestingSubId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAllAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewRes, slaRes, heatmapRes, funnelRes, subsRes] = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getSlaPerformance(300),
        analyticsApi.getTrafficHeatmap(),
        analyticsApi.getConversionFunnel(),
        webhooksApi.listSubscriptions(),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      if (slaRes.status === 'fulfilled') setSlaData(slaRes.value);
      if (heatmapRes.status === 'fulfilled') setHeatmap(heatmapRes.value);
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value);
      if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value);
    } catch (err) {
      showToast('Failed to load analytics data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllAnalytics();
  }, [loadAllAnalytics]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied to clipboard', 'success');
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookName.trim() || !webhookUrl.trim()) {
      showToast('Name and URL are required', 'error');
      return;
    }

    setIsSubmittingWebhook(true);
    try {
      const newSub = await webhooksApi.createSubscription({
        name: webhookName.trim(),
        url: webhookUrl.trim(),
        secret: webhookSecret.trim() || undefined,
        events: webhookEvents,
      });

      setSubscriptions((prev) => [newSub, ...prev]);
      setIsCreateWebhookOpen(false);
      setWebhookName('');
      setWebhookUrl('');
      setWebhookSecret('');
      setWebhookEvents(['*']);
      showToast('Webhook endpoint subscribed successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create webhook', 'error');
    } finally {
      setIsSubmittingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Webhook Subscription',
      message: 'Are you sure you want to delete this webhook subscription? Outgoing events will no longer be dispatched to this URL.',
      confirmText: 'Delete Subscription',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await webhooksApi.deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      showToast('Webhook subscription deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete webhook', 'error');
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingSubId(id);
    try {
      const res = await webhooksApi.testSubscription(id);
      if (res.success) {
        showToast(`Test ping succeeded (Status: ${res.statusCode || 200})`, 'success');
      } else {
        showToast(`Test ping failed: ${res.error || `HTTP ${res.statusCode}`}`, 'error');
      }
      // Refresh subscriptions to show updated trigger time
      const updated = await webhooksApi.listSubscriptions();
      setSubscriptions(updated);
    } catch (err: any) {
      showToast(err.message || 'Test request failed', 'error');
    } finally {
      setTestingSubId(null);
    }
  };

  const handleOpenLogs = async (sub: WebhookSubscription) => {
    setSelectedSubForLogs(sub);
    setIsLoadingLogs(true);
    try {
      const logs = await webhooksApi.listDeliveryLogs(sub.id, 50);
      setDeliveryLogs(logs);
    } catch {
      showToast('Failed to load delivery logs', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const formatSeconds = (sec: number): string => {
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remainder = sec % 60;
    return remainder > 0 ? `${min}m ${remainder}s` : `${min}m`;
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxHeatmapCount = Math.max(...heatmap.map((h) => h.count), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Analytics & Distributed Infrastructure
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time telemetry, SLA performance benchmarks, 7x24 traffic heatmaps, and outbound webhook dispatchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadAllAnalytics} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-1.5', isLoading && 'animate-spin')} />
            Refresh Telemetry
          </Button>
          {activeTab === 'webhooks' && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateWebhookOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Webhook
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Executive Overview', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'sla', label: 'SLA & Agent Scorecard', icon: <Clock className="w-4 h-4" /> },
          { id: 'traffic', label: '7x24 Traffic Heatmap', icon: <Flame className="w-4 h-4" /> },
          { id: 'funnel', label: 'Conversion Funnel', icon: <Layers className="w-4 h-4" /> },
          { id: 'webhooks', label: 'Outbound Webhooks', icon: <Globe className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      {isLoading && !overview ? (
        <div className="py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* ==================== TAB 1: EXECUTIVE OVERVIEW ==================== */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-primary-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Volume</span>
                    <span className="p-2 bg-primary-50 rounded-xl text-primary-600">
                      <MessageSquare className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{overview.totalMessages.toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="text-emerald-600 font-semibold">{overview.inboundMessages.toLocaleString()} in</span>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">{overview.outboundMessages.toLocaleString()} out</span>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</span>
                    <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <Radio className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{overview.totalConversations.toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="text-amber-600 font-semibold">{overview.openConversations} active</span>
                    <span>•</span>
                    <span className="text-gray-600 font-semibold">{overview.closedConversations} resolved</span>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audience</span>
                    <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
                      <Users className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{overview.totalContacts.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">Verified omnichannel contacts</p>
                </Card>

                <Card className="p-5 border-l-4 border-l-indigo-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Commerce Revenue</span>
                    <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <DollarSign className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">
                    ${((overview.totalRevenue || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{overview.paidOrders} paid orders / {overview.totalOrders} total</span>
                  </div>
                </Card>
              </div>

              {/* Channel Distribution & Volume Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary-600" />
                      Channel Traffic Distribution
                    </CardTitle>
                    <CardDescription>Omnichannel message delivery split across connected channels</CardDescription>
                  </CardHeader>

                  <div className="space-y-4 mt-2">
                    {overview.channelDistribution.length === 0 ? (
                      <p className="text-sm text-gray-400 py-6 text-center">No channel message activity yet.</p>
                    ) : (
                      overview.channelDistribution.map((item) => {
                        const total = overview.totalMessages || 1;
                        const pct = Math.round((item.count / total) * 100);
                        return (
                          <div key={item.channelType} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="capitalize flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'w-2 h-2 rounded-full',
                                    item.channelType === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'
                                  )}
                                />
                                {item.channelType}
                              </span>
                              <span className="text-gray-600">
                                {item.count.toLocaleString()} msgs ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  item.channelType === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'
                                )}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                {/* Realtime Gateway Status */}
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Distributed Infrastructure Status
                    </CardTitle>
                    <CardDescription>Live Redis Pub/Sub, WebSockets & BullMQ workers</CardDescription>
                  </CardHeader>

                  <div className="space-y-3 mt-2">
                    <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          WS
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">WebSocket Real-Time Gateway</p>
                          <p className="text-[11px] text-gray-500">Horizontal cluster with Redis Pub/Sub backplane</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          MQ
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">BullMQ Background Workers</p>
                          <p className="text-[11px] text-gray-500">Flow delay scheduler, campaign broadcaster & webhooks</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Running
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                          GCM
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Credential Encryption at Rest</p>
                          <p className="text-[11px] text-gray-500">AES-256-GCM symmetric cryptographic envelopes</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Secured
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: SLA & AGENT SCORECARD ==================== */}
          {activeTab === 'sla' && slaData && (
            <div className="space-y-6">
              {/* SLA KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-primary-600">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg First Response Time</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">
                    {formatSeconds(slaData.avgFirstResponseSeconds)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Time until agent initial reply</p>
                </Card>

                <Card className="p-5 border-l-4 border-l-blue-600">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Resolution Duration</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">
                    {formatSeconds(slaData.avgResolutionSeconds)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total conversation lifecycle</p>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-600">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA Compliance Rate</span>
                  <p className="text-2xl font-black text-emerald-600 mt-2">
                    {slaData.slaComplianceRate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Threshold: &lt; 5 minutes FRT</p>
                </Card>

                <Card className="p-5 border-l-4 border-l-rose-600">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA Breaches</span>
                  <p className="text-2xl font-black text-rose-600 mt-2">
                    {slaData.slaBreachCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Conversations exceeding threshold</p>
                </Card>
              </div>

              {/* Agent Performance Scorecard */}
              <Card className="overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-600" />
                      Agent Productivity Scorecard
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Individual agent speed, ticket throughput, and resolution efficiency
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/75 text-gray-500 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3">Agent</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3 text-center">Assigned</th>
                        <th className="px-5 py-3 text-center">Resolved</th>
                        <th className="px-5 py-3">Avg First Response</th>
                        <th className="px-5 py-3">Avg Resolution</th>
                        <th className="px-5 py-3 text-right">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {slaData.agentScorecard.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                            No agent conversation activity recorded yet.
                          </td>
                        </tr>
                      ) : (
                        slaData.agentScorecard.map((agent, idx) => (
                          <tr key={agent.userId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs uppercase">
                                  {(agent.name || agent.email || 'AG').slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{agent.name || agent.email || 'Agent'}</p>
                                  <p className="text-[11px] text-gray-400">{agent.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant="secondary" size="sm" className="capitalize">
                                {agent.role}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-center font-semibold text-gray-700">
                              {agent.assignedConversations}
                            </td>
                            <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">
                              {agent.resolvedConversations}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-gray-800">
                              {formatSeconds(agent.avgFirstResponseSeconds)}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-gray-800">
                              {formatSeconds(agent.avgResolutionSeconds)}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px]',
                                  agent.avgFirstResponseSeconds <= 180
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : agent.avgFirstResponseSeconds <= 600
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                )}
                              >
                                {agent.avgFirstResponseSeconds <= 180 ? '⚡ Fast' : agent.avgFirstResponseSeconds <= 600 ? '✓ Normal' : '⚠ Delayed'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ==================== TAB 3: 7x24 TRAFFIC HEATMAP ==================== */}
          {activeTab === 'traffic' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500" />
                      7-Day x 24-Hour Inbound Traffic Matrix
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Identify peak customer messaging windows to optimize agent staffing and automated flow routing.
                    </p>
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Low</span>
                    <div className="flex gap-1">
                      <span className="w-3.5 h-3.5 rounded bg-slate-100" />
                      <span className="w-3.5 h-3.5 rounded bg-primary-200" />
                      <span className="w-3.5 h-3.5 rounded bg-primary-400" />
                      <span className="w-3.5 h-3.5 rounded bg-primary-600" />
                    </div>
                    <span>Peak</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[700px] space-y-2">
                    {/* Hour labels */}
                    <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-[10px] text-gray-400 font-medium text-center">
                      <div className="text-left font-bold text-gray-700">Day / Hr</div>
                      {Array.from({ length: 24 }).map((_, hr) => (
                        <div key={hr}>{hr}</div>
                      ))}
                    </div>

                    {/* Day Rows */}
                    {daysOfWeek.map((dayName, dayIndex) => (
                      <div
                        key={dayName}
                        className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 items-center"
                      >
                        <span className="text-xs font-semibold text-gray-700">{dayName}</span>
                        {Array.from({ length: 24 }).map((_, hourIndex) => {
                          const match = heatmap.find(
                            (h) => h.dayOfWeek === dayIndex && h.hourOfDay === hourIndex
                          );
                          const count = match ? match.count : 0;
                          const intensity = count / maxHeatmapCount;

                          let bgClass = 'bg-slate-100 text-slate-400';
                          if (count > 0) {
                            if (intensity < 0.25) bgClass = 'bg-primary-100 text-primary-800';
                            else if (intensity < 0.6) bgClass = 'bg-primary-300 text-primary-900';
                            else bgClass = 'bg-primary-600 text-white font-bold';
                          }

                          return (
                            <div
                              key={hourIndex}
                              className={cn(
                                'h-7 rounded flex items-center justify-center text-[10px] transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-primary-500',
                                bgClass
                              )}
                              title={`${dayName} ${hourIndex}:00 — ${count} messages`}
                            >
                              {count > 0 ? count : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ==================== TAB 4: CONVERSION FUNNEL ==================== */}
          {activeTab === 'funnel' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-600" />
                    Omnichannel Conversion Pipeline
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Multi-stage funnel tracking customer journey from first contact to deal won and paid order.
                  </p>
                </div>

                <div className="space-y-4 max-w-4xl mx-auto py-4">
                  {funnel.length === 0 ? (
                    <p className="text-sm text-gray-400 py-10 text-center">No funnel data available yet.</p>
                  ) : (
                    funnel.map((stage, idx) => {
                      const maxFunnelCount = funnel[0]?.count || 1;
                      const barWidth = Math.max(Math.round((stage.count / maxFunnelCount) * 100), 10);

                      return (
                        <div key={stage.stage} className="relative">
                          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                            <span className="text-gray-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              {stage.stage}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-900 font-bold">{stage.count.toLocaleString()}</span>
                              <Badge variant={idx === funnel.length - 1 ? 'success' : 'secondary'} size="sm">
                                {stage.conversionRate}% conv
                              </Badge>
                            </div>
                          </div>

                          {/* Funnel Stage Bar */}
                          <div className="h-8 w-full bg-slate-100 rounded-xl overflow-hidden p-1">
                            <div
                              className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg transition-all duration-700 flex items-center justify-end px-3 text-[11px] text-white font-bold"
                              style={{ width: `${barWidth}%` }}
                            >
                              {stage.count > 0 && `${stage.count}`}
                            </div>
                          </div>

                          {idx < funnel.length - 1 && stage.dropoffRate > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium mt-1 ml-7">
                              <span>↓ {stage.dropoffRate}% dropoff to next stage</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ==================== TAB 5: OUTBOUND WEBHOOKS ==================== */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary-600" />
                      Active Webhook Subscriptions
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dispatch real-time HTTP POST notifications to your CRM or custom API with HMAC-SHA256 signatures.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setIsCreateWebhookOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Register Endpoint
                  </Button>
                </div>

                <div className="divide-y divide-gray-100">
                  {subscriptions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 space-y-2">
                      <Globe className="w-10 h-10 mx-auto opacity-30" />
                      <p className="text-sm font-medium">No webhook subscriptions registered.</p>
                      <p className="text-xs text-gray-500">
                        Create a webhook endpoint to receive live events in your internal software.
                      </p>
                    </div>
                  ) : (
                    subscriptions.map((sub) => (
                      <div key={sub.id} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm text-gray-900">{sub.name}</span>
                            <Badge variant={sub.is_active ? 'success' : 'secondary'} size="sm">
                              {sub.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                            {sub.failure_count > 0 && (
                              <Badge variant="danger" size="sm">
                                {sub.failure_count} failures
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg break-all">
                            <span className="truncate">{sub.url}</span>
                            <button
                              onClick={() => handleCopy(sub.url, sub.id)}
                              className="text-gray-400 hover:text-gray-600 ml-auto shrink-0"
                            >
                              {copiedId === sub.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
                            <span>Events:</span>
                            {(Array.isArray(sub.events) ? sub.events : ['*']).map((evt) => (
                              <span key={evt} className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-mono font-medium">
                                {evt}
                              </span>
                            ))}
                            <span className="text-gray-300">•</span>
                            <span>Last triggered: {sub.last_triggered_at ? formatDateTime(sub.last_triggered_at) : 'Never'}</span>
                            {sub.last_status_code && (
                              <span className={cn('font-bold', sub.last_status_code < 300 ? 'text-emerald-600' : 'text-rose-600')}>
                                (HTTP {sub.last_status_code})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTestWebhook(sub.id)}
                            disabled={testingSubId === sub.id}
                          >
                            <Send className={cn('w-3.5 h-3.5 mr-1.5', testingSubId === sub.id && 'animate-spin')} />
                            {testingSubId === sub.id ? 'Pinging...' : 'Test Ping'}
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenLogs(sub)}
                          >
                            <Activity className="w-3.5 h-3.5 mr-1.5" />
                            Delivery Logs
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteWebhook(sub.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ==================== CREATE WEBHOOK MODAL ==================== */}
      <Modal
        isOpen={isCreateWebhookOpen}
        onClose={() => setIsCreateWebhookOpen(false)}
        title="Register Outbound Webhook"
      >
        <form onSubmit={handleCreateWebhook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Webhook Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Production CRM Sync"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Endpoint URL (HTTPS)</label>
            <input
              type="url"
              required
              placeholder="https://api.yourdomain.com/webhooks/omni"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              HMAC Signature Secret (Optional — auto-generated if left blank)
            </label>
            <input
              type="text"
              placeholder="Leave blank to generate cryptographically secure secret"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subscribed Events</label>
            <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              {[
                { id: '*', label: 'All Events (*)' },
                { id: 'message:new', label: 'message:new (Inbound & Outbound messages)' },
                { id: 'conversation:new', label: 'conversation:new (New customer threads)' },
                { id: 'order:new', label: 'order:new (Commerce orders)' },
                { id: 'deal:won', label: 'deal:won (Sales pipeline wins)' },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(item.id)}
                    onChange={(e) => {
                      if (item.id === '*') {
                        setWebhookEvents(e.target.checked ? ['*'] : []);
                      } else {
                        const next = e.target.checked
                          ? [...webhookEvents.filter((x) => x !== '*'), item.id]
                          : webhookEvents.filter((x) => x !== item.id);
                        setWebhookEvents(next.length === 0 ? ['*'] : next);
                      }
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateWebhookOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmittingWebhook}>
              {isSubmittingWebhook ? 'Registering...' : 'Register Webhook'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================== DELIVERY LOGS MODAL ==================== */}
      <Modal
        isOpen={Boolean(selectedSubForLogs)}
        onClose={() => setSelectedSubForLogs(null)}
        title={`Delivery Audit Logs: ${selectedSubForLogs?.name || ''}`}
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {isLoadingLogs ? (
            <div className="py-10">
              <Spinner size="md" />
            </div>
          ) : deliveryLogs.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No webhook delivery events recorded yet.</p>
          ) : (
            deliveryLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl border border-gray-100 bg-slate-50 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                      {(log.status || 'unknown').toUpperCase()} {log.response_status ? `(${log.response_status})` : ''}
                    </Badge>
                    <span className="font-mono font-bold text-gray-900">{log.event}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{formatDateTime(log.created_at)}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>Duration: {log.duration_ms}ms</span>
                  <span>•</span>
                  <span>Attempt: {log.attempt}</span>
                </div>

                {log.response_body && (
                  <div className="p-2 rounded bg-white border border-gray-200 font-mono text-[10px] text-gray-700 max-h-24 overflow-y-auto break-all">
                    {log.response_body}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
