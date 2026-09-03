import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  MessageSquare,
  FileText,
  Clock,
  GitBranch,
  Globe,
  UserCheck,
  StopCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Repeat,
  Layers,
  Trash2,
  Edit2,
  Flag,
} from 'lucide-react';
import type { FlowNode } from '../../types';
import { Badge } from '../common/Badge';
import { cn } from '../../lib/utils';

export interface FlowNodeData {
  node: FlowNode;
  isEntry: boolean;
  onEdit: (node: FlowNode) => void;
  onDelete: (id: string) => void;
  onSetEntry?: (id: string) => void;
}

export const FlowCanvasNode: React.FC<NodeProps<FlowNodeData>> = memo(({ data, selected }) => {
  const { node, isEntry, onEdit, onDelete, onSetEntry } = data;

  const getNodeIcon = () => {
    switch (node.type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      case 'template':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'wait':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'input':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'condition':
        return <GitBranch className="w-4 h-4 text-orange-600" />;
      case 'action':
        return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'handoff':
        return <UserCheck className="w-4 h-4 text-rose-600" />;
      case 'end':
        return <StopCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNodeBadge = () => {
    switch (node.type) {
      case 'message':
        return <Badge variant="primary" size="sm">Message</Badge>;
      case 'template':
        return <Badge variant="success" size="sm">WhatsApp Template</Badge>;
      case 'wait':
        return <Badge variant="warning" size="sm">Wait / Retry</Badge>;
      case 'input':
        return <Badge variant="purple" size="sm">Input</Badge>;
      case 'condition':
        return <Badge variant="warning" size="sm">Condition</Badge>;
      case 'action':
        return <Badge variant="secondary" size="sm">Webhook</Badge>;
      case 'handoff':
        return <Badge variant="danger" size="sm">Handoff</Badge>;
      case 'end':
        return <Badge variant="outline" size="sm">End</Badge>;
    }
  };

  return (
    <div
      className={cn(
        'w-[280px] rounded-2xl bg-white/95 backdrop-blur-sm border transition-all duration-150 shadow-md select-none',
        selected
          ? 'border-primary-600 ring-2 ring-primary-500/20 shadow-lg'
          : isEntry
          ? 'border-primary-400 ring-1 ring-primary-400/30'
          : 'border-gray-200/90 hover:border-gray-300'
      )}
    >
      {/* Top Input Handle for incoming connections */}
      {node.type !== 'input' && !isEntry && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          className="w-3 h-3 bg-gray-400 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
      )}
      {isEntry && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          className="w-3 h-3 bg-primary-500 border-2 border-white rounded-full"
        />
      )}

      {/* Card Header */}
      <div className="p-3 bg-gray-50/80 rounded-t-2xl border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-white shadow-xs border border-gray-100 shrink-0">
            {getNodeIcon()}
          </div>
          <div className="overflow-hidden">
            <span className="font-mono text-xs font-bold text-gray-800 truncate block">
              {node.id}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {getNodeBadge()}
              {isEntry && (
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1 rounded">
                  ENTRY
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isEntry && onSetEntry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetEntry(node.id);
              }}
              className="p-1 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Set as Flow Entry Node"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-white transition-colors"
            title="Edit Node"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body Content */}
      <div className="p-3 text-xs text-gray-600 space-y-2">
        {node.type === 'message' && (
          <div>
            <p className="line-clamp-2 text-gray-800 font-medium italic">
              "{node.text || 'Empty message'}"
            </p>
            {node.retryConfig?.maxRetries ? (
              <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-1">
                <Repeat className="w-3 h-3" /> Auto-retry: {node.retryConfig.maxRetries}x ({node.retryConfig.delaySeconds || 60}s)
              </p>
            ) : null}
          </div>
        )}

        {node.type === 'template' && (
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950 font-mono text-[11px] truncate">
              {node.templateName}
            </p>
            <p className="text-[10px] text-gray-500">
              Lang: {node.language || 'en_US'} • {node.buttons?.length || 0} buttons
            </p>
            {node.templateParams && Object.keys(node.templateParams).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(node.templateParams).slice(0, 3).map(([k, v]) => (
                  <span key={k} className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono">
                    {`{{${k}}}`}➔{v}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {node.type === 'wait' && (
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/50 space-y-0.5">
            <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Delay: {node.duration} {node.durationUnit || 'seconds'}
            </span>
            <p className="text-[10px] text-amber-800">
              Suspends flow via BullMQ delayed queue
            </p>
          </div>
        )}

        {node.type === 'input' && (
          <div>
            <p className="line-clamp-2 text-gray-800 font-medium">
              "{node.prompt}"
            </p>
            <p className="text-[10px] text-purple-700 mt-1">
              Saves to: <code className="font-mono bg-purple-50 px-1 py-0.5 rounded font-bold">{node.saveAs}</code>
            </p>
          </div>
        )}

        {node.type === 'condition' && (
          <div className="space-y-1">
            <p className="text-[11px] text-gray-700">
              Evaluate: <code className="font-mono bg-orange-50 text-orange-900 px-1 rounded font-bold">{node.variable}</code>
            </p>
            <p className="text-[10px] text-gray-500">
              {node.branches?.length || 0} branches configured
            </p>
          </div>
        )}

        {node.type === 'action' && (
          <div>
            <p className="font-mono text-[10px] text-indigo-900 truncate bg-indigo-50/60 p-1 rounded">
              {node.url}
            </p>
          </div>
        )}

        {node.type === 'handoff' && (
          <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Hands off to human agent
          </p>
        )}

        {node.type === 'end' && (
          <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <StopCircle className="w-3 h-3" /> Terminates execution
          </p>
        )}
      </div>

      {/* ================= Output Ports / Handles ================= */}
      {/* 1. Message / Template Nodes: Continue, Delivered, Failed Status Ports */}
      {(node.type === 'message' || node.type === 'template') && (
        <div className="pt-2 pb-2 px-3 bg-gray-50/60 rounded-b-2xl border-t border-gray-100 space-y-1.5">
          {/* Continue Port */}
          <div className="relative flex items-center justify-between text-[10px] text-sky-700 py-0.5">
            <span className="flex items-center gap-1 font-semibold">
              <ArrowRight className="w-3 h-3 text-sky-500" /> Continue (Default)
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="continue"
              className="!right-[-7px] w-2.5 h-2.5 bg-sky-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
            />
          </div>

          {/* Delivered Port */}
          <div className="relative flex items-center justify-between text-[10px] text-emerald-700 py-0.5">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> On Delivered (WhatsApp)
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="delivered"
              className="!right-[-7px] w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
            />
          </div>

          {/* Failed Port */}
          <div className="relative flex items-center justify-between text-[10px] text-rose-700 py-0.5">
            <span className="flex items-center gap-1 font-semibold">
              <XCircle className="w-3 h-3 text-rose-600" /> On Failed / Ecosystem Error
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="failed"
              className="!right-[-7px] w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
            />
          </div>

          {/* Template Button Quick-Reply Ports */}
          {node.type === 'template' && node.buttons && node.buttons.length > 0 && (
            <div className="pt-1 border-t border-gray-200/60 space-y-1">
              {node.buttons.map((btn, i) => (
                <div key={i} className="relative flex items-center justify-between text-[10px] text-purple-800 py-0.5">
                  <span className="font-semibold truncate max-w-[190px]">
                    🔘 "{btn.buttonText}"
                  </span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`btn_${i}`}
                    className="!right-[-7px] w-2.5 h-2.5 bg-purple-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Condition Node: Branch Ports */}
      {node.type === 'condition' && (
        <div className="pt-2 pb-2 px-3 bg-gray-50/60 rounded-b-2xl border-t border-gray-100 space-y-1.5">
          {node.branches?.map((branch, i) => (
            <div key={i} className="relative flex items-center justify-between text-[10px] text-orange-900 py-0.5">
              <span className="font-semibold">
                If equals "{branch.equals}"
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`branch_${i}`}
                className="!right-[-7px] w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
              />
            </div>
          ))}
          <div className="relative flex items-center justify-between text-[10px] text-gray-600 py-0.5">
            <span className="font-medium">Default Fallback</span>
            <Handle
              type="source"
              position={Position.Right}
              id="default"
              className="!right-[-7px] w-2.5 h-2.5 bg-gray-400 border-2 border-white rounded-full hover:scale-125 transition-transform"
            />
          </div>
        </div>
      )}

      {/* 3. Wait / Action / Input Node Single Output Port */}
      {(node.type === 'wait' || node.type === 'input' || node.type === 'action') && (
        <div className="pt-2 pb-2 px-3 bg-gray-50/60 rounded-b-2xl border-t border-gray-100">
          <div className="relative flex items-center justify-between text-[10px] text-gray-700 py-0.5">
            <span className="flex items-center gap-1 font-semibold">
              <ArrowRight className="w-3 h-3 text-gray-500" /> Next Step
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id="continue"
              className="!right-[-7px] w-2.5 h-2.5 bg-gray-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
            />
          </div>
        </div>
      )}
    </div>
  );
});
