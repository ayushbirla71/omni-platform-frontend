import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Megaphone,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  Repeat,
  GitBranch,
  Zap,
  Calendar,
  Tag as TagIcon,
  Search,
  ExternalLink,
  MessageSquare,
  Layers,
  RefreshCw,
  Trash2,
  BarChart3,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Radio,
  Share2,
} from 'lucide-react';
import { campaignsApi } from '../api';
import type { Campaign, CampaignRecipient, CampaignAnalytics } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';
import { Modal } from '../components/common/Modal';
import { formatDateTime, cn } from '../lib/utils';

export const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Recipient filters & pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadData = useCallback(async (showLoadingSpinner = true) => {
    if (!id) return;
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const [analyticsData, campaignData] = await Promise.all([
        campaignsApi.getAnalytics(id),
        campaignsApi.get(id),
      ]);
      setAnalytics(analyticsData);
      setCampaign(campaignData);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load campaign analytics', 'error');
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [id, showToast]);

  const loadRecipients = useCallback(async () => {
    if (!id) return;
    setIsLoadingRecipients(true);
    try {
      const res = await campaignsApi.getRecipients(id, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setRecipients(res.recipients || []);
      setRecipientsTotal(res.total || 0);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load recipient logs', 'error');
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [id, statusFilter, searchQuery, page, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadData(false), loadRecipients()]);
    setIsRefreshing(false);
    showToast('Analytics refreshed', 'success');
  };

  const handleSendCampaign = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to execute and send this campaign now?')) return;

    setIsSending(true);
    try {
      const res = await campaignsApi.send(id);
      showToast(`Campaign sent successfully! (${res.sent} sent, ${res.failed} failed)`, 'success');
      await loadData(false);
      await loadRecipients();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send campaign', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await campaignsApi.delete(id);
      showToast('Campaign deleted successfully', 'success');
      navigate('/campaigns');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete campaign', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-gray-500 font-medium">Loading campaign analytics & recipient logs...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-20 text-center space-y-4">
        <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Campaign Not Found</h2>
        <p className="text-xs text-gray-500">The requested campaign does not exist or has been deleted.</p>
        <Link to="/campaigns">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalRecipients: campaign.total_recipients || campaign.totalRecipients || 0,
    sentCount: campaign.sent_count || campaign.sentCount || 0,
    completedCount: campaign.completed_count || campaign.completedCount || 0,
    deliveredTotal: (campaign.sent_count || 0) + (campaign.completed_count || 0),
    failedCount: campaign.failed_count || campaign.failedCount || 0,
    pendingCount: campaign.pending_count || campaign.pendingCount || 0,
    deliveryRate: 0,
    failureRate: 0,
    pendingRate: 0,
  };

  const total = metrics.totalRecipients || 1;
  const sentPercent = Math.round(((metrics.sentCount || 0) / total) * 100);
  const completedPercent = Math.round(((metrics.completedCount || 0) / total) * 100);
  const pendingPercent = Math.round(((metrics.pendingCount || 0) / total) * 100);
  const failedPercent = Math.round(((metrics.failedCount || 0) / total) * 100);
  const def: any = campaign.definition || {};

  const totalPages = Math.ceil(recipientsTotal / limit) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/campaigns"
            className="mt-1 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            title="Back to Campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{campaign.name}</h1>
              <Badge
                variant={
                  campaign.status === 'completed'
                    ? 'success'
                    : campaign.status === 'sending'
                    ? 'warning'
                    : 'secondary'
                }
                size="md"
                className="capitalize font-semibold"
              >
                {campaign.status}
              </Badge>
              <Badge
                variant={
                  campaign.type === 'flow'
                    ? 'success'
                    : campaign.type === 'broadcast'
                    ? 'primary'
                    : 'purple'
                }
                size="md"
                className="capitalize font-semibold"
              >
                {campaign.type === 'flow' ? 'Flow Builder' : campaign.type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Channel: <strong>{campaign.channel_display_name || campaign.channelDisplayName || campaign.channel_id}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Created {formatDateTime(campaign.created_at || campaign.createdAt || '')}</span>
              </div>
              {def.tags && def.tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>Audience Tags: {def.tags.map((t: string) => `#${t}`).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            icon={<RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />}
          >
            Refresh
          </Button>

          {campaign.type === 'flow' && def.flowId && (
            <Link to={`/flows/${def.flowId}`}>
              <Button variant="outline" size="sm" icon={<Layers className="w-3.5 h-3.5 text-emerald-600" />}>
                Flow Editor
              </Button>
            </Link>
          )}

          {campaign.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isSending}
              onClick={handleSendCampaign}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send Now
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-rose-600 hover:bg-rose-50 border-rose-200"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Recipients */}
        <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audience</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalRecipients.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">Total targeted contacts</p>
        </Card>

        {/* Delivery Rate */}
        <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600">{metrics.deliveryRate}%</span>
            <span className="text-xs text-gray-400">success</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.deliveryRate}%` }} />
          </div>
        </Card>

        {/* Sent & Delivered */}
        <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivered / Sent</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{metrics.deliveredTotal.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">
            {metrics.sentCount} sent {metrics.completedCount > 0 && `• ${metrics.completedCount} completed`}
          </p>
        </Card>

        {/* In Queue / Pending */}
        <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics.pendingCount.toLocaleString()}</div>
          <p className="text-[11px] text-gray-400 mt-1">{metrics.pendingRate}% waiting or scheduled</p>
        </Card>

        {/* Failed / Bounced */}
        <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed / Bounced</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">{metrics.failedCount.toLocaleString()}</div>
          <p className="text-[11px] text-rose-500 mt-1">{metrics.failureRate}% failure rate</p>
        </Card>
      </div>

      {/* Progress & Definition Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Visual Delivery Progress & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-bold text-gray-900">Delivery Execution Funnel</h3>
              </div>
              <span className="text-xs text-gray-400">
                {metrics.deliveredTotal} of {metrics.totalRecipients} processed
              </span>
            </div>

            {/* Stacked Multi-Color Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded-full flex overflow-hidden shadow-inner">
                {completedPercent > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${completedPercent}%` }}
                    title={`Completed: ${metrics.completedCount} (${completedPercent}%)`}
                  />
                )}
                {sentPercent > 0 && (
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${sentPercent}%` }}
                    title={`Sent: ${metrics.sentCount} (${sentPercent}%)`}
                  />
                )}
                {pendingPercent > 0 && (
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${pendingPercent}%` }}
                    title={`Pending: ${metrics.pendingCount} (${pendingPercent}%)`}
                  />
                )}
                {failedPercent > 0 && (
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${failedPercent}%` }}
                    title={`Failed: ${metrics.failedCount} (${failedPercent}%)`}
                  />
                )}
              </div>

              {/* Progress Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-emerald-900 uppercase">Completed</p>
                    <p className="text-xs font-bold text-emerald-700">{metrics.completedCount} ({completedPercent}%)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-blue-900 uppercase">Sent</p>
                    <p className="text-xs font-bold text-blue-700">{metrics.sentCount} ({sentPercent}%)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-amber-900 uppercase">In Queue</p>
                    <p className="text-xs font-bold text-amber-700">{metrics.pendingCount} ({pendingPercent}%)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 border border-rose-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-rose-900 uppercase">Failed</p>
                    <p className="text-xs font-bold text-rose-700">{metrics.failedCount} ({failedPercent}%)</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Drip Step Breakdown (if drip campaign) */}
          {campaign.type === 'drip' && analytics?.stepBreakdown && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-900">Drip Sequence Step Progression</h3>
              </div>
              <div className="space-y-3">
                {(def.steps || []).map((step: any, idx: number) => {
                  const stepNum = idx + 1;
                  const stat = analytics.stepBreakdown.find((s) => s.step === stepNum);
                  const count = stat ? stat.count : 0;
                  const stepPercent = metrics.totalRecipients > 0 ? Math.round((count / metrics.totalRecipients) * 100) : 0;

                  return (
                    <div key={idx} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="purple" size="sm">Step {stepNum}</Badge>
                          <span className="text-xs font-bold text-gray-800">+{step.delayHours || 0} Hours Delay</span>
                        </div>
                        <span className="text-xs font-semibold text-purple-700">
                          {count} recipients ({stepPercent}%)
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-100">
                        "{step.text || step.message}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Definition & Metadata Preview */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Activity className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">Campaign Configuration</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Campaign Name</span>
                <span className="font-semibold text-gray-800">{campaign.name}</span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Automation Type</span>
                <span className="font-semibold text-gray-800 capitalize">{campaign.type}</span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Dispatch Channel</span>
                <span className="font-semibold text-gray-800">
                  {campaign.channel_display_name || campaign.channelDisplayName || campaign.channel_id}
                </span>
              </div>

              {campaign.type === 'flow' && (
                <div>
                  <span className="text-gray-400 block mb-0.5">Attached Automation Flow</span>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold">{campaign.flow_name || def.flowId || 'Visual Flow'}</span>
                    </div>
                    {def.flowId && (
                      <Link
                        to={`/flows/${def.flowId}`}
                        className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold text-[11px]"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {campaign.type === 'broadcast' && (
                <div>
                  <span className="text-gray-400 block mb-1">Broadcast Message Preview</span>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-gray-800 text-xs leading-relaxed relative">
                    <p className="whitespace-pre-wrap">{def.text || campaign.message || 'No copy specified'}</p>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> WhatsApp Standard Broadcast
                    </div>
                  </div>
                </div>
              )}

              {def.tags && def.tags.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-1">Audience Filter Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {def.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recipient Delivery Activity Log Table */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recipient Delivery Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Individual contact delivery receipts, execution statuses, and direct conversation links
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contact name / phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {(['all', 'pending', 'sent', 'completed', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors',
                    statusFilter === st
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoadingRecipients ? (
          <div className="py-16 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : recipients.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-medium text-gray-600">No recipients match the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  {campaign.type === 'drip' && <th className="py-3 px-4">Current Step</th>}
                  <th className="py-3 px-4">Execution / Scheduled At</th>
                  <th className="py-3 px-4">Diagnostics / Error</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recipients.map((rec) => {
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Contact Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(rec.contact_name || rec.contact_external_id || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {rec.contact_name || 'Unnamed Contact'}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {rec.contact_external_id || rec.contact_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            rec.status === 'completed'
                              ? 'success'
                              : rec.status === 'sent'
                              ? 'primary'
                              : rec.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                          className="capitalize font-semibold"
                        >
                          {rec.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                          {rec.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {rec.status === 'sent' && <Send className="w-3 h-3" />}
                          {rec.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {rec.status}
                        </Badge>
                      </td>

                      {/* Drip Step */}
                      {campaign.type === 'drip' && (
                        <td className="py-3 px-4">
                          <Badge variant="outline" size="sm">
                            Step {rec.current_step}
                          </Badge>
                        </td>
                      )}

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-gray-600">
                        {rec.next_send_at ? formatDateTime(rec.next_send_at) : formatDateTime(rec.updated_at)}
                      </td>

                      {/* Diagnostic Errors */}
                      <td className="py-3 px-4 max-w-xs">
                        {rec.last_error ? (
                          <div className="text-rose-600 text-[11px] bg-rose-50 p-1.5 rounded border border-rose-100 truncate" title={rec.last_error}>
                            {rec.last_error}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {rec.conversation_id ? (
                          <Link
                            to={`/inbox?id=${rec.conversation_id}`}
                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold text-xs bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Open Chat
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">No chat</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {recipientsTotal > limit && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
            <span className="text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, recipientsTotal)} of {recipientsTotal} recipients
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Campaign"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to delete campaign <strong className="text-gray-900">{campaign.name}</strong>? All
            recipient delivery tracking and execution statistics for this campaign will be permanently removed.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteCampaign}
              isLoading={isDeleting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
