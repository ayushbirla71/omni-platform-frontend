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
  Play,
  FileCode,
} from 'lucide-react';
import { flowsApi } from '../api';
import type { Flow, FlowDefinition } from '../types';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle } from '../components/common/Card';
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
  const [newFlowName, setNewFlowName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    setIsSubmitting(true);
    try {
      // Starter template flow
      const starterDefinition: FlowDefinition = {
        entryNodeId: 'node_1',
        nodes: [
          {
            id: 'node_1',
            type: 'message',
            text: '👋 Hi there! Thanks for reaching out.',
            next: 'node_2',
          },
          {
            id: 'node_2',
            type: 'input',
            prompt: 'What is your name?',
            saveAs: 'userName',
            next: 'node_3',
          },
          {
            id: 'node_3',
            type: 'message',
            text: 'Nice to meet you, {{userName}}! An agent will be with you shortly.',
            next: 'node_4',
          },
          {
            id: 'node_4',
            type: 'end',
          },
        ],
      };

      const flow = await flowsApi.create({
        name: newFlowName.trim(),
        definition: starterDefinition,
      });

      setFlows((prev) => [...prev, flow]);
      setIsCreateModalOpen(false);
      setNewFlowName('');
      showToast('Flow created successfully!', 'success');
      navigate(`/flows/${flow.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create flow', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Build conversational AI bots and automation workflows with condition branching and input capture.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Flow
        </Button>
      </div>

      {/* Flows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-16">
              <Workflow className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-900">No flows created yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                Create a conversational flow to automatically greet customers, ask qualification questions, or handoff to agents.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create First Flow
              </Button>
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

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Link to={`/flows/${flow.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-between group">
                    <span>Open Flow Editor</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Flow"
        description="Name your conversational automation flow"
      >
        <form onSubmit={handleCreateFlow} className="space-y-4">
          <Input
            label="Flow Name"
            placeholder="e.g. Lead Qualification Flow"
            value={newFlowName}
            onChange={(e) => setNewFlowName(e.target.value)}
            helperText="You can customize all nodes and logic in the visual builder"
            required
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Start Building
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
