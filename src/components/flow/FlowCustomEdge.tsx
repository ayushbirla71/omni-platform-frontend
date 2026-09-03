import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import { X } from 'lucide-react';

export const FlowCustomEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  label,
  selected,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine stroke color based on port type / handle
  let strokeColor = '#0284c7'; // default sky blue for continue
  let strokeWidth = selected ? 2.5 : 1.8;
  let strokeDasharray: string | undefined = undefined;

  if (sourceHandleId === 'delivered') {
    strokeColor = '#10b981'; // emerald green for delivered
  } else if (sourceHandleId === 'failed') {
    strokeColor = '#ef4444'; // rose red for failed / error
    strokeDasharray = '5 5';
  } else if (sourceHandleId?.startsWith('btn_')) {
    strokeColor = '#8b5cf6'; // purple for template quick replies
  } else if (sourceHandleId?.startsWith('branch_')) {
    strokeColor = '#f97316'; // orange for conditions
  } else if (sourceHandleId === 'default') {
    strokeColor = '#6b7280'; // gray for default fallback
  }

  const handleEdgeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onDeleteEdge) {
      data.onDeleteEdge(id);
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group"
        >
          {label ? (
            <span
              style={{ borderColor: strokeColor, color: strokeColor }}
              className="px-1.5 py-0.5 rounded-full bg-white/95 text-[9px] font-bold border shadow-xs flex items-center gap-1"
            >
              {label}
              <button
                onClick={handleEdgeDelete}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-0.5 rounded"
                title="Delete Connection"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ) : (
            <button
              onClick={handleEdgeDelete}
              className="opacity-0 group-hover:opacity-100 p-1 bg-white border border-gray-300 rounded-full text-gray-500 hover:text-rose-600 shadow-xs transition-opacity"
              title="Delete connection"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
