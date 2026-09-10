import React, { useEffect, useState } from 'react';
import {
  Brain,
  Database,
  FileText,
  Search,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  RefreshCw,
  Send,
  HelpCircle,
  Code,
  ShieldCheck,
  ChevronRight,
  Sliders,
  FileCode,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { knowledgeBasesApi, aiCopilotApi } from '../api';
import type {
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeChunk,
  RAGQueryResult,
  AILogEntry,
} from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

export const KnowledgeBasePage: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Active Tab for Selected Knowledge Base
  const [activeTab, setActiveTab] = useState<'documents' | 'playground' | 'settings'>('documents');

  // Create / Edit Knowledge Base Modal
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  const [kbForm, setKbForm] = useState({
    name: '',
    description: '',
    system_prompt: '',
    provider: 'claude',
    model: 'claude-3-5-sonnet',
    temperature: 0.2,
    is_active: true,
  });
  const [isSubmittingKb, setIsSubmittingKb] = useState(false);

  // Add Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    source_type: 'text' as 'text' | 'markdown' | 'pdf' | 'url',
    source_url: '',
    raw_content: '',
  });
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // Delete Confirmations
  const [deleteKbTarget, setDeleteKbTarget] = useState<KnowledgeBase | null>(null);
  const [isDeletingKb, setIsDeletingKb] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState<KnowledgeDocument | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Playground States
  const [playgroundQuery, setPlaygroundQuery] = useState('');
  const [topK, setTopK] = useState(4);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.25);
  const [isQueryingRAG, setIsQueryingRAG] = useState(false);
  const [ragResult, setRagResult] = useState<RAGQueryResult | null>(null);
  const [searchedChunks, setSearchedChunks] = useState<KnowledgeChunk[]>([]);
  const [isSearchingChunks, setIsSearchingChunks] = useState(false);

  const { showToast } = useToast();

  const loadKnowledgeBases = async () => {
    setIsLoading(true);
    try {
      const res = await knowledgeBasesApi.list();
      const items = res.items || [];
      setKnowledgeBases(items);
      if (items.length > 0 && !selectedKb) {
        setSelectedKb(items[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load knowledge bases', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (kbId: string) => {
    setIsLoadingDocs(true);
    try {
      const res = await knowledgeBasesApi.listDocuments(kbId);
      setDocuments(res.items || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load documents', 'error');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKb) {
      loadDocuments(selectedKb.id);
      setRagResult(null);
      setSearchedChunks([]);
    }
  }, [selectedKb?.id]);

  const handleOpenCreateKb = () => {
    setEditingKb(null);
    setKbForm({
      name: '',
      description: '',
      system_prompt:
        'You are an expert AI customer support assistant. Answer the user query strictly using the provided context. If the answer cannot be found in the context, politely clarify or state that you will connect them with a human specialist.',
      provider: 'claude',
      model: 'claude-3-5-sonnet',
      temperature: 0.2,
      is_active: true,
    });
    setIsKbModalOpen(true);
  };

  const handleOpenEditKb = (kb: KnowledgeBase, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingKb(kb);
    setKbForm({
      name: kb.name,
      description: kb.description || '',
      system_prompt:
        (kb as any).system_prompt ||
        'You are an expert AI customer support assistant. Answer the user query strictly using the provided context.',
      provider: (kb as any).provider || 'claude',
      model: (kb as any).model || 'claude-3-5-sonnet',
      temperature: (kb as any).temperature ?? 0.2,
      is_active: (kb as any).is_active ?? true,
    });
    setIsKbModalOpen(true);
  };

  const handleSaveKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbForm.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setIsSubmittingKb(true);
    try {
      if (editingKb) {
        const updated = await knowledgeBasesApi.update(editingKb.id, kbForm);
        showToast(`Updated ${updated.name}`, 'success');
        setKnowledgeBases((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
        if (selectedKb?.id === updated.id) {
          setSelectedKb(updated);
        }
      } else {
        const created = await knowledgeBasesApi.create(kbForm);
        showToast(`Created ${created.name}`, 'success');
        setKnowledgeBases((prev) => [created, ...prev]);
        setSelectedKb(created);
      }
      setIsKbModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save knowledge base', 'error');
    } finally {
      setIsSubmittingKb(false);
    }
  };

  const handleDeleteKb = async () => {
    if (!deleteKbTarget) return;
    setIsDeletingKb(true);
    try {
      await knowledgeBasesApi.delete(deleteKbTarget.id);
      showToast(`Removed ${deleteKbTarget.name}`, 'success');
      const remaining = knowledgeBases.filter((k) => k.id !== deleteKbTarget.id);
      setKnowledgeBases(remaining);
      if (selectedKb?.id === deleteKbTarget.id) {
        setSelectedKb(remaining[0] || null);
      }
      setDeleteKbTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete knowledge base', 'error');
    } finally {
      setIsDeletingKb(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb) return;
    if (!docForm.title.trim() || !docForm.raw_content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setIsSubmittingDoc(true);
    try {
      const doc = await knowledgeBasesApi.addDocument(selectedKb.id, docForm);
      showToast(`Created document with ${(doc as any).chunk_count || (doc as any).chunkCount || 'multiple'} chunks`, 'success');
      setIsDocModalOpen(false);
      setDocForm({ title: '', source_type: 'text', source_url: '', raw_content: '' });
      await loadDocuments(selectedKb.id);
      await loadKnowledgeBases(); // refresh chunk count
    } catch (err: any) {
      showToast(err.message || 'Failed to add document', 'error');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedKb || !deleteDocTarget) return;
    setIsDeletingDoc(true);
    try {
      await knowledgeBasesApi.deleteDocument(selectedKb.id, deleteDocTarget.id);
      showToast(`Removed ${deleteDocTarget.title}`, 'success');
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDocTarget.id));
      setDeleteDocTarget(null);
      await loadKnowledgeBases(); // refresh chunk count
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleTestRAG = async () => {
    if (!selectedKb || !playgroundQuery.trim()) return;
    setIsQueryingRAG(true);
    setRagResult(null);
    try {
      const res = await aiCopilotApi.queryRAG({
        knowledgeBaseId: selectedKb.id,
        query: playgroundQuery,
        topK,
        threshold: similarityThreshold,
        customSystemPrompt: (selectedKb as any).system_prompt || undefined,
      });
      setRagResult(res);
      showToast(`AI Answer Generated (Confidence: ${(res.confidence * 100).toFixed(0)}%)`, 'success');
    } catch (err: any) {
      showToast(err.message || 'RAG query failed', 'error');
    } finally {
      setIsQueryingRAG(false);
    }
  };

  const handleSearchChunks = async () => {
    if (!selectedKb || !playgroundQuery.trim()) return;
    setIsSearchingChunks(true);
    try {
      const res = await knowledgeBasesApi.searchChunks(selectedKb.id, {
        query: playgroundQuery,
        limit: topK,
      });
      setSearchedChunks(res.results || []);
      showToast(`Retrieved ${res.results?.length || 0} similar chunks`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Vector search failed', 'error');
    } finally {
      setIsSearchingChunks(false);
    }
  };

  // Aggregate stats
  const totalBases = knowledgeBases.length;
  const totalDocs = knowledgeBases.reduce(
    (acc, kb) => acc + (Number((kb as any).document_count || (kb as any).docCount) || 0),
    0
  );
  const totalChunks = knowledgeBases.reduce(
    (acc, kb) => acc + (Number((kb as any).chunk_count || (kb as any).chunkCount) || 0),
    0
  );

  const filteredBases = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (kb.description && kb.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Bases & AI Agent RAG</h1>
            <Badge variant="purple" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Phase 6 Active</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage vector embeddings, document chunking, and AI grounding for intelligent bot flows and agent copilot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />}
            onClick={() => loadKnowledgeBases()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateKb}
          >
            New Knowledge Base
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Knowledge Bases</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalBases}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Active multi-tenant stores</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-white border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Indexed Documents</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalDocs}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">FAQs, PDFs, and guides</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Vector Chunks</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalChunks}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">1536-dim normalized embeddings</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-white border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Embedding Pipeline</p>
              <h3 className="text-sm font-bold text-gray-900 mt-1 truncate">text-embedding-3</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Dual-mode OpenAI / Offline</p>
        </Card>
      </div>

      {/* Main Content Layout: Sidebar of Knowledge Bases + Selected Knowledge Base Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Knowledge Bases List */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-600" />
                Knowledge Repositories
              </h2>
              <span className="text-xs text-gray-500">{filteredBases.length} total</span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search knowledge bases..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : filteredBases.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                No knowledge bases found. Click "+ New Knowledge Base" to create your first repository.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredBases.map((kb) => {
                  const isSelected = selectedKb?.id === kb.id;
                  const docCount = Number((kb as any).document_count || (kb as any).docCount) || 0;
                  const chunkCount = Number((kb as any).chunk_count || (kb as any).chunkCount) || 0;

                  return (
                    <div
                      key={kb.id}
                      onClick={() => setSelectedKb(kb)}
                      className={cn(
                        'p-3 rounded-xl border transition-all cursor-pointer text-left',
                        isSelected
                          ? 'bg-primary-50/60 border-primary-300 ring-1 ring-primary-400/40 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{kb.name}</h3>
                            {(kb as any).is_active === false && (
                              <Badge variant="secondary" size="sm">Inactive</Badge>
                            )}
                          </div>
                          {kb.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{kb.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleOpenEditKb(kb, e)}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteKbTarget(kb);
                            }}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          {docCount} docs
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-gray-400" />
                          {chunkCount} chunks
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {(kb as any).provider || 'claude'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Selected Knowledge Base Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {selectedKb ? (
            <Card className="p-6">
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{selectedKb.name}</h2>
                    <Badge variant="purple" size="sm">
                      {(selectedKb as any).model || 'claude-3-5-sonnet'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedKb.description || 'No description provided.'}
                  </p>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5',
                      activeTab === 'documents'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Documents ({documents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('playground')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5',
                      activeTab === 'playground'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    RAG Playground
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5',
                      activeTab === 'settings'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Settings
                  </button>
                </div>
              </div>

              {/* TAB 1: Documents Management */}
              {activeTab === 'documents' && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Indexed Knowledge Documents</h3>
                      <p className="text-xs text-gray-500">
                        Content is automatically chunked into 600-character segments and indexed for semantic search.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setDocForm({ title: '', source_type: 'text', source_url: '', raw_content: '' });
                        setIsDocModalOpen(true);
                      }}
                    >
                      Add Document
                    </Button>
                  </div>

                  {isLoadingDocs ? (
                    <div className="py-12 flex justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">No documents indexed yet</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                        Add product guides, FAQ articles, refund policies, or pricing sheets so your AI bot can answer user questions accurately.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsDocModalOpen(true)}
                      >
                        Ingest First Document
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                      {documents.map((doc) => {
                        const chunkCount = Number((doc as any).chunk_count || (doc as any).chunkCount) || 0;
                        const sourceType = (doc as any).source_type || doc.sourceType || 'text';

                        return (
                          <div key={doc.id} className="p-4 hover:bg-gray-50/80 transition flex items-center justify-between gap-4">
                            <div className="min-w-0 flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                                {sourceType === 'markdown' ? (
                                  <FileCode className="w-4 h-4 text-purple-600" />
                                ) : sourceType === 'url' ? (
                                  <Globe className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-primary-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.title}</h4>
                                  <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                                    {sourceType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {chunkCount} vector chunks
                                  </span>
                                  <span>•</span>
                                  <span>Added {formatDateTime(doc.createdAt || (doc as any).created_at)}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => setDeleteDocTarget(doc)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete document and chunks"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RAG Playground */}
              {activeTab === 'playground' && (
                <div className="mt-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Semantic Search & RAG Test Bench
                    </h3>
                    <p className="text-xs text-gray-500">
                      Query your knowledge base in real-time to inspect cosine similarity matching, grounding accuracy, and AI responses.
                    </p>
                  </div>

                  {/* Playground Controls */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">User Query</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={playgroundQuery}
                          onChange={(e) => setPlaygroundQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTestRAG();
                          }}
                          placeholder="e.g. How do I request a refund, or what are the delivery charges?"
                          className="flex-1 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button
                          variant="primary"
                          size="md"
                          icon={<Sparkles className={cn("w-4 h-4", isQueryingRAG && "animate-spin")} />}
                          onClick={handleTestRAG}
                          disabled={isQueryingRAG || !playgroundQuery.trim()}
                        >
                          Ask RAG
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          icon={<Search className="w-4 h-4" />}
                          onClick={handleSearchChunks}
                          disabled={isSearchingChunks || !playgroundQuery.trim()}
                        >
                          Vector Search
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200/60 text-xs">
                      <div>
                        <div className="flex justify-between font-medium text-gray-700 mb-1">
                          <span>Top-K Context Chunks:</span>
                          <span className="text-primary-600 font-bold">{topK}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="1"
                          value={topK}
                          onChange={(e) => setTopK(Number(e.target.value))}
                          className="w-full accent-primary-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-medium text-gray-700 mb-1">
                          <span>Similarity Threshold:</span>
                          <span className="text-primary-600 font-bold">{similarityThreshold}</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={similarityThreshold}
                          onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                          className="w-full accent-primary-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RAG Answer Output Display */}
                  {ragResult && (
                    <div className="p-4 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 border border-purple-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-700" />
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                            Grounded AI Synthesis
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="purple" size="sm">
                            Confidence: {(ragResult.confidence * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="secondary" size="sm">
                            Latency: {ragResult.latencyMs}ms
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-purple-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap shadow-sm">
                        {ragResult.answer}
                      </div>

                      {ragResult.usedSources && ragResult.usedSources.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider mb-1.5">
                            Attributed Grounding Sources ({ragResult.usedSources.length}):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ragResult.usedSources.map((src, i) => (
                              <div key={i} className="p-2.5 bg-white/90 rounded-lg border border-purple-100 text-xs">
                                <div className="flex items-center justify-between font-semibold text-gray-900 mb-1">
                                  <span className="truncate">{src.documentTitle || 'Document'}</span>
                                  <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                    {(src.similarity * 100).toFixed(1)}% match
                                  </span>
                                </div>
                                <p className="text-gray-600 text-[11px] line-clamp-3 italic">"{src.content}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw Vector Chunks Search Display */}
                  {searchedChunks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        Ranked Vector Matches ({searchedChunks.length})
                      </h4>
                      <div className="space-y-2">
                        {searchedChunks.map((chunk, idx) => (
                          <div key={chunk.id || idx} className="p-3 bg-white border border-gray-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">Chunk #{chunk.chunkIndex ?? idx + 1}</span>
                              {chunk.similarity !== undefined && (
                                <Badge variant="success" size="sm">
                                  Similarity: {(chunk.similarity * 100).toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap">{chunk.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Settings & Instructions */}
              {activeTab === 'settings' && (
                <div className="mt-5 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">AI Grounding & Inference Settings</h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">System Instruction Prompt</label>
                      <textarea
                        rows={4}
                        value={(selectedKb as any).system_prompt || ''}
                        disabled
                        className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-lg font-mono text-gray-700 focus:outline-none"
                      />
                      <p className="text-[11px] text-gray-500">
                        To modify system prompt instructions, temperature, or models, click "Edit Knowledge Base".
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <span className="text-gray-500">LLM Provider:</span>
                        <p className="font-semibold text-gray-800 uppercase">{(selectedKb as any).provider || 'Claude'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Model Name:</span>
                        <p className="font-semibold text-gray-800">{(selectedKb as any).model || 'claude-3-5-sonnet'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Sampling Temperature:</span>
                        <p className="font-semibold text-gray-800">{(selectedKb as any).temperature ?? 0.2}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-semibold text-emerald-600">
                          {(selectedKb as any).is_active !== false ? 'Active & Serving' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center text-gray-500 text-sm">
              Select or create a knowledge base to view documents and run RAG tests.
            </Card>
          )}
        </div>
      </div>

      {/* CREATE / EDIT KNOWLEDGE BASE MODAL */}
      <Modal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        title={editingKb ? 'Edit Knowledge Base' : 'Create Knowledge Base'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveKb} className="space-y-4">
          <Input
            label="Knowledge Base Name *"
            value={kbForm.name}
            onChange={(e) => setKbForm({ ...kbForm, name: e.target.value })}
            placeholder="e.g. Omnichannel Support Guide, Product FAQs, Pricing Policy"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Description</label>
            <input
              type="text"
              value={kbForm.description}
              onChange={(e) => setKbForm({ ...kbForm, description: e.target.value })}
              placeholder="e.g. Contains all official return policies and FAQ documentation"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">System Instruction Prompt</label>
            <textarea
              rows={3}
              value={kbForm.system_prompt}
              onChange={(e) => setKbForm({ ...kbForm, system_prompt: e.target.value })}
              placeholder="Instructions to the LLM on how to answer user questions..."
              className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">AI Provider</label>
              <select
                value={kbForm.provider}
                onChange={(e) => setKbForm({ ...kbForm, provider: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="claude">Anthropic Claude</option>
                <option value="openai">OpenAI</option>
                <option value="offline">Deterministic Offline Engine</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Model</label>
              <select
                value={kbForm.model}
                onChange={(e) => setKbForm({ ...kbForm, model: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="offline-vector">Offline Vector Matcher</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="kb_active"
              checked={kbForm.is_active}
              onChange={(e) => setKbForm({ ...kbForm, is_active: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="kb_active" className="text-xs font-medium text-gray-700">
              Active (Enabled for bot flows and RAG search)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setIsKbModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingKb}>
              {editingKb ? 'Update Knowledge Base' : 'Create Knowledge Base'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD DOCUMENT MODAL */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Ingest Knowledge Document"
        maxWidth="lg"
      >
        <form onSubmit={handleAddDocument} className="space-y-4">
          <Input
            label="Document Title *"
            value={docForm.title}
            onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
            placeholder="e.g. Return & Exchange Policy 2026, WhatsApp Catalog FAQ"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Source Type</label>
              <select
                value={docForm.source_type}
                onChange={(e) => setDocForm({ ...docForm, source_type: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="text">Plain Text</option>
                <option value="markdown">Markdown Documentation</option>
                <option value="pdf">PDF Content</option>
                <option value="url">Web Page / URL</option>
              </select>
            </div>

            {docForm.source_type === 'url' && (
              <Input
                label="Source URL"
                value={docForm.source_url}
                onChange={(e) => setDocForm({ ...docForm, source_url: e.target.value })}
                placeholder="https://example.com/faq"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Document Content *</label>
              <span className="text-[11px] text-gray-400">
                {docForm.raw_content.length} chars (~{Math.max(1, Math.ceil(docForm.raw_content.length / 520))} chunks)
              </span>
            </div>
            <textarea
              rows={8}
              value={docForm.raw_content}
              onChange={(e) => setDocForm({ ...docForm, raw_content: e.target.value })}
              placeholder="Paste the documentation text, FAQ items, policy terms, or product details here..."
              className="w-full p-3 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-gray-800"
              required
            />
          </div>

          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              The content will be split into overlapping semantic chunks and vectorized using 1536-dimensional embeddings for immediate similarity lookup in AI flows.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setIsDocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingDoc}>
              Vectorize & Save Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE KB CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteKbTarget}
        onClose={() => setDeleteKbTarget(null)}
        title="Delete Knowledge Base"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900">{deleteKbTarget?.name}</strong>?
            All associated documents and vector chunks will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteKbTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteKb} isLoading={isDeletingKb}>
              Delete Knowledge Base
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE DOC CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        title="Delete Document"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900">{deleteDocTarget?.title}</strong>?
            Its embeddings and vector chunks will be purged.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteDocTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDocument} isLoading={isDeletingDoc}>
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
