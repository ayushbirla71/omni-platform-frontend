import { WhatsAppTemplate } from '../types';

// In-memory cache for runtime-discovered templates per tenant channel
const dynamicTemplateRegistry = new Map<string, WhatsAppTemplate>();

export function registerDynamicTemplates(templates: WhatsAppTemplate[]) {
  if (!Array.isArray(templates)) return;
  templates.forEach((t) => {
    if (t?.name) {
      dynamicTemplateRegistry.set(t.name.toLowerCase(), t);
    }
  });
}

export function findTemplateByName(name?: string): WhatsAppTemplate | undefined {
  if (!name) return undefined;
  return dynamicTemplateRegistry.get(name.toLowerCase());
}

export function clearTemplateRegistry() {
  dynamicTemplateRegistry.clear();
}

export interface ParsedTemplateDetails {
  templateName: string;
  category?: string;
  status?: string;
  headerType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerText?: string;
  headerMediaUrl?: string;
  bodyText: string;
  footerText?: string;
  buttons: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | string;
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

/**
 * Resolves a WhatsApp template message into full renderable details, interpolating
 * any body parameters, determining media URLs, footers, and interactive action buttons.
 */
export function resolveTemplateMessage(options: {
  templateName?: string;
  templateParams?: Record<string, string> | any[];
  headerType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerValue?: string;
  mediaUrl?: string;
  content?: Record<string, any>;
  rawText?: string;
  knownTemplates?: WhatsAppTemplate[];
}): ParsedTemplateDetails {
  const {
    templateParams,
    headerType: explicitHeaderType,
    headerValue: explicitHeaderValue,
    mediaUrl,
    content,
    rawText,
    knownTemplates,
  } = options;

  let templateName =
    options.templateName ||
    content?.templateName ||
    content?.template_name ||
    '';

  // If template name was embedded in rawText like "[Template: theater_ad]"
  if (!templateName && rawText && rawText.startsWith('[Template:')) {
    const match = rawText.match(/\[Template:\s*([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      templateName = match[1];
    }
  }

  // Register any caller-provided templates
  if (knownTemplates && knownTemplates.length > 0) {
    registerDynamicTemplates(knownTemplates);
  }

  const template = findTemplateByName(templateName);

  let headerType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | undefined =
    explicitHeaderType || content?.headerType;
  let headerText: string | undefined;
  let headerMediaUrl: string | undefined =
    explicitHeaderValue || mediaUrl || content?.headerValue || content?.mediaUrl;
  let bodyText = content?.bodyText || content?.text || '';
  let footerText: string | undefined = content?.footerText;
  let buttons: ParsedTemplateDetails['buttons'] = content?.buttons || [];

  if (template) {
    for (const comp of template.components) {
      if (comp.type === 'HEADER') {
        if (!headerType) {
          headerType = (comp.format as any) || (comp.text ? 'TEXT' : undefined);
        }
        if (comp.format === 'TEXT' || (!comp.format && comp.text)) {
          headerText = comp.text;
        // } else if (comp.format === 'IMAGE' || comp.format === 'VIDEO' || comp.format === 'DOCUMENT') {
        //   if (!headerMediaUrl) {
        //     // Check example handles from Meta template definition
        //     if (comp.example?.header_handle?.[0]) {
        //       headerMediaUrl = comp.example.header_handle[0];
        //     }
        //   }
        }
      } else if (comp.type === 'BODY') {
        if (!bodyText || bodyText.startsWith('[Template:')) {
          bodyText = comp.text || '';
        }
      } else if (comp.type === 'FOOTER') {
        if (!footerText) {
          footerText = comp.text;
        }
      } else if (comp.type === 'BUTTONS') {
        if (!buttons || buttons.length === 0) {
          buttons = (comp.buttons || []).map((b) => ({
            type: b.type,
            text: b.text || '',
            url: b.url,
            phone_number: b.phone_number || b.phoneNumber,
          }));
        }
      }
    }
  }

  // Parameter Interpolation: Replace {{1}}, {{2}}, etc. or {{name}}, etc.
  if (bodyText) {
    const params = templateParams || content?.templateParams;
    if (params) {
      if (Array.isArray(params)) {
        params.forEach((val, idx) => {
          const re = new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g');
          bodyText = bodyText.replace(re, String(val ?? ''));
        });
      } else if (typeof params === 'object') {
        Object.entries(params).forEach(([key, val]) => {
          // Handle numeric keys {{1}}, {{2}} or named keys {{name}}
          const numKey = Number(key);
          const pattern = !isNaN(numKey) ? `\\{\\{${numKey}\\}\\}` : `\\{\\{${key}\\}\\}`;
          bodyText = bodyText.replace(new RegExp(pattern, 'g'), String(val ?? ''));
        });
      }
    }
  }

  // Fallback bodyText if still empty
  if (!bodyText) {
    bodyText = rawText && !rawText.startsWith('[Template:') ? rawText : `WhatsApp Template: ${templateName || 'Message'}`;
  }

  return {
    templateName: templateName || 'WhatsApp Template',
    category: template?.category,
    status: template?.status,
    headerType,
    headerText,
    headerMediaUrl,
    bodyText,
    footerText,
    buttons,
  };
}
