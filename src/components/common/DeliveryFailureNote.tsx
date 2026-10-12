import React from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getDeliveryFailure } from '../../utils/whatsapp-errors';

export interface DeliveryFailureNoteProps {
  /** Provider error code, e.g. 131049 */
  code?: string | null;
  /** Raw error text reported by WhatsApp */
  message?: string | null;
  /** `bubble` sits under a chat message, `row` fits a table cell */
  variant?: 'bubble' | 'row';
  className?: string;
}

const TONES = {
  amber: {
    box: 'bg-amber-50 border-amber-200/80',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    muted: 'text-amber-800/80',
    chip: 'bg-amber-100/70 text-amber-800',
  },
  neutral: {
    box: 'bg-slate-50 border-slate-200',
    icon: 'text-slate-500',
    title: 'text-slate-800',
    muted: 'text-slate-600',
    chip: 'bg-slate-100 text-slate-600',
  },
} as const;

/**
 * Calm explanation of why a WhatsApp message was not delivered: a visible one-line reason with
 * the provider code as a quiet chip, and the details one click (or key press) away. Used in the
 * Team Inbox and on the campaign page so the same failure reads the same in both.
 */
export const DeliveryFailureNote: React.FC<DeliveryFailureNoteProps> = ({
  code,
  message,
  variant = 'row',
  className,
}) => {
  const failure = getDeliveryFailure(code, message);
  const tone = TONES[failure.tone];
  const compact = variant === 'bubble';

  return (
    <div
      role="note"
      className={cn(
        'rounded-lg border text-left',
        tone.box,
        compact ? 'max-w-[320px] px-2.5 py-1.5 text-[11px]' : 'max-w-sm px-2.5 py-2 text-xs',
        className
      )}
    >
      <div className="flex items-start gap-1.5">
        <Info className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', tone.icon)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium leading-snug break-words', tone.title)}>
            {failure.title}
            {failure.code && (
              <span className={cn('ml-1.5 px-1.5 py-px rounded text-[10px] font-normal tabular-nums', tone.chip)}>
                {failure.code}
              </span>
            )}
          </p>

          <details className="group mt-0.5">
            <summary
              className={cn(
                'inline-flex items-center gap-0.5 cursor-pointer select-none list-none text-[11px] hover:underline',
                '[&::-webkit-details-marker]:hidden',
                tone.muted
              )}
            >
              Details
              <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className={cn('mt-1 space-y-1 leading-relaxed break-words', tone.muted)}>
              <p>{failure.hint}</p>
              {failure.detail && <p className="opacity-80">WhatsApp said: {failure.detail}</p>}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
