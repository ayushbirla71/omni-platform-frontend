import { WhatsAppTemplate, TemplateComponent } from '../types';

/**
 * Built-in catalog of verified Meta approved WhatsApp templates.
 * This guarantees zero-flicker instant rendering even before API template sync completes.
 */
export const APPROVED_TEMPLATES_CATALOG: WhatsAppTemplate[] = [
  {
    name: 'theater_ad',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    id: '2127574357824428',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [
            'https://scontent.whatsapp.net/v/t61.29466-34/677628429_2127574364491094_8771787898347501044_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=wBkJETwWNaAQ7kNvwHftx5X&_nc_oc=Adrylu3VjON3oCVIw_pZ3fkpN-01JbdbegDKD_uSAJw3X4U3EGMQ1mjWknsC7ucV-10&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=5uDkIgLfYSct5pJ0XV5uwQ&_nc_tpa=Q5bMBQJfxzvM-KjbuGysHAjdYNR2abwadmfwv5NEhu1INAVwhebT1djk7X_FhTlEgFehKMxWWaxJ1RP3oA&oh=01_Q5Aa5gHMoWT2Gy8x8Hb6wNEZtbqWk-mJ4dJTP3iQ74Ej8hT8zQ&oe=6ACCC659',
          ],
        },
      },
      {
        type: 'BODY',
        text:
          '🎬FESTIVAL SEASON IS COMING! 🔥\n\n' +
          'The upcoming months are the perfect time for brands to go BIG on the BIG SCREEN!\n\n' +
          '🌸Sravana Maasam – Weddings, auspicious occasions & increased shopping\n' +
          '🎉Dasara & Diwali– Peak festive buying season\n' +
          '🍿Blockbuster & Pan-India Movies – Higher theatre footfalls & massive audience reach\n\n' +
          'This is the right time to PRE-BOOK your Theatre Advertising slots.\n' +
          'During major movie releases, premium theatre inventory gets booked quickly, availability becomes limited and advertising rates can increase due to high demand.\n\n' +
          '👉Pre-book now and secure the best theatres, movies & pricing before the peak season!\n\n' +
          '🎥AD96 offers:\n' +
          '• Theatre Advertising Pan India\n' +
          '• Ad Film Production\n' +
          '• Creative & Concept Development\n' +
          '• Multicity Campaign Planning & Execution\n\n' +
          'Whether it’s a Festive Campaign, New Launch, Store Opening, Brand Awareness or Sales Promotion, we help your brand reach audiences on the BIG SCREEN.\n\n' +
          '📲Plan early. Book early. Advertise smarter. Let’s reserve your slots before they’re gone!',
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: 'Interested' },
          { type: 'QUICK_REPLY', text: 'Not Interested' },
          { type: 'PHONE_NUMBER', text: 'Call Back', phone_number: '+918886899696' },
        ],
      },
    ],
  },
  {
    name: 'digital_signage_96',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    id: '1371655087692180',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [
            'https://scontent.whatsapp.net/v/t61.29466-34/546360844_1371655091025513_2614787913085086801_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=Sp38REfocDoQ7kNvwFHO8gL&_nc_oc=AdpzxbZxM6qj--KCrE2B4jkWuvvzEGQUkgzq3PSw9K5qFYcHMSU5v5S_OQ99XJKCmEI&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=5uDkIgLfYSct5pJ0XV5uwQ&_nc_tpa=Q5bMBQIRO4QL5Wn8ZzLSJdr0TGegFFTV15j26ToYTflO0ufuSfpD0ptGuto9XVcfRHqCcZvf4AEuq4dkVA&oh=01_Q5Aa5gGz1DDNs2PVnYOa4T5o_46GGfKE3_RYLMgq4xhfcPezAA&oe=6ACCEB25',
          ],
        },
      },
      {
        type: 'BODY',
        text:
          "Hi!\nWe hope you're doing well!\n\n" +
          'Looking for a smarter way to attract customers and promote your business?\n\n' +
          'At ad96, we provide:\n\n' +
          '✅ Digital Signages\n' +
          '✅ Outdoor LED Displays\n' +
          '✅ Digital Menu Boards\n' +
          '✅ Advertising Displays\n' +
          '✅ Installation & Support\n\n' +
          'Our digital screens help businesses increase visibility, engage customers, and boost sales.\n\n' +
          "We're here to help you choose the perfect display for your business.",
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: 'Interested' },
          { type: 'QUICK_REPLY', text: 'Not Interested' },
          { type: 'PHONE_NUMBER', text: 'Call Back', phone_number: '+918886899696' },
        ],
      },
    ],
  },
  {
    name: 'digital_signage',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    id: '1526283498706945',
    components: [
      {
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [
            'https://scontent.whatsapp.net/v/t61.29466-34/761584313_1526283505373611_8230653784476468870_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=hbbULNeusPwQ7kNvwHQ5ag_&_nc_oc=AdpwcjJH9DSfxVhxzobgePTegJBQFcZXT1OVElpT_tZyK9Z7O0V5EEoiATGYsrO6NUU&_nc_zt=3&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=5uDkIgLfYSct5pJ0XV5uwQ&_nc_tpa=Q5bMBQLglUjstA3pofUWFTPX0gdJjWw7N2At8ypBHM2TDkXJ0pueKCgFvxu8SvmqKr28vMArbhL8GAKYyw&oh=01_Q5Aa5gHOgIb2ml1-BtUyZmVOrwyQhJSKoyyAy_v-BpbYn7mdkQ&oe=6ACCC24A',
          ],
        },
      },
      {
        type: 'BODY',
        text:
          "Hi!\nWe hope you're doing well!\n\n" +
          'Looking for a smarter way to attract customers and promote your business?\n\n' +
          'At ad96, we provide:\n\n' +
          '✅ Digital Signages\n' +
          '✅ Outdoor LED Displays\n' +
          '✅ Digital Menu Boards\n' +
          '✅ Advertising Displays\n' +
          '✅ Video Wall Solutions\n' +
          '✅ Installation & Support\n\n' +
          'Our digital screens help businesses increase visibility, engage customers, and boost sales.\n\n' +
          'Book a FREE Demo today and see the difference!\n\n' +
          "We're here to help you choose the perfect display for your business.",
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Interested', url: 'https://www.ad96.in/' },
          { type: 'PHONE_NUMBER', text: 'Call Back', phone_number: '+918886899696' },
          { type: 'QUICK_REPLY', text: 'Not Interested' },
        ],
      },
    ],
  },
  {
    name: 'follow_up_th_ads',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    id: '1601892761535533',
    components: [
      {
        type: 'BODY',
        text: 'Hi!\nWe are team ad96.\nCan you please update me regarding Theater Ads.',
      },
    ],
  },
  {
    name: 'follow_up_ds',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    id: '1710166786931430',
    components: [
      {
        type: 'BODY',
        text: 'Hi!\nWe are team ad96.\ncan you please update me regarding Digital signages.',
      },
    ],
  },
  {
    name: 'hello_world',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en_US',
    id: '2198696687531264',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: 'Hello World',
      },
      {
        type: 'BODY',
        text:
          'Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.',
      },
      {
        type: 'FOOTER',
        text: 'WhatsApp Business Platform sample message',
      },
    ],
  },
];

// In-memory cache for runtime-discovered templates per channel
const dynamicTemplateRegistry = new Map<string, WhatsAppTemplate>();

// Initialize with built-in templates
APPROVED_TEMPLATES_CATALOG.forEach((t) => {
  dynamicTemplateRegistry.set(t.name.toLowerCase(), t);
});

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
        } else if (comp.format === 'IMAGE' || comp.format === 'VIDEO' || comp.format === 'DOCUMENT') {
          if (!headerMediaUrl) {
            // Check example handles from Meta template definition
            if (comp.example?.header_handle?.[0]) {
              headerMediaUrl = comp.example.header_handle[0];
            }
          }
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
          buttons = comp.buttons || [];
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
