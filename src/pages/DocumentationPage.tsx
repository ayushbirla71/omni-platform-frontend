import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Radio,
  Workflow,
  Brain,
  MessageSquare,
  Megaphone,
  KanbanSquare,
  Package,
  ShoppingBag,
  CreditCard,
  Shield,
  Key,
  Webhook,
  LifeBuoy,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  Bot,
  Users,
  Send,
  Sliders,
  Database,
  Lock,
  Code,
  AlertTriangle,
  FileText,
  Clock,
  CheckCheck,
  BarChart3,
  Smartphone,
  Server,
  Globe,
  RefreshCw,
  Terminal,
  FileCode,
  Download,
  Printer,
  Compass,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { cn } from '../lib/utils';

// Documentation Chapter Definition
interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: any;
  summary: string;
  badge?: string;
  keywords: string[];
}

export const DocumentationPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSectionId, setActiveSectionId] = useState<string>('getting-started');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Interactive Checklist State
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({
    'step-1': true,
    'step-2': false,
    'step-3': false,
    'step-4': false,
    'step-5': false,
  });

  // Interactive FAQ Accordion State
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': false,
    'faq-3': false,
    'faq-4': false,
    'faq-5': false,
    'faq-6': false,
    'faq-7': false,
  });

  // Code Tab Language State
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'javascript' | 'python' | 'php'>('curl');

  // Interactive WhatsApp Template Simulator State
  const [simCustomerName, setSimCustomerName] = useState('Alex Morgan');
  const [simOrderNumber, setSimOrderNumber] = useState('ORD-9824');
  const [simTrackingUrl, setSimTrackingUrl] = useState('https://track.omniplatform.io/9824');

  const categories = [
    { id: 'all', name: 'All Guides', icon: Compass },
    { id: 'start', name: 'Quickstart & Architecture', icon: Zap },
    { id: 'channels', name: 'Channels & WhatsApp', icon: Radio },
    { id: 'inbox', name: 'Team Inbox & Routing', icon: MessageSquare },
    { id: 'ai', name: 'AI Copilot & RAG', icon: Brain },
    { id: 'flows', name: 'Visual Flow Builder', icon: Workflow },
    { id: 'campaigns', name: 'Campaigns & Broadcasts', icon: Megaphone },
    { id: 'crm', name: 'CRM, Deals & Catalog', icon: KanbanSquare },
    { id: 'billing', name: 'Billing & Quotas', icon: CreditCard },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'api', name: 'APIs & Webhooks', icon: Code },
    { id: 'faq', name: 'FAQ & Troubleshooting', icon: HelpCircle },
  ];

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: '1. Getting Started & Architecture',
      category: 'start',
      icon: Zap,
      summary: 'Platform overview, end-to-end data flow, workspace roles, and the 5-minute launch checklist.',
      badge: 'Essential',
      keywords: ['onboarding', 'checklist', 'roles', 'rbac', 'architecture', 'overview', 'admin', 'agent'],
    },
    {
      id: 'channels-setup',
      title: '2. Channels & Messaging Gateways',
      category: 'channels',
      icon: Radio,
      summary: '1-Click Meta WhatsApp Embedded Signup, Manual WhatsApp Cloud API, Telegram Bots, Messenger, and Webchat.',
      badge: 'Meta Certified',
      keywords: ['whatsapp', 'embedded signup', 'facebook login for business', '1-click', 'meta', 'cloud api', 'telegram', 'messenger', 'instagram', 'webchat', 'waba', 'webhook', 'tier'],
    },
    {
      id: 'team-inbox',
      title: '3. Omnichannel Team Inbox & Routing',
      category: 'inbox',
      icon: MessageSquare,
      summary: 'Real-time WebSocket conversations, status lifecycles, agent assignment, canned responses, and zero-leak staff notes.',
      badge: 'Real-Time',
      keywords: ['inbox', 'conversations', 'assignment', 'routing', 'canned responses', 'private notes', 'internal notes', 'tickets'],
    },
    {
      id: 'ai-copilot',
      title: '4. AI Copilot, RAG & Knowledge Bases',
      category: 'ai',
      icon: Brain,
      summary: 'Hybrid LLM intelligence (Claude 3.5 Sonnet, GPT-4o), vector embeddings, document chunking, and AI Auto-Pilot.',
      badge: 'AI Powered',
      keywords: ['ai', 'copilot', 'rag', 'vector', 'knowledge base', 'claude', 'embeddings', 'pdf', 'chunking', 'auto-responder'],
    },
    {
      id: 'flow-builder',
      title: '5. Visual Flow Builder & Automation',
      category: 'flows',
      icon: Workflow,
      summary: 'Interactive ReactFlow canvas, trigger nodes, conditions, RAG queries, external REST API calls, and pre-built templates.',
      badge: 'No-Code',
      keywords: ['flow builder', 'automation', 'canvas', 'nodes', 'triggers', 'bot', 'drag and drop', 'templates', 'webhooks'],
    },
    {
      id: 'broadcast-campaigns',
      title: '6. Campaigns & WhatsApp Templates',
      category: 'campaigns',
      icon: Megaphone,
      summary: 'Meta HSM template creation, audience segmentation by tags, throttled broadcast scheduling, and read analytics.',
      badge: 'Broadcast',
      keywords: ['campaigns', 'broadcast', 'hsm', 'templates', 'segmentation', 'tags', 'meta approval', 'analytics'],
    },
    {
      id: 'crm-deals-orders',
      title: '7. Deals CRM, Catalog & Orders',
      category: 'crm',
      icon: KanbanSquare,
      summary: 'Kanban sales pipeline, 360° contact profiles, product SKU catalogs, inventory tracking, and payment links.',
      badge: 'E-Commerce',
      keywords: ['crm', 'deals', 'pipeline', 'contacts', 'products', 'orders', 'catalog', 'payments'],
    },
    {
      id: 'billing-plans',
      title: '8. Billing, Plans & Resource Quotas',
      category: 'billing',
      icon: CreditCard,
      summary: 'Plan tiers (Free Sandbox, Starter, Pro, Enterprise), Stripe & Razorpay checkouts, annual discounts, and invoice ledger.',
      badge: 'Multi-Gateway',
      keywords: ['billing', 'plans', 'stripe', 'razorpay', 'sandbox', 'invoices', 'quotas', 'upgrade', 'subscription'],
    },
    {
      id: 'privacy-security',
      title: '9. Data Privacy & Zero-PII Shield',
      category: 'privacy',
      icon: Shield,
      summary: 'Zero-PII guarantee, strict tenant isolation, GDPR/CCPA data erasure compliance, and staff privacy boundaries.',
      badge: 'GDPR / CCPA',
      keywords: ['privacy', 'zero-pii', 'gdpr', 'ccpa', 'security', 'data deletion', 'isolation', 'compliance'],
    },
    {
      id: 'api-webhooks',
      title: '10. Developer APIs & Webhooks',
      category: 'api',
      icon: Code,
      summary: 'REST API endpoints, Bearer token authentication, HMAC-SHA256 signature verification, and interactive code samples.',
      badge: 'REST & JSON',
      keywords: ['api', 'webhooks', 'developer', 'curl', 'nodejs', 'python', 'php', 'sdk', 'endpoints'],
    },
    {
      id: 'faq-troubleshooting',
      title: '11. FAQ & Troubleshooting Guide',
      category: 'faq',
      icon: HelpCircle,
      summary: 'Frequently asked questions, common Meta webhook errors, token expiration fixes, and support ticket submission.',
      badge: 'Solutions',
      keywords: ['faq', 'troubleshooting', 'errors', 'support', 'help', 'meta tokens', 'whatsapp error', 'tickets'],
    },
  ];

  // Filtered sections based on category and search query
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    showToast('Code snippet copied to clipboard', 'info');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const toggleChecklistStep = (key: string) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleFaq = (key: string) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedStepsCount = Object.values(checkedSteps).filter(Boolean).length;
  const checklistPercentage = Math.round((completedStepsCount / 5) * 100);

  // Scroll to section handler
  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn("space-y-8 pb-16 max-w-7xl mx-auto", !isAuthenticated && "px-4 sm:px-6 pt-6")}>
      {/* Unauthenticated Top Navigation Bar */}
      {!isAuthenticated && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs mb-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Ω
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Omni Platform</h2>
              <p className="text-[10px] text-gray-500">Official Documentation & User Manual</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" className="text-xs">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 sm:p-10 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-300 text-xs font-semibold backdrop-blur-md">
            <BookOpen className="w-3.5 h-3.5 text-primary-400" />
            <span>Complete Platform User Manual & Flow Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Omni Platform Documentation & Feature Manual
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Everything you need to master customer messaging: connect official Meta WhatsApp Cloud API channels,
            train AI Copilot with your documents, construct visual automation flows, broadcast campaigns, and scale your sales pipeline.
          </p>

          {/* Real-time Search Box */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search features, WhatsApp setup, Flow builder, APIs, Webhooks, RAG..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="primary"
                onClick={() => window.print()}
                icon={<Printer className="w-4 h-4" />}
                className="bg-primary-600 hover:bg-primary-500 text-xs font-semibold py-3.5 px-4 rounded-2xl shadow-lg"
              >
                Print / PDF
              </Button>
              {isAuthenticated && (
                <Link to="/support">
                  <Button
                    variant="outline"
                    icon={<LifeBuoy className="w-4 h-4" />}
                    className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold py-3.5 px-4 rounded-2xl"
                  >
                    Get Support
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Version 3.4.0 (Enterprise)
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Globe className="w-3.5 h-3.5 text-primary-400" />
              Official Meta Tech Provider API
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Zero-PII GDPR Shield Active
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200/80">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0',
                isSelected
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/70'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout Grid: Sidebar Navigation + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Table of Contents (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
          <Card className="p-4 bg-white border border-gray-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary-600" />
                Table of Contents
              </span>
              <Badge variant="secondary" size="sm" className="text-[10px]">
                {filteredSections.length} Chapters
              </Badge>
            </div>

            <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all group',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200 shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600')} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    {sec.badge && (
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0', isActive ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-600')}>
                        {sec.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Quick Help Card */}
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-primary-50 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Need Live Assistance?</h4>
                <p className="text-[11px] text-gray-500">Our engineering team is ready 24/7</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you have a customized integration, custom CRM connector, or enterprise SLA need, open a support ticket.
            </p>
            <Link to="/support" className="block">
              <Button variant="primary" size="sm" className="w-full text-xs font-semibold">
                Open Support Ticket
              </Button>
            </Link>
          </Card>
        </div>

        {/* Right Content Stream (Col 8) */}
        <div className="lg:col-span-8 space-y-12">
          {/* ========================================================================= */}
          {/* CHAPTER 1: GETTING STARTED & ARCHITECTURE */}
          {/* ========================================================================= */}
          <section id="getting-started" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 1: Getting Started & System Architecture</h2>
                <p className="text-xs text-gray-500">Understanding how messages flow from channels to your team and AI automations.</p>
              </div>
            </div>

            {/* Architecture Flow Card */}
            <Card className="p-6 bg-slate-900 text-white border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">End-to-End System Flow</span>
                </div>
                <Badge variant="purple" size="sm" className="bg-purple-900/60 text-purple-300">
                  Real-Time Event Engine
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs pt-2">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Radio className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-slate-200">1. Inbound Ingestion</p>
                  <p className="text-[11px] text-slate-400">WhatsApp Cloud API / Telegram / Webchat Webhook</p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center mx-auto">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-slate-200">2. Flow Engine</p>
                  <p className="text-[11px] text-slate-400">Trigger matching, keyword intent, or RAG AI query</p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-slate-200">3. Team Inbox</p>
                  <p className="text-[11px] text-slate-400">Live agent socket, AI Copilot assist, staff notes</p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <KanbanSquare className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-slate-200">4. CRM & Sales</p>
                  <p className="text-[11px] text-slate-400">Deals Kanban, Order generation, customer tags</p>
                </div>
              </div>
            </Card>

            {/* Interactive 5-Minute Launch Checklist */}
            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">5-Minute Workspace Launch Checklist</h3>
                  <p className="text-xs text-gray-500">Track your workspace setup progress step-by-step.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-primary-600">{checklistPercentage}% Ready</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${checklistPercentage}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  { id: 'step-1', title: '1. Configure Workspace Profile & Timezone', link: '/settings?tab=profile', desc: 'Set your business name, currency, and primary contact email.' },
                  { id: 'step-2', title: '2. Connect Your Official WhatsApp Channel (1-Click Embedded Signup or Manual)', link: '/channels', desc: 'Use 1-Click Facebook Login for Business popup or enter Meta Cloud API credentials.' },
                  { id: 'step-3', title: '3. Upload Company FAQs to AI Knowledge Base', link: '/knowledge-bases', desc: 'Upload PDF product catalogs, return policies, or pricing tables.' },
                  { id: 'step-4', title: '4. Build or Activate a Customer Welcome Flow', link: '/flows', desc: 'Choose a pre-built template to automate after-hours replies & lead capture.' },
                  { id: 'step-5', title: '5. Invite Support Agents & Assign RBAC Roles', link: '/settings?tab=team', desc: 'Add team members with Agent, Admin, or Viewer access.' },
                ].map((step) => (
                  <div
                    key={step.id}
                    onClick={() => toggleChecklistStep(step.id)}
                    className={cn(
                      'p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors',
                      checkedSteps[step.id] ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/70'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors', checkedSteps[step.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white')}>
                        {checkedSteps[step.id] && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className={cn('text-xs font-semibold', checkedSteps[step.id] ? 'text-emerald-900 line-through' : 'text-gray-900')}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                    {isAuthenticated && (
                      <Link to={step.link} onClick={(e) => e.stopPropagation()} className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 font-semibold shrink-0">
                        Go <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Roles and Permissions Matrix */}
            <Card className="p-6 bg-white border border-gray-200 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Workspace RBAC Permission Roles</h3>
              <p className="text-xs text-gray-500">Every team member has scoped capabilities within their tenant boundary:</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 font-bold">
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Inbox & Chat</th>
                      <th className="p-2.5">Flow Builder</th>
                      <th className="p-2.5">Campaigns</th>
                      <th className="p-2.5">Billing & Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    <tr>
                      <td className="p-2.5 font-bold text-purple-700 flex items-center gap-1">
                        <Badge variant="purple" size="sm">Owner</Badge>
                      </td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Owner Authority</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-primary-700">
                        <Badge variant="primary" size="sm">Admin</Badge>
                      </td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Full Access</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Create & Edit</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Create & Broadcast</td>
                      <td className="p-2.5 text-amber-600">View Invoices / Manage Team</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-700">
                        <Badge variant="success" size="sm">Agent</Badge>
                      </td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Assign & Reply</td>
                      <td className="p-2.5 text-gray-400">Read Only</td>
                      <td className="p-2.5 text-gray-400">Read Only</td>
                      <td className="p-2.5 text-rose-500">Restricted</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-gray-600">
                        <Badge variant="secondary" size="sm">Viewer</Badge>
                      </td>
                      <td className="p-2.5 text-gray-500">Read Only</td>
                      <td className="p-2.5 text-gray-400">Read Only</td>
                      <td className="p-2.5 text-gray-400">Read Only</td>
                      <td className="p-2.5 text-rose-500">Restricted</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 2: CHANNELS & WHATSAPP SETUP */}
          {/* ========================================================================= */}
          <section id="channels-setup" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 2: Channels & Messaging Gateways</h2>
                <p className="text-xs text-gray-500">Connect Meta WhatsApp (1-Click Embedded Signup or Manual Cloud API), Telegram bots, Messenger, and live chat widgets.</p>
              </div>
            </div>

            {/* 1-Click Meta WhatsApp Embedded Signup Feature Box */}
            <Card className="p-6 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border border-emerald-200/80 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">1-Click Meta WhatsApp Embedded Signup (Recommended)</h3>
                      <Badge variant="success" size="sm" className="bg-emerald-600 text-white font-semibold text-[10px]">
                        Zero Manual API Setup
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      The official, fastest onboarding flow powered by Meta’s Facebook Login for Business &amp; WhatsApp Onboarding API.
                    </p>
                  </div>
                </div>
                {isAuthenticated && (
                  <Link to="/channels" className="shrink-0">
                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                      Launch Onboarding &rarr;
                    </Button>
                  </Link>
                )}
              </div>

              {/* Step-by-Step Embedded Signup Walkthrough */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <p className="font-bold text-gray-900">Click &amp; Authenticate</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    On the Channels page, click <strong>"Connect with Facebook / WhatsApp Embedded Signup"</strong>. A secure Meta popup window appears.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <p className="font-bold text-gray-900">Select WABA &amp; Phone</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Select your Meta Business Account (or create one instantly) and choose or register your verified business phone number via SMS OTP.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <p className="font-bold text-gray-900">Automatic Channel Provisioning</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Omni Platform’s backend auto-exchanges the OAuth code for a permanent token, inspects the WABA ID &amp; Phone Number ID, registers the webhook, and activates the channel in seconds!
                  </p>
                </div>
              </div>

              {/* Technical Under-the-Hood Process */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-2.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 font-sans font-semibold text-xs border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    How Embedded Signup Works Behind the Scenes
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Meta Graph API v20.0</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><span className="text-emerald-400 font-bold">1. Frontend:</span> Meta JavaScript SDK dispatches <code>sessionInfoListener</code> containing <code>waba_id</code> and <code>phone_number_id</code> via secure HTML5 <code>postMessage</code>.</p>
                  <p><span className="text-primary-400 font-bold">2. Token Exchange:</span> Backend calls <code>GET /oauth/access_token</code> with <code>client_id</code>, <code>client_secret</code>, and the OAuth code.</p>
                  <p><span className="text-indigo-400 font-bold">3. Auto-Discovery:</span> Backend queries Meta <code>debug_token</code> to verify <code>granular_scopes</code> and retrieve verified business name.</p>
                  <p><span className="text-teal-400 font-bold">4. Cloud Registration:</span> Backend executes <code>POST /&#123;phone_number_id&#125;/register</code> with encryption PIN to activate the number immediately.</p>
                </div>
              </div>
            </Card>

            {/* Manual Meta Developers Setup & Comparison */}
            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Alternative: Manual Meta Developers App Configuration</h3>
                    <p className="text-[11px] text-gray-500">For enterprise engineering teams bringing pre-existing standalone Meta Apps.</p>
                  </div>
                </div>
                <Badge variant="purple" size="sm">Advanced</Badge>
              </div>

              <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100">
                  <p className="font-bold text-gray-900">Step 1: Create a Meta Developer App</p>
                  <p>Visit <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">developers.facebook.com</a>, create a "Business" type app, and add the "WhatsApp" product.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100">
                  <p className="font-bold text-gray-900">Step 2: Retrieve Credentials</p>
                  <p>Navigate to <strong>WhatsApp &gt; API Setup</strong> and copy your <code>Phone Number ID</code>, <code>WhatsApp Business Account ID (WABA ID)</code>, and generate a <strong>System User Permanent Access Token</strong> with <code>whatsapp_business_messaging</code> permissions.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100">
                  <p className="font-bold text-gray-900">Step 3: Configure Omni Platform Webhook in Meta</p>
                  <p>In your Meta App Dashboard under WhatsApp &gt; Configuration, configure:</p>
                  <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] flex items-center justify-between mt-1">
                    <span>Callback URL: https://api.yourdomain.com/api/channels/whatsapp/webhook</span>
                    <button
                      onClick={() => handleCopyCode('wa-webhook', 'https://api.yourdomain.com/api/channels/whatsapp/webhook')}
                      className="text-primary-400 hover:text-white"
                    >
                      {copiedCodeId === 'wa-webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="pt-1">Subscribe to <code>messages</code> and <code>message_template_status_update</code> webhook fields.</p>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-900">Comparison: 1-Click Embedded Signup vs. Manual Credentials</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">Feature &amp; Workflow</th>
                        <th className="p-2.5 text-emerald-700">1-Click Embedded Signup</th>
                        <th className="p-2.5 text-slate-700">Manual Meta App</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-600 text-[11px]">
                      <tr>
                        <td className="p-2.5 font-medium text-gray-900">Setup Time</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">&lt; 30 Seconds</td>
                        <td className="p-2.5">15 - 30 Minutes</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-gray-900">Meta Developer Portal Required</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">No (Client uses normal FB login)</td>
                        <td className="p-2.5">Yes (Developer App creation)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-gray-900">Token Refresh / Expiration</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">Automatic System User Token</td>
                        <td className="p-2.5">Requires manual System User setup</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-gray-900">Webhook Configuration</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">Pre-wired &amp; Subscribed</td>
                        <td className="p-2.5">Manual URL &amp; Verify Token paste</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* WhatsApp Quality & Tier Reference */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-900">Meta Messaging Tier Limits &amp; Warmup Schedule</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-emerald-600 block">Tier 1</span>
                    <span className="text-[11px] text-gray-500">1,000 unique recipients / 24h</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-primary-600 block">Tier 2</span>
                    <span className="text-[11px] text-gray-500">10,000 unique recipients / 24h</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-indigo-600 block">Tier 3</span>
                    <span className="text-[11px] text-gray-500">100,000 unique recipients / 24h</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-purple-600 block">Tier 4</span>
                    <span className="text-[11px] text-gray-500">Unlimited recipients / 24h</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Telegram & Webchat Widget Setup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Telegram Bot Setup</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  1. Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">@BotFather</a> on Telegram.<br />
                  2. Send <code>/newbot</code> and follow prompts.<br />
                  3. Paste the generated Bot Token into Omni Platform Channels page.
                </p>
              </Card>

              <Card className="p-5 bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">Live Webchat Widget</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Embed live chat directly into your website header or footer by pasting our lightweight 1-line script tag with WebSocket support.
                </p>
              </Card>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 3: TEAM INBOX & ROUTING */}
          {/* ========================================================================= */}
          <section id="team-inbox" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 3: Omnichannel Team Inbox & Routing</h2>
                <p className="text-xs text-gray-500">Collaborative live chat, ticket statuses, agent skills routing, and private staff notes.</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Conversation Lifecycles & State Transitions</h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <Badge variant="warning" size="sm">Unassigned</Badge>
                  <p className="text-[11px] text-gray-600">New customer message waiting for automated flow resolution or human agent pickup.</p>
                </div>

                <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl space-y-1">
                  <Badge variant="primary" size="sm">Open</Badge>
                  <p className="text-[11px] text-gray-600">Assigned to an active agent currently in live dialogue with the customer.</p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <Badge variant="purple" size="sm">Pending</Badge>
                  <p className="text-[11px] text-gray-600">Waiting for customer reply or payment confirmation before next action.</p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <Badge variant="success" size="sm">Resolved</Badge>
                  <p className="text-[11px] text-gray-600">Issue successfully resolved. Archived until customer sends another message.</p>
                </div>
              </div>

              {/* Zero-Leak Internal Staff Notes Guarantee */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Zero-Leak Internal Staff Notes</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Agents can post internal yellow notes (<code>isInternalNote: true</code>) inside any conversation thread to collaborate with teammates, supervisors, or billing specialists.
                  These notes are <strong>strictly filtered by the backend WebSocket gateway</strong> and will NEVER be transmitted to customer mobile devices or external webhooks.
                </p>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 4: AI COPILOT & RAG */}
          {/* ========================================================================= */}
          <section id="ai-copilot" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 4: AI Copilot, RAG & Knowledge Bases</h2>
                <p className="text-xs text-gray-500">Train intelligent chatbots using your company documents with vector embeddings and grounding.</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">How Retrieval-Augmented Generation (RAG) Works</h3>
                  <p className="text-xs text-gray-500">Prevent hallucinations by anchoring responses strictly in verified company knowledge.</p>
                </div>
                <Badge variant="purple" size="sm">Hybrid LLM Engine</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <Database className="w-4 h-4 text-purple-600" />
                  <p className="font-bold text-gray-900">1. Document Chunking</p>
                  <p className="text-[11px] text-gray-600">PDFs, Word docs, and FAQs are split into semantic chunks with 1536-dim vector embeddings.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <Search className="w-4 h-4 text-primary-600" />
                  <p className="font-bold text-gray-900">2. Cosine Similarity</p>
                  <p className="text-[11px] text-gray-600">When a user asks a question, the top 3-5 most relevant passages are retrieved with cosine score &gt; 0.70.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <p className="font-bold text-gray-900">3. Grounded Synthesis</p>
                  <p className="text-[11px] text-gray-600">The LLM synthesizes an accurate, multilingual reply citing the retrieved knowledge chunks.</p>
                </div>
              </div>

              {/* AI Modes Toggle Table */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                <h4 className="text-xs font-bold text-purple-950">AI Operational Modes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-purple-200/60 shadow-xs">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-purple-600" />
                      Auto-Pilot Mode
                    </p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      AI directly responds to incoming customer inquiries 24/7. If confidence is below threshold, it escalates to a human queue.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-purple-200/60 shadow-xs">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                      Copilot (Agent Assist) Mode
                    </p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      AI quietly drafts suggested responses in the agent's composer. The agent reviews, edits, and clicks "Send" with 1 click.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 5: VISUAL FLOW BUILDER */}
          {/* ========================================================================= */}
          <section id="flow-builder" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 5: Visual Flow Builder & Automations</h2>
                <p className="text-xs text-gray-500">Construct visual conversation graphs with triggers, branching conditions, buttons, and API nodes.</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Canvas Node Types & Capabilities</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" /> Trigger Node
                  </span>
                  <p className="text-[11px] text-gray-600">Inbound message keyword match (e.g. <code>#order</code>, <code>support</code>), webhook event, or conversation start.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-primary-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary-600" /> Send Message / Buttons
                  </span>
                  <p className="text-[11px] text-gray-600">Send WhatsApp interactive quick-reply buttons, media images, catalogs, or list menus.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-purple-700 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-purple-600" /> AI RAG Query Node
                  </span>
                  <p className="text-[11px] text-gray-600">Pass customer question to your Knowledge Base and output the generated answer variable.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-indigo-600" /> External REST API Call
                  </span>
                  <p className="text-[11px] text-gray-600">Make HTTP GET/POST calls to external ERP/Shopify/CRM with dynamic JSON response mapping.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-amber-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" /> Condition Split
                  </span>
                  <p className="text-[11px] text-gray-600">Branch execution paths based on contact attributes, VIP tags, or business operating hours.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-rose-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-600" /> Assign to Agent
                  </span>
                  <p className="text-[11px] text-gray-600">Route conversation to specific department queue (Sales, Technical Support, Billing).</p>
                </div>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 6: BROADCAST CAMPAIGNS & TEMPLATES */}
          {/* ========================================================================= */}
          <section id="broadcast-campaigns" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 6: Campaigns & WhatsApp Templates</h2>
                <p className="text-xs text-gray-500">Send high-converting Meta approved HSM broadcast templates to targeted contact segments.</p>
              </div>
            </div>

            {/* Interactive WhatsApp Template Preview Simulator */}
            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Interactive WhatsApp HSM Template Simulator</h3>
                  <p className="text-xs text-gray-500">Preview dynamic parameter substitution in real-time.</p>
                </div>
                <Badge variant="success" size="sm">Meta Compliant</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Simulator Inputs */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Parameter 1: Customer Name</label>
                    <input
                      type="text"
                      value={simCustomerName}
                      onChange={(e) => setSimCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Parameter 2: Order Number</label>
                    <input
                      type="text"
                      value={simOrderNumber}
                      onChange={(e) => setSimOrderNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Parameter 3: Tracking URL</label>
                    <input
                      type="text"
                      value={simTrackingUrl}
                      onChange={(e) => setSimTrackingUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Smartphone Preview Frame */}
                <div className="max-w-[280px] mx-auto w-full bg-slate-900 p-3 rounded-[32px] shadow-2xl border-4 border-slate-700">
                  <div className="bg-[#e5ddd5] rounded-[24px] p-3 text-gray-900 min-h-[260px] flex flex-col justify-between shadow-inner relative overflow-hidden">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm space-y-2 border border-gray-200 text-xs">
                      <p className="font-bold text-primary-700 text-[11px] uppercase tracking-wider">📦 Shipping Update</p>
                      <p className="text-[11px] leading-relaxed text-gray-800">
                        Hello <strong>{simCustomerName || 'Customer'}</strong>, your order <strong>#{simOrderNumber || '1234'}</strong> has been packed and dispatched!
                      </p>
                      <p className="text-[10px] text-gray-500">Track real-time courier status below.</p>
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400">
                        <span>Omni Platform Verified</span>
                        <span>10:42 AM ✓✓</span>
                      </div>
                    </div>

                    {/* Quick Reply Button */}
                    <div className="mt-2 bg-white text-center py-2 rounded-xl text-primary-600 font-bold text-[11px] shadow-xs border border-gray-200">
                      Track Package 🚚
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 7: DEALS CRM, CATALOG & ORDERS */}
          {/* ========================================================================= */}
          <section id="crm-deals-orders" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <KanbanSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 7: Deals CRM, Catalog &amp; Orders</h2>
                <p className="text-xs text-gray-500">Kanban sales pipelines, 360° contact profiles, product SKU inventory, and order fulfillment.</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <KanbanSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Visual Kanban Sales Pipeline</h3>
                    <p className="text-[11px] text-gray-500">Track high-value leads and convert conversations into revenue.</p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">Revenue Driver</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-600" /> 1. Contact to Deal
                  </span>
                  <p className="text-[11px] text-gray-600">Turn any WhatsApp, Telegram, or Webchat conversation into an active deal with 1 click directly from the inbox drawer.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" /> 2. Stage Progression
                  </span>
                  <p className="text-[11px] text-gray-600">Drag and drop cards across pipeline stages: <em>Lead</em> &rarr; <em>Contacted</em> &rarr; <em>Proposal Sent</em> &rarr; <em>Negotiation</em> &rarr; <em>Won</em>.</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 3. Pipeline Forecasting
                  </span>
                  <p className="text-[11px] text-gray-600">Real-time aggregate stage sums, expected close dates, and probability-weighted revenue metrics.</p>
                </div>
              </div>

              {/* Product Catalog & Orders */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-primary-600" />
                    Product &amp; SKU Catalog
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-[11px]">
                    Create rich product catalogs with SKU identifiers, stock quantities, high-resolution media images, and variant prices. Share products directly inside customer live chats.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    Orders &amp; Payment Tracking
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-[11px]">
                    Generate customer orders, track fulfillment states (<em>Pending</em>, <em>Paid</em>, <em>Shipped</em>, <em>Delivered</em>), and automatically trigger WhatsApp delivery updates via Flow Builder.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 8: BILLING & QUOTAS */}
          {/* ========================================================================= */}
          <section id="billing-plans" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 8: Billing, Plans &amp; Resource Quotas</h2>
                <p className="text-xs text-gray-500">Subscription tiers, multi-gateway payments (Stripe/Razorpay), and sequential invoice receipts.</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="font-bold text-gray-900">Free Sandbox</p>
                  <p className="text-lg font-black text-gray-900">$0</p>
                  <p className="text-[11px] text-gray-500">1 Channel • 500 Contacts • 2K Msgs/mo</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="font-bold text-primary-700">Starter Growth</p>
                  <p className="text-lg font-black text-gray-900">$29<span className="text-xs font-normal text-gray-500">/mo</span></p>
                  <p className="text-[11px] text-gray-500">3 Channels • 3,000 Contacts • 25K Msgs/mo</p>
                </div>

                <div className="p-3 bg-primary-50 rounded-xl border border-primary-200 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary-800">Pro Scale</p>
                    <Badge variant="primary" size="sm" className="text-[9px]">Popular</Badge>
                  </div>
                  <p className="text-lg font-black text-primary-900">$99<span className="text-xs font-normal text-gray-500">/mo</span></p>
                  <p className="text-[11px] text-gray-600">10 Channels • 25,000 Contacts • 100K Msgs/mo</p>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                  <p className="font-bold text-purple-800">Enterprise Custom</p>
                  <p className="text-lg font-black text-purple-900">$299<span className="text-xs font-normal text-gray-500">/mo</span></p>
                  <p className="text-[11px] text-gray-600">50 Channels • 500,000 Contacts • 1M Msgs/mo</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900">Supported Payment Methods</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Stripe Checkout:</strong> Credit cards, Apple Pay, Google Pay, SEPA Direct Debit.</li>
                  <li><strong>Razorpay Payments:</strong> UPI, Netbanking, Credit/Debit cards for South Asian regions.</li>
                  <li><strong>Instant Sandbox:</strong> 1-click zero-risk simulation for testing tier upgrades immediately.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 9: ZERO-PII DATA PRIVACY SHIELD */}
          {/* ========================================================================= */}
          <section id="privacy-security" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 9: Data Privacy &amp; Zero-PII Shield</h2>
                <p className="text-xs text-gray-500">Strict GDPR/CCPA multi-tenant isolation guaranteeing zero unauthorized data access.</p>
              </div>
            </div>

            <Card className="p-6 bg-slate-900 text-white border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">The Zero-PII Data Privacy Guarantee</h3>
                </div>
                <Badge variant="success" size="sm">Audited &amp; Verified</Badge>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  Under our core architecture guidelines and strict GDPR constraints:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-200">
                  <li><strong>Zero Platform Impersonation:</strong> Platform administrators (Super Admins, DevOps, Support) can NEVER view conversation transcripts, customer message texts, or customer contact records.</li>
                  <li><strong>Row Level Tenant Isolation:</strong> Every database query enforces strict <code>tenant_id</code> isolation via JWT authentication claims.</li>
                  <li><strong>Automated Data Erasure:</strong> Fully compliant with Meta user data deletion protocols with automated callback URLs.</li>
                </ul>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 10: DEVELOPER APIS & WEBHOOKS */}
          {/* ========================================================================= */}
          <section id="api-webhooks" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 10: Developer REST APIs &amp; Webhooks</h2>
                <p className="text-xs text-gray-500">Automate your external systems using our high-performance REST APIs and real-time outbound webhooks.</p>
              </div>
            </div>

            <Card className="p-6 bg-white border border-gray-200 space-y-4">
              {/* Language Selector */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-900">Interactive API Request Snippet</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {(['curl', 'javascript', 'python', 'php'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLanguage(lang)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors',
                        codeLanguage === lang ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-2xl bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                <button
                  onClick={() => {
                    const code =
                      codeLanguage === 'curl'
                        ? `curl -X POST https://api.omniplatform.io/api/messages/send \\
  -H "Authorization: Bearer omni_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channelId": "chan_987654",
    "recipient": "+14155552671",
    "type": "text",
    "content": "Hello! Your appointment is confirmed."
  }'`
                        : codeLanguage === 'javascript'
                        ? `import axios from 'axios';

const response = await axios.post('https://api.omniplatform.io/api/messages/send', {
  channelId: 'chan_987654',
  recipient: '+14155552671',
  type: 'text',
  content: 'Hello! Your appointment is confirmed.'
}, {
  headers: {
    'Authorization': 'Bearer omni_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
console.log(response.data);`
                        : codeLanguage === 'python'
                        ? `import requests

url = "https://api.omniplatform.io/api/messages/send"
headers = {
    "Authorization": "Bearer omni_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "channelId": "chan_987654",
    "recipient": "+14155552671",
    "type": "text",
    "content": "Hello! Your appointment is confirmed."
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
                        : `<?php
$ch = curl_init('https://api.omniplatform.io/api/messages/send');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer omni_live_YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'channelId' => 'chan_987654',
    'recipient' => '+14155552671',
    'type' => 'text',
    'content' => 'Hello! Your appointment is confirmed.'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
                    handleCopyCode('api-snippet', code);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy code snippet"
                >
                  {copiedCodeId === 'api-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <pre className="text-[11px] leading-relaxed">
                  {codeLanguage === 'curl' &&
`curl -X POST https://api.omniplatform.io/api/messages/send \\
  -H "Authorization: Bearer omni_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channelId": "chan_987654",
    "recipient": "+14155552671",
    "type": "text",
    "content": "Hello! Your appointment is confirmed."
  }'`}

                  {codeLanguage === 'javascript' &&
`import axios from 'axios';

const response = await axios.post('https://api.omniplatform.io/api/messages/send', {
  channelId: 'chan_987654',
  recipient: '+14155552671',
  type: 'text',
  content: 'Hello! Your appointment is confirmed.'
}, {
  headers: {
    'Authorization': 'Bearer omni_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
console.log(response.data);`}

                  {codeLanguage === 'python' &&
`import requests

url = "https://api.omniplatform.io/api/messages/send"
headers = {
    "Authorization": "Bearer omni_live_YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "channelId": "chan_987654",
    "recipient": "+14155552671",
    "type": "text",
    "content": "Hello! Your appointment is confirmed."
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}

                  {codeLanguage === 'php' &&
`<?php
$ch = curl_init('https://api.omniplatform.io/api/messages/send');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer omni_live_YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'channelId' => 'chan_987654',
    'recipient' => '+14155552671',
    'type' => 'text',
    'content' => 'Hello! Your appointment is confirmed.'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`}
                </pre>
              </div>

              {/* Webhook HMAC Signature Security */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-600" />
                  Outbound Webhook HMAC-SHA256 Verification
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Every webhook event dispatched from Omni Platform includes the header <code>X-Omni-Signature</code>.
                  Compute <code>sha256_hmac(rawPayload, webhookSecret)</code> on your server to verify payload authenticity.
                </p>
              </div>
            </Card>
          </section>

          {/* ========================================================================= */}
          {/* CHAPTER 11: FAQ & TROUBLESHOOTING */}
          {/* ========================================================================= */}
          <section id="faq-troubleshooting" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chapter 11: FAQ &amp; Troubleshooting Guide</h2>
                <p className="text-xs text-gray-500">Quick answers and solutions to the most common configuration questions.</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'faq-1',
                  question: 'Why are my WhatsApp messages showing "Failed" or not delivering?',
                  answer:
                    'WhatsApp Cloud API requires Meta approval for Business-Initiated messages outside the 24-hour customer window. Ensure: 1) You are sending an Approved HSM Template, 2) Your Permanent Access Token is valid, 3) Your Phone Number ID matches the registered Meta WABA ID, and 4) Your Meta payment method is active in Meta Business Manager.',
                },
                {
                  id: 'faq-2',
                  question: 'How do I increase my Meta WhatsApp Tier limit from 1K to 10K/100K messages per day?',
                  answer:
                    'Meta automatically upgrades your tier when you send at least 50% of your current tier limit to unique recipients within a rolling 7-day period while maintaining a High Quality Rating (Green). Avoid spam reports to preserve quality.',
                },
                {
                  id: 'faq-3',
                  question: 'Can Platform SuperAdmins or Developers see my customer conversations?',
                  answer:
                    'No. Under our Zero-PII Data Privacy Guarantee, platform operators only see workspace metadata (tenant name, plan, quotas, error rates). Conversation transcripts, customer names, and message contents are strictly encrypted and accessible only to your workspace agents.',
                },
                {
                  id: 'faq-4',
                  question: 'How do I test billing and plan upgrades without real credit cards?',
                  answer:
                    'Go to Settings > Usage & Plans, select any tier (Starter, Pro, Enterprise), and choose "Instant Sandbox". The system will execute an immediate simulated checkout, activate your elevated resource quotas, and generate a test invoice.',
                },
                {
                  id: 'faq-5',
                  question: 'What happens when a customer asks a question not in my AI Knowledge Base?',
                  answer:
                    'If the AI RAG search score is below your configured confidence threshold (default 0.70), the AI will gracefully state it does not have the information and automatically transition the conversation to "Unassigned" for a human agent to answer.',
                },
                {
                  id: 'faq-6',
                  question: 'Are Internal Staff Notes visible to customers?',
                  answer:
                    'No. Internal Staff Notes (isInternalNote: true) are stored separately and rendered exclusively in the agent dashboard. They are never broadcasted via WebSockets to external users or dispatched over WhatsApp/Telegram.',
                },
                {
                  id: 'faq-7',
                  question: 'How do I download official PDF receipts and invoices for tax reporting?',
                  answer:
                    'Navigate to Settings & Scale > Invoices & Billing History. Click "View Receipt" next to any paid invoice to inspect line items, breakdown taxes, and click "Print / Download PDF" for your accounting ledger.',
                },
              ].map((faq) => (
                <Card
                  key={faq.id}
                  className="p-4 bg-white border border-gray-200/80 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => toggleFaq(faq.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      {faq.question}
                    </h4>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0',
                        expandedFaqs[faq.id] && 'rotate-180 text-primary-600'
                      )}
                    />
                  </div>
                  {expandedFaqs[faq.id] && (
                    <p className="text-xs text-gray-600 mt-2.5 pt-2.5 border-t border-gray-100 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* Bottom Helpdesk CTA Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-bold">Still have questions or need custom integration help?</h3>
              <p className="text-xs text-primary-100 max-w-xl">
                Our support desk is staffed 24/7 with WhatsApp Cloud API specialists and AI automation architects.
              </p>
            </div>
            <Link to="/support" className="shrink-0">
              <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100 text-xs font-bold px-6 py-3 rounded-xl shadow-md">
                Contact Support Desk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
