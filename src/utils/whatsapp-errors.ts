/**
 * Plain-language descriptions of WhatsApp Cloud API delivery failures, shared by the Team Inbox
 * and the campaign pages so the same error reads the same everywhere.
 */

export type FailureTone = 'amber' | 'neutral';

export interface DeliveryFailure {
  /** Provider error code, e.g. "131049" */
  code?: string;
  /** One short, calm line */
  title: string;
  /** What it means / what to do about it */
  hint: string;
  /** What Meta actually said, cleaned of repetition (shown under "Details") */
  detail?: string;
  tone: FailureTone;
}

interface KnownFailure {
  title: string;
  hint: string;
  tone: FailureTone;
}

const KNOWN_FAILURES: Record<string, KnownFailure> = {
  '131049': {
    title: 'WhatsApp limited this marketing message',
    hint: 'Meta chose not to deliver this marketing message to protect the recipient from too many promotions. Trying again later, or sending a utility or service message instead, usually works.',
    tone: 'amber',
  },
  '131026': {
    title: "This number can't receive the message",
    hint: 'The number is not on WhatsApp, has blocked this business, or is using an outdated version of the app.',
    tone: 'neutral',
  },
  '131047': {
    title: '24-hour reply window is closed',
    hint: "The customer hasn't written in the last 24 hours, so only an approved template message can be sent.",
    tone: 'amber',
  },
  '131048': {
    title: 'Sending limit reached for this number',
    hint: 'WhatsApp paused sending because too many recent messages were reported or ignored. Slow down and improve template quality.',
    tone: 'amber',
  },
  '131056': {
    title: 'Too many messages to this contact',
    hint: 'Too many messages were sent to this contact in a short time. Wait a little before sending again.',
    tone: 'amber',
  },
  '130429': {
    title: 'Sending rate limit reached',
    hint: 'The phone number hit its throughput limit. Retry with a lower sending rate.',
    tone: 'amber',
  },
  '130472': {
    title: 'Delivery paused by Meta for this number',
    hint: "Meta is running a test that includes this recipient, so the message isn't delivered. No action needed; it can work later.",
    tone: 'neutral',
  },
  '132000': {
    title: "Template parameters don't match",
    hint: 'The number of values sent does not match the approved template. Check the template variables.',
    tone: 'amber',
  },
  '132001': {
    title: 'Template not found or not approved',
    hint: 'The template does not exist in this language or is not approved yet.',
    tone: 'amber',
  },
  '132012': {
    title: 'A template value has the wrong format',
    hint: 'One of the template variables is not in the format the template expects.',
    tone: 'amber',
  },
  '131000': {
    title: 'WhatsApp had a temporary problem',
    hint: 'Something went wrong on the WhatsApp side. Sending again later usually works.',
    tone: 'neutral',
  },
};

const FALLBACK_TITLE = 'Message not delivered';
const FALLBACK_HINT = 'WhatsApp did not deliver this message. Check the WhatsApp channel connection and try again.';

/** Words of 4+ letters, used to spot a "details" sentence that just repeats the title */
const significantWords = (text: string): Set<string> =>
  new Set((text.toLowerCase().match(/[a-z]{4,}/g) || []) as string[]);

/**
 * Meta's text reaches us as "<title>.: <details>" and the two halves often say the same thing
 * ("...not delivered to maintain healthy ecosystem engagement.: In order to maintain a healthy
 * ecosystem engagement, the message failed to be delivered."). Keep the headline and only keep
 * the second half when it adds something.
 */
export function cleanMetaErrorMessage(raw?: string | null): { headline: string; detail?: string } {
  const text = (raw || '').replace(/\s+/g, ' ').trim();
  if (!text) return { headline: '' };

  const split = text.search(/\.?:\s/);
  if (split <= 0) return { headline: text.replace(/[.:]+$/, '') };

  const headline = text.slice(0, split).trim();
  const tail = text.slice(text.indexOf(':', split) + 1).trim();
  if (!tail) return { headline };

  const headWords = significantWords(headline);
  const tailWords = significantWords(tail);
  if (tailWords.size === 0) return { headline };

  let shared = 0;
  tailWords.forEach((w) => {
    if (headWords.has(w)) shared += 1;
  });
  const mostlyRepeats = shared / tailWords.size >= 0.5;
  return mostlyRepeats ? { headline } : { headline, detail: tail };
}

/** Turns a provider error code and/or raw message into something calm and readable. */
export function getDeliveryFailure(code?: string | null, rawMessage?: string | null): DeliveryFailure {
  const cleanCode = (code ?? '').toString().replace(/^#/, '').trim() || undefined;
  const { headline, detail } = cleanMetaErrorMessage(rawMessage);
  const metaText = [headline, detail].filter(Boolean).join('. ');

  const known = cleanCode ? KNOWN_FAILURES[cleanCode] : undefined;
  if (known) {
    return { code: cleanCode, ...known, detail: metaText || undefined };
  }

  if (metaText) {
    // Unknown code: show Meta's own words as the hint, under a calm generic title
    return { code: cleanCode, title: FALLBACK_TITLE, hint: headline, detail, tone: 'amber' };
  }
  return { code: cleanCode, title: FALLBACK_TITLE, hint: FALLBACK_HINT, tone: 'amber' };
}
