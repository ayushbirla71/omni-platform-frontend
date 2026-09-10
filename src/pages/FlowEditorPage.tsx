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
  Image as ImageIcon,
  Video,
  File,
  RefreshCw,
  HelpCircle,
  XCircle,
  CheckCheck,
  Globe,
  Info,
  Smartphone,
  ExternalLink,
  Brain,
  Split,
  ShieldAlert,
} from 'lucide-react';
import { flowsApi, channelsApi, knowledgeBasesApi } from '../api';
import type {
  Flow,
  FlowDefinition,
  FlowNode,
  FlowNodeType,
  WhatsAppTemplate,
  Channel,
  KnowledgeBase,
} from '../types';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { Badge } from '../components/common/Badge';
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

  // Available WhatsApp templates from connected active channels
  const [availableTemplates, setAvailableTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Available Knowledge Bases
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoadingKBs, setIsLoadingKBs] = useState(false);

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

  // Form fields: Message / Input / Action / Wait / Condition
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

  // AI Agent Form fields
  const [aiKbId, setAiKbId] = useState('');
  const [aiQueryVar, setAiQueryVar] = useState('last_message');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSaveResponseAs, setAiSaveResponseAs] = useState('ai_response');
  const [aiSendImmediately, setAiSendImmediately] = useState(true);
  const [aiFallbackThreshold, setAiFallbackThreshold] = useState(0.2);

  // Intent Router Form fields
  const [intentInputVar, setIntentInputVar] = useState('last_message');
  const [intentBranches, setIntentBranches] = useState<Array<{ intent: string; next: string }>>([
    { intent: 'support', next: '' },
    { intent: 'sales', next: '' },
  ]);
  const [intentDefault, setIntentDefault] = useState('');
  const [intentSaveIntentAs, setIntentSaveIntentAs] = useState('detected_intent');
  const [intentSaveSentimentAs, setIntentSaveSentimentAs] = useState('detected_sentiment');

  // WhatsApp Template Form fields
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en_US');
  const [templateHeaderType, setTemplateHeaderType] = useState<'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | undefined>();
  const [templateHeaderValue, setTemplateHeaderValue] = useState('');
  const [templateParams, setTemplateParams] = useState<Array<{ key: string; value: string }>>([]);
  const [templateButtons, setTemplateButtons] = useState<Array<{ buttonText: string; next: string }>>([]);
  const [templateSaveAs, setTemplateSaveAs] = useState('');

  // Filter available templates strictly to APPROVED templates from Meta
  const approvedTemplates = useMemo(() => {
    return availableTemplates.filter((t) => t.status === 'APPROVED');
  }, [availableTemplates]);

  // Selected template object from Meta catalog
  const selectedMetaTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.name === templateName);
  }, [availableTemplates, templateName]);

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

        // 3. AI Agent node (Answered vs Fallback)
        if (n.type === 'ai_agent') {
          if (n.next) {
            generatedEdges.push({
              id: `e-${n.id}-continue-${n.next}`,
              source: n.id,
              sourceHandle: 'continue',
              target: n.next,
              type: 'custom',
              label: 'Answered',
            });
          }
          if (n.onFallback) {
            generatedEdges.push({
              id: `e-${n.id}-fallback-${n.onFallback}`,
              source: n.id,
              sourceHandle: 'fallback',
              target: n.onFallback,
              type: 'custom',
              label: `Fallback (<${n.fallbackThreshold ?? 0.2})`,
            });
          }
        }

        // 4. Intent Router branches
        if (n.type === 'intent_router') {
          n.branches?.forEach((b, bIdx) => {
            if (b.next) {
              generatedEdges.push({
                id: `e-${n.id}-intent-${bIdx}-${b.next}`,
                source: n.id,
                sourceHandle: `intent_${bIdx}`,
                target: b.next,
                type: 'custom',
                label: `Intent: "${b.intent}"`,
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

        // 5. Wait / Input / Action
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
    },
    []
  );

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
      } else if (baseNode.type === 'ai_agent') {
        const contEdge = outgoing.find((e) => e.sourceHandle === 'continue');
        const fallbackEdge = outgoing.find((e) => e.sourceHandle === 'fallback');
        baseNode.next = contEdge?.target || undefined;
        baseNode.onFallback = fallbackEdge?.target || undefined;
      } else if (baseNode.type === 'intent_router') {
        if (baseNode.branches) {
          baseNode.branches = baseNode.branches.map((b, bIdx) => {
            const bEdge = outgoing.find((e) => e.sourceHandle === `intent_${bIdx}`);
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

  // Fetch WhatsApp Templates from all connected WhatsApp channels
  const loadAvailableTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
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
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Fetch Knowledge Bases for AI Agent RAG nodes
  const loadAvailableKnowledgeBases = useCallback(async () => {
    setIsLoadingKBs(true);
    try {
      const res = await knowledgeBasesApi.list();
      const items = res.items || (Array.isArray(res) ? res : []);
      setKnowledgeBases(items);
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingKBs(false);
    }
  }, []);

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

    // AI Agent fields
    if (targetNode.type === 'ai_agent') {
      setAiKbId(targetNode.knowledgeBaseId || '');
      setAiQueryVar(targetNode.queryVariable || 'last_message');
      setAiPrompt(targetNode.prompt || '');
      setAiSaveResponseAs(targetNode.saveAs || targetNode.saveResponseAs || 'ai_response');
      setAiSendImmediately(targetNode.sendImmediately !== false);
      setAiFallbackThreshold(targetNode.fallbackThreshold ?? 0.2);
    } else {
      setAiKbId(knowledgeBases[0]?.id || '');
      setAiQueryVar('last_message');
      setAiPrompt('');
      setAiSaveResponseAs('ai_response');
      setAiSendImmediately(true);
      setAiFallbackThreshold(0.2);
    }

    // Intent Router fields
    if (targetNode.type === 'intent_router') {
      setIntentInputVar(targetNode.inputVariable || 'last_message');
      setIntentBranches(targetNode.branches?.length ? targetNode.branches : [
        { intent: 'support', next: '' },
        { intent: 'sales', next: '' },
      ]);
      setIntentDefault(targetNode.default || '');
      setIntentSaveIntentAs(targetNode.saveIntentAs || 'detected_intent');
      setIntentSaveSentimentAs(targetNode.saveSentimentAs || 'detected_sentiment');
    } else {
      setIntentInputVar('last_message');
      setIntentBranches([
        { intent: 'support', next: '' },
        { intent: 'sales', next: '' },
      ]);
      setIntentDefault('');
      setIntentSaveIntentAs('detected_intent');
      setIntentSaveSentimentAs('detected_sentiment');
    }

    if (targetNode.type === 'template') {
      setTemplateName(targetNode.templateName || '');
      setTemplateLanguage(targetNode.language || 'en_US');
      setTemplateHeaderType(targetNode.headerType);
      setTemplateHeaderValue(targetNode.headerValue || '');
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
      setTemplateHeaderType(undefined);
      setTemplateHeaderValue('');
      setTemplateParams([]);
      setTemplateButtons([]);
      setTemplateSaveAs('');
    }

    setIsModalOpen(true);
  }, [knowledgeBases]);

  // When a user picks an approved template from Meta catalog
  const handleSelectTemplate = (selectedTplName: string) => {
    setTemplateName(selectedTplName);
    const found = availableTemplates.find((t) => t.name === selectedTplName);
    if (!found) return;

    setTemplateLanguage(found.language || 'en_US');

    // 1. Header Component Decomposition
    const headerComp = found.components?.find((c) => c.type === 'HEADER');
    if (headerComp) {
      const format = (headerComp.format as any) || (headerComp.text ? 'TEXT' : undefined);
      setTemplateHeaderType(format);
      if (format === 'TEXT' && headerComp.text) {
        setTemplateHeaderValue(headerComp.text);
      } else {
        setTemplateHeaderValue('');
      }
    } else {
      setTemplateHeaderType(undefined);
      setTemplateHeaderValue('');
    }

    // 2. Body Parameters Decomposition
    const bodyComp = found.components?.find((c) => c.type === 'BODY');
    if (bodyComp?.text) {
      const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(bodyComp.text)) !== null) {
        if (!matches.includes(match[1])) {
          matches.push(match[1]);
        }
      }
      if (matches.length > 0) {
        setTemplateParams(matches.map((k) => ({ key: k, value: '' })));
      } else {
        setTemplateParams([]);
      }
    } else {
      setTemplateParams([]);
    }

    // 3. Quick-Reply & CTA Buttons Decomposition
    const buttonsComp = found.components?.find((c) => c.type === 'BUTTONS');
    if (buttonsComp?.buttons && buttonsComp.buttons.length > 0) {
      setTemplateButtons(
        buttonsComp.buttons.map((btn) => ({
          buttonText: btn.text,
          next: '',
        }))
      );
    } else {
      setTemplateButtons([]);
    }
  };

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

      await Promise.all([loadAvailableTemplates(), loadAvailableKnowledgeBases()]);
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
      else if (params.sourceHandle === 'fallback') edgeLabel = 'On Fallback';
      else if (params.sourceHandle === 'default') edgeLabel = 'Default';
      else if (params.sourceHandle?.startsWith('intent_')) {
        const iIdx = Number(params.sourceHandle.replace('intent_', ''));
        const sourceNode = nodes.find((n) => n.id === params.source)?.data.node;
        if (sourceNode?.type === 'intent_router' && sourceNode.branches?.[iIdx]) {
          edgeLabel = `Intent: "${sourceNode.branches[iIdx].intent}"`;
        }
      } else if (params.sourceHandle?.startsWith('branch_')) {
        const bIdx = Number(params.sourceHandle.replace('branch_', ''));
        const sourceNode = nodes.find((n) => n.id === params.source)?.data.node;
        if (sourceNode?.type === 'condition' && sourceNode.branches?.[bIdx]) {
          edgeLabel = `== "${sourceNode.branches[bIdx].equals}"`;
        }
      } else if (params.sourceHandle?.startsWith('btn_')) {
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
      case 'template': {
        const firstApproved = approvedTemplates[0];
        if (firstApproved) {
          newNodeData = {
            id: generatedId,
            type: 'template',
            templateName: firstApproved.name,
            language: firstApproved.language || 'en_US',
          };
        } else {
          newNodeData = {
            id: generatedId,
            type: 'template',
            templateName: 'order_update',
            language: 'en_US',
          };
        }
        break;
      }
      case 'wait':
        newNodeData = { id: generatedId, type: 'wait', duration: 3600, durationUnit: 'seconds' };
        break;
      case 'input':
        newNodeData = { id: generatedId, type: 'input', prompt: 'What is your email?', saveAs: 'userEmail' };
        break;
      case 'condition':
        newNodeData = { id: generatedId, type: 'condition', variable: 'userChoice', branches: [{ equals: '1', next: '' }] };
        break;
      case 'ai_agent':
        newNodeData = {
          id: generatedId,
          type: 'ai_agent',
          knowledgeBaseId: knowledgeBases[0]?.id || '',
          queryVariable: 'last_message',
          prompt: '',
          saveResponseAs: 'ai_response',
          sendImmediately: true,
          fallbackThreshold: 0.2,
        };
        break;
      case 'intent_router':
        newNodeData = {
          id: generatedId,
          type: 'intent_router',
          inputVariable: 'last_message',
          branches: [
            { intent: 'support', next: '' },
            { intent: 'sales', next: '' },
          ],
          default: '',
          saveIntentAs: 'detected_intent',
          saveSentimentAs: 'detected_sentiment',
        };
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
          if (p.key.trim() && p.value.trim()) pObj[p.key.trim()] = p.value.trim();
        });
        updatedNode = {
          id: editingNodeId,
          type: 'template',
          templateName: templateName.trim(),
          language: templateLanguage.trim() || 'en_US',
          headerType: templateHeaderType,
          headerValue: templateHeaderValue.trim() || undefined,
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
      case 'ai_agent':
        updatedNode = {
          id: editingNodeId,
          type: 'ai_agent',
          knowledgeBaseId: aiKbId.trim() || undefined,
          queryVariable: aiQueryVar.trim() || 'last_message',
          prompt: aiPrompt.trim() || undefined,
          saveResponseAs: aiSaveResponseAs.trim() || 'ai_response',
          sendImmediately: aiSendImmediately,
          fallbackThreshold: Number(aiFallbackThreshold) || 0.2,
          next: nodeNext.trim() || undefined,
        };
        break;
      case 'intent_router':
        updatedNode = {
          id: editingNodeId,
          type: 'intent_router',
          inputVariable: intentInputVar.trim() || 'last_message',
          branches: intentBranches.filter((b) => b.intent.trim()),
          default: intentDefault.trim() || undefined,
          saveIntentAs: intentSaveIntentAs.trim() || undefined,
          saveSentimentAs: intentSaveSentimentAs.trim() || undefined,
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

  // Helper for live preview body interpolation
  const previewBodyText = useMemo(() => {
    const rawBody = selectedMetaTemplate?.components?.find((c) => c.type === 'BODY')?.text;
    if (!rawBody) {
      if (templateName) {
        return `Hi {{1}}, this is an official update regarding your request.`;
      }
      return 'Select or enter an approved WhatsApp template to preview the message content.';
    }

    let interpolated = rawBody;
    templateParams.forEach((p) => {
      const regex = new RegExp(`\\{\\{\\s*${p.key}\\s*\\}\\}`, 'g');
      interpolated = interpolated.replace(regex, p.value ? p.value : `[${p.key}]`);
    });
    return interpolated;
  }, [selectedMetaTemplate, templateParams, templateName]);

  const previewFooterText = useMemo(() => {
    return selectedMetaTemplate?.components?.find((c) => c.type === 'FOOTER')?.text;
  }, [selectedMetaTemplate]);

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
        description="Set up step properties, Meta approved WhatsApp templates, AI RAG agents, intent routers, delayed timers, and retry rules."
        maxWidth={nodeType === 'template' || nodeType === 'ai_agent' || nodeType === 'intent_router' ? '2xl' : 'lg'}
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
                <option value="ai_agent">AI Agent (RAG Knowledge Base)</option>
                <option value="intent_router">Intent Router (NLU / Classification)</option>
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
                  placeholder="Hi {{contact.name}}, here is your update..."
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

          {/* ================= Form fields: WhatsApp Approved Template (Meta) ================= */}
          {nodeType === 'template' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
              {/* Left Column: Template Configuration */}
              <div className="lg:col-span-7 space-y-4">
                {/* Meta Approved Template Selector */}
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Meta Approved Template Catalog
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={loadAvailableTemplates}
                      disabled={isLoadingTemplates}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 p-1 rounded-md hover:bg-emerald-100/60 transition-colors"
                      title="Refresh approved templates from connected WhatsApp channels"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
                      <span>{isLoadingTemplates ? 'Syncing...' : 'Sync with Meta'}</span>
                    </button>
                  </div>

                  {approvedTemplates.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={templateName}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full rounded-xl border border-emerald-200 px-3.5 py-2 text-xs font-semibold bg-white text-gray-800 shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        required
                      >
                        <option value="">-- Choose Approved Template --</option>
                        {approvedTemplates.map((t) => (
                          <option key={t.id || t.name} value={t.name}>
                            ✅ {t.name} ({t.category} • {t.language})
                          </option>
                        ))}
                      </select>
                      {selectedMetaTemplate && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Status: APPROVED
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Category: {selectedMetaTemplate.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Language: {selectedMetaTemplate.language}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">No Meta-approved templates found on active WhatsApp channels.</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Make sure your WhatsApp Business Account is connected in Channels, or enter the template name manually below.
                          </p>
                        </div>
                      </div>
                      <Input
                        label="Template Name (Manual)"
                        placeholder="e.g. order_confirmation_v1"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Input
                      label="Language Code"
                      placeholder="en_US"
                      value={templateLanguage}
                      onChange={(e) => setTemplateLanguage(e.target.value)}
                      required
                    />
                    <Input
                      label="Save Button Tap As"
                      placeholder="e.g. userChoice"
                      value={templateSaveAs}
                      onChange={(e) => setTemplateSaveAs(e.target.value)}
                      helperText="Stores customer quick-reply text in variables"
                    />
                  </div>
                </div>

                {/* 1. Header Component Configuration */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                      {templateHeaderType === 'TEXT' && <FileText className="w-3.5 h-3.5 text-sky-600" />}
                      {templateHeaderType === 'IMAGE' && <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />}
                      {templateHeaderType === 'VIDEO' && <Video className="w-3.5 h-3.5 text-purple-600" />}
                      {templateHeaderType === 'DOCUMENT' && <File className="w-3.5 h-3.5 text-amber-600" />}
                      {!templateHeaderType && <Layers className="w-3.5 h-3.5 text-gray-500" />}
                      Template Header Component
                    </span>
                    <select
                      value={templateHeaderType || ''}
                      onChange={(e) => setTemplateHeaderType(e.target.value ? (e.target.value as any) : undefined)}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs bg-white font-medium text-gray-700"
                    >
                      <option value="">None (No Header)</option>
                      <option value="TEXT">🔤 Text Header</option>
                      <option value="IMAGE">🖼️ Image Header</option>
                      <option value="VIDEO">🎬 Video Header</option>
                      <option value="DOCUMENT">📄 Document / PDF Header</option>
                    </select>
                  </div>

                  {templateHeaderType === 'TEXT' && (
                    <Input
                      label="Header Text"
                      placeholder="e.g. Order #{{orderId}} Confirmation"
                      value={templateHeaderValue}
                      onChange={(e) => setTemplateHeaderValue(e.target.value)}
                      helperText="Supports static text or dynamic variables like {{orderId}}"
                    />
                  )}

                  {(templateHeaderType === 'IMAGE' ||
                    templateHeaderType === 'VIDEO' ||
                    templateHeaderType === 'DOCUMENT') && (
                    <div className="space-y-1.5">
                      <Input
                        label={`${templateHeaderType} Media Link or Variable`}
                        placeholder="https://example.com/file.jpg or {{deal.invoiceUrl}}"
                        value={templateHeaderValue}
                        onChange={(e) => setTemplateHeaderValue(e.target.value)}
                        helperText={`Direct HTTPS URL or dynamic variable for Meta ${templateHeaderType} delivery.`}
                      />
                      <p className="text-[10px] text-gray-500">
                        {templateHeaderType === 'IMAGE' && 'Supported formats: JPG, PNG (Max 5MB)'}
                        {templateHeaderType === 'VIDEO' && 'Supported formats: MP4 (Max 16MB)'}
                        {templateHeaderType === 'DOCUMENT' && 'Supported formats: PDF, DOCX (Max 100MB)'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Dynamic Body Parameter Mappings */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                        Body Parameters Mapping
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Map Meta template placeholders ({'{{1}}'}, {'{{2}}'}) to static values or flow variables.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTemplateParams([
                          ...templateParams,
                          { key: String(templateParams.length + 1), value: '' },
                        ])
                      }
                      className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Param
                    </button>
                  </div>

                  {templateParams.length === 0 ? (
                    <div className="p-3 bg-white rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                      No dynamic parameters in this template body. Click "Add Param" if required.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templateParams.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                          <div className="w-28 shrink-0">
                            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Placeholder</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-xs text-gray-400 font-mono">{'{{'}</span>
                              <input
                                placeholder="1"
                                value={p.key}
                                onChange={(e) => {
                                  const copy = [...templateParams];
                                  copy[idx].key = e.target.value;
                                  setTemplateParams(copy);
                                }}
                                className="w-full rounded-lg border border-gray-200 pl-6 pr-6 py-1 text-xs font-mono font-bold text-emerald-800 bg-emerald-50/40"
                              />
                              <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-mono">{'}}'}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Value / Flow Variable</span>
                            <input
                              placeholder="e.g. {{contact.name}} or 49.99"
                              value={p.value}
                              onChange={(e) => {
                                const copy = [...templateParams];
                                copy[idx].value = e.target.value;
                                setTemplateParams(copy);
                              }}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-primary-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setTemplateParams(templateParams.filter((_, i) => i !== idx))}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors mt-3"
                            title="Remove parameter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* Quick Variable Inserts */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-400 font-medium">Quick Insert:</span>
                        {['{{contact.name}}', '{{contact.email}}', '{{deal.title}}', '{{deal.value}}'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              const emptyIdx = templateParams.findIndex((p) => !p.value);
                              if (emptyIdx !== -1) {
                                const copy = [...templateParams];
                                copy[emptyIdx].value = v;
                                setTemplateParams(copy);
                              } else {
                                setTemplateParams([
                                  ...templateParams,
                                  { key: String(templateParams.length + 1), value: v },
                                ]);
                              }
                            }}
                            className="text-[10px] font-mono bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded transition-colors"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Quick-Reply Button Ports */}
                <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-950 flex items-center gap-1 uppercase tracking-wider">
                        <MousePointerClick className="w-3.5 h-3.5 text-purple-600" /> Quick-Reply Button Ports
                      </span>
                      <p className="text-[11px] text-purple-800">
                        Each button exposes an interactive output handle (<code>btn_0</code>, <code>btn_1</code>) on canvas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTemplateButtons([...templateButtons, { buttonText: '', next: '' }])}
                      className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Button
                    </button>
                  </div>

                  {templateButtons.length === 0 ? (
                    <div className="p-3 bg-white/80 rounded-xl border border-dashed border-purple-200 text-center text-xs text-purple-600">
                      No interactive quick-reply buttons configured for this template.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templateButtons.map((btn, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                          <span className="text-xs font-mono font-bold text-purple-700 px-1.5 py-0.5 rounded bg-purple-50 shrink-0">
                            Port: btn_{idx}
                          </span>
                          <input
                            placeholder="Button Text (e.g. Yes, Confirm Order)"
                            value={btn.buttonText}
                            onChange={(e) => {
                              const copy = [...templateButtons];
                              copy[idx].buttonText = e.target.value;
                              setTemplateButtons(copy);
                            }}
                            className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-purple-500 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setTemplateButtons(templateButtons.filter((_, i) => i !== idx))}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Automatic Retry on Failure */}
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1 uppercase tracking-wider">
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
                      helperText="Delay between retry passes"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live WhatsApp Chat Bubble Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full sticky top-0 bg-[#efeae2] rounded-3xl p-4 border border-gray-300 shadow-inner flex flex-col space-y-3 min-h-[460px]">
                  {/* WhatsApp Simulation Top Header */}
                  <div className="bg-[#008069] text-white p-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs border border-white/30">
                        WA
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold">Business WhatsApp</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 fill-emerald-400" />
                        </div>
                        <span className="text-[9px] text-emerald-100">Official Business Account</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-medium">
                      PREVIEW
                    </span>
                  </div>

                  {/* WhatsApp Message Bubble Container */}
                  <div className="flex-1 flex flex-col justify-start space-y-2 overflow-y-auto">
                    <div className="self-start max-w-[94%] bg-white rounded-2xl rounded-tl-xs shadow-md border border-gray-200/60 overflow-hidden">
                      {/* Media or Text Header Preview */}
                      {templateHeaderType === 'TEXT' && templateHeaderValue && (
                        <div className="p-3 pb-1 font-bold text-xs text-gray-900 border-b border-gray-100">
                          {templateHeaderValue}
                        </div>
                      )}

                      {templateHeaderType === 'IMAGE' && (
                        <div className="bg-emerald-950/10 flex flex-col items-center justify-center min-h-[120px] p-2 text-center border-b border-gray-100">
                          {templateHeaderValue && (templateHeaderValue.startsWith('http://') || templateHeaderValue.startsWith('https://')) ? (
                            <img
                              src={templateHeaderValue}
                              alt="Header Preview"
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-emerald-800 p-3">
                              <ImageIcon className="w-8 h-8 opacity-70" />
                              <span className="text-[11px] font-semibold">Image Header</span>
                              <span className="text-[9px] font-mono text-gray-600 truncate max-w-[200px]">
                                {templateHeaderValue || '{{variable}} or image link'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {templateHeaderType === 'VIDEO' && (
                        <div className="bg-purple-950/10 flex flex-col items-center justify-center min-h-[120px] p-4 text-center border-b border-gray-100 text-purple-900">
                          <Video className="w-8 h-8 opacity-70 mb-1" />
                          <span className="text-[11px] font-semibold">Video Header Attachment</span>
                          <span className="text-[9px] font-mono text-gray-600 truncate max-w-[200px]">
                            {templateHeaderValue || '{{videoUrl}}'}
                          </span>
                        </div>
                      )}

                      {templateHeaderType === 'DOCUMENT' && (
                        <div className="bg-amber-950/10 flex items-center gap-2 p-3 border-b border-gray-100 text-amber-950">
                          <File className="w-7 h-7 text-amber-700 shrink-0" />
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold truncate block">PDF Document</span>
                            <span className="text-[10px] font-mono text-gray-600 truncate block">
                              {templateHeaderValue || '{{invoicePdfUrl}}'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Body Text */}
                      <div className="p-3 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                        {previewBodyText}
                      </div>

                      {/* Footer Text */}
                      {previewFooterText && (
                        <div className="px-3 pb-1 text-[10px] text-gray-400 italic">
                          {previewFooterText}
                        </div>
                      )}

                      {/* Timestamp & Delivered Checkmarks */}
                      <div className="px-3 pb-2 flex items-center justify-end gap-1 text-[9px] text-gray-400">
                        <span>12:00 PM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      </div>

                      {/* Buttons in Message Bubble */}
                      {templateButtons.length > 0 && (
                        <div className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50/50">
                          {templateButtons.map((b, i) => (
                            <div
                              key={i}
                              className="py-2 px-3 text-center text-xs font-semibold text-sky-600 flex items-center justify-center gap-1.5"
                            >
                              <MousePointerClick className="w-3.5 h-3.5 text-sky-500" />
                              <span>{b.buttonText || `Button ${i + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 font-medium">
                    ⚡ Live WhatsApp chat simulation with dynamic variables
                  </div>
                </div>
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

          {/* Form fields: AI Agent (RAG Knowledge Base) */}
          {nodeType === 'ai_agent' && (
            <div className="space-y-4">
              <div className="p-3 bg-violet-50/80 rounded-2xl border border-violet-200/80 space-y-1">
                <div className="flex items-center gap-2 text-violet-900 font-bold text-xs">
                  <Brain className="w-4 h-4 text-violet-600" />
                  RAG Knowledge Base Agent
                </div>
                <p className="text-[11px] text-violet-700">
                  Retrieves semantic context chunks from your vector knowledge base and generates an AI answer using Claude/GPT.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Knowledge Base Source <span className="text-rose-500">*</span>
                </label>
                <select
                  value={aiKbId}
                  onChange={(e) => setAiKbId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                >
                  <option value="">-- Select Knowledge Base --</option>
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={kb.id}>
                      {kb.name} ({kb.documentCount || 0} docs, {kb.embeddingModel || 'text-embedding-3-small'})
                    </option>
                  ))}
                </select>
                {knowledgeBases.length === 0 && !isLoadingKBs && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    No knowledge bases found. You can create one in{' '}
                    <a href="/knowledge-bases" target="_blank" rel="noreferrer" className="underline font-semibold">
                      AI Knowledge Base
                    </a>.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Query Variable"
                  placeholder="last_message"
                  value={aiQueryVar}
                  onChange={(e) => setAiQueryVar(e.target.value)}
                  helperText="Variable containing user question"
                />
                <Input
                  label="Save Response As"
                  placeholder="ai_response"
                  value={aiSaveResponseAs}
                  onChange={(e) => setAiSaveResponseAs(e.target.value)}
                  helperText="Stores AI output in flow context"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  System Persona & Prompt Override (Optional)
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="You are a helpful customer support agent for our company. Keep answers concise, polite, and directly address customer questions using the knowledge base context."
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Leave blank to use default knowledge base system instructions.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Confidence Fallback Threshold
                  </label>
                  <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                    {aiFallbackThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={aiFallbackThreshold}
                  onChange={(e) => setAiFallbackThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0.0 (Lenient / Always Answer)</span>
                  <span>0.5 (Balanced)</span>
                  <span>1.0 (Strict / High Match Only)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  If knowledge base similarity is below this score, flow routes to the <code className="text-amber-700 font-bold">Fallback</code> handle.
                </p>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-white">
                <input
                  type="checkbox"
                  id="aiSendImmediately"
                  checked={aiSendImmediately}
                  onChange={(e) => setAiSendImmediately(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="aiSendImmediately" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Automatically send response message directly to WhatsApp recipient
                </label>
              </div>
            </div>
          )}

          {/* Form fields: Intent Router (NLU / Intent Classifier) */}
          {nodeType === 'intent_router' && (
            <div className="space-y-4">
              <div className="p-3 bg-fuchsia-50/80 rounded-2xl border border-fuchsia-200/80 space-y-1">
                <div className="flex items-center gap-2 text-fuchsia-900 font-bold text-xs">
                  <Split className="w-4 h-4 text-fuchsia-600" />
                  Intent Router (Zero-Shot NLU Classifier)
                </div>
                <p className="text-[11px] text-fuchsia-700">
                  Analyzes incoming text with zero-shot classification and dynamically branches to target nodes based on customer intent.
                </p>
              </div>

              <Input
                label="Input Variable"
                placeholder="last_message"
                value={intentInputVar}
                onChange={(e) => setIntentInputVar(e.target.value)}
                helperText="Variable containing customer message to classify"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Intent Branches
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIntentBranches([...intentBranches, { intent: '', next: '' }])}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Intent
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {intentBranches.map((branch, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-[11px] font-bold text-fuchsia-800 w-6 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. sales, support, pricing, billing, speak_to_human"
                        value={branch.intent}
                        onChange={(e) => {
                          const copy = [...intentBranches];
                          copy[idx].intent = e.target.value;
                          setIntentBranches(copy);
                        }}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-600"
                      />
                      <button
                        type="button"
                        onClick={() => setIntentBranches(intentBranches.filter((_, i) => i !== idx))}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Remove Intent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {intentBranches.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      No intent branches configured. Click "Add Intent" above.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <Input
                  label="Save Detected Intent As"
                  placeholder="detected_intent"
                  value={intentSaveIntentAs}
                  onChange={(e) => setIntentSaveIntentAs(e.target.value)}
                  helperText="Context variable for intent"
                />
                <Input
                  label="Save Detected Sentiment As"
                  placeholder="detected_sentiment"
                  value={intentSaveSentimentAs}
                  onChange={(e) => setIntentSaveSentimentAs(e.target.value)}
                  helperText="positive / neutral / negative"
                />
              </div>
            </div>
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
