import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  Repeat,
  Clock,
  MousePointerClick,
  FileText,
  Flag,
} from 'lucide-react';
import { flowsApi, channelsApi } from '../api';
import type {
  Flow,
  FlowDefinition,
  FlowNode,
  FlowNodeType,
  WhatsAppTemplate,
  Channel,
} from '../types';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { FlowCanvasNode, FlowNodeData } from '../components/flow/FlowCanvasNode';
import { FlowCustomEdge } from '../components/flow/FlowCustomEdge';
import { FlowToolbar } from '../components/flow/FlowToolbar';

// Node and Edge types registered with React Flow
const nodeTypes = {
  custom: FlowCanvasNode,
};

const edgeTypes = {
  custom: FlowCustomEdge,
};

interface HistorySnapshot {
  nodes: FlowNode[];
  edges: Edge[];
  entryNodeId: string;
}

const FlowEditorCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const reactFlowInstance = useReactFlow();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [entryNodeId, setEntryNodeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Available WhatsApp templates for template node dropdown
  const [availableTemplates, setAvailableTemplates] = useState<WhatsAppTemplate[]>([]);

  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Undo / Redo History
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Node Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewNode, setIsNewNode] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState('');
  const [nodeType, setNodeType] = useState<FlowNodeType>('message');

  // Form fields
  const [nodeText, setNodeText] = useState('');
  const [nodePrompt, setNodePrompt] = useState('');
  const [nodeSaveAs, setNodeSaveAs] = useState('');
  const [nodeNext, setNodeNext] = useState('');
  const [nodeUrl, setNodeUrl] = useState('');
  const [nodeWaitDuration, setNodeWaitDuration] = useState(60);
  const [nodeWaitUnit, setNodeWaitUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('seconds');
  const [maxRetries, setMaxRetries] = useState(0);
  const [retryDelaySeconds, setRetryDelaySeconds] = useState(60);

  // Condition Form fields
  const [conditionVar, setConditionVar] = useState('');
  const [conditionBranches, setConditionBranches] = useState<Array<{ equals: string; next: string }>>([
    { equals: '', next: '' },
  ]);
  const [conditionDefault, setConditionDefault] = useState('');

  // Template Form fields
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en_US');
  const [templateParams, setTemplateParams] = useState<Array<{ key: string; value: string }>>([]);
  const [templateButtons, setTemplateButtons] = useState<Array<{ buttonText: string; next: string }>>([]);
  const [templateSaveAs, setTemplateSaveAs] = useState('');

  // Push state to Undo/Redo history
  const pushHistory = useCallback((currentNodes: FlowNode[], currentEdges: Edge[], entryId: string) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, { nodes: currentNodes, edges: currentEdges, entryNodeId: entryId }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Convert backend FlowDefinition into React Flow nodes & edges
  const convertDefToGraph = useCallback(
    (
      def: FlowDefinition,
      onEditFn: (n: FlowNode) => void,
      onDeleteFn: (id: string) => void,
      onSetEntryFn: (id: string) => void
    ) => {
      const rawNodes = def.nodes || [];
      const entryId = def.entryNodeId || rawNodes[0]?.id || '';
      const generatedEdges: Edge[] = [];

      // Create React Flow nodes with auto-layout positions if coordinates not saved
      const flowNodes: Node<FlowNodeData>[] = rawNodes.map((n, idx) => {
        const posX = n.position?.x ?? (idx % 3) * 340 + 100;
        const posY = n.position?.y ?? Math.floor(idx / 3) * 260 + 100;

        return {
          id: n.id,
          type: 'custom',
          position: { x: posX, y: posY },
          data: {
            node: n,
            isEntry: n.id === entryId,
            onEdit: onEditFn,
            onDelete: onDeleteFn,
            onSetEntry: onSetEntryFn,
          },
        };
      });

    // Generate edges from node connections
    rawNodes.forEach((n) => {
      // 1. Message & Template Delivered / Failed / Continue
      if (n.type === 'message' || n.type === 'template') {
        if (n.onDelivered) {
          generatedEdges.push({
            id: `e-${n.id}-delivered-${n.onDelivered}`,
            source: n.id,
            sourceHandle: 'delivered',
            target: n.onDelivered,
            type: 'custom',
            label: 'Delivered',
          });
        }
        if (n.onFailed) {
          generatedEdges.push({
            id: `e-${n.id}-failed-${n.onFailed}`,
            source: n.id,
            sourceHandle: 'failed',
            target: n.onFailed,
            type: 'custom',
            label: 'Failed',
          });
        }
        if (n.next) {
          generatedEdges.push({
            id: `e-${n.id}-continue-${n.next}`,
            source: n.id,
            sourceHandle: 'continue',
            target: n.next,
            type: 'custom',
            label: 'Continue',
          });
        }
        if (n.type === 'template' && n.buttons) {
          n.buttons.forEach((btn, bIdx) => {
            if (btn.next) {
              generatedEdges.push({
                id: `e-${n.id}-btn-${bIdx}-${btn.next}`,
                source: n.id,
                sourceHandle: `btn_${bIdx}`,
                target: btn.next,
                type: 'custom',
                label: `"${btn.buttonText}"`,
              });
            }
          });
        }
      }

      // 2. Condition branches
      if (n.type === 'condition') {
        n.branches?.forEach((b, bIdx) => {
          if (b.next) {
            generatedEdges.push({
              id: `e-${n.id}-branch-${bIdx}-${b.next}`,
              source: n.id,
              sourceHandle: `branch_${bIdx}`,
              target: b.next,
              type: 'custom',
              label: `== "${b.equals}"`,
            });
          }
        });
        if (n.default) {
          generatedEdges.push({
            id: `e-${n.id}-default-${n.default}`,
            source: n.id,
            sourceHandle: 'default',
            target: n.default,
            type: 'custom',
            label: 'Default',
          });
        }
      }

      // 3. Wait / Input / Action
      if ((n.type === 'wait' || n.type === 'input' || n.type === 'action') && n.next) {
        generatedEdges.push({
          id: `e-${n.id}-continue-${n.next}`,
          source: n.id,
          sourceHandle: 'continue',
          target: n.next,
          type: 'custom',
        });
      }
    });

    return { flowNodes, generatedEdges, entryId };
  }, []);

  // Serialize React Flow canvas state back to backend FlowDefinition
  const serializeGraph = useCallback((): FlowDefinition => {
    const serializedNodes: FlowNode[] = nodes.map((rn) => {
      const baseNode = { ...rn.data.node, position: rn.position };

      // Rebuild outbound ports & next pointers from connected edges
      const outgoing = edges.filter((e) => e.source === rn.id);

      if (baseNode.type === 'message' || baseNode.type === 'template') {
        const delEdge = outgoing.find((e) => e.sourceHandle === 'delivered');
        const failEdge = outgoing.find((e) => e.sourceHandle === 'failed');
        const contEdge = outgoing.find((e) => e.sourceHandle === 'continue');

        baseNode.onDelivered = delEdge?.target || undefined;
        baseNode.onFailed = failEdge?.target || undefined;
        baseNode.next = contEdge?.target || undefined;

        if (baseNode.type === 'template' && baseNode.buttons) {
          baseNode.buttons = baseNode.buttons.map((btn, bIdx) => {
            const btnEdge = outgoing.find((e) => e.sourceHandle === `btn_${bIdx}`);
            return {
              ...btn,
              next: btnEdge?.target || btn.next || '',
            };
          });
        }
      } else if (baseNode.type === 'condition') {
        if (baseNode.branches) {
          baseNode.branches = baseNode.branches.map((b, bIdx) => {
            const bEdge = outgoing.find((e) => e.sourceHandle === `branch_${bIdx}`);
            return {
              ...b,
              next: bEdge?.target || b.next || '',
            };
          });
        }
        const defEdge = outgoing.find((e) => e.sourceHandle === 'default');
        baseNode.default = defEdge?.target || undefined;
      } else if (baseNode.type === 'wait' || baseNode.type === 'input' || baseNode.type === 'action') {
        const contEdge = outgoing.find((e) => e.sourceHandle === 'continue' || !e.sourceHandle);
        baseNode.next = contEdge?.target || undefined;
      }

      return baseNode;
    });

    return {
      entryNodeId,
      nodes: serializedNodes,
    };
  }, [nodes, edges, entryNodeId]);

  // Open Edit Node Modal
  const handleOpenEdit = useCallback((targetNode: FlowNode) => {
    setIsNewNode(false);
    setEditingNodeId(targetNode.id);
    setNodeType(targetNode.type);

    setNodeText((targetNode as any).text || '');
    setNodePrompt((targetNode as any).prompt || '');
    setNodeSaveAs((targetNode as any).saveAs || '');
    setNodeNext((targetNode as any).next || '');
    setNodeUrl((targetNode as any).url || '');
    setNodeWaitDuration((targetNode as any).duration || 60);
    setNodeWaitUnit((targetNode as any).durationUnit || 'seconds');
    setMaxRetries((targetNode as any).retryConfig?.maxRetries || 0);
    setRetryDelaySeconds((targetNode as any).retryConfig?.delaySeconds || 60);

    setConditionVar((targetNode as any).variable || '');
    setConditionBranches((targetNode as any).branches?.length ? (targetNode as any).branches : [{ equals: '', next: '' }]);
    setConditionDefault((targetNode as any).default || '');

    if (targetNode.type === 'template') {
      setTemplateName(targetNode.templateName || '');
      setTemplateLanguage(targetNode.language || 'en_US');
      setTemplateParams(
        targetNode.templateParams
          ? Object.entries(targetNode.templateParams).map(([k, v]) => ({ key: k, value: v }))
          : []
      );
      setTemplateButtons(targetNode.buttons || []);
      setTemplateSaveAs(targetNode.saveAs || '');
    } else {
      setTemplateName('');
      setTemplateLanguage('en_US');
      setTemplateParams([]);
      setTemplateButtons([]);
      setTemplateSaveAs('');
    }

    setIsModalOpen(true);
  }, []);

  // Set Node as Entry Node
  const handleSetEntryNode = useCallback((newEntryId: string) => {
    setEntryNodeId(newEntryId);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isEntry: n.id === newEntryId,
        },
      }))
    );
    showToast(`Set "${newEntryId}" as flow entry step`, 'info');
  }, [setNodes, showToast]);

  // Delete Node
  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    let nextEntryId = entryNodeId;
    setNodes((prev) => {
      const filtered = prev.filter((n) => n.id !== nodeIdToDelete);
      if (entryNodeId === nodeIdToDelete) {
        nextEntryId = filtered[0]?.id || '';
        setEntryNodeId(nextEntryId);
      }
      return filtered.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isEntry: n.id === nextEntryId,
        },
      }));
    });
    setEdges((prev) => prev.filter((e) => e.source !== nodeIdToDelete && e.target !== nodeIdToDelete));
    showToast(`Node "${nodeIdToDelete}" removed`, 'info');
  }, [entryNodeId, setNodes, setEdges, showToast]);

  // Load flow & templates
  const loadFlow = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await flowsApi.get(id);
      setFlow(data);
      const def = data.definition || { entryNodeId: '', nodes: [] };
      const { flowNodes, generatedEdges, entryId } = convertDefToGraph(
        def,
        handleOpenEdit,
        handleDeleteNode,
        handleSetEntryNode
      );
      setNodes(flowNodes);
      setEdges(generatedEdges);
      setEntryNodeId(entryId);

      // Try loading templates from connected WhatsApp channels
      try {
        const channels = await channelsApi.list();
        const waChannels = channels.filter((c: Channel) => c.type === 'whatsapp' && c.status === 'active');
        const allTemplates: WhatsAppTemplate[] = [];
        for (const ch of waChannels) {
          try {
            const tpls = await channelsApi.getTemplates(ch.id);
            allTemplates.push(...tpls);
          } catch {
            // Non-fatal
          }
        }
        setAvailableTemplates(allTemplates);
      } catch {
        // Non-fatal
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load flow', 'error');
      navigate('/flows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlow();
  }, [id]);

  // Connect port handler
  const onConnect = useCallback(
    (params: Connection) => {
      let edgeLabel = '';
      if (params.sourceHandle === 'delivered') edgeLabel = 'Delivered';
      else if (params.sourceHandle === 'failed') edgeLabel = 'Failed';
      else if (params.sourceHandle === 'continue') edgeLabel = 'Continue';
      else if (params.sourceHandle?.startsWith('btn_')) {
        const bIdx = Number(params.sourceHandle.replace('btn_', ''));
        const sourceNode = nodes.find((n) => n.id === params.source)?.data.node;
        if (sourceNode?.type === 'template' && sourceNode.buttons?.[bIdx]) {
          edgeLabel = `"${sourceNode.buttons[bIdx].buttonText}"`;
        }
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'custom',
            label: edgeLabel,
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  // Add new node to canvas
  const handleAddNewNode = (type: FlowNodeType) => {
    const generatedId = `${type}_${Date.now().toString().slice(-4)}`;
    const position = {
      x: 250 + Math.random() * 80,
      y: 180 + Math.random() * 80,
    };

    let newNodeData: FlowNode;
    switch (type) {
      case 'message':
        newNodeData = { id: generatedId, type: 'message', text: 'Hello! How can we help you?' };
        break;
      case 'template':
        newNodeData = {
          id: generatedId,
          type: 'template',
          templateName: 'sample_template',
          language: 'en_US',
        };
        break;
      case 'wait':
        newNodeData = { id: generatedId, type: 'wait', duration: 3600, durationUnit: 'seconds' };
        break;
      case 'input':
        newNodeData = { id: generatedId, type: 'input', prompt: 'What is your email?', saveAs: 'userEmail' };
        break;
      case 'condition':
        newNodeData = { id: generatedId, type: 'condition', variable: 'userChoice', branches: [{ equals: '1', next: '' }] };
        break;
      case 'action':
        newNodeData = { id: generatedId, type: 'action', action: 'webhook', url: 'https://api.example.com/webhook' };
        break;
      case 'handoff':
        newNodeData = { id: generatedId, type: 'handoff' };
        break;
      case 'end':
        newNodeData = { id: generatedId, type: 'end' };
        break;
    }

    const newRfNode: Node<FlowNodeData> = {
      id: generatedId,
      type: 'custom',
      position,
      data: {
        node: newNodeData,
        isEntry: nodes.length === 0,
        onEdit: handleOpenEdit,
        onDelete: handleDeleteNode,
        onSetEntry: handleSetEntryNode,
      },
    };

    setNodes((nds) => [...nds, newRfNode]);
    if (nodes.length === 0) {
      setEntryNodeId(generatedId);
    }
  };

  // Save Node from Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedNode: FlowNode;

    const retryConfig = maxRetries > 0 ? { maxRetries, delaySeconds: retryDelaySeconds } : undefined;

    switch (nodeType) {
      case 'message':
        updatedNode = {
          id: editingNodeId,
          type: 'message',
          text: nodeText.trim(),
          retryConfig,
          next: nodeNext.trim() || undefined,
        };
        break;
      case 'template': {
        const pObj: Record<string, string> = {};
        templateParams.forEach((p) => {
          if (p.key && p.value) pObj[p.key] = p.value;
        });
        updatedNode = {
          id: editingNodeId,
          type: 'template',
          templateName: templateName.trim(),
          language: templateLanguage.trim() || 'en_US',
          templateParams: Object.keys(pObj).length ? pObj : undefined,
          buttons: templateButtons.filter((b) => b.buttonText.trim()),
          saveAs: templateSaveAs.trim() || undefined,
          retryConfig,
          next: nodeNext.trim() || undefined,
        };
        break;
      }
      case 'wait':
        updatedNode = {
          id: editingNodeId,
          type: 'wait',
          duration: Number(nodeWaitDuration),
          durationUnit: nodeWaitUnit,
          next: nodeNext.trim() || undefined,
        };
        break;
      case 'input':
        updatedNode = {
          id: editingNodeId,
          type: 'input',
          prompt: nodePrompt.trim(),
          saveAs: nodeSaveAs.trim(),
          next: nodeNext.trim() || undefined,
        };
        break;
      case 'condition':
        updatedNode = {
          id: editingNodeId,
          type: 'condition',
          variable: conditionVar.trim(),
          branches: conditionBranches.filter((b) => b.equals),
          default: conditionDefault.trim() || undefined,
        };
        break;
      case 'action':
        updatedNode = {
          id: editingNodeId,
          type: 'action',
          action: 'webhook',
          url: nodeUrl.trim(),
          next: nodeNext.trim() || undefined,
        };
        break;
      case 'handoff':
        updatedNode = { id: editingNodeId, type: 'handoff' };
        break;
      case 'end':
        updatedNode = { id: editingNodeId, type: 'end' };
        break;
    }

    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNodeId
          ? { ...n, data: { ...n.data, node: updatedNode } }
          : n
      )
    );

    setIsModalOpen(false);
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex - 1];
      const { flowNodes, generatedEdges, entryId } = convertDefToGraph(
        { entryNodeId: target.entryNodeId, nodes: target.nodes },
        handleOpenEdit,
        handleDeleteNode,
        handleSetEntryNode
      );
      setNodes(flowNodes);
      setEdges(generatedEdges);
      setEntryNodeId(entryId);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex + 1];
      const { flowNodes, generatedEdges, entryId } = convertDefToGraph(
        { entryNodeId: target.entryNodeId, nodes: target.nodes },
        handleOpenEdit,
        handleDeleteNode,
        handleSetEntryNode
      );
      setNodes(flowNodes);
      setEdges(generatedEdges);
      setEntryNodeId(entryId);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Save Draft to Backend
  const handleSaveDraft = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const def = serializeGraph();
      const updated = await flowsApi.update(id, def);
      setFlow(updated);
      showToast('Draft flow saved successfully!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save flow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Flow
  const handlePublish = async () => {
    if (!id) return;
    setIsPublishing(true);
    try {
      const def = serializeGraph();
      await flowsApi.update(id, def);
      const published = await flowsApi.publish(id);
      setFlow(published);
      showToast('Flow published successfully! It is now active on channels.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to publish flow', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const isValid = nodes.length > 0 && Boolean(entryNodeId);

  if (isLoading || !flow) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden bg-slate-50/50 rounded-3xl border border-gray-200/90 shadow-sm">
      {/* Top Floating Toolbar */}
      <div className="p-3 z-10">
        <FlowToolbar
          flowName={flow.name}
          flowStatus={flow.status}
          flowVersion={flow.version || 1}
          entryNodeId={entryNodeId}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isValid={isValid}
          onZoomIn={() => reactFlowInstance.zoomIn()}
          onZoomOut={() => reactFlowInstance.zoomOut()}
          onFitView={() => reactFlowInstance.fitView({ padding: 0.2 })}
          onAddNode={handleAddNewNode}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={(deletedNodes) => {
            deletedNodes.forEach((dn) => handleDeleteNode(dn.id));
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'custom' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />

          {/* Minimap Viewport Overlay */}
          <MiniMap
            nodeStrokeColor="#94a3b8"
            nodeColor={(n) => {
              if (n.data?.node?.type === 'template') return '#10b981';
              if (n.data?.node?.type === 'wait') return '#f59e0b';
              if (n.data?.node?.type === 'message') return '#0284c7';
              if (n.data?.node?.type === 'condition') return '#ea580c';
              if (n.data?.node?.type === 'input') return '#9333ea';
              return '#64748b';
            }}
            className="!rounded-2xl !border !border-gray-200/80 !shadow-lg !bg-white/90 !backdrop-blur-sm !m-4"
          />

          {/* Canvas Helper Legend */}
          <Panel position="top-right" className="bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-gray-200 shadow-xs text-[10px] space-y-1">
            <span className="font-bold text-gray-700 block">Port Color Guide</span>
            <div className="flex items-center gap-1.5 text-sky-700">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> Continue / Next
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp Delivered
            </div>
            <div className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> WhatsApp Failed / Error
            </div>
            <div className="flex items-center gap-1.5 text-purple-700">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Quick-Reply Buttons
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* ================= Node Editor Modal ================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Configure Node: ${editingNodeId}`}
        description="Set up step properties, Meta templates, BullMQ wait timers, and automatic retry rules"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Node ID" value={editingNodeId} disabled required />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Step Type
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as FlowNodeType)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
              >
                <option value="message">Send Message</option>
                <option value="template">WhatsApp Approved Template (Meta)</option>
                <option value="wait">Wait / Delay Queue (BullMQ)</option>
                <option value="input">User Input</option>
                <option value="condition">Condition Branch</option>
                <option value="action">Webhook Action</option>
                <option value="handoff">Human Handoff</option>
                <option value="end">End Flow</option>
              </select>
            </div>
          </div>

          {/* Flow Entry Point Setting */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-gray-800">Flow Entry Point</span>
                <p className="text-[11px] text-gray-500">
                  {editingNodeId === entryNodeId
                    ? 'This is the starting step when a conversation starts.'
                    : 'Designate this step as the start of the flow.'}
                </p>
              </div>
            </div>
            {editingNodeId === entryNodeId ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                Active Entry
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleSetEntryNode(editingNodeId)}
              >
                Set as Entry
              </Button>
            )}
          </div>

          {/* Form fields: Message */}
          {nodeType === 'message' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Message Text
                </label>
                <textarea
                  rows={3}
                  placeholder="Hi {{name}}, here is your update..."
                  value={nodeText}
                  onChange={(e) => setNodeText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              {/* Automatic Retry on Failure */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 space-y-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-amber-600" /> Automatic Retry on Ecosystem Error
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Max Retry Attempts"
                    type="number"
                    min="0"
                    max="10"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    helperText="0 = no auto-retry (routes to Failed port)"
                  />
                  <Input
                    label="Retry Delay (Seconds)"
                    type="number"
                    min="5"
                    value={retryDelaySeconds}
                    onChange={(e) => setRetryDelaySeconds(Number(e.target.value))}
                    helperText="Delay between retry attempts"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form fields: WhatsApp Template */}
          {nodeType === 'template' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Meta WhatsApp Template
                </label>
                {availableTemplates.length > 0 ? (
                  <select
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="">-- Choose Approved Template --</option>
                    {availableTemplates.map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} ({t.status} - {t.language})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="e.g. order_update_v1"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Language Code"
                  value={templateLanguage}
                  onChange={(e) => setTemplateLanguage(e.target.value)}
                  required
                />
                <Input
                  label="Save Tap Result As"
                  placeholder="e.g. choice"
                  value={templateSaveAs}
                  onChange={(e) => setTemplateSaveAs(e.target.value)}
                />
              </div>

              {/* Template Dynamic Params */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Dynamic Parameters</span>
                  <button
                    type="button"
                    onClick={() => setTemplateParams([...templateParams, { key: String(templateParams.length + 1), value: '' }])}
                    className="text-xs text-primary-600 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Param
                  </button>
                </div>
                {templateParams.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      placeholder="Key (e.g. 1)"
                      value={p.key}
                      onChange={(e) => {
                        const copy = [...templateParams];
                        copy[idx].key = e.target.value;
                        setTemplateParams(copy);
                      }}
                      className="w-1/3 rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white"
                    />
                    <input
                      placeholder="Value (e.g. {{userName}})"
                      value={p.value}
                      onChange={(e) => {
                        const copy = [...templateParams];
                        copy[idx].value = e.target.value;
                        setTemplateParams(copy);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setTemplateParams(templateParams.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Template Buttons */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-purple-600" /> Quick-Reply Button Ports
                  </span>
                  <button
                    type="button"
                    onClick={() => setTemplateButtons([...templateButtons, { buttonText: '', next: '' }])}
                    className="text-xs text-purple-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Button
                  </button>
                </div>
                {templateButtons.map((btn, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      placeholder="Button Label (e.g. Track Order)"
                      value={btn.buttonText}
                      onChange={(e) => {
                        const copy = [...templateButtons];
                        copy[idx].buttonText = e.target.value;
                        setTemplateButtons(copy);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setTemplateButtons(templateButtons.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form fields: Wait Node */}
          {nodeType === 'wait' && (
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> BullMQ Delayed Execution Timer
              </span>
              <p className="text-xs text-amber-900">
                Pushes the execution task into Redis delayed queue. When the timer expires, the worker awakens the flow.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Duration Value"
                  type="number"
                  min="1"
                  value={nodeWaitDuration}
                  onChange={(e) => setNodeWaitDuration(Number(e.target.value))}
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit
                  </label>
                  <select
                    value={nodeWaitUnit}
                    onChange={(e) => setNodeWaitUnit(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours (e.g. 1 hour = 3600s)</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form fields: Input */}
          {nodeType === 'input' && (
            <div className="space-y-3">
              <Input
                label="Prompt Question"
                placeholder="What is your email address?"
                value={nodePrompt}
                onChange={(e) => setNodePrompt(e.target.value)}
                required
              />
              <Input
                label="Save Answer As (Variable)"
                placeholder="e.g. userEmail"
                value={nodeSaveAs}
                onChange={(e) => setNodeSaveAs(e.target.value)}
                required
              />
            </div>
          )}

          {/* Form fields: Condition */}
          {nodeType === 'condition' && (
            <div className="space-y-3">
              <Input
                label="Variable Name to Evaluate"
                placeholder="e.g. userChoice"
                value={conditionVar}
                onChange={(e) => setConditionVar(e.target.value)}
                required
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Branch Equality Rules</span>
                  <button
                    type="button"
                    onClick={() => setConditionBranches([...conditionBranches, { equals: '', next: '' }])}
                    className="text-xs text-primary-600 font-semibold"
                  >
                    + Add Branch
                  </button>
                </div>
                {conditionBranches.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      placeholder="Equals (e.g. Yes)"
                      value={b.equals}
                      onChange={(e) => {
                        const copy = [...conditionBranches];
                        copy[idx].equals = e.target.value;
                        setConditionBranches(copy);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setConditionBranches(conditionBranches.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form fields: Action */}
          {nodeType === 'action' && (
            <Input
              label="Webhook URL"
              placeholder="https://api.example.com/webhook"
              value={nodeUrl}
              onChange={(e) => setNodeUrl(e.target.value)}
              required
            />
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                handleDeleteNode(editingNodeId);
                setIsModalOpen(false);
              }}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Node
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Apply Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const FlowEditorPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowEditorCanvas />
    </ReactFlowProvider>
  );
};
