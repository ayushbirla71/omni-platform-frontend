import React, { useState } from 'react';
import {
  MessageSquare,
  FileText,
  Clock,
  HelpCircle,
  GitBranch,
  Globe,
  UserCheck,
  StopCircle,
  Brain,
  Split,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Code2,
  ShieldAlert,
  CheckCircle2,
  Workflow,
  BookOpen,
  Info,
  Timer,
  Bot,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface FlowNodeHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlowNodeHelpModal: React.FC<FlowNodeHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'ports' | 'variables' | 'lifecycle' | 'best_practices'>('nodes');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('message');

  const nodeSpecs = [
    {
      id: 'message',
      name: 'Send Message',
      badge: 'Communication',
      badgeColor: 'primary' as const,
      icon: MessageSquare,
      colorClass: 'text-sky-600 bg-sky-50 border-sky-200',
      description: 'Sends a standard text message to the contact over the active channel (WhatsApp, Telegram, LiveChat, etc.).',
      howItWorks:
        'When execution reaches this node, the text is interpolated with current conversation variables and dispatched via the appropriate channel adapter. Supports optional exponential retry policies on network glitches.',
      ports: [
        { name: 'continue (default)', description: 'Fires immediately after message is enqueued / sent' },
        { name: 'delivered (optional)', description: 'Triggered when WhatsApp delivery status receipt (DLR) is received' },
        { name: 'failed (optional)', description: 'Triggered if the message cannot be delivered or provider rejects it' },
      ],
      variables: 'Supports {{userName}}, {{orderId}}, and all runtime context variables.',
      example: 'Hello {{contact.name}}! Thank you for contacting our support desk.',
    },
    {
      id: 'template',
      name: 'WhatsApp Approved Template (Meta HSM)',
      badge: 'Meta Certified',
      badgeColor: 'success' as const,
      icon: FileText,
      colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'Dispatches an official Meta-approved WhatsApp Business message template with media headers, dynamic parameters, and interactive buttons.',
      howItWorks:
        'Required when initiating conversations outside the WhatsApp 24-hour service window. The engine automatically decomposes header components (Text/Image/Video/Document), maps parameters, and binds quick-reply buttons to branch handles.',
      ports: [
        { name: 'continue (default)', description: 'Sequential continuation after template dispatch' },
        { name: 'delivered', description: 'Async handle invoked when Meta confirms delivery to recipient handset' },
        { name: 'failed', description: 'Async handle invoked if template fails (e.g. invalid phone number, rate limit)' },
        { name: 'btn_0, btn_1, ...', description: 'Interactive button tap ports corresponding to Quick-Reply template buttons' },
      ],
      variables: 'Decomposes {{1}}, {{2}} or named variables ({{orderNumber}}, {{discountCode}}).',
      example: 'Your appointment is confirmed for {{1}}. Tap below to reschedule.',
    },
    {
      id: 'wait',
      name: 'Wait / Delay Queue (BullMQ)',
      badge: 'Queue Timers',
      badgeColor: 'warning' as const,
      icon: Clock,
      colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
      description: 'Schedules an asynchronous time delay in execution using Redis-backed BullMQ delayed jobs.',
      howItWorks:
        'Freezes flow state and enqueues a delayed task in Redis for seconds, minutes, hours, or days. Safe against server restarts and pod redeployments. Once time expires, execution resumes at the connected node.',
      ports: [
        { name: 'continue (default)', description: 'Triggered automatically after the configured delay duration expires' },
      ],
      variables: 'Preserves all session variables across the sleep duration.',
      example: 'Wait 2 Hours after ticket resolution -> Trigger CSAT Feedback Survey.',
    },
    {
      id: 'input',
      name: 'User Input Collector',
      badge: 'Interaction',
      badgeColor: 'purple' as const,
      icon: HelpCircle,
      colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
      description: 'Prompts the customer with a question, pauses execution, and captures their next reply into a context variable.',
      howItWorks:
        'Sends the prompt to the customer and transitions the flow run to "waiting_for_input" status. When the contact sends their next inbound message, the text is extracted, sanitized, stored under the configured Variable Name (saveAs), and execution continues.',
      ports: [
        { name: 'continue (default)', description: 'Fires as soon as customer provides a reply' },
      ],
      variables: 'Saves answer to custom key: e.g. "emailAddress", "orderId", "feedbackRating".',
      example: 'Prompt: "What is your registered email address?" -> Save to variable {{customerEmail}}.',
    },
    {
      id: 'condition',
      name: 'Condition Branching',
      badge: 'Logic Engine',
      badgeColor: 'warning' as const,
      icon: GitBranch,
      colorClass: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Evaluates context variables against multiple equality rules to steer conversation paths.',
      howItWorks:
        'Inspects a chosen context variable (e.g. user intent, country, customer tier, or button choice). Checks branch conditions from top to bottom. If a match is found, takes that branch handle. If no rules match, takes the "default" fallback branch.',
      ports: [
        { name: 'branch_0, branch_1, ...', description: 'Handles corresponding to each matching value condition' },
        { name: 'default', description: 'Fallback path taken if no branch condition matches' },
      ],
      variables: 'Inspects any variable: {{userTier}} === "VIP", {{selectedOption}} === "Pricing".',
      example: 'If {{selectedOption}} == "1" -> Sales Flow; If == "2" -> Support Flow; Default -> Agent.',
    },
    {
      id: 'ai_agent',
      name: 'AI Agent (RAG Knowledge Base)',
      badge: 'AI & Vectors',
      badgeColor: 'purple' as const,
      icon: Brain,
      colorClass: 'text-violet-600 bg-violet-50 border-violet-200',
      description: 'Generates intelligent conversational responses by querying your Knowledge Base vector embeddings.',
      howItWorks:
        'Embeds the customer query, retrieves top relevant text chunks from PostgreSQL pgvector / ChromaDB, feeds chunks + system persona prompt into Claude / OpenAI, and streams the answer back. Features confidence threshold monitoring.',
      ports: [
        { name: 'continue (default)', description: 'High confidence AI response successfully generated and sent' },
        { name: 'fallback', description: 'Triggered when similarity score is below threshold or query is out of scope' },
      ],
      variables: 'Stores AI output in {{ai_response}} and extracts relevant citations.',
      example: 'Answer refund queries using Knowledge Base; if confidence < 0.25, route to Human Handoff.',
    },
    {
      id: 'intent_router',
      name: 'Intent Router (NLU Classifier)',
      badge: 'Natural Language',
      badgeColor: 'secondary' as const,
      icon: Split,
      colorClass: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200',
      description: 'Performs zero-shot NLU intent classification and sentiment analysis on incoming customer messages.',
      howItWorks:
        'Uses an AI classifier to analyze message semantics and categorize into configured intent labels (e.g. "billing", "technical_issue", "order_status", "speak_to_agent"). Routes immediately to matching intent handles.',
      ports: [
        { name: 'intent_0, intent_1, ...', description: 'Port handles for each configured intent category' },
        { name: 'default', description: 'Fallback path taken if intent is unclassified or ambiguous' },
      ],
      variables: 'Saves classification to {{detected_intent}} and {{detected_sentiment}} (positive/neutral/negative).',
      example: '"I want to cancel my subscription" -> Routes to Retention / Billing intent branch.',
    },
    {
      id: 'action',
      name: 'Webhook & API Action',
      badge: 'Integration',
      badgeColor: 'secondary' as const,
      icon: Globe,
      colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description: 'Executes an outbound HTTP Webhook (POST/GET/PUT) to external CRM, ERP, Shopify, or custom backends.',
      howItWorks:
        'Sends a real-time JSON payload containing conversation details, contact metadata, and collected flow variables to an external REST endpoint. Can receive response JSON and merge keys back into flow context.',
      ports: [
        { name: 'continue (default)', description: 'HTTP 2xx Success response received' },
        { name: 'failed (optional)', description: 'HTTP 4xx/5xx or timeout error occurred' },
      ],
      variables: 'All context variables are serialized and sent in JSON payload.',
      example: 'POST to https://api.crm.com/leads with { name: {{userName}}, phone: {{contact.phone}} }.',
    },
    {
      id: 'handoff',
      name: 'Human Agent Handoff',
      badge: 'Escalation',
      badgeColor: 'danger' as const,
      icon: UserCheck,
      colorClass: 'text-rose-600 bg-rose-50 border-rose-200',
      description: 'Pauses automated bot flows and transfers the conversation to a human support agent.',
      howItWorks:
        'Transitions the flow run to "handed_off" status, flags the conversation in the Omni Inbox, emits WebSocket alerts to online agents, and pauses automated triggers so human messages take precedence without bot interruption.',
      ports: [
        { name: 'None (Terminal)', description: 'Hands off control to human agent in Omni Inbox' },
      ],
      variables: 'Summarizes all collected variables and attaches them as an internal agent note.',
      example: 'When customer asks "I want to speak with a human", hand off with VIP tag.',
    },
    {
      id: 'end',
      name: 'End Flow',
      badge: 'Terminal',
      badgeColor: 'outline' as const,
      icon: StopCircle,
      colorClass: 'text-gray-600 bg-gray-50 border-gray-200',
      description: 'Terminates flow execution cleanly, marking the run as completed.',
      howItWorks:
        'Releases active flow run locks on the conversation and records final execution metrics. If the customer messages again in the future, the flow can restart from the entry point or route to new triggers.',
      ports: [
        { name: 'None (Terminal)', description: 'Marks flow run as completed' },
      ],
      variables: 'Persists final context variables in the execution audit log.',
      example: 'Send farewell thank-you note and cleanly terminate flow.',
    },
  ];

  const selectedNode = nodeSpecs.find((n) => n.id === selectedNodeType) || nodeSpecs[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flow Builder Working System & Architecture Guide"
      description="Learn how flow nodes, connection handles, dynamic variables, BullMQ delayed timers, and AI agents work together."
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'nodes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 10 Node Types Guide
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" /> Multi-Port Routing
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'variables'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Variables & Expressions
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'lifecycle'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Timer className="w-3.5 h-3.5" /> BullMQ & Timers
          </button>
          <button
            onClick={() => setActiveTab('best_practices')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'best_practices'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Best Practices
          </button>
        </div>

        {/* ================= TAB 1: 10 NODE TYPES GUIDE ================= */}
        {activeTab === 'nodes' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[420px]">
            {/* Left Column: Node Selector List */}
            <div className="md:col-span-4 space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1 mb-1">
                Select Node Type
              </span>
              {nodeSpecs.map((spec) => {
                const Icon = spec.icon;
                const isSelected = selectedNodeType === spec.id;
                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedNodeType(spec.id)}
                    className={`w-full text-left p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                        : 'border-gray-200/80 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${spec.colorClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{spec.name}</span>
                    </div>
                    <Badge variant={spec.badgeColor} size="sm">
                      {spec.badge}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Node Details & Working System */}
            <div className="md:col-span-8 p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4 max-h-[440px] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${selectedNode.colorClass}`}>
                    <selectedNode.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedNode.name}</h3>
                    <span className="text-[11px] text-gray-500 font-mono">type: "{selectedNode.id}"</span>
                  </div>
                </div>
                <Badge variant={selectedNode.badgeColor} size="sm">
                  {selectedNode.badge}
                </Badge>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-800">What It Does:</span>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedNode.description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" /> Internal Working System:
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">{selectedNode.howItWorks}</p>
              </div>

              {/* Output Connection Ports */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-800 block">Connection Handle Ports:</span>
                <div className="space-y-1.5">
                  {selectedNode.ports.map((port, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-gray-50/80 border border-gray-200/80 flex items-start gap-2 text-xs"
                    >
                      <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                        {port.name}
                      </span>
                      <span className="text-gray-600">{port.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Context Variables & Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Variable Support
                  </span>
                  <p className="text-xs text-gray-600">{selectedNode.variables}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Typical Example
                  </span>
                  <p className="text-xs font-mono text-gray-700 bg-gray-50 p-1.5 rounded-lg border border-gray-200 break-words">
                    {selectedNode.example}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MULTI-PORT ROUTING ================= */}
        {activeTab === 'ports' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto p-1">
            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-indigo-600" /> Multi-Port Routing Architecture
              </span>
              <p className="text-indigo-800 leading-relaxed">
                Nodes feature dedicated output handle ports on their right or bottom edges. Connecting an edge from a specific port dictates which pathway the flow engine executes when that event occurs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                  <h4 className="text-xs font-bold text-gray-900">continue (Default Sequence)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  The primary sequential branch. Once the current node finishes execution (e.g. text sent, input captured, timer elapsed), flow immediately advances to this connected node.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <h4 className="text-xs font-bold text-gray-900">delivered (Delivery Receipt)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Asynchronous WhatsApp status port. Triggered when Meta sends an incoming DLR webhook confirming the customer handset received the message.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                  <h4 className="text-xs font-bold text-gray-900">failed (Error & Rejection)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Triggered if WhatsApp rejects the template (e.g. expired 24h window), webhook returns 500 error, or max retries are exceeded. Wire this to fallback notifications.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                  <h4 className="text-xs font-bold text-gray-900">btn_0, btn_1, ... (Interactive Buttons)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Generated for Meta Quick-Reply buttons. Each button creates its own independent output handle so you can route customers based on exactly which button they tapped.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-100" />
                  <h4 className="text-xs font-bold text-gray-900">fallback (AI Low Confidence)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  AI Agent (RAG) port. When vector search similarity or model confidence falls below the Fallback Threshold (e.g. 0.20), execution diverts here to Human Handoff.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-fuchsia-500 ring-4 ring-fuchsia-100" />
                  <h4 className="text-xs font-bold text-gray-900">intent_0, intent_1, ... (NLU Routes)</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Emitted by Intent Router. Automatically routes based on AI classification categories such as Support, Sales, Billing, Feedback, or Cancellation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: VARIABLES & EXPRESSIONS ================= */}
        {activeTab === 'variables' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto p-1">
            <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs text-purple-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-purple-600" /> Dynamic Variable Interpolation
              </span>
              <p className="text-purple-800 leading-relaxed">
                You can personalize any message text, WhatsApp template parameter, prompt, or webhook payload using the double curly brace syntax: <code className="bg-purple-100 px-1 py-0.5 rounded font-mono font-bold">{'{{variableName}}'}</code>.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Standard Built-In System Variables
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono">
                  <strong className="text-indigo-600">{'{{contact.name}}'}</strong>
                  <p className="text-gray-500 font-sans mt-0.5 text-[11px]">The customer's full name or WhatsApp display profile name.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono">
                  <strong className="text-indigo-600">{'{{contact.phone}}'}</strong>
                  <p className="text-gray-500 font-sans mt-0.5 text-[11px]">E.164 formatted international phone number (e.g. +14155552671).</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono">
                  <strong className="text-indigo-600">{'{{last_message}}'}</strong>
                  <p className="text-gray-500 font-sans mt-0.5 text-[11px]">The exact text content of the contact's most recent incoming message.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono">
                  <strong className="text-indigo-600">{'{{channel.type}}'}</strong>
                  <p className="text-gray-500 font-sans mt-0.5 text-[11px]">Active channel identifier: "whatsapp", "telegram", "livechat".</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono">
                  <strong className="text-indigo-600">{'{{detected_intent}}'}</strong>
                  <p className="text-gray-500 font-sans mt-0.5 text-[11px]">The semantic category classified by the Intent Router.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono">
                  <strong className="text-indigo-600">{'{{ai_response}}'}</strong>
                  <p className="text-gray-500 font-sans mt-0.5 text-[11px]">The synthesized answer generated by the AI RAG Agent.</p>
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider pt-2">
                Custom User Input Variables
              </h4>
              <p className="text-xs text-gray-600">
                Any variable captured via a <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">User Input</code> node (e.g. <code className="font-mono text-purple-700">saveAs: "companyName"</code>) becomes immediately available in downstream nodes as <code className="font-mono text-purple-700">{'{{companyName}}'}</code>.
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 4: BULLMQ & TIMERS ================= */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto p-1">
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-600" /> BullMQ Redis Delayed Execution Engine
              </span>
              <p className="text-amber-800 leading-relaxed">
                When a flow hits a <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Wait</code> node, execution does not block system threads. Instead, it serializes conversation state and enqueues a delayed job in Redis.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">State Snapshot Serialization</h4>
                  <p className="text-gray-600 mt-0.5">
                    All conversation context variables, contact identifiers, and the destination node pointer are serialized into a JSON state snapshot.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Redis Timer Scheduling</h4>
                  <p className="text-gray-600 mt-0.5">
                    BullMQ creates a delayed job in Redis with timestamp <code className="font-mono">now() + delaySeconds</code>. The conversation remains open and responsive to human inbox takeovers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Worker Pickup & Auto-Resumption</h4>
                  <p className="text-gray-600 mt-0.5">
                    When the delay expires, a background BullMQ worker pulls the job, verifies the conversation hasn't been handed off to an agent, and automatically executes the next connected step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: BEST PRACTICES ================= */}
        {activeTab === 'best_practices' && (
          <div className="space-y-3 max-h-[440px] overflow-y-auto p-1 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Always Provide a Default / Fallback Branch
              </div>
              <p className="text-gray-600 leading-relaxed">
                When using Condition or Intent Router nodes, ensure the <code className="font-mono text-indigo-700">default</code> handle is connected. This prevents customer conversations from stalling when an unexpected input is received.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Use WhatsApp Templates for Re-engagement
              </div>
              <p className="text-gray-600 leading-relaxed">
                If scheduling delayed follow-ups longer than 24 hours, use an approved WhatsApp Template node rather than standard text messages to comply with Meta's official 24-hour customer care policy.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-1">
              <div className="flex items-center gap-1.5 text-violet-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-violet-600" /> Wire AI Fallback to Human Handoff
              </div>
              <p className="text-gray-600 leading-relaxed">
                Connect the <code className="font-mono text-violet-700">fallback</code> port of AI Agent nodes to a Human Handoff node. If the AI doesn't know the answer with high confidence, customers are seamlessly transferred to a human agent without frustrating hallucinations.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-gray-200 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Set Entry Point Before Publishing
              </div>
              <p className="text-gray-600 leading-relaxed">
                Every flow requires exactly one Entry node (marked with the green Flag icon). Click any node and toggle "Flow Entry Point" in its settings to choose where conversations begin.
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Omnichannel Flow Engine v2.4 Reference</span>
          </div>

          <Button variant="primary" size="sm" onClick={onClose}>
            Got It, Back to Canvas
          </Button>
        </div>
      </div>
    </Modal>
  );
};
