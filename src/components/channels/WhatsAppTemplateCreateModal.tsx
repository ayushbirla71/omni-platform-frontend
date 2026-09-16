import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileText,
  Image as ImageIcon,
  Video,
  Phone,
  ExternalLink,
  Copy,
  CornerDownLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TemplateMediaUploader, TemplateMediaValue } from '../common/TemplateMediaUploader';
import {
  WhatsAppTemplateLivePreview,
  WhatsAppTemplatePreviewData,
} from './WhatsAppTemplateLivePreview';
import {
  Channel,
  TemplateCategory,
  TemplateHeaderFormat,
  CreateWhatsAppTemplatePayload,
  TemplateComponent,
  TemplateButton,
} from '../../types';
import { channelsApi } from '../../api';

interface WhatsAppTemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const COMMON_LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'es_ES', label: 'Spanish (Spain)' },
  { code: 'es_LA', label: 'Spanish (Latin America)' },
  { code: 'pt_BR', label: 'Portuguese (Brazil)' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'id', label: 'Indonesian' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh_CN', label: 'Chinese (Simplified)' },
  { code: 'zh_TW', label: 'Chinese (Traditional)' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'th', label: 'Thai' },
  { code: 'ms', label: 'Malay' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
];

interface ButtonFormState {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url?: string;
  urlType?: 'STATIC' | 'DYNAMIC';
  urlSample?: string;
  phoneNumber?: string;
  code?: string;
}

export const WhatsAppTemplateCreateModal: React.FC<WhatsAppTemplateCreateModalProps> = ({
  isOpen,
  onClose,
  channel,
  onSuccess,
  showToast,
}) => {
  // 1. General Info State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('MARKETING');
  const [language, setLanguage] = useState('en_US');

  // 2. Header State
  const [headerType, setHeaderType] = useState<'NONE' | TemplateHeaderFormat>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerSample, setHeaderSample] = useState('');
  const [headerMedia, setHeaderMedia] = useState<TemplateMediaValue>({});

  // 3. Body State
  const [bodyText, setBodyText] = useState('');
  const [bodySamples, setBodySamples] = useState<Record<string, string>>({});
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 4. Footer State
  const [footerText, setFooterText] = useState('');

  // 5. Buttons State
  const [buttons, setButtons] = useState<ButtonFormState[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory('MARKETING');
      setLanguage('en_US');
      setHeaderType('NONE');
      setHeaderText('');
      setHeaderSample('');
      setHeaderMedia({});
      setBodyText('');
      setBodySamples({});
      setFooterText('');
      setButtons([]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Extract detected variables from bodyText (e.g., {{1}}, {{2}})
  const detectedVariables = React.useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const uniqueVars = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ''))));
    return uniqueVars.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [bodyText]);

  // Keep body samples in sync with detected variables
  useEffect(() => {
    setBodySamples((prev) => {
      const next: Record<string, string> = {};
      detectedVariables.forEach((v) => {
        next[v] = prev[v] || '';
      });
      return next;
    });
  }, [detectedVariables]);

  // Check if variable sequence has gaps (e.g. {{1}}, {{3}})
  const variableSequenceWarning = React.useMemo(() => {
    if (detectedVariables.length === 0) return null;
    const nums = detectedVariables.map((v) => parseInt(v, 10));
    if (nums[0] !== 1) {
      return 'Variables must start with {{1}}.';
    }
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== i + 1) {
        return `Missing variable {{${i + 1}}} in sequence.`;
      }
    }
    return null;
  }, [detectedVariables]);

  // Formatting helpers for Body Text
  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bodyText.substring(start, end);
    const before = bodyText.substring(0, start);
    const after = bodyText.substring(end);

    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newText = `${before}${replacement}${after}`;
    setBodyText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 0);
  };

  const insertVariable = () => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    // Find next sequential variable index
    const nextIndex = detectedVariables.length + 1;
    const varTag = `{{${nextIndex}}}`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = bodyText.substring(0, start);
    const after = bodyText.substring(end);

    const newText = `${before}${varTag}${after}`;
    setBodyText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varTag.length, start + varTag.length);
    }, 0);
  };

  // Button management helpers
  const countByType = (type: string) => buttons.filter((b) => b.type === type).length;

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE') => {
    if (buttons.length >= 10) {
      setErrorMessage('Meta limits templates to a maximum of 10 buttons total.');
      return;
    }
    if (type === 'PHONE_NUMBER' && countByType('PHONE_NUMBER') >= 1) {
      setErrorMessage('Meta permits only 1 Phone Number button per template.');
      return;
    }
    if (type === 'URL' && countByType('URL') >= 2) {
      setErrorMessage('Meta permits a maximum of 2 URL buttons per template.');
      return;
    }
    if (type === 'COPY_CODE' && countByType('COPY_CODE') >= 1) {
      setErrorMessage('Meta permits only 1 Copy Offer Code button per template.');
      return;
    }

    setErrorMessage(null);
    const newBtn: ButtonFormState = {
      id: `btn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      text:
        type === 'QUICK_REPLY'
          ? 'Quick Reply'
          : type === 'URL'
          ? 'Visit Website'
          : type === 'PHONE_NUMBER'
          ? 'Call Support'
          : 'Copy Code',
      url: type === 'URL' ? 'https://example.com' : undefined,
      urlType: 'STATIC',
      urlSample: undefined,
      phoneNumber: type === 'PHONE_NUMBER' ? '+1' : undefined,
      code: type === 'COPY_CODE' ? 'OFFER20' : undefined,
    };
    setButtons([...buttons, newBtn]);
  };

  const handleUpdateButton = (id: string, updates: Partial<ButtonFormState>) => {
    setButtons(buttons.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleRemoveButton = (id: string) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  // Validation before submission
  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Template Name is required.';
    }
    if (!/^[a-z0-9_]{1,512}$/.test(name.trim())) {
      return 'Template Name can only contain lowercase letters, numbers, and underscores (1-512 chars).';
    }
    if (!bodyText.trim()) {
      return 'Body text is required.';
    }
    if (variableSequenceWarning) {
      return variableSequenceWarning;
    }

    // Check header variable sample
    if (headerType === 'TEXT' && headerText.includes('{{1}}') && !headerSample.trim()) {
      return 'Please provide a sample text value for the Header variable {{1}}.';
    }

    // Check body variable samples
    for (const v of detectedVariables) {
      if (!bodySamples[v] || !bodySamples[v].trim()) {
        return `Please provide a sample value for variable {{${v}}}.`;
      }
    }

    // Check media header sample
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
      if (!headerMedia.headerValue && !headerMedia.mediaStorageKey) {
        return `Please upload a sample ${headerType.toLowerCase()} file or enter a sample media URL.`;
      }
    }

    // Check buttons
    for (const btn of buttons) {
      if (!btn.text?.trim()) {
        return 'All buttons must have non-empty button text.';
      }
      if (btn.type === 'PHONE_NUMBER' && !btn.phoneNumber?.trim()) {
        return 'Please enter a valid phone number for the phone button.';
      }
      if (btn.type === 'URL') {
        if (!btn.url?.trim() || !btn.url.startsWith('http')) {
          return 'URL buttons must start with http:// or https://.';
        }
        if (btn.url.includes('{{1}}') && !btn.urlSample?.trim()) {
          return 'Please provide a sample URL for the dynamic URL button.';
        }
      }
      if (btn.type === 'COPY_CODE' && !btn.code?.trim()) {
        return 'Please enter a coupon/discount code for the Copy Code button.';
      }
    }

    return null;
  };

  // Handle Submit to Meta Cloud API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;

    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const components: TemplateComponent[] = [];

      // 1. Build HEADER component if specified
      if (headerType !== 'NONE') {
        if (headerType === 'TEXT') {
          const headerComp: TemplateComponent = {
            type: 'HEADER',
            format: 'TEXT',
            text: headerText.trim(),
          };
          if (headerText.includes('{{1}}') && headerSample.trim()) {
            headerComp.example = {
              header_text: [headerSample.trim()],
            };
          }
          components.push(headerComp);
        } else {
          // Media Header (IMAGE / VIDEO / DOCUMENT)
          const mediaUrl = headerMedia.headerValue || '';
          const headerComp: TemplateComponent = {
            type: 'HEADER',
            format: headerType,
          };
          if (mediaUrl) {
            headerComp.example = {
              header_handle: [mediaUrl],
            };
          }
          components.push(headerComp);
        }
      }

      // 2. Build BODY component
      const bodyComp: TemplateComponent = {
        type: 'BODY',
        text: bodyText,
      };
      if (detectedVariables.length > 0) {
        const sampleRow = detectedVariables.map((v) => bodySamples[v]?.trim() || `Sample ${v}`);
        bodyComp.example = {
          body_text: [sampleRow],
        };
      }
      components.push(bodyComp);

      // 3. Build FOOTER component if specified
      if (footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: footerText.trim(),
        });
      }

      // 4. Build BUTTONS component if any
      if (buttons.length > 0) {
        const metaButtons: TemplateButton[] = buttons.map((btn) => {
          if (btn.type === 'QUICK_REPLY') {
            return {
              type: 'QUICK_REPLY',
              text: btn.text.trim(),
            };
          }
          if (btn.type === 'PHONE_NUMBER') {
            return {
              type: 'PHONE_NUMBER',
              text: btn.text.trim(),
              phone_number: btn.phoneNumber?.trim(),
            };
          }
          if (btn.type === 'URL') {
            const b: TemplateButton = {
              type: 'URL',
              text: btn.text.trim(),
              url: btn.url?.trim(),
            };
            if (btn.url?.includes('{{1}}') && btn.urlSample?.trim()) {
              b.example = [btn.urlSample.trim()];
            }
            return b;
          }
          if (btn.type === 'COPY_CODE') {
            return {
              type: 'COPY_CODE',
              code: btn.code?.trim(),
              example: btn.code?.trim(),
            };
          }
          return { type: btn.type, text: btn.text };
        });

        components.push({
          type: 'BUTTONS',
          buttons: metaButtons,
        });
      }

      const payload: CreateWhatsAppTemplatePayload = {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        language,
        category,
        components,
      };

      await channelsApi.createTemplate(channel.id, payload);

      if (showToast) {
        showToast('Template submitted to Meta for approval!', 'success');
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('[WhatsAppTemplateCreateModal] Creation failed:', err);
      const msg =
        err?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to submit template to Meta.');
      setErrorMessage(msg);
      if (showToast) {
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Data binding
  const previewData: WhatsAppTemplatePreviewData = {
    name: name.toLowerCase().replace(/\s+/g, '_'),
    category,
    language,
    headerType,
    headerText,
    headerSample,
    headerMediaUrl: headerMedia.headerValue,
    headerFilename: headerMedia.filename,
    bodyText,
    bodySamples,
    footerText,
    buttons,
    businessName: channel?.displayName || channel?.display_name || 'Omni Platform',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create WhatsApp Message Template"
      description="Design rich message templates with headers, variables, footers, and interactive action buttons for Meta approval."
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
        {/* Two-Column Grid: Form Builder (Left 60%) + Device Preview (Right 40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Form Builder Sections */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: General Info */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span>1. General Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <Input
                    label="Template Name"
                    placeholder="e.g. order_shipped_v1"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, '_')
                      )
                    }
                    helperText="Lowercase alphanumeric and underscores only (e.g. welcome_offer_2026)"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="MARKETING">MARKETING (Offers & Promotions)</option>
                    <option value="UTILITY">UTILITY (Orders, Alerts, Updates)</option>
                    <option value="AUTHENTICATION">AUTHENTICATION (OTP & Security)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {COMMON_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label} ({lang.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Header Configuration */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>2. Header (Optional)</span>
                </div>
                <span className="text-[11px] text-slate-500">Text or Rich Media</span>
              </div>

              {/* Header Type Selector Tabs */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-medium">
                {(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setHeaderType(type);
                      setErrorMessage(null);
                    }}
                    className={`py-1.5 rounded-md transition-all text-center ${
                      headerType === type
                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {type === 'NONE' ? 'None' : type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Text Header Input */}
              {headerType === 'TEXT' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Header Text
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {headerText.length} / 60
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. Order Confirmation #{{1}}"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Supports up to 1 variable placeholder: <code className="font-mono text-primary-600 dark:text-primary-400">{'{{1}}'}</code>
                    </p>
                  </div>

                  {headerText.includes('{{1}}') && (
                    <div className="bg-primary-50/60 dark:bg-primary-950/20 p-2.5 rounded-lg border border-primary-200/60 dark:border-primary-800/40 space-y-1">
                      <label className="block text-[11px] font-semibold text-primary-900 dark:text-primary-200">
                        Header Sample Value for Meta Review <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12345"
                        value={headerSample}
                        onChange={(e) => setHeaderSample(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-primary-300 dark:border-primary-700 rounded-md focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Media Header (IMAGE / VIDEO / DOCUMENT) */}
              {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                <div className="pt-1">
                  <TemplateMediaUploader
                    headerType={headerType as 'IMAGE' | 'VIDEO' | 'DOCUMENT'}
                    value={headerMedia}
                    onChange={setHeaderMedia}
                    label={`Sample ${headerType.charAt(0) + headerType.slice(1).toLowerCase()} File`}
                    description={`Meta requires a sample ${headerType.toLowerCase()} file or public URL to evaluate your template.`}
                  />
                </div>
              )}
            </div>

            {/* Section 3: Body & Variables */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>3. Body Text & Variables <span className="text-rose-500">*</span></span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {bodyText.length} / 1024 chars
                </span>
              </div>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  title="Bold (*text*)"
                  className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1"
                >
                  <Bold className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('_', '_')}
                  title="Italic (_text_)"
                  className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1"
                >
                  <Italic className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Italic</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('~', '~')}
                  title="Strikethrough (~text~)"
                  className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Strike</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('```', '```')}
                  title="Monospace (```text```)"
                  className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">Code</span>
                </button>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={insertVariable}
                  className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 ml-auto shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variable {`{{${detectedVariables.length + 1}}}`}</span>
                </button>
              </div>

              {/* Body Textarea */}
              <textarea
                ref={bodyTextareaRef}
                rows={5}
                maxLength={1024}
                placeholder="Hello *{{1}}*! Thank you for ordering from us. Your order #{{2}} has been confirmed."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white leading-relaxed"
                required
              />

              {/* Variable Sequence Warning */}
              {variableSequenceWarning && (
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{variableSequenceWarning}</span>
                </div>
              )}

              {/* Dynamic Sample Values Table */}
              {detectedVariables.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <span>Variable Samples for Meta Review</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10.5px] text-slate-400">
                      {detectedVariables.length} variable{detectedVariables.length > 1 ? 's' : ''} detected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {detectedVariables.map((v) => (
                      <div
                        key={`sample-${v}`}
                        className="flex items-center space-x-2 bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-mono font-bold text-xs rounded shrink-0">
                          {`{{${v}}}`}
                        </span>
                        <input
                          type="text"
                          placeholder={`Sample for {{${v}}} (e.g. John)`}
                          value={bodySamples[v] || ''}
                          onChange={(e) =>
                            setBodySamples({
                              ...bodySamples,
                              [v]: e.target.value,
                            })
                          }
                          className="flex-1 px-2.5 py-1 text-xs bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-primary-500 text-slate-900 dark:text-white outline-none"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-sky-500" />
                  <span>4. Footer (Optional)</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {footerText.length} / 60 chars
                </span>
              </div>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. Reply STOP to unsubscribe • Omni Platform"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Small disclaimer subtext rendered at the bottom of your message. Variables and markdown are not supported in footers.
              </p>
            </div>

            {/* Section 5: Buttons */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <CornerDownLeft className="w-4 h-4 text-purple-500" />
                  <span>5. Action Buttons (Optional)</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {buttons.length} / 10 buttons
                </span>
              </div>

              {/* Added Buttons List */}
              {buttons.length > 0 && (
                <div className="space-y-3">
                  {buttons.map((btn, idx) => (
                    <div
                      key={btn.id}
                      className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {btn.type.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(btn.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Remove button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            Button Label (Max 25 chars)
                          </label>
                          <input
                            type="text"
                            maxLength={25}
                            value={btn.text}
                            onChange={(e) =>
                              handleUpdateButton(btn.id, { text: e.target.value })
                            }
                            placeholder="e.g. Track Package"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                            required
                          />
                        </div>

                        {btn.type === 'PHONE_NUMBER' && (
                          <div className="space-y-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              Phone Number (E.164)
                            </label>
                            <input
                              type="text"
                              value={btn.phoneNumber || ''}
                              onChange={(e) =>
                                handleUpdateButton(btn.id, { phoneNumber: e.target.value })
                              }
                              placeholder="+18005550199"
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                              required
                            />
                          </div>
                        )}

                        {btn.type === 'COPY_CODE' && (
                          <div className="space-y-1">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              Coupon / Offer Code
                            </label>
                            <input
                              type="text"
                              value={btn.code || ''}
                              onChange={(e) =>
                                handleUpdateButton(btn.id, { code: e.target.value })
                              }
                              placeholder="e.g. SUMMER2026"
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white font-mono"
                              required
                            />
                          </div>
                        )}

                        {btn.type === 'URL' && (
                          <>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                Website URL (supports {'{{1}}'} for dynamic links)
                              </label>
                              <input
                                type="text"
                                value={btn.url || ''}
                                onChange={(e) =>
                                  handleUpdateButton(btn.id, { url: e.target.value })
                                }
                                placeholder="https://example.com/orders/{{1}}"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                required
                              />
                            </div>

                            {btn.url?.includes('{{1}}') && (
                              <div className="space-y-1 sm:col-span-2 bg-primary-50/50 dark:bg-primary-950/20 p-2 rounded-md border border-primary-200/50 dark:border-primary-800/40">
                                <label className="block text-[10.5px] font-semibold text-primary-900 dark:text-primary-200">
                                  Sample URL for Meta Review <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={btn.urlSample || ''}
                                  onChange={(e) =>
                                    handleUpdateButton(btn.id, { urlSample: e.target.value })
                                  }
                                  placeholder="https://example.com/orders/12345"
                                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-primary-300 dark:border-primary-700 rounded-md focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                                  required
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Button Action Bar */}
              {buttons.length < 10 && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    + Add Interactive Button Type:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddButton('QUICK_REPLY')}
                      className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5 text-purple-500" />
                      <span>Quick Reply</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddButton('URL')}
                      disabled={countByType('URL') >= 2}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                        countByType('URL') >= 2
                          ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                          : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                      <span>Website Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddButton('PHONE_NUMBER')}
                      disabled={countByType('PHONE_NUMBER') >= 1}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                        countByType('PHONE_NUMBER') >= 1
                          ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                          : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Call Number</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddButton('COPY_CODE')}
                      disabled={countByType('COPY_CODE') >= 1}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                        countByType('COPY_CODE') >= 1
                          ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                          : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Copy Code</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Device Preview (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live WhatsApp Preview</span>
              </span>
              <span className="text-[11px] text-slate-400">Updates in real-time</span>
            </div>

            <WhatsAppTemplateLivePreview data={previewData} />

            {/* Helper Tips */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
                <span>Meta Approval Guidelines:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                <li>Variables must represent realistic data for approval.</li>
                <li>Marketing templates require clear opt-out language in footer.</li>
                <li>Utility templates cannot contain promotional copy.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form Error Banner */}
        {errorMessage && (
          <div className="flex items-start space-x-2 text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Submission Error</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Submit Template to Meta
          </Button>
        </div>
      </form>
    </Modal>
  );
};
