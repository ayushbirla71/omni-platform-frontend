import React, { useState } from 'react';
import {
  ExternalLink,
  Phone,
  CornerDownLeft,
  FileText,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveTemplateMessage, ParsedTemplateDetails } from '../../utils/whatsapp-templates';
import { WhatsAppTemplate } from '../../types';

interface WhatsAppTemplateCardProps {
  message: {
    id?: string;
    text?: string;
    mediaUrl?: string;
    content?: Record<string, any>;
    type?: string;
    direction?: 'inbound' | 'outbound';
  };
  knownTemplates?: WhatsAppTemplate[];
  onQuickReplyClick?: (replyText: string) => void;
  isOutbound?: boolean;
}

export const WhatsAppTemplateCard: React.FC<WhatsAppTemplateCardProps> = ({
  message,
  knownTemplates,
  onQuickReplyClick,
  isOutbound = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const parsed: ParsedTemplateDetails = resolveTemplateMessage({
    templateName: message.content?.templateName || message.content?.template_name,
    templateParams: message.content?.templateParams,
    headerType: message.content?.headerType,
    headerValue: message.content?.headerValue || message.content?.mediaUrl || message.mediaUrl,
    mediaUrl: message.mediaUrl,
    content: message.content,
    rawText: message.text,
    knownTemplates,
  });

  const {
    templateName,
    category,
    status,
    headerType,
    headerText,
    headerMediaUrl,
    bodyText,
    footerText,
    buttons,
  } = parsed;

  const isImageHeader = (headerType === 'IMAGE' || (!headerType && headerMediaUrl)) && !!headerMediaUrl && !imageError;
  const isVideoHeader = headerType === 'VIDEO' && !!headerMediaUrl;
  const isDocumentHeader = headerType === 'DOCUMENT' && !!headerMediaUrl;

  return (
    <div className="flex flex-col w-full max-w-[420px] rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all">
      {/* Template Header Meta Badge */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700/50 text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300 truncate">
          <Sparkles className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span className="font-semibold tracking-wide truncate">{templateName}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {category && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {category}
            </span>
          )}
          {status === 'APPROVED' && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Meta Approved
            </span>
          )}
        </div>
      </div>

      {/* Header Content: Image / Video / Document / Text */}
      {isImageHeader && (
        <div className="relative group overflow-hidden bg-gray-100 dark:bg-gray-900 max-h-[260px] flex items-center justify-center">
          <img
            src={headerMediaUrl}
            alt={templateName}
            className="w-full h-auto max-h-[260px] object-cover object-center transition-transform duration-300 group-hover:scale-[1.02] cursor-pointer"
            onClick={() => setShowImageModal(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(true);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            title="Enlarge image"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isVideoHeader && (
        <div className="relative overflow-hidden bg-black max-h-[260px]">
          <video src={headerMediaUrl} controls className="w-full max-h-[260px] object-contain" />
        </div>
      )}

      {isDocumentHeader && (
        <div className="flex items-center gap-3 p-3 mx-3 mt-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
          <div className="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">Document Attachment</p>
            <a
              href={headerMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>View / Download</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {headerText && (
        <div className="px-4 pt-3.5 pb-1">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-snug">
            {headerText}
          </h4>
        </div>
      )}

      {/* Template Body Copy */}
      <div className="px-4 py-3">
        <p className="text-xs md:text-[13px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 break-words font-normal">
          {bodyText}
        </p>

        {/* Footer Disclaimer */}
        {footerText && (
          <p className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/50 text-[11px] text-gray-500 dark:text-gray-400 italic">
            {footerText}
          </p>
        )}
      </div>

      {/* WhatsApp Interactive Buttons (Quick Reply / URL / Call) */}
      {buttons && buttons.length > 0 && (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700/60 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
          {buttons.map((btn, idx) => {
            const isUrl = btn.type === 'URL' || !!btn.url;
            const isPhone = btn.type === 'PHONE_NUMBER' || !!btn.phone_number;
            const isQuickReply = btn.type === 'QUICK_REPLY' || (!isUrl && !isPhone);

            if (isUrl) {
              return (
                <a
                  key={idx}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{btn.text}</span>
                </a>
              );
            }

            if (isPhone) {
              return (
                <a
                  key={idx}
                  href={`tel:${btn.phone_number?.replace(/\s+/g, '')}`}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{btn.text} {btn.phone_number ? `(${btn.phone_number})` : ''}</span>
                </a>
              );
            }

            // Quick Reply button
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onQuickReplyClick?.(btn.text)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-gray-400" />
                <span>{btn.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Zoom Modal for Template Image */}
      {showImageModal && isImageHeader && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={headerMediaUrl}
              alt={templateName}
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-white/80 mt-2 font-medium">{templateName} Header Image</p>
          </div>
        </div>
      )}
    </div>
  );
};
