import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Workflow,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  GitBranch,
  FileCode,
  HelpCircle,
  Brain,
  Layers,
  Filter,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { flowsApi } from '../api';
import type { Flow } from '../types';
import { FLOW_TEMPLATES, FlowTemplate } from '../lib/flow-templates';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime } from '../lib/utils';

export const FlowsPage: React.FC = () => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate>(FLOW_TEMPLATES[0]);
  const [newFlowName, setNewFlowName] = useState(FLOW_TEMPLATES[0].suggestedFlowName);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadFlows = async () => {
    setIsLoading(true);
    try {
      const list = await flowsApi.list();
      setFlows(list);
    } catch (err) {
      showToast('Failed to load flows', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const handleOpenCreateModal = (template?: FlowTemplate) => {
    const t = template || FLOW_TEMPLATES[0];
    setSelectedTemplate(t);
    setNewFlowName(t.suggestedFlowName);
    setIsCreateModalOpen(true);
  };

  const handleSelectTemplate = (template: FlowTemplate) => {
    setSelectedTemplate(template);
    setNewFlowName(template.suggestedFlowName);
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    setIsSubmitting(true);
    try {
      const flow = await flowsApi.create({
        name: newFlowName.trim(),
        definition: selectedTemplate.definition,
      });

      setFlows((prev) => [...prev, flow]);
      setIsCreateModalOpen(false);
      showToast(`Flow "${flow.name}" created successfully!`, 'success');
      navigate(`/flows/${flow.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create flow', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFlow = async () => {
    if (!flowToDelete) return;

    setIsDeleting(true);
    try {
      await flowsApi.delete(flowToDelete.id);
      setFlows((prev) => prev.filter((f) => f.id !== flowToDelete.id));
      showToast(`Flow "${flowToDelete.name}" deleted successfully`, 'success');
      setFlowToDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete flow', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileCode':
        return <FileCode className="w-5 h-5 text-gray-700" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'HelpCircle':
        return <HelpCircle className="w-5 h-5 text-sky-500" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-emerald-500" />;
      case 'GitBranch':
        return <GitBranch className="w-5 h-5 text-orange-500" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-violet-500" />;
      default:
        return <Workflow className="w-5 h-5 text-indigo-500" />;
    }
  };

  const categories = ['All', 'General', 'Support', 'Sales', 'Marketing', 'AI & Automation'];
  const filteredTemplates = selectedCategory === 'All'
    ? FLOW_TEMPLATES
    : FLOW_TEMPLATES.filter((t) => t.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">No-Code Flow Builder</h1>
          <p className="text-xs text-gray-500 mt-1">
            Build conversational AI bots and automation workflows with condition branching, WhatsApp templates, and RAG agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenCreateModal(FLOW_TEMPLATES.find((t) => t.id === 'blank'))}
            icon={<FileCode className="w-4 h-4" />}
          >
            Blank Flow
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            icon={<Plus className="w-4 h-4" />}
          >
            Create from Template
          </Button>
        </div>
      </div>

      {/* Featured Templates Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white rounded-2xl border border-indigo-100 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Pre-built Business Flow Templates</h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  6 Ready Templates
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5 max-w-2xl">
                Get started in seconds with ready-to-use workflows for Customer Onboarding, FAQ Bots, CSAT Follow-ups, B2B Lead Capture, and Vector AI Knowledge Base Support.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="shrink-0"
            icon={<Layers className="w-4 h-4" />}
          >
            Explore Templates
          </Button>
        </div>
      </div>

      {/* Flows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-16">
              <Workflow className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-900">No flows created yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                Create a conversational flow to automatically greet customers, ask qualification questions, or hand off to human agents.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleOpenCreateModal(FLOW_TEMPLATES.find((t) => t.id === 'blank'))}
                  icon={<FileCode className="w-4 h-4" />}
                >
                  Start Blank Flow
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenCreateModal()}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Pick from Templates
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          flows.map((flow) => (
            <Card key={flow.id} hover className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={flow.status === 'published' ? 'success' : 'warning'} size="sm">
                      {flow.status}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      v{flow.version}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">{flow.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Array.isArray(flow.definition?.nodes) ? flow.definition.nodes.length : 0} nodes configured • Entry:{' '}
                    <code>{flow.definition?.entryNodeId || 'None'}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDateTime(flow.updatedAt || (flow as any).updated_at || flow.createdAt)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <Link to={`/flows/${flow.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full justify-between group">
                    <span>Open Flow Editor</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFlowToDelete(flow);
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
                  title="Delete Flow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Flow Modal with Template Selection */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Automation Flow"
        description="Choose a pre-configured template or start with a clean blank canvas"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFlow} className="space-y-5">
          {/* Template Category Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" /> Select Starter Template
              </label>
              <span className="text-xs text-gray-400">
                {filteredTemplates.length} templates available
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto p-1">
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplate.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                        }`}>
                          {renderTemplateIcon(template.icon)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{template.name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {template.category}
                          </span>
                        </div>
                      </div>

                      {template.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          template.id === 'blank'
                            ? 'bg-gray-100 text-gray-700'
                            : isSelected
                            ? 'bg-indigo-200/70 text-indigo-900'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {template.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100/80 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      {template.definition.nodes.length} {template.definition.nodes.length === 1 ? 'node' : 'nodes'}
                    </span>
                    <div className="flex items-center gap-1">
                      {template.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="bg-white px-1.5 py-0.5 rounded text-[10px] border border-gray-200 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flow Name Input */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            <Input
              label="Flow Name"
              placeholder="e.g. Lead Qualification Flow"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              helperText={`Will be initialized with ${selectedTemplate.definition.nodes.length} configured steps. You can customize all nodes in the visual canvas.`}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Selected: <strong>{selectedTemplate.name}</strong>
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting} icon={<Plus className="w-4 h-4" />}>
                Create Flow
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Flow Confirmation Modal */}
      <Modal
        isOpen={!!flowToDelete}
        onClose={() => !isDeleting && setFlowToDelete(null)}
        title="Delete Automation Flow"
        description="Are you sure you want to delete this flow? This action will remove the flow and cleanly disconnect related services."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                You are about to delete <span className="underline font-bold">"{flowToDelete?.name}"</span>.
              </p>
              <p className="text-amber-700 leading-relaxed">
                Channels configured with this flow will be safely unlinked, and any active executions will be marked completed. Historical logs and past analytics will remain intact.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="outline"
              type="button"
              disabled={isDeleting}
              onClick={() => setFlowToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              isLoading={isDeleting}
              onClick={handleDeleteFlow}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Flow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
