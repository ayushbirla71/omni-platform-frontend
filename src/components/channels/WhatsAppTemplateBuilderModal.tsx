import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  Type,
  ExternalLink,
  Phone,
  Copy,
  CornerDownLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Info,
  Layers,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { TemplateMediaUploader, TemplateMediaValue } from '../common/TemplateMediaUploader';
import { channelsApi } from '../../api';
import { useToast } from '../../context/ToastContext';

// Standard Meta WhatsApp Supported Languages
const WHATSAPP_LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'es', label: 'Spanish' },
  { code: 'es_MX', label: 'Spanish (Mexico)' },
  { code: 'es_ES', label: 'Spanish (Spain)' },
  { code: 'pt_BR', label: 'Portuguese (Brazil)' },
  { code: 'pt_PT', label: 'Portuguese (Portugal)' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ru', label: 'Russian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh_CN', label: 'Chinese (Simplified)' },
  { code: 'zh_TW', label: 'Chinese (Traditional)' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'sv', label: 'Swedish' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'ms', label: 'Malay' },
  { code: 'he', label: 'Hebrew' },
  { code: 'ur', label: 'Urdu' },
  { code: 'bn', label: 'Bengali' },
];

export type HeaderFormat = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
export type ButtonGroupType = 'NONE' | 'QUICK_REPLY' | 'CTA' | 'COPY_CODE' | 'OTP';

export interface QuickReplyBtn {
  text: string;
  isOptOut?: boolean;
}

export interface CtaBtn {
  type: 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  urlType?: 'STATIC' | 'DYNAMIC';
  urlSample?: string;
  phoneNumber?: string;
}

export interface CopyCodeBtn {
  text: string;
  example: string;
}

export interface OtpBtn {
  otpType: 'COPY_CODE' | 'ONE_TAP' | 'ZERO_TAP';
  text: string;
  autofillText?: string;
  packageName?: string;
  signatureHash?: string;
}

interface WhatsAppTemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName?: string;
  onSuccess: () => void;
}

export const WhatsAppTemplateBuilderModal: React.FC<WhatsAppTemplateBuilderModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Info
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [customLanguage, setCustomLanguage] = useState('');

  // Header State
  const [headerType, setHeaderType] = useState<HeaderFormat>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerTextSample, setHeaderTextSample] = useState('');
  const [headerMedia, setHeaderMedia] = useState<TemplateMediaValue>({});

  // Body State
  const [bodyText, setBodyText] = useState('');
  const [bodySamples, setBodySamples] = useState<Record<string, string>>({});
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Footer State
  const [footerText, setFooterText] = useState('');

  // Button Group State
  const [buttonGroupType, setButtonGroupType] = useState<ButtonGroupType>('NONE');
  const [quickReplies, setQuickReplies] = useState<QuickReplyBtn[]>([{ text: 'Yes, Interested' }]);
  const [ctaButtons, setCtaButtons] = useState<CtaBtn[]>([
    { type: 'URL', text: 'Visit Website', url: 'https://example.com', urlType: 'STATIC' },
  ]);
  const [copyCodeBtn, setCopyCodeBtn] = useState<CopyCodeBtn>({ text: 'Copy Offer Code', example: 'PROMO2026' });
  const [otpBtn, setOtpBtn] = useState<OtpBtn>({ otpType: 'COPY_CODE', text: 'Copy Code' });

  // Tab State for Mobile View
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Regex to extract all variables {{1}}, {{2}}, etc. from body text
  const detectedVariables = useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const unique = Array.from(new Set(matches));
    return unique.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });
  }, [bodyText]);

  // Check if header text has a variable
  const hasHeaderVariable = useMemo(() => {
    return headerType === 'TEXT' && /\{\{\d+\}\}/.test(headerText);
  }, [headerType, headerText]);

  // Reset form
  const handleReset = () => {
    setName('');
    setCategory('MARKETING');
    setLanguage('en_US');
    setCustomLanguage('');
    setHeaderType('NONE');
    setHeaderText('');
    setHeaderTextSample('');
    setHeaderMedia({});
    setBodyText('');
    setBodySamples({});
    setFooterText('');
    setButtonGroupType('NONE');
    setQuickReplies([{ text: 'Yes, Interested' }]);
    setCtaButtons([{ type: 'URL', text: 'Visit Website', url: 'https://example.com', urlType: 'STATIC' }]);
    setCopyCodeBtn({ text: 'Copy Offer Code', example: 'PROMO2026' });
    setOtpBtn({ otpType: 'COPY_CODE', text: 'Copy Code' });
  };

  // Helper: insert formatting into body textarea
  const insertFormatting = (wrapper: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bodyText.substring(start, end);
    const replacement = selectedText
      ? `${wrapper}${selectedText}${wrapper}`
      : `${wrapper}text${wrapper}`;
    const newText = bodyText.substring(0, start) + replacement + bodyText.substring(end);
    setBodyText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapper.length, start + replacement.length - wrapper.length);
    }, 50);
  };

  // Helper: insert next sequential variable into body textarea
  const insertNextVariable = () => {
    const textarea = bodyTextareaRef.current;
    const nextNum = detectedVariables.length + 1;
    const variableTag = `{{${nextNum}}}`;
    if (!textarea) {
      setBodyText((prev) => (prev ? `${prev} ${variableTag}` : variableTag));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = bodyText.substring(0, start) + variableTag + bodyText.substring(end);
    setBodyText(newText);
    setTimeout(() => {
      textarea.focus();
      const pos = start + variableTag.length;
      textarea.setSelectionRange(pos, pos);
    }, 50);
  };

  // Compute interpolated live preview text
  const previewBodyText = useMemo(() => {
    if (!bodyText) return 'Your template message body will appear here.';
    let interpolated = bodyText;
    detectedVariables.forEach((v) => {
      const sample = bodySamples[v];
      interpolated = interpolated.replace(
        new RegExp(v.replace(/[{}]/g, '\\$&'), 'g'),
        sample ? sample : `[${v}]`
      );
    });
    return interpolated;
  }, [bodyText, detectedVariables, bodySamples]);

  const previewHeaderText = useMemo(() => {
    if (headerType !== 'TEXT') return '';
    if (!headerText) return '';
    let text = headerText;
    if (hasHeaderVariable) {
      text = text.replace(/\{\{\d+\}\}/g, headerTextSample || '[Variable 1]');
    }
    return text;
  }, [headerType, headerText, hasHeaderVariable, headerTextSample]);

  // Validation
  const validateForm = (): string | null => {
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanName) return 'Template name is required';
    if (!/^[a-z0-9_]+$/.test(cleanName)) {
      return 'Template name may only contain lowercase letters, numbers, and underscores';
    }
    if (cleanName.length > 512) return 'Template name cannot exceed 512 characters';

    const finalLang = language === 'custom' ? customLanguage.trim() : language;
    if (!finalLang) return 'Language code is required';

    if (!bodyText.trim()) return 'Message body text is required';

    // Verify sequential variables in body
    const varNumbers = detectedVariables
      .map((v) => parseInt(v.replace(/\D/g, ''), 10))
      .sort((a, b) => a - b);
    for (let i = 0; i < varNumbers.length; i++) {
      if (varNumbers[i] !== i + 1) {
        return `Variables must be sequential starting from {{1}}. Found variable {{${varNumbers[i]}}} without {{${i + 1}}}.`;
      }
    }

    // Verify sample values for detected variables
    for (const v of detectedVariables) {
      if (!bodySamples[v] || !bodySamples[v].trim()) {
        return `Meta requires a sample value for variable ${v} in the body.`;
      }
    }

    // Header validation
    if (headerType === 'TEXT') {
      if (!headerText.trim()) return 'Header text is required when Text header is selected';
      if (headerText.length > 60) return 'Header text cannot exceed 60 characters';
      if (hasHeaderVariable && (!headerTextSample || !headerTextSample.trim())) {
        return 'Meta requires a sample value for the Header text variable.';
      }
    } else if (headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') {
      if (!headerMedia.headerValue) {
        return `Please upload a sample ${headerType.toLowerCase()} or provide a public URL handle for Meta approval.`;
      }
    }

    // Footer validation
    if (footerText && footerText.length > 60) {
      return 'Footer text cannot exceed 60 characters';
    }

    // Button validation
    if (buttonGroupType === 'QUICK_REPLY') {
      if (quickReplies.length === 0) return 'At least one Quick Reply button is required';
      if (quickReplies.length > 10) return 'Maximum 10 Quick Reply buttons are allowed';
      for (let i = 0; i < quickReplies.length; i++) {
        if (!quickReplies[i].text.trim()) return `Quick Reply button #${i + 1} text cannot be empty`;
        if (quickReplies[i].text.length > 25) return `Quick Reply button #${i + 1} exceeds 25 characters`;
      }
    } else if (buttonGroupType === 'CTA') {
      if (ctaButtons.length === 0) return 'At least one CTA button is required';
      if (ctaButtons.length > 2) return 'Maximum 2 Call to Action buttons are allowed';
      for (let i = 0; i < ctaButtons.length; i++) {
        const btn = ctaButtons[i];
        if (!btn.text.trim()) return `CTA button #${i + 1} label cannot be empty`;
        if (btn.text.length > 25) return `CTA button #${i + 1} label exceeds 25 characters`;
        if (btn.type === 'URL') {
          if (!btn.url?.trim()) return `CTA button #${i + 1} URL is required`;
          if (!btn.url.startsWith('http://') && !btn.url.startsWith('https://')) {
            return `CTA button #${i + 1} URL must start with http:// or https://`;
          }
          if (btn.urlType === 'DYNAMIC') {
            if (!btn.url.includes('{{1}}')) {
              return `Dynamic URL button #${i + 1} must include {{1}} at the end of the URL.`;
            }
            if (!btn.urlSample?.trim()) {
              return `Sample variable value is required for dynamic URL button #${i + 1}.`;
            }
          }
        } else if (btn.type === 'PHONE_NUMBER') {
          if (!btn.phoneNumber?.trim()) return `Phone number is required for CTA button #${i + 1}`;
          if (!/^\+[1-9]\d{6,14}$/.test(btn.phoneNumber.replace(/\s+/g, ''))) {
            return `CTA button #${i + 1} phone number must be in E.164 international format (e.g. +15551234567)`;
          }
        }
      }
    } else if (buttonGroupType === 'COPY_CODE') {
      if (!copyCodeBtn.text.trim()) return 'Copy offer code button label is required';
      if (!copyCodeBtn.example.trim()) return 'Sample coupon/offer code is required (e.g. SUMMER25)';
    } else if (buttonGroupType === 'OTP') {
      if (!otpBtn.text.trim()) return 'OTP button label is required';
    }

    return null;
  };

  // Submit to Meta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      showToast(error, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanName = name.trim().toLowerCase().replace(/\s+/g, '_');
      const finalLang = language === 'custom' ? customLanguage.trim() : language;
      const components: any[] = [];

      // 1. HEADER Component
      if (headerType === 'TEXT') {
        const headerComp: any = {
          type: 'HEADER',
          format: 'TEXT',
          text: headerText.trim(),
        };
        if (hasHeaderVariable && headerTextSample.trim()) {
          headerComp.example = {
            header_text: [headerTextSample.trim()],
          };
        }
        components.push(headerComp);
      } else if (headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') {
        const headerComp: any = {
          type: 'HEADER',
          format: headerType,
        };
        if (headerMedia.headerValue) {
          headerComp.example = {
            header_handle: [headerMedia.headerValue],
          };
        }
        components.push(headerComp);
      } else if (headerType === 'LOCATION') {
        components.push({
          type: 'HEADER',
          format: 'LOCATION',
        });
      }

      // 2. BODY Component
      const bodyComp: any = {
        type: 'BODY',
        text: bodyText,
      };
      if (detectedVariables.length > 0) {
        const sampleRow = detectedVariables.map((v) => bodySamples[v] || 'Sample');
        bodyComp.example = {
          body_text: [sampleRow],
        };
      }
      components.push(bodyComp);

      // 3. FOOTER Component
      if (footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: footerText.trim(),
        });
      }

      // 4. BUTTONS Component
      if (buttonGroupType === 'QUICK_REPLY' && quickReplies.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: quickReplies.map((btn) => ({
            type: 'QUICK_REPLY',
            text: btn.text.trim(),
          })),
        });
      } else if (buttonGroupType === 'CTA' && ctaButtons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: ctaButtons.map((btn) => {
            if (btn.type === 'URL') {
              const obj: any = {
                type: 'URL',
                text: btn.text.trim(),
                url: btn.url?.trim(),
              };
              if (btn.urlType === 'DYNAMIC' && btn.urlSample?.trim()) {
                obj.example = [btn.urlSample.trim()];
              }
              return obj;
            } else {
              return {
                type: 'PHONE_NUMBER',
                text: btn.text.trim(),
                phone_number: btn.phoneNumber?.replace(/\s+/g, ''),
              };
            }
          }),
        });
      } else if (buttonGroupType === 'COPY_CODE') {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'COPY_CODE',
              example: copyCodeBtn.example.trim(),
            },
          ],
        });
      } else if (buttonGroupType === 'OTP') {
        const otpButtonPayload: any = {
          type: 'OTP',
          otp_type: otpBtn.otpType,
          text: otpBtn.text.trim(),
        };
        if (otpBtn.autofillText?.trim()) otpButtonPayload.autofill_text = otpBtn.autofillText.trim();
        if (otpBtn.packageName?.trim()) otpButtonPayload.package_name = otpBtn.packageName.trim();
        if (otpBtn.signatureHash?.trim()) otpButtonPayload.signature_hash = otpBtn.signatureHash.trim();

        components.push({
          type: 'BUTTONS',
          buttons: [otpButtonPayload],
        });
      }

      // Final Payload
      const payload = {
        name: cleanName,
        category,
        language: finalLang,
        components,
      };

      await channelsApi.createTemplate(channelId, payload);
      showToast(`Template "${cleanName}" submitted to Meta for review!`, 'success');
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[WhatsAppTemplateBuilder] Submission failed:', err);
      const errMsg =
        err?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to submit template to Meta Cloud API');
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create WhatsApp HSM Message Template"
      description={`Design, configure variables & buttons, and submit template directly to Meta for ${channelName || 'WhatsApp Channel'}`}
      maxWidth="5xl"
    >
      <div className="flex flex-col h-full max-h-[82vh]">
        {/* Mobile View Toggle */}
        <div className="flex lg:hidden items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Template Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ==================== LEFT COLUMN: TEMPLATE DESIGNER ==================== */}
          <div
            className={`lg:col-span-7 overflow-y-auto pr-1 space-y-6 max-h-[68vh] pb-4 ${
              activeTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Section 1: Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    General Information
                  </h3>
                </div>
                <Badge variant="outline" size="sm">
                  Required
                </Badge>
              </div>

              <div className="space-y-3">
                <Input
                  label="Template Name"
                  placeholder="e.g. order_status_update_v1"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  helperText="Lowercase alphanumeric and underscores only. Max 512 chars."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="MARKETING">MARKETING (Promotions, offers, newsletters)</option>
                      <option value="UTILITY">UTILITY (Order updates, receipts, billing)</option>
                      <option value="AUTHENTICATION">AUTHENTICATION (OTPs, login verification)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {WHATSAPP_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label} ({lang.code})
                        </option>
                      ))}
                      <option value="custom">Other Language Code...</option>
                    </select>
                  </div>
                </div>

                {language === 'custom' && (
                  <Input
                    label="Custom Meta Language Code"
                    placeholder="e.g. it_IT or zh_HK"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    helperText="Valid BCP 47 or Meta ISO language code"
                    required
                  />
                )}
              </div>
            </div>

            {/* Section 2: Header Configuration */}
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Header (Optional)
                  </h3>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Add bold title or media</span>
              </div>

              {/* Header Type Selector Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'NONE', label: 'None', icon: Layers },
                  { id: 'TEXT', label: 'Text', icon: Type },
                  { id: 'IMAGE', label: 'Image', icon: ImageIcon },
                  { id: 'VIDEO', label: 'Video', icon: Video },
                  { id: 'DOCUMENT', label: 'Document', icon: FileText },
                  { id: 'LOCATION', label: 'Location', icon: MapPin },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = headerType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHeaderType(item.id as HeaderFormat)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Conditional Header Content Inputs */}
              {headerType === 'TEXT' && (
                <div className="space-y-3 pt-1">
                  <Input
                    label="Header Text (Max 60 chars)"
                    placeholder="e.g. Order #{{1}} Confirmed!"
                    value={headerText}
                    maxLength={60}
                    onChange={(e) => setHeaderText(e.target.value)}
                    helperText="Supports one variable {{1}} for dynamic order numbers, names, or codes."
                  />

                  {hasHeaderVariable && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Header Variable Sample Value (Required by Meta)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 10928"
                        value={headerTextSample}
                        onChange={(e) => setHeaderTextSample(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {(headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT') && (
                <div className="space-y-2 pt-1">
                  <TemplateMediaUploader
                    headerType={headerType}
                    value={headerMedia}
                    onChange={(val) => setHeaderMedia(val)}
                    label={`Sample ${headerType} Header Asset (Required for Meta Approval)`}
                    description="Upload a real media file or provide a public HTTPS URL as a representative sample for Meta reviewers."
                  />
                </div>
              )}

              {headerType === 'LOCATION' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    Location header enabled. At send time, dynamic latitude, longitude, and place name parameters will be passed.
                  </span>
                </div>
              )}
            </div>

            {/* Section 3: Body Configuration */}
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Message Body Text
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  {bodyText.length} / 1024 chars
                </span>
              </div>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => insertFormatting('*')}
                  title="Bold (*text*)"
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs flex items-center gap-1 font-bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('_')}
                  title="Italic (_text_)"
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs flex items-center gap-1 italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Italic</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('~')}
                  title="Strikethrough (~text~)"
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs flex items-center gap-1 line-through"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('```')}
                  title="Monospace (```text```)"
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs flex items-center gap-1 font-mono"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                <button
                  type="button"
                  onClick={insertNextVariable}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold text-xs hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variable {`{{${detectedVariables.length + 1}}}`}</span>
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={bodyTextareaRef}
                rows={5}
                placeholder="Hi {{1}}, your order #{{2}} of {{3}} items has been confirmed! Track your package using the button below."
                value={bodyText}
                maxLength={1024}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 p-3.5 text-xs md:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-normal leading-relaxed"
                required
              />

              {/* Dynamic Sample Values Form for Meta Approval */}
              {detectedVariables.length > 0 && (
                <div className="bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/80 dark:border-primary-900/40 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary-900 dark:text-primary-300">
                      <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                      <span>Meta Sample Values for Body Variables (Required)</span>
                    </div>
                    <span className="text-[10.5px] text-primary-600 dark:text-primary-400 font-medium">
                      {detectedVariables.length} variable{detectedVariables.length > 1 ? 's' : ''} detected
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    Meta requires realistic sample data for each variable to verify template compliance.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {detectedVariables.map((v, idx) => (
                      <div key={v} className="space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                          Sample for <span className="font-mono text-primary-600">{v}</span>
                        </label>
                        <input
                          type="text"
                          placeholder={idx === 0 ? 'e.g. John Doe' : idx === 1 ? 'e.g. ORD-9821' : 'e.g. 3'}
                          value={bodySamples[v] || ''}
                          onChange={(e) =>
                            setBodySamples({
                              ...bodySamples,
                              [v]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Footer Configuration */}
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Footer (Optional)
                  </h3>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">
                  {footerText.length} / 60 chars
                </span>
              </div>

              <Input
                placeholder="e.g. Reply STOP to unsubscribe or HELP for assistance."
                value={footerText}
                maxLength={60}
                onChange={(e) => setFooterText(e.target.value)}
                helperText="Short footer disclaimer or opt-out notice. Variables are not allowed."
              />
            </div>

            {/* Section 5: Buttons Configuration */}
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Buttons (Optional)
                  </h3>
                </div>
                <span className="text-[11px] text-gray-500">Interactive actions</span>
              </div>

              {/* Button Group Type Switcher */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'NONE', label: 'No Buttons' },
                  { id: 'QUICK_REPLY', label: 'Quick Reply' },
                  { id: 'CTA', label: 'Call to Action' },
                  { id: 'COPY_CODE', label: 'Copy Offer Code' },
                  { id: 'OTP', label: 'Authentication OTP' },
                ].map((item) => {
                  const isSelected = buttonGroupType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setButtonGroupType(item.id as ButtonGroupType)}
                      className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* 5.1 QUICK REPLY BUTTONS */}
              {buttonGroupType === 'QUICK_REPLY' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Quick Reply Buttons ({quickReplies.length}/10)
                    </label>
                    {quickReplies.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickReplies([...quickReplies, { text: `Option ${quickReplies.length + 1}` }])}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add Button
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {quickReplies.map((btn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                      >
                        <CornerDownLeft className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          placeholder={`Button #${idx + 1} text`}
                          maxLength={25}
                          value={btn.text}
                          onChange={(e) => {
                            const updated = [...quickReplies];
                            updated[idx].text = e.target.value;
                            setQuickReplies(updated);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                        <span className="text-[10px] text-gray-400 w-10 text-right">{btn.text.length}/25</span>
                        {quickReplies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuickReplies(quickReplies.filter((_, i) => i !== idx))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5.2 CALL TO ACTION (CTA) BUTTONS */}
              {buttonGroupType === 'CTA' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Call to Action Buttons ({ctaButtons.length}/2 max)
                    </label>
                    {ctaButtons.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCtaButtons([
                            ...ctaButtons,
                            { type: 'PHONE_NUMBER', text: 'Call Us', phoneNumber: '+15551234567' },
                          ])
                        }
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add CTA Button
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {ctaButtons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              CTA Button #{idx + 1}
                            </span>
                            <select
                              value={btn.type}
                              onChange={(e) => {
                                const updated = [...ctaButtons];
                                updated[idx].type = e.target.value as any;
                                setCtaButtons(updated);
                              }}
                              className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium"
                            >
                              <option value="URL">Visit Website (URL)</option>
                              <option value="PHONE_NUMBER">Call Phone Number</option>
                            </select>
                          </div>

                          {ctaButtons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setCtaButtons(ctaButtons.filter((_, i) => i !== idx))}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Button Label (Max 25 chars)"
                            placeholder="e.g. Track Order"
                            maxLength={25}
                            value={btn.text}
                            onChange={(e) => {
                              const updated = [...ctaButtons];
                              updated[idx].text = e.target.value;
                              setCtaButtons(updated);
                            }}
                            required
                          />

                          {btn.type === 'PHONE_NUMBER' ? (
                            <Input
                              label="Phone Number (E.164 with +)"
                              placeholder="+15551234567"
                              value={btn.phoneNumber || ''}
                              onChange={(e) => {
                                const updated = [...ctaButtons];
                                updated[idx].phoneNumber = e.target.value;
                                setCtaButtons(updated);
                              }}
                              helperText="International format including country code"
                              required
                            />
                          ) : (
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                URL Type
                              </label>
                              <select
                                value={btn.urlType || 'STATIC'}
                                onChange={(e) => {
                                  const updated = [...ctaButtons];
                                  updated[idx].urlType = e.target.value as any;
                                  if (e.target.value === 'DYNAMIC' && !updated[idx].url?.includes('{{1}}')) {
                                    updated[idx].url = `${updated[idx].url || 'https://example.com/orders'}/{{1}}`;
                                    updated[idx].urlSample = '10928';
                                  }
                                  setCtaButtons(updated);
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium"
                              >
                                <option value="STATIC">Static URL (e.g. https://store.com/deal)</option>
                                <option value="DYNAMIC">Dynamic URL (e.g. https://store.com/order/{"{{1}}"})</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {btn.type === 'URL' && (
                          <div className="space-y-2">
                            <Input
                              label="Website URL"
                              placeholder={
                                btn.urlType === 'DYNAMIC'
                                  ? 'https://example.com/track/{{1}}'
                                  : 'https://example.com/shop'
                              }
                              value={btn.url || ''}
                              onChange={(e) => {
                                const updated = [...ctaButtons];
                                updated[idx].url = e.target.value;
                                setCtaButtons(updated);
                              }}
                              helperText={
                                btn.urlType === 'DYNAMIC'
                                  ? 'Must include {{1}} at the end of the URL for dynamic parameter replacement.'
                                  : 'Full URL starting with https://'
                              }
                              required
                            />

                            {btn.urlType === 'DYNAMIC' && (
                              <Input
                                label="Sample URL Variable Value (Required by Meta)"
                                placeholder="e.g. ord_88192"
                                value={btn.urlSample || ''}
                                onChange={(e) => {
                                  const updated = [...ctaButtons];
                                  updated[idx].urlSample = e.target.value;
                                  setCtaButtons(updated);
                                }}
                                required
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5.3 COPY OFFER CODE BUTTON */}
              {buttonGroupType === 'COPY_CODE' && (
                <div className="p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100">
                    <Copy className="w-4 h-4 text-primary-500" />
                    <span>Copy Offer Code Button</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Button Label (Max 25 chars)"
                      placeholder="e.g. Copy Code"
                      value={copyCodeBtn.text}
                      maxLength={25}
                      onChange={(e) => setCopyCodeBtn({ ...copyCodeBtn, text: e.target.value })}
                      required
                    />
                    <Input
                      label="Sample Coupon / Promo Code"
                      placeholder="e.g. SUMMER2026"
                      value={copyCodeBtn.example}
                      onChange={(e) => setCopyCodeBtn({ ...copyCodeBtn, example: e.target.value })}
                      helperText="Default coupon code copied when clicked"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 5.4 AUTHENTICATION OTP BUTTON */}
              {buttonGroupType === 'OTP' && (
                <div className="p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Authentication OTP Button</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        OTP Action Type
                      </label>
                      <select
                        value={otpBtn.otpType}
                        onChange={(e) => setOtpBtn({ ...otpBtn, otpType: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium"
                      >
                        <option value="COPY_CODE">COPY_CODE (User taps to copy OTP)</option>
                        <option value="ONE_TAP">ONE_TAP (Android Intent autofill)</option>
                        <option value="ZERO_TAP">ZERO_TAP (Zero-click authentication)</option>
                      </select>
                    </div>

                    <Input
                      label="Button Label"
                      placeholder="Copy Code"
                      value={otpBtn.text}
                      maxLength={25}
                      onChange={(e) => setOtpBtn({ ...otpBtn, text: e.target.value })}
                      required
                    />
                  </div>

                  {otpBtn.otpType !== 'COPY_CODE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <Input
                        label="Android Package Name"
                        placeholder="com.example.app"
                        value={otpBtn.packageName || ''}
                        onChange={(e) => setOtpBtn({ ...otpBtn, packageName: e.target.value })}
                      />
                      <Input
                        label="App Signature Hash"
                        placeholder="e.g. 4v1z9+K...="
                        value={otpBtn.signatureHash || ''}
                        onChange={(e) => setOtpBtn({ ...otpBtn, signatureHash: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ==================== RIGHT COLUMN: LIVE WHATSAPP PREVIEW CARD ==================== */}
          <div
            className={`lg:col-span-5 flex flex-col items-center justify-start bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[68vh] ${
              activeTab === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="w-full flex items-center justify-between mb-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary-500" />
                Live WhatsApp Device Preview
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                WhatsApp Business
              </span>
            </div>

            {/* Mobile Mockup Frame */}
            <div className="w-full max-w-[340px] rounded-3xl overflow-hidden shadow-xl border-4 border-slate-800 dark:border-slate-700 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col">
              {/* WhatsApp App Top Bar */}
              <div className="bg-[#008069] dark:bg-[#202c33] text-white px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  {channelName ? channelName.charAt(0).toUpperCase() : 'W'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {channelName || 'Business Account'}
                    </p>
                    <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
                  </div>
                  <p className="text-[9.5px] text-white/80 leading-none">Official Business Account</p>
                </div>
              </div>

              {/* Chat Bubble Area with WhatsApp Wallpaper background pattern */}
              <div className="p-3 min-h-[320px] flex flex-col justify-start">
                {/* Bubble Container */}
                <div className="w-full rounded-2xl rounded-tl-xs overflow-hidden shadow-md bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-slate-100 border border-black/5 dark:border-white/5 transition-all">
                  {/* Header Render */}
                  {headerType === 'IMAGE' && (
                    <div className="w-full max-h-[160px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      {headerMedia.headerValue ? (
                        <img
                          src={headerMedia.headerValue}
                          alt="Header"
                          className="w-full h-auto max-h-[160px] object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="py-8 flex flex-col items-center text-slate-400 text-xs">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span>Image Header Preview</span>
                        </div>
                      )}
                    </div>
                  )}

                  {headerType === 'VIDEO' && (
                    <div className="w-full h-32 bg-slate-900 text-white flex flex-col items-center justify-center gap-1">
                      <Video className="w-8 h-8 text-primary-400" />
                      <span className="text-[11px] text-slate-300">Video Header Attachment</span>
                    </div>
                  )}

                  {headerType === 'DOCUMENT' && (
                    <div className="flex items-center gap-2.5 p-3 m-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{headerMedia.filename || 'Document Attachment.pdf'}</p>
                        <p className="text-[10px] text-slate-400">PDF Document</p>
                      </div>
                    </div>
                  )}

                  {headerType === 'LOCATION' && (
                    <div className="p-3 m-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Live Location Pin</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Coordinates & place name</p>
                      </div>
                    </div>
                  )}

                  {headerType === 'TEXT' && previewHeaderText && (
                    <div className="px-3.5 pt-3 pb-0.5">
                      <h4 className="text-xs md:text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
                        {previewHeaderText}
                      </h4>
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="px-3.5 py-2.5">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200 font-normal">
                      {previewBodyText}
                    </p>

                    {/* Footer disclaimer */}
                    {footerText && (
                      <p className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400 italic">
                        {footerText}
                      </p>
                    )}

                    {/* Meta Timestamp & checkmark */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9.5px] text-slate-400">
                      <span>12:45 PM</span>
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  </div>

                  {/* Action Buttons Render */}
                  {buttonGroupType === 'QUICK_REPLY' && quickReplies.length > 0 && (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/60 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                      {quickReplies.map((btn, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#00a884] dark:text-[#00a884]"
                        >
                          <CornerDownLeft className="w-3 h-3 text-slate-400" />
                          <span>{btn.text || `Option ${idx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {buttonGroupType === 'CTA' && ctaButtons.length > 0 && (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/60 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                      {ctaButtons.map((btn, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#00a884] dark:text-[#00a884]"
                        >
                          {btn.type === 'PHONE_NUMBER' ? (
                            <Phone className="w-3 h-3" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          <span>{btn.text || (btn.type === 'PHONE_NUMBER' ? 'Call Phone' : 'Visit Website')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {buttonGroupType === 'COPY_CODE' && (
                    <div className="border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00a884]">
                      <Copy className="w-3 h-3" />
                      <span>{copyCodeBtn.text || 'Copy Code'}</span>
                    </div>
                  )}

                  {buttonGroupType === 'OTP' && (
                    <div className="border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00a884]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{otpBtn.text || 'Copy Code'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== FOOTER ACTIONS ==================== */}
          <div className="lg:col-span-12 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                icon={isSubmitting ? undefined : <Sparkles className="w-4 h-4" />}
              >
                {isSubmitting ? 'Submitting to Meta...' : 'Submit Template to Meta'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
