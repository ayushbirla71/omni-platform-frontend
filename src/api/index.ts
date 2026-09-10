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
  SystemStatus,
  SystemLogsResponse,
  SystemErrorsResponse,
  Product,
  Order,
  OrderStats,
  PaymentTransaction,
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeChunk,
  ReplySuggestion,
  CopilotSuggestionsResponse,
  ConversationSummary,
  RephraseResult,
  IntentClassification,
  RAGQueryResult,
  AILogEntry,
  TeamMember,
  UserRole,
  UserStatus,
  ApiKey,
  CreatedApiKeyResult,
  WorkspaceUsageSummary,
  AuditLogsResponse,
  ContactDataExportBundle,
  AnalyticsOverview,
  SlaPerformanceMetrics,
  TrafficHeatmapCell,
  FunnelStage,
  WebhookSubscription,
  WebhookDeliveryLog,
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

// ==================== SYSTEM & LOGS API ====================
export const systemApi = {
  getStatus: () => apiClient.get<SystemStatus>('/system/status'),

  getLogs: (params?: { level?: string; module?: string; search?: string; limit?: number }) =>
    apiClient.get<SystemLogsResponse>('/system/logs', params),

  getErrors: (params?: { search?: string; limit?: number }) =>
    apiClient.get<SystemErrorsResponse>('/system/errors', params),

  clearLogs: () => apiClient.post<{ success: boolean; message: string }>('/system/logs/clear'),

  getDownloadLogUrl: (type: 'app' | 'error' = 'app') => {
    const token = apiClient.getToken();
    return `/api/system/logs/download?type=${type}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  },
};

// ==================== COMMERCE & PRODUCTS API ====================
export const productsApi = {
  list: (params?: { category?: string; availableOnly?: boolean; search?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ products: Product[]; total: number }>('/products', params),

  getCategories: () =>
    apiClient.get<{ categories: string[] }>('/products/categories'),

  get: (id: string) =>
    apiClient.get<{ product: Product }>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    apiClient.post<{ product: Product }>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    apiClient.patch<{ product: Product }>(`/products/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/products/${id}`),
};

// ==================== ORDERS API ====================
export const ordersApi = {
  list: (params?: {
    status?: string;
    paymentStatus?: string;
    contactId?: string;
    conversationId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<{ orders: Order[]; total: number }>('/orders', params),

  getStats: () =>
    apiClient.get<OrderStats>('/orders/stats'),

  get: (id: string) =>
    apiClient.get<{ order: Order }>(`/orders/${id}`),

  create: (data: {
    contactId: string;
    conversationId?: string;
    items: Array<{ productId?: string; sku?: string; name: string; quantity: number; unitPrice: number }>;
    currency?: string;
    shippingAddress?: Record<string, any>;
    paymentMethod?: string;
    metadata?: Record<string, any>;
  }) => apiClient.post<{ order: Order }>('/orders', data),

  updateStatus: (id: string, data: { status: string; paymentStatus?: string }) =>
    apiClient.patch<{ order: Order }>(`/orders/${id}/status`, data),

  setPaymentLink: (id: string, data: { paymentLink: string; paymentMethod?: string }) =>
    apiClient.post<{ order: Order }>(`/orders/${id}/payment-link`, data),
};

// ==================== PAYMENTS API ====================
export const paymentsApi = {
  listTransactions: (orderId?: string) =>
    apiClient.get<{ transactions: PaymentTransaction[] }>('/payments/transactions', orderId ? { orderId } : undefined),

  createRazorpayLink: (data: { orderId: string; callbackUrl?: string; keyId?: string; keySecret?: string }) =>
    apiClient.post<{ paymentLink: string; paymentId?: string }>('/payments/razorpay/link', data),

  createStripeLink: (data: { orderId: string; successUrl?: string; cancelUrl?: string; secretKey?: string }) =>
    apiClient.post<{ paymentLink: string; sessionId?: string }>('/payments/stripe/link', data),

  recordManualPayment: (data: { orderId: string; amount: number; currency?: string; reference?: string }) =>
    apiClient.post<{ transaction: PaymentTransaction }>('/payments/manual', data),
};

// ==================== KNOWLEDGE BASE API ====================
export const knowledgeBasesApi = {
  list: () =>
    apiClient.get<{ items: KnowledgeBase[] }>('/knowledge-bases'),

  get: (id: string) =>
    apiClient.get<KnowledgeBase>(`/knowledge-bases/${id}`),

  create: (data: {
    name: string;
    description?: string;
    system_prompt?: string;
    provider?: string;
    model?: string;
    temperature?: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
  }) => apiClient.post<KnowledgeBase>('/knowledge-bases', data),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      system_prompt?: string;
      provider?: string;
      model?: string;
      temperature?: number;
      is_active?: boolean;
      metadata?: Record<string, any>;
    }
  ) => apiClient.patch<KnowledgeBase>(`/knowledge-bases/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/knowledge-bases/${id}`),

  listDocuments: (knowledgeBaseId: string) =>
    apiClient.get<{ items: KnowledgeDocument[] }>(`/knowledge-bases/${knowledgeBaseId}/documents`),

  addDocument: (
    knowledgeBaseId: string,
    data: {
      title: string;
      raw_content: string;
      source_type?: 'text' | 'pdf' | 'markdown' | 'url';
      source_url?: string;
      metadata?: Record<string, any>;
    }
  ) => apiClient.post<KnowledgeDocument>(`/knowledge-bases/${knowledgeBaseId}/documents`, data),

  deleteDocument: (knowledgeBaseId: string, documentId: string) =>
    apiClient.delete<{ success: boolean }>(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`),

  searchChunks: (
    knowledgeBaseId: string,
    data: { query: string; limit?: number }
  ) => apiClient.post<{ results: KnowledgeChunk[] }>(`/knowledge-bases/${knowledgeBaseId}/search`, data),
};

// ==================== AI COPILOT & AGENT API ====================
export const aiCopilotApi = {
  suggestReplies: (data: { conversationId: string; customContext?: string }) =>
    apiClient.post<CopilotSuggestionsResponse>('/ai/copilot/suggest', data),

  summarizeConversation: (data: { conversationId: string }) =>
    apiClient.post<ConversationSummary>('/ai/copilot/summarize', data),

  rephraseMessage: (data: {
    text: string;
    tone?: 'professional' | 'friendly' | 'concise' | 'bullet_points' | 'sales_pitch';
    targetLanguage?: string;
  }) => apiClient.post<RephraseResult>('/ai/copilot/rephrase', data),

  classifyIntent: (data: { text: string }) =>
    apiClient.post<IntentClassification>('/ai/classify', data),

  queryRAG: (data: {
    knowledgeBaseId: string;
    query: string;
    conversationId?: string;
    topK?: number;
    threshold?: number;
    customSystemPrompt?: string;
  }) => apiClient.post<RAGQueryResult>('/ai/rag/query', data),

  getLogs: (params?: { limit?: number; feature?: string }) =>
    apiClient.get<{ logs: AILogEntry[] }>('/ai/logs', params),
};

// ==================== TEAM & RBAC API ====================
export const teamApi = {
  list: () =>
    apiClient.get<TeamMember[]>('/team'),

  invite: (data: { email: string; name?: string; role?: UserRole; password?: string }) =>
    apiClient.post<TeamMember>('/team/invite', data),

  updateRole: (id: string, role: UserRole) =>
    apiClient.patch<TeamMember>(`/team/${id}/role`, { role }),

  updateStatus: (id: string, status: UserStatus) =>
    apiClient.patch<TeamMember>(`/team/${id}/status`, { status }),

  remove: (id: string) =>
    apiClient.delete<{ message: string; id: string }>(`/team/${id}`),
};

// ==================== DEVELOPER API KEYS API ====================
export const apiKeysApi = {
  list: () =>
    apiClient.get<ApiKey[]>('/api-keys'),

  create: (data: { name: string; scopes?: string[]; expiresInDays?: number }) =>
    apiClient.post<CreatedApiKeyResult>('/api-keys', data),

  revoke: (id: string) =>
    apiClient.delete<{ message: string; id: string }>(`/api-keys/${id}`),
};

// ==================== BILLING & USAGE API ====================
export const billingApi = {
  getUsage: () =>
    apiClient.get<WorkspaceUsageSummary>('/billing/usage'),

  updatePlan: (planId: string) =>
    apiClient.post<{ message: string; plan: any }>('/billing/plan', { planId }),
};

// ==================== AUDIT LOGS API ====================
export const auditLogsApi = {
  list: (params?: { action?: string; resourceType?: string; limit?: number; offset?: number }) =>
    apiClient.get<AuditLogsResponse>('/audit-logs', params),
};

// ==================== COMPLIANCE & GDPR API ====================
export const complianceApi = {
  exportContact: (contactId: string) =>
    apiClient.post<ContactDataExportBundle>('/compliance/export', { contactId }),

  purgeContact: (contactId: string) =>
    apiClient.post<{ message: string; deletedItemsCount: { conversations: number; messages: number } }>(
      '/compliance/purge',
      { contactId }
    ),
};

// ==================== ADVANCED ANALYTICS API ====================
export const analyticsApi = {
  getOverview: () =>
    apiClient.get<AnalyticsOverview>('/analytics/overview'),

  getSlaPerformance: (thresholdSeconds?: number) =>
    apiClient.get<SlaPerformanceMetrics>('/analytics/sla-performance', { threshold: thresholdSeconds }),

  getTrafficHeatmap: () =>
    apiClient.get<TrafficHeatmapCell[]>('/analytics/traffic-heatmap'),

  getConversionFunnel: () =>
    apiClient.get<FunnelStage[]>('/analytics/conversion-funnel'),
};

// ==================== OUTBOUND WEBHOOKS API ====================
export const webhooksApi = {
  listSubscriptions: () =>
    apiClient.get<WebhookSubscription[]>('/webhooks/subscriptions'),

  getSubscription: (id: string) =>
    apiClient.get<WebhookSubscription>(`/webhooks/subscriptions/${id}`),

  createSubscription: (data: { name: string; url: string; secret?: string; events?: string[] }) =>
    apiClient.post<WebhookSubscription>('/webhooks/subscriptions', data),

  updateSubscription: (
    id: string,
    data: { name?: string; url?: string; secret?: string; events?: string[]; is_active?: boolean }
  ) => apiClient.patch<WebhookSubscription>(`/webhooks/subscriptions/${id}`, data),

  deleteSubscription: (id: string) =>
    apiClient.delete<{ message: string; id: string }>(`/webhooks/subscriptions/${id}`),

  testSubscription: (id: string) =>
    apiClient.post<{ success: boolean; statusCode?: number; error?: string }>(`/webhooks/subscriptions/${id}/test`),

  listDeliveryLogs: (id: string, limit?: number) =>
    apiClient.get<WebhookDeliveryLog[]>(`/webhooks/subscriptions/${id}/deliveries`, { limit }),
};



