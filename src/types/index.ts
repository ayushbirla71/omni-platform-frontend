// Tenant & User
export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: 'owner' | 'admin' | 'agent';
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tenantId: string;
  userId: string;
}

// Channel
export type ChannelType = 'whatsapp' | 'telegram' | 'instagram' | 'messenger';
export type ChannelStatus = 'active' | 'inactive' | 'error';

export interface Channel {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  type: ChannelType;
  displayName?: string;
  display_name?: string;
  externalId?: string;
  external_id?: string;
  status: ChannelStatus;
  defaultFlowId?: string | null;
  default_flow_id?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

export interface WhatsAppOnboardingConfig {
  appId: string | null;
  configId: string | null;
}

export interface OnboardingCapacity {
  used: number;
  limit: number;
  remaining: number;
  windowDays: number;
}

// WhatsApp Templates
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponent[];
}

// Contact
export interface Contact {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  channelId?: string;
  channel_id?: string;
  channelType?: ChannelType;
  channel?: string;
  externalId?: string;
  external_id?: string; // phone number or telegram chat ID
  name: string | null;
  email?: string | null;
  attributes?: {
    tags?: string[];
    email?: string;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

export interface ImportContactsResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  errors: string[];
}

// Conversation
export type ConversationStatus = 'open' | 'closed';

export interface Conversation {
  id: string;
  tenantId: string;
  channelId: string;
  channelType: ChannelType;
  channelDisplayName?: string;
  contactId: string;
  contactName?: string | null;
  contactExternalId?: string;
  assignedAgentUserId?: string | null;
  status: ConversationStatus;
  lastMessageAt: string;
  lastMessageText?: string;
  flowId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Message
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  _id?: string;
  id?: string;
  tenantId?: string;
  tenant_id?: string;
  conversationId?: string;
  conversation_id?: string;
  channelId?: string;
  direction: MessageDirection;
  type?: string;
  senderType?: 'customer' | 'agent' | 'bot' | 'system';
  senderUserId?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaStorageKey?: string;
  content?: Record<string, any>;
  raw?: Record<string, any>;
  status?: MessageStatus;
  createdAt?: string;
  created_at?: string;
  sentAt?: string;
  sent_at?: string;
}

// Flow Engine & Visual Graph Canvas
export type FlowNodeType =
  | 'message'
  | 'input'
  | 'condition'
  | 'action'
  | 'template'
  | 'wait'
  | 'ai_agent'
  | 'intent_router'
  | 'handoff'
  | 'end';

export interface NodePort {
  id: string;
  label?: string;
  next?: string;
}

export interface RetryConfig {
  maxRetries?: number;
  delaySeconds?: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  label?: string;
}

export interface MessageNode {
  id: string;
  type: 'message';
  text: string;
  waitForDelivery?: boolean;
  onDelivered?: string;
  onFailed?: string;
  retryConfig?: RetryConfig;
  next?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface InputNode {
  id: string;
  type: 'input';
  prompt: string;
  saveAs: string;
  next?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface ConditionBranch {
  equals: string;
  next: string;
}

export interface ConditionNode {
  id: string;
  type: 'condition';
  variable: string;
  branches: ConditionBranch[];
  default?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface ActionNode {
  id: string;
  type: 'action';
  action: 'webhook';
  url: string;
  next?: string;
  onSuccess?: string;
  onFailure?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface TemplateButtonAction {
  buttonText: string;
  next: string;
}

export interface TemplateNode {
  id: string;
  type: 'template';
  templateName: string;
  language?: string;
  templateParams?: Record<string, string>;
  headerType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  headerValue?: string;
  buttons?: TemplateButtonAction[];
  waitForDelivery?: boolean;
  onDelivered?: string;
  onFailed?: string;
  retryConfig?: RetryConfig;
  saveAs?: string;
  next?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface WaitNode {
  id: string;
  type: 'wait';
  duration: number;
  durationUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
  next?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface AIAgentNode {
  id: string;
  type: 'ai_agent';
  knowledgeBaseId?: string;
  queryVariable?: string;
  prompt?: string;
  saveResponseAs?: string;
  saveAs?: string;
  sendImmediately?: boolean;
  fallbackThreshold?: number;
  onFallback?: string;
  next?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface IntentRouterNode {
  id: string;
  type: 'intent_router';
  inputVariable?: string;
  branches: { intent: string; next: string }[];
  default?: string;
  saveIntentAs?: string;
  saveSentimentAs?: string;
  ports?: NodePort[];
  position?: NodePosition;
}

export interface HandoffNode {
  id: string;
  type: 'handoff';
  ports?: NodePort[];
  position?: NodePosition;
}

export interface EndNode {
  id: string;
  type: 'end';
  ports?: NodePort[];
  position?: NodePosition;
}

export type FlowNode =
  | MessageNode
  | InputNode
  | ConditionNode
  | ActionNode
  | TemplateNode
  | WaitNode
  | AIAgentNode
  | IntentRouterNode
  | HandoffNode
  | EndNode;

export interface FlowDefinition {
  entryNodeId: string;
  nodes: FlowNode[];
  edges?: FlowEdge[];
}

export interface Flow {
  id: string;
  tenant_id?: string;
  tenantId?: string;
  name: string;
  status: 'draft' | 'published';
  version: number;
  definition: FlowDefinition;
  publishedAt?: string | null;
  published_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// CRM Deal
export interface Deal {
  id: string;
  tenantId: string;
  contactId: string;
  contactName?: string | null;
  contactExternalId?: string;
  title: string;
  stage: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineSummary {
  stage: string;
  count: number;
  totalValue: number;
}

// Marketing Campaign
export type CampaignType = 'broadcast' | 'drip' | 'flow';
export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'failed';

export interface BroadcastDefinition {
  text?: string;
  flowId?: string;
  tags?: string[];
}

export interface FlowCampaignDefinition {
  flowId: string;
  tags?: string[];
}

export interface DripStep {
  stepNumber?: number;
  delayHours: number;
  message?: string;
  text?: string;
}

export interface DripDefinition {
  steps: DripStep[];
}

export interface Campaign {
  id: string;
  tenant_id?: string;
  tenantId?: string;
  channel_id?: string;
  channelId?: string;
  channelDisplayName?: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  definition: BroadcastDefinition | DripDefinition | FlowCampaignDefinition;
  total_recipients?: number;
  totalRecipients?: number;
  sent_count?: number;
  sentCount?: number;
  failed_count?: number;
  failedCount?: number;
  targetContactIds?: string[];
  tags?: string[];
  flowId?: string;
  message?: string;
  steps?: DripStep[];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Search
export interface SearchResults {
  messages: Array<{
    id: string;
    conversationId: string;
    text: string;
    direction: MessageDirection;
    createdAt: string;
  }>;
  contacts: Array<{
    id: string;
    name: string | null;
    externalId: string;
    channelType?: ChannelType;
    channel?: string;
  }>;
}

// Deep link / QR
export interface DeepLinkResponse {
  link: string;
  qrCodeDataUrl: string;
}

// System Logs & Diagnostics
export type SystemLogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: SystemLogLevel;
  module?: string;
  message: string;
  reqId?: string;
  tenantId?: string;
  userId?: string;
  durationMs?: number;
  statusCode?: number;
  meta?: Record<string, any>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    code?: string | number;
    details?: any;
  };
}

export interface SystemStatus {
  status: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  uptimeSeconds: number;
  database: string;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
  };
  logStats: {
    inMemoryLogsCount: number;
    inMemoryErrorsCount: number;
  };
  environment: string;
  timestamp: string;
}

export interface SystemLogsResponse {
  total: number;
  limit: number;
  logs: SystemLogEntry[];
}

export interface SystemErrorsResponse {
  total: number;
  limit: number;
  errors: SystemLogEntry[];
}

// Commerce & Products
export interface Product {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  currency: string;
  images: string[];
  category?: string | null;
  isAvailable?: boolean;
  is_available?: boolean;
  inventoryQuantity?: number;
  inventory_quantity?: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface OrderItem {
  productId?: string;
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit_price?: number;
  total: number;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'paid' | 'unpaid' | 'failed' | 'refunded';
export type PaymentGateway = 'razorpay' | 'stripe' | 'whatsapp_pay' | 'manual';

export interface Order {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  contactId?: string;
  contact_id?: string;
  contactName?: string | null;
  contact_name?: string | null;
  contactExternalId?: string | null;
  contact_external_id?: string | null;
  conversationId?: string | null;
  conversation_id?: string | null;
  orderNumber?: string;
  order_number?: string;
  status: OrderStatus;
  currency: string;
  totalAmount?: number;
  total_amount?: number;
  items: OrderItem[];
  shippingAddress?: Record<string, any> | null;
  shipping_address?: Record<string, any> | null;
  paymentStatus?: PaymentStatus;
  payment_status?: PaymentStatus;
  paymentMethod?: string | null;
  payment_method?: string | null;
  paymentLink?: string | null;
  payment_link?: string | null;
  metadata?: Record<string, any>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  paidOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface PaymentTransaction {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  orderId?: string;
  order_id?: string;
  gateway: PaymentGateway;
  gatewayOrderId?: string | null;
  gateway_order_id?: string | null;
  gatewayPaymentId?: string | null;
  gateway_payment_id?: string | null;
  amount: number;
  currency: string;
  status: 'created' | 'success' | 'failed' | 'refunded';
  rawResponse?: Record<string, any>;
  raw_response?: Record<string, any>;
  createdAt?: string;
  created_at?: string;
}

// AI Knowledge Base & RAG Vector Store
export interface KnowledgeBase {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  name: string;
  description?: string | null;
  embeddingModel?: string;
  embedding_model?: string;
  vectorDimension?: number;
  vector_dimension?: number;
  docCount?: number;
  doc_count?: number;
  documentCount?: number;
  chunkCount?: number;
  chunk_count?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId?: string;
  knowledge_base_id?: string;
  title: string;
  sourceType?: 'text' | 'pdf' | 'markdown' | 'url';
  source_type?: 'text' | 'pdf' | 'markdown' | 'url';
  content?: string;
  metadata?: Record<string, any>;
  chunkCount?: number;
  chunk_count?: number;
  status?: 'ready' | 'processing' | 'error';
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId?: string;
  document_id?: string;
  knowledgeBaseId?: string;
  knowledge_base_id?: string;
  chunkIndex?: number;
  chunk_index?: number;
  content: string;
  tokenCount?: number;
  token_count?: number;
  similarity?: number;
  createdAt?: string;
  created_at?: string;
}

export interface KnowledgeBaseStats {
  totalBases: number;
  totalDocuments: number;
  totalChunks: number;
  totalQueries: number;
}

// AI Copilot & Inbox Assistant
export interface ReplySuggestion {
  text: string;
  confidence: number;
  category: 'direct_resolution' | 'clarification' | 'closing' | 'general';
}

export interface CopilotSuggestionsResponse {
  suggestions: ReplySuggestion[];
  contextSummary?: string;
}

export interface ConversationSummary {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent' | 'mixed';
  intent?: string;
  mainIntent?: string;
  keyPoints: string[];
  suggestedAction?: string;
  actionItems?: string[];
}

export interface RephraseResult {
  rephrased: string;
  originalText?: string;
  tone?: string;
}

export interface IntentClassification {
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  entities?: Record<string, any>;
}

export interface RAGQueryResult {
  answer: string;
  confidence: number;
  usedSources: Array<{
    documentTitle: string;
    content: string;
    similarity: number;
  }>;
  latencyMs: number;
}

export interface AILogEntry {
  id: string;
  tenant_id: string;
  feature: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  metadata: Record<string, any>;
  created_at: string;
}

