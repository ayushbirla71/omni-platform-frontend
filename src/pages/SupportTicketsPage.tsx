import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  ShieldAlert,
  ArrowRight,
  Headphones,
  FileText,
  User,
  Shield,
  Sparkles,
} from "lucide-react";
import { supportApi } from "../api";
import type { SupportTicketSummary, SupportTicketDetail, SupportTicketMessage } from "../types";
import { useToast } from "../context/ToastContext";
import { useRealtimeEvent } from "../hooks/useWebSocket";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Spinner } from "../components/common/Tabs";
import { formatRelativeTime } from "../lib/utils";

export const SupportTicketsPage: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<SupportTicketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Ticket Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Auto-scroll messages to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  useEffect(() => {
    if (ticketDetail?.messages) {
      scrollToBottom(false);
    }
  }, [ticketDetail?.id]);

  // Real-time: Listen for incoming ticket messages
  useRealtimeEvent("support_ticket:message", (event) => {
    const data = event.data;
    if (!data || !data.ticketId) return;

    // If currently viewing this ticket, append message
    if (selectedTicketId === data.ticketId && data.message) {
      setTicketDetail((prev) => {
        if (!prev || prev.id !== data.ticketId) return prev;
        const exists = prev.messages.some((m) => m.id === data.message.id);
        if (exists) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          lastReplyAt: data.lastReplyAt || new Date().toISOString(),
          messages: [...prev.messages, data.message],
        };
      });
      setTimeout(() => scrollToBottom(true), 50);
    }

    // Update tickets list
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === data.ticketId) {
          return {
            ...t,
            status: data.status || t.status,
            lastReplyAt: data.lastReplyAt || new Date().toISOString(),
            messageCount: (t.messageCount || 0) + 1,
          };
        }
        return t;
      })
    );
  });

  // Real-time: Listen for ticket status / assignment updates
  useRealtimeEvent("support_ticket:updated", (event) => {
    const data = event.data;
    if (!data || !data.ticketId) return;

    if (selectedTicketId === data.ticketId) {
      setTicketDetail((prev) => {
        if (!prev || prev.id !== data.ticketId) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          priority: data.priority || prev.priority,
          category: data.category || prev.category,
          assignedToStaffId: data.assignedToStaffId,
          assignedToName: data.assignedToName,
          resolvedAt: data.resolvedAt,
          closedAt: data.closedAt,
        };
      });
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === data.ticketId) {
          return {
            ...t,
            status: data.status || t.status,
            priority: data.priority || t.priority,
            category: data.category || t.category,
            assignedToStaffId: data.assignedToStaffId,
            assignedToName: data.assignedToName,
          };
        }
        return t;
      })
    );
  });

  // Real-time: Listen for newly created tickets
  useRealtimeEvent("support_ticket:created", (event) => {
    const data = event.data;
    if (!data?.ticket) return;

    setTickets((prev) => {
      const exists = prev.some((t) => t.id === data.ticket.id);
      if (exists) return prev;
      return [data.ticket, ...prev];
    });
  });

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { status?: string; search?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await supportApi.listTickets(params);
      setTickets(data || []);

      // If a ticket is currently selected, refresh its details
      if (selectedTicketId) {
        fetchTicketDetail(selectedTicketId);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load support tickets", "error");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, selectedTicketId, showToast]);

  const fetchTicketDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const data = await supportApi.getTicket(id);
      setTicketDetail(data);
      setTimeout(() => scrollToBottom(false), 50);
    } catch (err: any) {
      showToast(err.message || "Failed to load ticket details", "error");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    fetchTicketDetail(id);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      showToast("Subject and message are required", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await supportApi.createTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim(),
      });

      showToast(`Support ticket ${created.ticketNumber} created successfully!`, "success");
      setIsCreateModalOpen(false);
      setNewSubject("");
      setNewCategory("general");
      setNewPriority("medium");
      setNewMessage("");

      await fetchTickets();
      setSelectedTicketId(created.id);
      fetchTicketDetail(created.id);
    } catch (err: any) {
      showToast(err.message || "Failed to create support ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDetail || !replyMessage.trim()) return;

    try {
      setIsSubmittingReply(true);
      const sentMsg = await supportApi.postMessage(ticketDetail.id, {
        message: replyMessage.trim(),
      });

      setReplyMessage("");
      if (sentMsg) {
        setTicketDetail((prev) => {
          if (!prev) return prev;
          const exists = prev.messages.some((m) => m.id === sentMsg.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, sentMsg],
          };
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
      showToast("Reply sent to support team", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to post reply", "error");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Helper status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="primary">Open</Badge>;
      case "in_progress":
        return <Badge variant="warning">In Progress</Badge>;
      case "pending_customer":
        return <Badge variant="purple">Pending You</Badge>;
      case "resolved":
        return <Badge variant="success">Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper priority badge styles
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">URGENT</span>;
      case "high":
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">High</span>;
      case "medium":
        return <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">Medium</span>;
      default:
        return <span className="text-[11px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">Low</span>;
    }
  };

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const pendingCount = tickets.filter((t) => t.status === "pending_customer").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Platform Support & Helpdesk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Need help or encountered an issue? Open a case with our 24/7 engineering and support team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets()}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Open New Ticket
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Cases</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active / In Progress</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{openCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Your Action</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Resolved / Closed</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ticket List */}
        <div className={`space-y-4 ${selectedTicketId ? "lg:col-span-5" : "lg:col-span-12"}`}>
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["all", "open", "in_progress", "pending_customer", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {st === "all" ? "All" : st.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                placeholder="Search ticket # or subject..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Ticket List View */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                <Spinner size="lg" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No tickets found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== "all"
                    ? "No tickets matched your current search and filter criteria."
                    : "You don't have any support tickets yet. Need help with anything? Open a ticket!"}
                </p>
                <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create Ticket
                </Button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    className={`bg-white dark:bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-indigo-400 dark:hover:border-indigo-500/50 ${
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/10"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          • {t.category.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(t.priority)}
                        {getStatusBadge(t.status)}
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-2 line-clamp-1">
                      {t.subject}
                    </h4>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Opened {formatRelativeTime(t.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t.messageCount || 0} {t.messageCount === 1 ? "msg" : "msgs"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        {selectedTicketId && (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[750px] sticky top-6">
            {isLoadingDetail || !ticketDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Spinner size="lg" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Loading ticket conversation...</p>
              </div>
            ) : (
              <>
                {/* Detail Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                        {ticketDetail.ticketNumber}
                      </span>
                      {getStatusBadge(ticketDetail.status)}
                      {getPriorityBadge(ticketDetail.priority)}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize font-medium">
                      Category: {ticketDetail.category.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                    {ticketDetail.subject}
                  </h3>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {ticketDetail.messages.map((msg) => {
                    const isStaff = msg.senderType === "platform_staff";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                          {isStaff ? (
                            <>
                              <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                                <Shield className="w-3.5 h-3.5" />
                                <span>{msg.senderName || "Support Engineer"}</span>
                              </div>
                              <span className="text-slate-500">• Official Staff</span>
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {msg.senderName || "You"}
                              </span>
                            </>
                          )}
                          <span>• {formatRelativeTime(msg.createdAt)}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                            isStaff
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-slate-900 dark:text-indigo-100 rounded-tl-sm shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tr-sm"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                  {ticketDetail.status === "closed" ? (
                    <div className="text-center py-2 text-xs text-slate-500">
                      This ticket is closed. Open a new case if you need further assistance.
                    </div>
                  ) : (
                    <form onSubmit={handlePostReply} className="space-y-3">
                      <textarea
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Write a reply to the support team..."
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400">
                          Replies notify platform engineers immediately in real-time.
                        </p>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={!replyMessage.trim() || isSubmittingReply}
                          className="flex items-center gap-1.5"
                        >
                          {isSubmittingReply ? (
                            <Spinner size="sm" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Send Reply
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal: Open Support Ticket with clean, spacious layout */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open Support Ticket"
        description="Open a direct case with our engineering & support team. We typically respond within 15 minutes."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. WhatsApp channel webhook synchronization failing"
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="general">General Inquiry</option>
                <option value="billing">Billing & Subscription</option>
                <option value="channels">Channel Integration</option>
                <option value="ai_copilot">AI & Knowledge Base</option>
                <option value="bug">Technical Bug / Outage</option>
                <option value="compliance">GDPR & Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Urgency / Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="low">Low - General query</option>
                <option value="medium">Medium - Standard issue</option>
                <option value="high">High - Impacting operations</option>
                <option value="urgent">Urgent - Critical outage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Description & Steps to Reproduce <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe the issue in detail. Include any relevant error messages, IDs, or timestamps..."
              className="w-full text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              {isSubmitting ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
