import { apiClient } from './client';
import type {
  AuthResponse,
  Channel,
  ChannelType,
  WhatsAppOnboardingConfig,
  OnboardingCapacity,
  WhatsAppTemplate,
  Contact,
  ImportContactsResult,
  Conversation,
  Message,
  Flow,
  FlowDefinition,
  Deal,
  PipelineSummary,
  Campaign,
  SearchResults,
  DeepLinkResponse,
} from '../types';

// ==================== AUTH API ====================
export const authApi = {
  signup: (data: { tenantName: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data),
};

// ==================== CHANNELS API ====================
export const channelsApi = {
  list: () => apiClient.get<Channel[]>('/channels'),

  create: (data: { type: ChannelType; displayName: string; credentials?: Record<string, any> }) =>
    apiClient.post<Channel>('/channels', data),

  update: (id: string, data: { displayName?: string; credentials?: Record<string, any>; status?: string }) =>
    apiClient.patch<Channel>(`/channels/${id}`, data),

  setDefaultFlow: (channelId: string, flowId: string | null) =>
    apiClient.post<void>(`/channels/${channelId}/default-flow`, { flowId }),

  getDeepLink: (channelId: string, text?: string) =>
    apiClient.get<DeepLinkResponse>(`/channels/${channelId}/deep-link`, text ? { text } : undefined),

  getTemplates: (channelId: string) =>
    apiClient.get<WhatsAppTemplate[]>(`/channels/${channelId}/templates`),

  createTemplate: (
    channelId: string,
    data: {
      name: string;
      language: string;
      category: string;
      components: any[];
    }
  ) => apiClient.post<WhatsAppTemplate>(`/channels/${channelId}/templates`, data),
};

// ==================== WHATSAPP ONBOARDING API ====================
export const whatsappOnboardingApi = {
  getConfig: () => apiClient.get<WhatsAppOnboardingConfig>('/whatsapp-onboarding/config'),

  getCapacity: () => apiClient.get<OnboardingCapacity>('/whatsapp-onboarding/capacity'),

  completeCallback: (data: {
    code: string;
    wabaId?: string;
    phoneNumberId?: string;
    displayName?: string;
  }) => apiClient.post<Channel>('/whatsapp-onboarding/callback', data),
};

// ==================== CONTACTS API ====================
export const contactsApi = {
  list: (limit = 100, offset = 0, options: { channelId?: string; tag?: string; search?: string } = {}) =>
    apiClient.get<Contact[]>('/contacts', { limit, offset, ...options }),

  getTags: () => apiClient.get<string[]>('/contacts/tags'),

  getCount: (options: { channelId?: string; tags?: string; search?: string } = {}) =>
    apiClient.get<{ count: number }>('/contacts/count', options),

  create: (data: { name?: string; externalId: string; channel?: string; channelId?: string; email?: string; tags?: string[] }) =>
    apiClient.post<Contact>('/contacts', data),

  update: (id: string, data: { name?: string; email?: string; tags?: string[] }) =>
    apiClient.patch<Contact>(`/contacts/${id}`, data),

  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/contacts/${id}`),

  importFile: (formData: FormData) =>
    apiClient.post<ImportContactsResult>('/contacts/import', formData),

  bulkCreate: (data: { channelId?: string; contacts: any[]; tags?: string[] }) =>
    apiClient.post<ImportContactsResult>('/contacts/bulk', data),
};

// ==================== CONVERSATIONS API ====================
export const conversationsApi = {
  list: (status?: 'open' | 'closed') =>
    apiClient.get<Conversation[]>('/conversations', status ? { status } : undefined),

  getMessages: (conversationId: string) =>
    apiClient.get<Message[]>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, text: string) =>
    apiClient.post<Message>(`/conversations/${conversationId}/messages`, { text }),

  assignAgent: (conversationId: string, agentUserId: string) =>
    apiClient.post<void>(`/conversations/${conversationId}/assign`, { agentUserId }),
};

// ==================== FLOWS API ====================
export const flowsApi = {
  list: () => apiClient.get<Flow[]>('/flows'),

  get: (id: string) => apiClient.get<Flow>(`/flows/${id}`),

  create: (data: { name: string; definition: FlowDefinition }) =>
    apiClient.post<Flow>('/flows', data),

  update: (id: string, definition: FlowDefinition) =>
    apiClient.put<Flow>(`/flows/${id}`, { definition }),

  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/flows/${id}`),

  publish: (id: string) => apiClient.post<Flow>(`/flows/${id}/publish`),
};

// ==================== DEALS API ====================
export const dealsApi = {
  list: (stage?: string) => apiClient.get<Deal[]>('/deals', stage ? { stage } : undefined),

  getPipelineSummary: () => apiClient.get<PipelineSummary[]>('/deals/pipeline-summary'),

  create: (data: { contactId: string; title: string; stage?: string; value?: number }) =>
    apiClient.post<Deal>(`/deals`, data),

  update: (id: string, data: { title?: string; stage?: string; value?: number }) =>
    apiClient.patch<Deal>(`/deals/${id}`, data),

  updateStage: (id: string, stage: string) =>
    apiClient.patch<Deal>(`/deals/${id}/stage`, { stage }),

  delete: (id: string) => apiClient.delete<void>(`/deals/${id}`),
};

// ==================== CAMPAIGNS API ====================
export const campaignsApi = {
  list: () => apiClient.get<Campaign[]>('/campaigns'),

  get: (id: string) => apiClient.get<Campaign>(`/campaigns/${id}`),

  create: (data: {
    channelId: string;
    name: string;
    type: 'broadcast' | 'drip' | 'flow';
    targetContactIds?: string[];
    contactIds?: string[];
    tags?: string[];
    flowId?: string;
    message?: string;
    steps?: any[];
    definition?: any;
  }) => apiClient.post<Campaign>('/campaigns', data),

  send: (id: string) => apiClient.post<{ sent: number; failed: number }>(`/campaigns/${id}/send`),

  sendBroadcast: (id: string) => apiClient.post<{ sent: number; failed: number }>(`/campaigns/${id}/send`),

  delete: (id: string) => apiClient.delete<void>(`/campaigns/${id}`),
};

// ==================== SEARCH API ====================
export const searchApi = {
  search: (query: string) => apiClient.get<SearchResults>('/search', { q: query }),
};

// ==================== MEDIA API ====================
export const mediaApi = {
  getDownloadUrl: (key: string) => apiClient.get<{ downloadUrl: string }>(`/media/download-url`, { key }),
};
