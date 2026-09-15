import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Eye,
  Type,
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  ExternalLink,
  Phone,
  Copy,
  CornerDownLeft,
  ShieldCheck,
  Languages,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { channelsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Channel } from '../../types';

export interface WhatsAppTemplateItem {
  id?: string;
  name: string;
  language: string;
  category: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'IN_APPEAL' | 'DELETED' | string;
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | string;
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | string;
    text?: string;
    example?: any;
    buttons?: Array<{
      type: string;
      text?: string;
      url?: string;
      phone_number?: string;
      example?: any;
      otp_type?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }>;
  rejected_reason?: string;
  quality_score?: { score: string };
  [key: string]: any;
}

interface WhatsAppTemplatesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onOpenCreate: () => void;
}

export const WhatsAppTemplatesManagerModal: React.FC<WhatsAppTemplatesManagerModalProps> = ({
  isOpen,
  onClose,
  channel,
  onOpenCreate,
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplateItem | null>(null);

  // Deletion state
  const [deletingTemplate, setDeletingTemplate] = useState<WhatsAppTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!channel) return;
    setLoading(true);
    try {
      const res = await channelsApi.listTemplates(channel.id);
      const data = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : [];
      setTemplates(data);
      if (data.length > 0 && !previewTemplate) {
        setPreviewTemplate(data[0]);
      }
    } catch (err: any) {
      console.error('[WhatsAppTemplatesManager] Fetch failed:', err);
      const errMsg =
        err?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to fetch templates from Meta');
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [channel, showToast]);

  useEffect(() => {
    if (isOpen && channel) {
      fetchTemplates();
    }
  }, [isOpen, channel, fetchTemplates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.components?.some((c) => c.text?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' || tpl.category.toUpperCase() === selectedCategory.toUpperCase();

      const matchStatus =
        selectedStatus === 'ALL' || tpl.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchSearch && matchCategory && matchStatus;
    });
  }, [templates, searchQuery, selectedCategory, selectedStatus]);

  // Handle Delete Template
  const handleDeleteConfirm = async () => {
    if (!channel || !deletingTemplate) return;
    setIsDeleting(true);
    try {
      await channelsApi.deleteTemplate(channel.id, deletingTemplate.name, deletingTemplate.id);
      showToast(`Template "${deletingTemplate.name}" deleted from Meta`, 'success');
      setDeletingTemplate(null);
      if (previewTemplate?.name === deletingTemplate.name) {
        setPreviewTemplate(null);
      }
      fetchTemplates();
    } catch (err: any) {
      console.error('[WhatsAppTemplatesManager] Deletion failed:', err);
      const errMsg =
        err?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to delete template from Meta');
      showToast(errMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'APPROVED':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3" />
            Pending Review
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" size="sm" className="flex items-center gap-1 font-semibold">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case 'PAUSED':
        return (
          <Badge variant="neutral" size="sm" className="flex items-center gap-1 font-semibold">
            <PauseCircle className="w-3 h-3" />
            Paused
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" size="sm">
            {status}
          </Badge>
        );
    }
  };

  // Header component info helper
  const getHeaderInfo = (tpl: WhatsAppTemplateItem) => {
    const header = tpl.components?.find((c) => c.type === 'HEADER');
    if (!header) return null;
    return header;
  };

  const getBodyComponent = (tpl: WhatsAppTemplateItem) => {
    return tpl.components?.find((c) => c.type === 'BODY');
  };

  const getFooterComponent = (tpl: WhatsAppTemplateItem) => {
    return tpl.components?.find((c) => c.type === 'FOOTER');
  };

  const getButtonsComponent = (tpl: WhatsAppTemplateItem) => {
    return tpl.components?.find((c) => c.type === 'BUTTONS');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp HSM Message Templates"
      description={`Manage, inspect, preview, and create official Meta message templates for ${channel?.name || 'WhatsApp'}`}
      maxWidth="5xl"
    >
      <div className="flex flex-col h-full max-h-[82vh] space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates by name, body, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="MARKETING">Marketing</option>
              <option value="UTILITY">Utility</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTemplates}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Sync Meta
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Template
            </Button>
          </div>
        </div>

        {/* Content Layout: Split Master-Detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[380px]">
          {/* ==================== LEFT LIST: TEMPLATE CARDS ==================== */}
          <div className="lg:col-span-6 overflow-y-auto pr-1 space-y-2.5 max-h-[58vh]">
            {loading ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
                <p className="text-xs text-gray-500 font-medium">Fetching message templates directly from Meta Cloud API...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                    ? 'No templates match your search criteria'
                    : 'No WhatsApp templates found for this account'}
                </p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  Create high-converting templates for notifications, marketing broadcasts, or customer service.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenCreate();
                  }}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create Your First Template
                </Button>
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = previewTemplate?.name === tpl.name;
                const header = getHeaderInfo(tpl);
                const body = getBodyComponent(tpl);
                const buttons = getButtonsComponent(tpl);

                return (
                  <div
                    key={`${tpl.name}_${tpl.language}`}
                    onClick={() => setPreviewTemplate(tpl)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/30 shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {tpl.name}
                          </h4>
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono font-medium">
                            {tpl.language}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">
                          {tpl.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {renderStatusBadge(tpl.status)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTemplate(tpl);
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Delete template from Meta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {body?.text || 'No body text.'}
                    </p>

                    {/* Badges bar */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500">
                      {header && (
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
                          {header.format === 'IMAGE' && <ImageIcon className="w-3 h-3" />}
                          {header.format === 'VIDEO' && <Video className="w-3 h-3" />}
                          {header.format === 'DOCUMENT' && <FileText className="w-3 h-3" />}
                          {header.format === 'LOCATION' && <MapPin className="w-3 h-3" />}
                          {header.format === 'TEXT' && <Type className="w-3 h-3" />}
                          <span>{header.format}</span>
                        </span>
                      )}

                      {buttons?.buttons && buttons.buttons.length > 0 && (
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
                          <CornerDownLeft className="w-3 h-3" />
                          <span>
                            {buttons.buttons.length} button{buttons.buttons.length > 1 ? 's' : ''}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================== RIGHT DETAIL: PREVIEW & METRICS ==================== */}
          <div className="lg:col-span-6 bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-start overflow-y-auto max-h-[58vh]">
            {previewTemplate ? (
              <div className="w-full space-y-4">
                {/* Meta Details Header */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">{previewTemplate.name}</h3>
                    <div className="flex items-center gap-2 text-[10.5px] text-gray-500">
                      <span>Lang: <strong className="text-gray-700 dark:text-gray-300">{previewTemplate.language}</strong></span>
                      <span>•</span>
                      <span>Category: <strong className="text-gray-700 dark:text-gray-300">{previewTemplate.category}</strong></span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(previewTemplate.status)}</div>
                </div>

                {previewTemplate.rejected_reason && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Meta Rejection Reason:</p>
                      <p className="text-[11px] mt-0.5">{previewTemplate.rejected_reason}</p>
                    </div>
                  </div>
                )}

                {/* Device Mockup */}
                <div className="mx-auto w-full max-w-[320px] rounded-3xl overflow-hidden shadow-lg border-4 border-slate-800 dark:border-slate-700 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col">
                  {/* Top Bar */}
                  <div className="bg-[#008069] dark:bg-[#202c33] text-white px-3 py-2 flex items-center gap-2 shadow-xs">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                      {channel?.name?.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-semibold truncate leading-tight">
                          {channel?.name || 'WhatsApp Business'}
                        </p>
                        <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="p-3 min-h-[260px] flex flex-col justify-start">
                    <div className="w-full rounded-2xl rounded-tl-xs overflow-hidden shadow-sm bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-slate-100 border border-black/5 dark:border-white/5">
                      {/* Header */}
                      {(() => {
                        const header = getHeaderInfo(previewTemplate);
                        if (!header) return null;
                        if (header.format === 'IMAGE') {
                          return (
                            <div className="w-full h-28 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-slate-400" />
                            </div>
                          );
                        }
                        if (header.format === 'VIDEO') {
                          return (
                            <div className="w-full h-28 bg-slate-900 text-white flex items-center justify-center">
                              <Video className="w-8 h-8 text-primary-400" />
                            </div>
                          );
                        }
                        if (header.format === 'DOCUMENT') {
                          return (
                            <div className="p-2.5 m-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                              <FileText className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-medium truncate">Document.pdf</span>
                            </div>
                          );
                        }
                        if (header.format === 'TEXT' && header.text) {
                          return (
                            <div className="px-3 pt-2.5 font-bold text-xs">
                              {header.text}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Body */}
                      <div className="px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">
                        {getBodyComponent(previewTemplate)?.text || 'No body text.'}
                      </div>

                      {/* Footer */}
                      {(() => {
                        const footer = getFooterComponent(previewTemplate);
                        if (!footer?.text) return null;
                        return (
                          <div className="px-3 pb-2 text-[10px] text-slate-500 italic">
                            {footer.text}
                          </div>
                        );
                      })()}

                      {/* Buttons */}
                      {(() => {
                        const btnComp = getButtonsComponent(previewTemplate);
                        if (!btnComp?.buttons || btnComp.buttons.length === 0) return null;
                        return (
                          <div className="border-t border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                            {btnComp.buttons.map((b, i) => (
                              <div
                                key={i}
                                className="py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00a884]"
                              >
                                {b.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3" />}
                                {b.type === 'URL' && <ExternalLink className="w-3 h-3" />}
                                {b.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3 text-slate-400" />}
                                {b.type === 'COPY_CODE' && <Copy className="w-3 h-3" />}
                                {b.type === 'OTP' && <ShieldCheck className="w-3 h-3" />}
                                <span>{b.text || b.type}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <Eye className="w-8 h-8 mb-2" />
                <p className="text-xs font-semibold">Select a template to view details and mobile preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500">
            Total {templates.length} template{templates.length !== 1 ? 's' : ''} in Meta WABA
          </span>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deletingTemplate && (
        <Modal
          isOpen={!!deletingTemplate}
          onClose={() => setDeletingTemplate(null)}
          title="Delete WhatsApp Template from Meta"
          description="Are you sure you want to permanently delete this message template from Meta Cloud API?"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold">Template: {deletingTemplate.name} ({deletingTemplate.language})</p>
              <p className="text-[11px]">
                Deleting this template will prevent it from being used in future broadcast campaigns and flow automations. This action cannot be undone on Meta.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingTemplate(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                icon={isDeleting ? undefined : <Trash2 className="w-4 h-4" />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Template'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
