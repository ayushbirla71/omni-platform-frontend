import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Clock,
  CheckCircle2,
  Send,
  Users,
  MessageSquare,
  Calendar,
  Zap,
  Repeat,
  GitBranch,
  Layers,
  Trash2,
  Tag as TagIcon,
  BarChart3,
  Eye,
} from 'lucide-react';
import { campaignsApi } from '../api';
import type { Campaign } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'flow' | 'broadcast' | 'drip'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sending' | 'completed'>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await campaignsApi.list();
      setCampaigns(data);
    } catch (err) {
      showToast('Failed to load campaigns', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to execute and send this campaign now?')) return;

    setSendingId(campaignId);
    try {
      const res = await campaignsApi.send(campaignId);
      showToast(`Campaign sent successfully! (${res.sent} sent, ${res.failed} failed)`, 'success');
      loadCampaigns();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send campaign', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await campaignsApi.delete(campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      showToast('Campaign deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete campaign', 'error');
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const draftCount = campaigns.filter((c) => c.status === 'draft').length;
  const sendingCount = campaigns.filter((c) => c.status === 'sending').length;
  const completedCount = campaigns.filter((c) => c.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaigns & Broadcast Automation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Trigger Flow Builder automations, instant template broadcasts, and scheduled drip sequences
          </p>
        </div>

        <Link to="/campaigns/new">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold">{draftCount}</p>
          <p className="text-xs text-blue-100 mt-0.5">Ready / Draft Campaigns</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold">{sendingCount}</p>
          <p className="text-xs text-amber-100 mt-0.5">Currently Sending</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-xs text-emerald-100 mt-0.5">Completed Executions</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type:</span>
            {(['all', 'flow', 'broadcast', 'drip'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors',
                  filterType === type
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {type === 'all' ? 'All Types' : type === 'flow' ? 'Flow Builder' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status:</span>
            {(['all', 'draft', 'sending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors',
                  filterStatus === status
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="text-center py-16">
          <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-900">No campaigns found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
            {filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters to see more campaigns'
              : 'Create your first Flow Builder automation or broadcast to engage your audience'}
          </p>
          {filterType === 'all' && filterStatus === 'all' && (
            <Link to="/campaigns/new">
              <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
                Create First Campaign
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => {
            const totalRecipients = campaign.total_recipients || campaign.totalRecipients || 0;
            const sentCount = campaign.sent_count || campaign.sentCount || 0;
            const progressPercent = totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0;
            const def: any = campaign.definition || {};

            return (
              <Card key={campaign.id} hover className="p-5 space-y-4">
                {/* Campaign Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                        campaign.type === 'flow'
                          ? 'bg-emerald-100 text-emerald-700'
                          : campaign.type === 'broadcast'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      )}
                    >
                      {campaign.type === 'flow' ? (
                        <GitBranch className="w-6 h-6" />
                      ) : campaign.type === 'broadcast' ? (
                        <Zap className="w-6 h-6" />
                      ) : (
                        <Repeat className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          to={`/campaigns/${campaign.id}`}
                          className="text-sm font-bold text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {campaign.name}
                        </Link>
                        <Badge
                          variant={
                            campaign.status === 'completed'
                              ? 'success'
                              : campaign.status === 'sending'
                              ? 'warning'
                              : 'secondary'
                          }
                          size="sm"
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
                          size="sm"
                          className="capitalize"
                        >
                          {campaign.type === 'flow' ? 'Flow Builder' : campaign.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {sentCount} / {totalRecipients} recipients
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>Created {formatDateTime(campaign.created_at || campaign.createdAt || '')}</span>
                        </div>
                        {def.tags && def.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <TagIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-600">
                              Tags: {def.tags.map((t: string) => `#${t}`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {totalRecipients > 0 && (campaign.status === 'sending' || campaign.status === 'completed') && (
                        <div className="mt-3 max-w-md">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all duration-300',
                                campaign.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : 'bg-gradient-to-r from-primary-500 to-primary-600'
                              )}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{Math.round(progressPercent)}% sent</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<BarChart3 className="w-3.5 h-3.5 text-primary-600" />}
                      >
                        Analytics
                      </Button>
                    </Link>
                    {campaign.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={sendingId === campaign.id}
                        onClick={() => handleSendCampaign(campaign.id)}
                        icon={<Send className="w-3.5 h-3.5" />}
                      >
                        Send Now
                      </Button>
                    )}
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Campaign Details Preview */}
                <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                  {campaign.type === 'flow' ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-900">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>
                          Flow ID: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">{def.flowId || 'N/A'}</code>
                        </span>
                      </div>
                      {def.flowId && (
                        <Link
                          to={`/flows/${def.flowId}`}
                          className="text-primary-600 hover:underline font-semibold text-xs"
                        >
                          View Flow Graph →
                        </Link>
                      )}
                    </div>
                  ) : campaign.type === 'broadcast' ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Message Content</p>
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                        {def.text || campaign.message || 'No text defined'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Drip Sequence Steps</p>
                      <div className="space-y-1">
                        {(def.steps || campaign.steps || []).slice(0, 2).map((step: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                            <Badge variant="outline" size="sm">
                              Step {idx + 1}
                            </Badge>
                            <span className="line-clamp-1 flex-1">{step.text || step.message}</span>
                            <span className="text-[10px] text-gray-400 font-mono">+{step.delayHours || 0}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
