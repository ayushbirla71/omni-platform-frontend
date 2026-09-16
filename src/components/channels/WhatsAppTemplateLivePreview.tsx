import React from 'react';
import {
  Sparkles,
  Phone,
  ExternalLink,
  Copy,
  CornerDownLeft,
  Image as ImageIcon,
  Video,
  FileText,
  CheckCheck,
  MoreVertical,
  ArrowLeft,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { TemplateHeaderFormat, TemplateCategory } from '../../types';

export interface WhatsAppTemplatePreviewData {
  name: string;
  category: TemplateCategory | string;
  language: string;
  headerType: 'NONE' | TemplateHeaderFormat;
  headerText?: string;
  headerSample?: string;
  headerMediaUrl?: string;
  headerFilename?: string;
  bodyText: string;
  bodySamples: Record<string, string>;
  footerText?: string;
  buttons: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
    text?: string;
    url?: string;
    urlType?: 'STATIC' | 'DYNAMIC';
    urlSample?: string;
    phoneNumber?: string;
    code?: string;
  }>;
  businessName?: string;
}

interface WhatsAppTemplateLivePreviewProps {
  data: WhatsAppTemplatePreviewData;
  className?: string;
}

/**
 * Format WhatsApp Markdown:
 * *bold* -> <strong>
 * _italic_ -> <em>
 * ~strike~ -> <del>
 * ```code``` -> <code>
 */
function renderWhatsAppMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Split by line breaks first
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Process markdown tags in line
    const parts: React.ReactNode[] = [];
    let current = line;
    let keyIdx = 0;

    // Helper regex for tokenizing
    const regex = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~|```([^`]+)```)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(current)) !== null) {
      if (match.index > lastIndex) {
        parts.push(current.substring(lastIndex, match.index));
      }

      if (match[2]) {
        // *bold*
        parts.push(
          <strong key={`b-${lineIdx}-${keyIdx++}`} className="font-semibold text-gray-900 dark:text-white">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // _italic_
        parts.push(
          <em key={`i-${lineIdx}-${keyIdx++}`} className="italic">
            {match[3]}
          </em>
        );
      } else if (match[4]) {
        // ~strike~
        parts.push(
          <del key={`s-${lineIdx}-${keyIdx++}`} className="line-through text-gray-500">
            {match[4]}
          </del>
        );
      } else if (match[5]) {
        // ```code```
        parts.push(
          <code
            key={`c-${lineIdx}-${keyIdx++}`}
            className="px-1 py-0.5 font-mono text-[11px] bg-black/5 dark:bg-white/10 rounded"
          >
            {match[5]}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < current.length) {
      parts.push(current.substring(lastIndex));
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts.length > 0 ? parts : <br />}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const WhatsAppTemplateLivePreview: React.FC<WhatsAppTemplateLivePreviewProps> = ({
  data,
  className = '',
}) => {
  const {
    name,
    category,
    language,
    headerType,
    headerText,
    headerSample,
    headerMediaUrl,
    headerFilename,
    bodyText,
    bodySamples,
    footerText,
    buttons,
    businessName = 'Omni Platform',
  } = data;

  // Substitute variables in header text
  const resolvedHeaderText = (headerText || '').replace(
    /\{\{1\}\}/g,
    headerSample?.trim() || '{{1}}'
  );

  // Substitute variables in body text
  let resolvedBodyText = bodyText || '';
  if (bodyText) {
    resolvedBodyText = bodyText.replace(/\{\{(\d+)\}\}/g, (match, num) => {
      const sampleVal = bodySamples[num];
      return sampleVal && sampleVal.trim().length > 0 ? sampleVal.trim() : match;
    });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-900 text-white ${className}`}>
      {/* Device Header Bar */}
      <div className="bg-[#008069] px-4 py-3 flex items-center justify-between text-white select-none shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <ArrowLeft className="w-4 h-4 text-white/90 cursor-pointer hover:text-white" />
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs uppercase shrink-0 text-white shadow-xs">
            {businessName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <h4 className="text-xs font-semibold leading-tight truncate">{businessName}</h4>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 fill-emerald-400/20 shrink-0" />
            </div>
            <p className="text-[10px] text-white/80 leading-tight">Official Business Account</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-white/90">
          <Phone className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
          <Search className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
          <MoreVertical className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Meta Info Pill Banner */}
      <div className="bg-slate-800/90 px-3 py-1.5 border-b border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center space-x-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono font-medium truncate">{name || 'untitled_template'}</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          {category && (
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {category}
            </span>
          )}
          <span className="text-slate-400 text-[10px] uppercase font-mono">{language}</span>
        </div>
      </div>

      {/* Chat Canvas (WhatsApp Wallpaper pattern background) */}
      <div
        className="flex-1 p-3.5 sm:p-4 overflow-y-auto max-h-[480px] bg-[#EFEAE2] dark:bg-[#0b141a] flex flex-col justify-start relative"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.04) 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      >
        {/* Date Marker */}
        <div className="flex justify-center mb-3">
          <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
            Today
          </span>
        </div>

        {/* WhatsApp Message Bubble */}
        <div className="w-full max-w-[340px] sm:max-w-[380px] bg-white dark:bg-[#1f2c34] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm shadow-md border border-black/5 dark:border-white/5 overflow-hidden self-start transition-all">
          {/* 1. HEADER COMPONENT */}
          {headerType === 'TEXT' && resolvedHeaderText && (
            <div className="px-3.5 pt-3 pb-1 font-bold text-sm text-slate-900 dark:text-white leading-snug">
              {resolvedHeaderText}
            </div>
          )}

          {headerType === 'IMAGE' && (
            <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border-b border-black/5 dark:border-white/5">
              {headerMediaUrl ? (
                <img
                  src={headerMediaUrl}
                  alt="Template Header Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium">Header Image Preview</span>
                  <span className="text-[9.5px] text-slate-400 mt-0.5">JPG or PNG (Max 5MB)</span>
                </div>
              )}
            </div>
          )}

          {headerType === 'VIDEO' && (
            <div className="relative w-full aspect-video bg-slate-900 overflow-hidden flex items-center justify-center border-b border-black/5 dark:border-white/5">
              {headerMediaUrl ? (
                <video
                  src={headerMediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1 text-white">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium">Header Video Preview</span>
                  <span className="text-[9.5px] text-slate-400 mt-0.5">MP4 (Max 16MB)</span>
                </div>
              )}
            </div>
          )}

          {headerType === 'DOCUMENT' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-black/5 dark:border-white/5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {headerFilename || 'Document_Attachment.pdf'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">PDF Document • Click to download</p>
              </div>
            </div>
          )}

          {/* 2. BODY COMPONENT */}
          <div className="px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words">
            {resolvedBodyText ? (
              renderWhatsAppMarkdown(resolvedBodyText)
            ) : (
              <span className="text-slate-400 italic">Enter template body text...</span>
            )}

            {/* 3. FOOTER COMPONENT */}
            {footerText && (
              <div className="mt-2 pt-1 text-[10.5px] text-slate-500 dark:text-slate-400 font-normal leading-normal">
                {footerText}
              </div>
            )}

            {/* Timestamp & Read Receipt */}
            <div className="flex items-center justify-end space-x-1 mt-1.5 text-[10px] text-slate-400 select-none">
              <span>{timeStr}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
          </div>

          {/* 4. INTERACTIVE BUTTONS COMPONENT */}
          {buttons && buttons.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700/60 divide-y divide-slate-200 dark:divide-slate-700/60 bg-slate-50/70 dark:bg-slate-800/30">
              {buttons.map((btn, idx) => {
                if (btn.type === 'QUICK_REPLY') {
                  return (
                    <div
                      key={`btn-${idx}`}
                      className="px-3 py-2 text-center text-xs font-semibold text-[#008069] dark:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5" />
                      <span className="truncate">{btn.text || `Quick Reply ${idx + 1}`}</span>
                    </div>
                  );
                }

                if (btn.type === 'PHONE_NUMBER') {
                  return (
                    <div
                      key={`btn-${idx}`}
                      className="px-3 py-2 text-center text-xs font-semibold text-[#008069] dark:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="truncate">{btn.text || 'Call Support'}</span>
                      {btn.phoneNumber && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({btn.phoneNumber})
                        </span>
                      )}
                    </div>
                  );
                }

                if (btn.type === 'URL') {
                  return (
                    <div
                      key={`btn-${idx}`}
                      className="px-3 py-2 text-center text-xs font-semibold text-[#008069] dark:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate">{btn.text || 'Visit Website'}</span>
                    </div>
                  );
                }

                if (btn.type === 'COPY_CODE') {
                  return (
                    <div
                      key={`btn-${idx}`}
                      className="px-3 py-2 text-center text-xs font-semibold text-[#008069] dark:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="truncate">
                        Copy Code: {btn.code ? <strong className="font-mono">{btn.code}</strong> : 'OFFER20'}
                      </span>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info / Meta Rules Guide */}
      <div className="bg-slate-800/80 px-3 py-2 text-[10.5px] text-slate-400 border-t border-slate-700/60 flex items-center justify-between">
        <span>Meta Cloud API v21.0 / v22.0</span>
        <span className="text-emerald-400 font-medium">Real-time Device Simulation</span>
      </div>
    </div>
  );
};
