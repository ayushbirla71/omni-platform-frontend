import React from 'react';
import { Check, CheckCheck, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MessageStatus } from '../../types';

export interface MessageStatusTicksProps {
  status?: MessageStatus;
  /**
   * `onBubble` sits on the blue outbound bubble, `onLight` on a light background
   * (e.g. under a template card), so the ticks keep enough contrast on both.
   */
  palette: 'onBubble' | 'onLight';
}

const PALETTE = {
  onBubble: { sent: 'text-primary-200', delivered: 'text-primary-200', read: 'text-sky-200', notDelivered: 'text-amber-200' },
  onLight: { sent: 'text-gray-400', delivered: 'text-gray-400', read: 'text-sky-500', notDelivered: 'text-amber-600' },
} as const;

/**
 * Delivery ticks for an outbound message. A failed message gets a quiet static icon here; the
 * reason itself is shown by DeliveryFailureNote under the message, not in a hover popover.
 */
export const MessageStatusTicks: React.FC<MessageStatusTicksProps> = ({ status, palette }) => {
  const colors = PALETTE[palette];

  if (status === 'failed') {
    return (
      <span title="Not delivered" className="flex items-center ml-0.5">
        <Info className={cn('w-3.5 h-3.5', colors.notDelivered)} aria-label="Not delivered" />
      </span>
    );
  }
  if (status === 'read') {
    return (
      <span title="Read by customer" className="flex items-center ml-0.5">
        <CheckCheck className={cn('w-3.5 h-3.5', colors.read)} />
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span title="Delivered to device" className="flex items-center ml-0.5">
        <CheckCheck className={cn('w-3.5 h-3.5', colors.delivered)} />
      </span>
    );
  }
  return (
    <span title="Sent" className="flex items-center ml-0.5">
      <Check className={cn('w-3.5 h-3.5', colors.sent)} />
    </span>
  );
};
