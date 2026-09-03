import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Megaphone,
  Zap,
  Repeat,
  GitBranch,
  Plus,
  Trash2,
  Clock,
  Users,
  Eye,
  Save,
  CheckCircle2,
  Tag as TagIcon,
  Layers,
  Sparkles,
  Info,
  Filter,
} from 'lucide-react';
import { campaignsApi, channelsApi, contactsApi, flowsApi } from '../api';
import type { Channel, Contact, Flow, DripStep } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { cn } from '../lib/utils';

export const NewCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [campaignType, setCampaignType] = useState<'flow' | 'broadcast' | 'drip'>('flow');
  const [name, setName] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Flow Automation selection
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');

  // Audience selection mode: 'tags' (dynamic query) vs 'manual' (explicit IDs)
  const [audienceMode, setAudienceMode] = useState<'tags' | 'manual'>('tags');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Broadcast fields
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Drip fields
  const [dripSteps, setDripSteps] = useState<DripStep[]>([
    { stepNumber: 1, delayHours: 0, message: 'Hi {{name}}, welcome to our platform!' },
    { stepNumber: 2, delayHours: 24, message: 'Hi {{name}}, just checking in to see if you had any questions.' },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [channelsData, flowsData, contactsData, tagsData] = await Promise.all([
          channelsApi.list(),
          flowsApi.list().catch(() => []),
          contactsApi.list(2000, 0),
          contactsApi.getTags().catch(() => []),
        ]);
        setChannels(channelsData);
        setFlows(flowsData);
        setContacts(contactsData);
        setAvailableTags(tagsData);

        if (channelsData.length > 0) {
          setSelectedChannelId(channelsData[0].id);
        }

        const publishedFlow = flowsData.find((f) => f.status === 'published') || flowsData[0];
        if (publishedFlow) {
          setSelectedFlowId(publishedFlow.id);
        }
      } catch (err) {
        showToast('Failed to load initial data for campaign creation', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute targeted contacts dynamically
  const targetedContacts = useMemo(() => {
    return contacts.filter((c) => {
      const contactChannelId = c.channelId || c.channel_id || '';
      const channelMatch = !selectedChannelId || contactChannelId === selectedChannelId;

      if (audienceMode === 'manual') {
        return channelMatch && selectedContactIds.has(c.id);
      }

      // Tag filter mode:
      if (selectedTags.length === 0) {
        // All contacts on channel
        return channelMatch;
      }

      const contactTags = (c.attributes?.tags || []).map((t) => t.toLowerCase());
      const hasAnyTag = selectedTags.some((t) => contactTags.includes(t.toLowerCase()));
      return channelMatch && hasAnyTag;
    });
  }, [contacts, selectedChannelId, audienceMode, selectedTags, selectedContactIds]);

  const handleToggleTag = (tag: string) => {
    const lower = tag.toLowerCase();
    if (selectedTags.includes(lower)) {
      setSelectedTags(selectedTags.filter((t) => t !== lower));
    } else {
      setSelectedTags([...selectedTags, lower]);
    }
  };

  const handleToggleContact = (id: string) => {
    const newSet = new Set(selectedContactIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContactIds(newSet);
  };

  const handleSelectAllContacts = () => {
    const channelContacts = contacts.filter(
      (c) => !selectedChannelId || (c.channelId || c.channel_id) === selectedChannelId
    );
    if (selectedContactIds.size === channelContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(channelContacts.map((c) => c.id)));
    }
  };

  const handleAddDripStep = () => {
    const nextStepNum = dripSteps.length + 1;
    setDripSteps([
      ...dripSteps,
      { stepNumber: nextStepNum, delayHours: 48, message: `Follow-up step #${nextStepNum}` },
    ]);
  };

  const handleRemoveDripStep = (index: number) => {
    const copy = dripSteps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setDripSteps(copy);
  };

  const handleUpdateDripStep = (index: number, field: keyof DripStep, value: any) => {
    const copy = [...dripSteps];
    copy[index] = { ...copy[index], [field]: value };
    setDripSteps(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a campaign name', 'error');
      return;
    }

    if (!selectedChannelId) {
      showToast('Please select a channel', 'error');
      return;
    }

    if (campaignType === 'flow' && !selectedFlowId) {
      showToast('Please select a visual Flow for this campaign', 'error');
      return;
    }

    if (campaignType === 'broadcast' && !broadcastMessage.trim()) {
      showToast('Please enter a broadcast message', 'error');
      return;
    }

    if (campaignType === 'drip' && dripSteps.length === 0) {
      showToast('Please add at least one drip step', 'error');
      return;
    }

    if (targetedContacts.length === 0) {
      showToast('No contacts match the selected audience criteria. Add contacts or select different tags.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const contactIds = targetedContacts.map((c) => c.id);

      await campaignsApi.create({
        name: name.trim(),
        type: campaignType,
        channelId: selectedChannelId,
        contactIds,
        tags: audienceMode === 'tags' && selectedTags.length > 0 ? selectedTags : undefined,
        flowId: campaignType === 'flow' ? selectedFlowId : undefined,
        message: campaignType === 'broadcast' ? broadcastMessage.trim() : undefined,
        steps: campaignType === 'drip' ? dripSteps : undefined,
        definition:
          campaignType === 'flow'
            ? { flowId: selectedFlowId, tags: selectedTags }
            : campaignType === 'broadcast'
            ? { text: broadcastMessage.trim(), tags: selectedTags }
            : { steps: dripSteps },
      });

      showToast(`Campaign "${name}" created with ${contactIds.length} recipients!`, 'success');
      navigate('/campaigns');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create campaign', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFlow = flows.find((f) => f.id === selectedFlowId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link to="/campaigns">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Launch Flow Builder automations, quick broadcasts, or multi-step drips targeted by tags
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          icon={<Save className="w-4 h-4" />}
        >
          Create Campaign
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Campaign Execution Mode */}
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary-600" />
            1. Campaign Execution Mode
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Flow Automation Mode (Recommended) */}
            <div
              onClick={() => setCampaignType('flow')}
              className={cn(
                'p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 space-y-2 relative',
                campaignType === 'flow'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <GitBranch className="w-5 h-5" />
                </div>
                {campaignType === 'flow' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-gray-900">Flow Builder Automation</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Run an interactive visual flow with WhatsApp template buttons, auto-retries, wait nodes, and branching.
              </p>
            </div>

            {/* Instant Broadcast */}
            <div
              onClick={() => setCampaignType('broadcast')}
              className={cn(
                'p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 space-y-2',
                campaignType === 'broadcast'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                {campaignType === 'broadcast' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </div>
              <h3 className="text-sm font-bold text-gray-900">Instant Broadcast</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Send a single direct text or template message simultaneously to targeted contacts.
              </p>
            </div>

            {/* Drip Sequence */}
            <div
              onClick={() => setCampaignType('drip')}
              className={cn(
                'p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 space-y-2',
                campaignType === 'drip'
                  ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-2 ring-purple-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Repeat className="w-5 h-5" />
                </div>
                {campaignType === 'drip' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
              </div>
              <h3 className="text-sm font-bold text-gray-900">Timed Drip Sequence</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Send a timed sequence of follow-up messages spaced across hours or days.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Campaign Name"
              placeholder="e.g. VIP Customer Offer - Followup Flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Target Channel
              </label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
                required
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.externalId || c.type} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Step 2: Content or Flow Configuration */}
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            {campaignType === 'flow' ? (
              <GitBranch className="w-4 h-4 text-emerald-600" />
            ) : campaignType === 'broadcast' ? (
              <Zap className="w-4 h-4 text-blue-600" />
            ) : (
              <Repeat className="w-4 h-4 text-purple-600" />
            )}
            2. {campaignType === 'flow' ? 'Select Visual Flow' : campaignType === 'broadcast' ? 'Broadcast Message' : 'Drip Sequence'}
          </h2>

          {/* 1. Flow Builder Selection */}
          {campaignType === 'flow' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Choose Published Flow Automation
                </label>
                <select
                  value={selectedFlowId}
                  onChange={(e) => setSelectedFlowId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white font-medium"
                  required
                >
                  <option value="" disabled>
                    -- Select a flow --
                  </option>
                  {flows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name} ({flow.status === 'published' ? 'Published' : 'Draft'} • v{flow.version})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Flow Details Card */}
              {selectedFlow ? (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">{selectedFlow.name}</h4>
                        <p className="text-[10px] text-emerald-700">
                          {selectedFlow.definition?.nodes?.length || 0} nodes • Entry Node:{' '}
                          <code className="font-mono font-bold">{selectedFlow.definition?.entryNodeId || 'N/A'}</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={selectedFlow.status === 'published' ? 'success' : 'warning'} size="sm">
                        {selectedFlow.status}
                      </Badge>
                      <Link to={`/flows/${selectedFlow.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs py-1 h-7">
                          Edit in Flow Builder
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900">
                    <div>
                      <span className="text-emerald-700 font-semibold block text-[10px]">WhatsApp Templates:</span>
                      <span>
                        {selectedFlow.definition?.nodes?.filter((n) => n.type === 'template').length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-semibold block text-[10px]">Auto-Retry & Waits:</span>
                      <span>
                        {selectedFlow.definition?.nodes?.filter((n) => n.type === 'wait' || (n as any).retryConfig?.maxRetries).length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-semibold block text-[10px]">Conditions / Branches:</span>
                      <span>
                        {selectedFlow.definition?.nodes?.filter((n) => n.type === 'condition').length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-semibold block text-[10px]">Handoffs / Actions:</span>
                      <span>
                        {selectedFlow.definition?.nodes?.filter((n) => n.type === 'handoff' || n.type === 'action').length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  No visual flows found. Go to <b>Flow Builder</b> to design an automated conversation tree with templates, buttons, and retry timers.
                </div>
              )}
            </div>
          )}

          {/* 2. Broadcast Message */}
          {campaignType === 'broadcast' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Message Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Hi {{name}}, we are excited to announce our new special offer! Visit..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-primary-500"
                  required
                />
                <p className="text-[11px] text-gray-500">
                  Tip: Use <code>&#123;&#123;name&#125;&#125;</code> to personalize each message with the contact's name.
                </p>
              </div>

              {broadcastMessage && (
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Sample Preview (Interpolated)
                  </span>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 shadow-xs max-w-md">
                    {broadcastMessage.replace(/{{name}}/g, 'Alex')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Drip Sequence */}
          {campaignType === 'drip' && (
            <div className="space-y-4">
              {dripSteps.map((step, index) => (
                <div key={index} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" size="md">
                        Step {step.stepNumber}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Delay:</span>
                        <input
                          type="number"
                          min="0"
                          value={step.delayHours}
                          onChange={(e) =>
                            handleUpdateDripStep(index, 'delayHours', Number(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-0.5 text-xs rounded-lg border border-gray-200 bg-white font-mono"
                        />
                        <span>hours after previous step</span>
                      </div>
                    </div>

                    {dripSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDripStep(index)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Enter message for this drip step..."
                    value={step.message}
                    onChange={(e) => handleUpdateDripStep(index, 'message', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAddDripStep}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Next Drip Step
              </Button>
            </div>
          )}
        </Card>

        {/* Step 3: Audience Criteria & Dynamic Target Count */}
        <Card className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" />
              3. Target Audience Selection
            </h2>

            {/* Dynamic Real-time Audience Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Targeted Audience:</span>
              <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{targetedContacts.length} Contacts</span>
              </div>
            </div>
          </div>

          {/* Audience Selection Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAudienceMode('tags')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5',
                audienceMode === 'tags'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <TagIcon className="w-3.5 h-3.5" />
              Filter by Tags (followup, up, mp...)
            </button>
            <button
              type="button"
              onClick={() => setAudienceMode('manual')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5',
                audienceMode === 'manual'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Manual Contact Selection
            </button>
          </div>

          {/* Tag Filter Mode UI */}
          {audienceMode === 'tags' && (
            <div className="space-y-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>Select Audience Tags to Include:</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    {selectedTags.length === 0 ? 'All contacts on channel' : `${selectedTags.length} tags selected`}
                  </span>
                </label>
                <p className="text-[11px] text-gray-500">
                  Select one or more tags (e.g. <code>followup</code>, <code>up</code>, <code>mp</code>). If no tag is selected, all contacts on the channel will be targeted.
                </p>
              </div>

              {/* Tag Badges Selectors */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all',
                    selectedTags.length === 0
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  All Contacts (No Tag Filter)
                </button>

                {Array.from(new Set(['followup', 'up', 'mp', 'vip', 'lead', ...availableTags])).map((tag) => {
                  const isSelected = selectedTags.includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5',
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                      )}
                    >
                      <span>#{tag}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Audience Preview Summary */}
              <div className="pt-3 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-700">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary-600" />
                  <span>
                    Matching <b>{targetedContacts.length}</b> contacts from database
                  </span>
                </div>
                <Link to="/contacts" target="_blank" className="text-primary-600 hover:underline font-semibold">
                  Manage Contacts & Tags ↗
                </Link>
              </div>
            </div>
          )}

          {/* Manual Selection Mode UI */}
          {audienceMode === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-semibold">
                  {selectedContactIds.size} contacts selected manually
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllContacts}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {selectedContactIds.size === contacts.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                {contacts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No contacts found. Please import contacts first.
                  </div>
                ) : (
                  contacts.map((contact) => {
                    const isSelected = selectedContactIds.has(contact.id);
                    const tags = contact.attributes?.tags || [];
                    const externalId = contact.externalId || contact.external_id || '';

                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleToggleContact(contact.id)}
                        className={cn(
                          'p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50',
                          isSelected && 'bg-primary-50/40'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleContact(contact.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{contact.name || 'Unnamed'}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{externalId}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Link to="/campaigns">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
          >
            Create & Prepare Campaign ({targetedContacts.length} Recipients)
          </Button>
        </div>
      </form>
    </div>
  );
};
