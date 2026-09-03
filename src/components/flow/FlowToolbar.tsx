import React from 'react';
import {
  Undo2,
  Redo2,
  Save,
  Play,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  Layers,
  MessageSquare,
  FileText,
  Clock,
  HelpCircle,
  GitBranch,
  Globe,
  UserCheck,
  StopCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { FlowNodeType } from '../../types';

interface FlowToolbarProps {
  flowName: string;
  flowStatus: 'draft' | 'published';
  flowVersion: number;
  entryNodeId: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isValid: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAddNode: (type: FlowNodeType) => void;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({
  flowName,
  flowStatus,
  flowVersion,
  entryNodeId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveDraft,
  onPublish,
  isSaving,
  isPublishing,
  isValid,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddNode,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = React.useState(false);

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xs">
        {/* Left: Breadcrumbs & Flow Metadata */}
        <div className="flex items-center gap-3">
          <Link to="/flows">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Flows
            </Button>
          </Link>
          <div className="h-5 w-px bg-gray-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 truncate max-w-[240px]">
                {flowName}
              </h1>
              <Badge variant={flowStatus === 'published' ? 'success' : 'warning'} size="sm">
                {flowStatus}
              </Badge>
              <Badge variant="outline" size="sm">
                v{flowVersion}
              </Badge>
            </div>
            <p className="text-[11px] text-gray-500">
              Entry: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">{entryNodeId || 'None'}</code>
            </p>
          </div>
        </div>

        {/* Right: History Stack & Actions */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo Buttons */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            isLoading={isSaving}
            disabled={flowStatus === 'published'}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPublish}
            disabled={!isValid}
            isLoading={isPublishing}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Floating Canvas Controls Toolbar (Bottom Center / Left) */}
      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/90 shadow-lg">
        {/* Add Node Menu */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Node
          </Button>

          {isAddMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-60 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 space-y-1 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 block py-1">
                Select Step to Add
              </span>
              <button
                onClick={() => { onAddNode('message'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-sky-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-sky-600" /> Send Message
              </button>
              <button
                onClick={() => { onAddNode('template'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> WhatsApp Template
              </button>
              <button
                onClick={() => { onAddNode('wait'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-amber-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <Clock className="w-4 h-4 text-amber-600" /> Wait / Delay Queue
              </button>
              <button
                onClick={() => { onAddNode('input'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-purple-600" /> User Input
              </button>
              <button
                onClick={() => { onAddNode('condition'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-orange-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <GitBranch className="w-4 h-4 text-orange-600" /> Branch Condition
              </button>
              <button
                onClick={() => { onAddNode('action'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <Globe className="w-4 h-4 text-indigo-600" /> Webhook Action
              </button>
              <button
                onClick={() => { onAddNode('handoff'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-rose-600" /> Human Handoff
              </button>
              <button
                onClick={() => { onAddNode('end'); setIsAddMenuOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-xs font-medium text-gray-800 flex items-center gap-2 transition-colors"
              >
                <StopCircle className="w-4 h-4 text-gray-600" /> End Flow
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Viewport Zoom & Fit Controls */}
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onFitView}
          className="p-1.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
