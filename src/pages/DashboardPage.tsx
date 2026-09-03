import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  MessageSquare,
  Users,
  KanbanSquare,
  Megaphone,
  Plus,
  ArrowUpRight,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { channelsApi, conversationsApi, contactsApi, dealsApi, campaignsApi, whatsappOnboardingApi } from '../api';
import type { Channel, Conversation, Contact, PipelineSummary, Campaign, OnboardingCapacity } from '../types';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';
import { formatRelativeTime } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipeline, setPipeline] = useState<PipelineSummary[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [capacity, setCapacity] = useState<OnboardingCapacity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [ch, conv, cont, pipe, camp, cap] = await Promise.allSettled([
          channelsApi.list(),
          conversationsApi.list(),
          contactsApi.list(10, 0),
          dealsApi.getPipelineSummary(),
          campaignsApi.list(),
          whatsappOnboardingApi.getCapacity(),
        ]);

        if (ch.status === 'fulfilled') setChannels(ch.value);
        if (conv.status === 'fulfilled') setConversations(conv.value);
        if (cont.status === 'fulfilled') setContacts(cont.value);
        if (pipe.status === 'fulfilled') setPipeline(pipe.value);
        if (camp.status === 'fulfilled') setCampaigns(camp.value);
        if (cap.status === 'fulfilled') setCapacity(cap.value);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalPipelineValue = pipeline.reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0);
  const activeChannels = channels.filter((c) => c.status === 'active').length;
  const openConversations = conversations.filter((c) => c.status === 'open').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time analytics and activity across all your communication channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/channels">
            <Button variant="outline" size="sm" icon={<Radio className="w-4 h-4 text-emerald-600" />}>
              Connect Channel
            </Button>
          </Link>
          <Link to="/campaigns/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Connected Channels */}
        <Card hover className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{channels.length}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activeChannels} Active
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Open Conversations */}
        <Card hover className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Chats</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{openConversations}</h3>
              <p className="text-xs text-primary-600 font-medium mt-1">
                {conversations.length} Total Conversations
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Contacts */}
        <Card hover className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacts</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{contacts.length}</h3>
              <p className="text-xs text-purple-600 font-medium mt-1">Audience Directory</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Pipeline Value */}
        <Card hover className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deals Pipeline</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                ${(totalPipelineValue / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Across all CRM stages</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <KanbanSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Meta Tech Provider Capacity & Quick Onboarding Banner */}
      {capacity && (
        <Card className="bg-gradient-to-r from-primary-900 via-slate-900 to-indigo-950 text-white border-0 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Meta Tech Provider Onboarding Engine
              </div>
              <h3 className="text-lg font-bold text-white">
                WhatsApp Embedded Signup Capacity: {capacity.remaining} remaining
              </h3>
              <p className="text-xs text-slate-300">
                You have used {capacity.used} of {capacity.limit} client onboarding slots in the rolling {capacity.windowDays}-day window.
              </p>
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (capacity.used / capacity.limit) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link to="/channels">
                <Button variant="primary" size="md" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-none border-0">
                  Manage WhatsApp WABAs
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Split Section: Recent Activity & Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Conversations</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Latest inbound and outbound chats</p>
            </div>
            <Link to="/inbox" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              View Inbox <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <div className="space-y-3">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No conversations yet. Inbound webhooks will appear here.
              </div>
            ) : (
              conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.id}
                  to={`/inbox?id=${conv.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-gray-700 uppercase">
                      {conv.contactName ? conv.contactName.substring(0, 2) : 'CT'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {conv.contactName || conv.contactExternalId || 'Unknown Contact'}
                        </p>
                        <Badge variant={conv.channelType === 'whatsapp' ? 'success' : 'primary'} size="sm">
                          {conv.channelType}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                        {conv.lastMessageText || 'No message preview'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400">
                      {formatRelativeTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                    <div className="mt-0.5">
                      <Badge variant={conv.status === 'open' ? 'success' : 'secondary'} size="sm">
                        {conv.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* CRM Pipeline Breakdown */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Deals Pipeline Breakdown</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Summary of deals and values by stage</p>
            </div>
            <Link to="/deals" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              Kanban Board <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <div className="space-y-4">
            {pipeline.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                <KanbanSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No deals in the pipeline yet.
              </div>
            ) : (
              pipeline.map((stage) => {
                const percentage = totalPipelineValue > 0 ? (Number(stage.totalValue) / totalPipelineValue) * 100 : 0;
                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 capitalize flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                        {stage.stage} ({stage.count} deals)
                      </span>
                      <span className="font-bold text-gray-900">
                        ${((Number(stage.totalValue) || 0) / 100).toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Campaigns Quick View */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Campaigns</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Broadcast and drip marketing sequences</p>
          </div>
          <Link to="/campaigns" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
            All Campaigns <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-400 text-xs">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No campaigns created yet. Click "New Campaign" above to launch one.
            </div>
          ) : (
            campaigns.slice(0, 3).map((camp) => (
              <div key={camp.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={camp.type === 'broadcast' ? 'purple' : 'primary'} size="sm">
                    {camp.type}
                  </Badge>
                  <Badge variant={camp.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {camp.status}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-gray-900">{camp.name}</h4>
                <p className="text-[11px] text-gray-500">
                  {camp.type === 'broadcast'
                    ? (camp.definition as any)?.text?.substring(0, 50) + '...'
                    : `${(camp.definition as any)?.steps?.length || 0} drip sequence steps`}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
