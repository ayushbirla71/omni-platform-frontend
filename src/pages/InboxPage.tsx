import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Radio,
  Clock,
  CheckCheck,
  Plus,
  RefreshCw,
  Phone,
  UserCheck,
  Tag,
  Paperclip,
  Smile,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { conversationsApi, contactsApi, dealsApi } from '../api';
import type { Conversation, Message, Contact, Deal } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Tabs';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { formatDateTime, formatRelativeTime, cn } from '../lib/utils';

export const InboxPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConvId = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [messageText, setMessageText] = useState('');

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  // Modals
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealValue, setNewDealValue] = useState('10000'); // in cents ($100)
  const [newDealStage, setNewDealStage] = useState('Lead');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

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

        // Load contact details & deals
        const currentConv = conversations.find((c) => c.id === selectedConvId);
        if (currentConv?.contactId) {
          const contactList = await contactsApi.list(100, 0);
          const currentContact = contactList.find((c) => c.id === currentConv.contactId);
          if (currentContact) setContact(currentContact);

          const allDeals = await dealsApi.list();
          setDeals(allDeals.filter((d) => d.contactId === currentConv.contactId));
        }
      } catch (err) {
        showToast('Failed to load messages', 'error');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessagesAndContact();
  }, [selectedConvId]);

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
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              Inbox ({conversations.length})
            </h2>
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
                  return (
                    <div
                      key={msg._id || msg.id || index}
                      className={cn('flex flex-col', isOutbound ? 'items-end' : 'items-start')}
                    >
                      <div
                        className={cn(
                          'max-w-md px-4 py-3 rounded-2xl shadow-xs text-xs space-y-1',
                          isOutbound
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-none'
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1 text-[10px] pt-1',
                            isOutbound ? 'text-primary-100' : 'text-gray-400'
                          )}
                        >
                          <span>{formatDateTime(msg.createdAt)}</span>
                          {isOutbound && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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

      {/* ==================== RIGHT PANE: Contact Details & Deals ==================== */}
      {activeConversation && (
        <div className="w-72 border-l border-gray-200 bg-white p-5 overflow-y-auto hidden xl:block space-y-6">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Contact Details
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-900">
                  {activeConversation.contactName || 'No Name Set'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Radio className="w-3.5 h-3.5 text-gray-400" />
                <span className="capitalize">{activeConversation.channelType}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{activeConversation.contactExternalId}</span>
              </div>
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
        </div>
      )}

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
    </div>
  );
};
