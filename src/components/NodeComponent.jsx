import React, { memo, useState, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Loader2, GitBranch, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import useStoryStore from '../store/useStoryStore'
import { BRANCH_TYPES } from '../store/useStoryStore'

/**
 * Individual story scene node rendered inside React Flow
 */
const NodeComponent = memo(function NodeComponent({ id, data, selected }) {
  const { isGenerating, generatingNodeId, highlightedPath } = useStoryStore()
  const [hovered, setHovered] = useState(false)

  const typeInfo = BRANCH_TYPES[data.type] || BRANCH_TYPES.root
  const isOnPath  = highlightedPath.includes(id)
  const isLoading = isGenerating && generatingNodeId === id
  const isRoot    = data.type === 'root'

  // Truncate content for display
  const preview = data.content?.length > 80
    ? data.content.slice(0, 77) + '…'
    : data.content

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        'node-wrapper relative rounded-xl border transition-all duration-200',
        'select-none cursor-pointer font-body',
        isRoot ? 'w-64' : 'w-56',
        // Border + glow based on state
        selected || isOnPath
          ? 'border-amber-500/80 shadow-node-selected'
          : hovered
          ? 'border-ink-500 shadow-node'
          : 'border-ink-700 shadow-node',
        // Background
        isRoot ? 'bg-ink-800/90' : 'bg-ink-900/90',
        data.expanded && 'opacity-90',
      )}
      style={{
        backdropFilter: 'blur(8px)',
        ...(isOnPath && !selected && {
          boxShadow: `0 0 0 1px ${typeInfo.color}55, 0 4px 20px rgba(0,0,0,0.5)`,
          borderColor: `${typeInfo.color}55`,
        }),
      }}
    >
      {/* Top accent bar — type color */}
      <div
        className="h-0.5 rounded-t-xl w-full"
        style={{ background: typeInfo.color }}
      />

      {/* Content */}
      <div className="px-3.5 py-3">
        {/* Type badge + depth */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-base leading-none"
              style={{ color: typeInfo.color }}
            >
              {typeInfo.icon}
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: typeInfo.color }}
            >
              {typeInfo.label}
            </span>
          </div>
          {data.depth > 0 && (
            <span className="text-xs text-ink-600 font-mono">
              D{data.depth}
            </span>
          )}
        </div>

        {/* Scene content */}
        <p className="text-xs text-ink-200 leading-relaxed font-body">
          {preview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-ink-700/50">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating…
            </span>
          ) : data.expanded ? (
            <span className="flex items-center gap-1.5 text-xs text-ink-500">
              <CheckCircle2 className="w-3 h-3 text-teal-500" />
              Expanded
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-ink-500">
              <GitBranch className="w-3 h-3" />
              Click to branch
            </span>
          )}

          {/* Path indicator */}
          {isOnPath && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-amber-400"
              style={{ boxShadow: '0 0 6px rgba(245,158,11,0.8)' }}
            />
          )}
        </div>
      </div>

      {/* Loading pulse overlay */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ background: `${typeInfo.color}18` }}
        />
      )}

      {/* React Flow Handles */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-ink-600 !border-ink-500"
        />
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-ink-600 !border-ink-500"
      />
    </motion.div>
  )
})

export default NodeComponent
