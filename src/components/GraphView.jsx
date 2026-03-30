import React, { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Zap, BookOpen } from 'lucide-react'
import { nanoid } from 'nanoid'
import clsx from 'clsx'

import useStoryStore from '../store/useStoryStore'
import NodeComponent from './NodeComponent'
import { generateBranches } from '../lib/api'

// Register custom node type
const NODE_TYPES = { storyNode: NodeComponent }

// ─── Tooltip component ──────────────────────────────────────────────────────
function Tooltip({ tooltip }) {
  if (!tooltip) return null
  return (
    <AnimatePresence>
      <motion.div
        key="tooltip"
        initial={{ opacity: 0, y: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="tooltip"
        style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top:  tooltip.y - 8,
          maxWidth: 240,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        {tooltip.text}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6 mx-auto w-20 h-20 rounded-2xl bg-ink-800/60
            border border-ink-700 flex items-center justify-center"
        >
          <BookOpen className="w-9 h-9 text-amber-400/60" />
        </motion.div>
        <h2 className="font-display text-2xl font-semibold text-ink-300 mb-2">
          Your story awaits
        </h2>
        <p className="text-sm text-ink-500 max-w-xs mx-auto leading-relaxed">
          Enter an opening scene in the left panel and click{' '}
          <span className="text-amber-400 font-medium">Start Story Graph</span>{' '}
          to begin weaving your narrative.
        </p>
      </motion.div>
    </div>
  )
}

// ─── Generating overlay ────────────────────────────────────────────────────
function GeneratingBadge({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30
            flex items-center gap-2 px-4 py-2
            bg-ink-800/90 backdrop-blur-sm border border-amber-500/30
            rounded-full shadow-glow-amber text-sm font-body text-amber-300"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <Zap className="w-3.5 h-3.5" />
          Weaving branches…
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Inner graph (needs ReactFlow context) ─────────────────────────────────
function GraphInner() {
  const {
    nodes, edges, selectedNodeId, isGenerating,
    storyGenre, storyTone, storySummary, tooltip,
    onNodesChange, onEdgesChange, onConnect,
    selectNode, addBranches, setGenerating, setTooltip,
  } = useStoryStore()

  const { fitView, getNode } = useReactFlow()
  const tooltipTimeout = useRef(null)

  // ── Node click → generate branches ──────────────────────────────
  const handleNodeClick = useCallback(async (_evt, node) => {
    const { id, data } = node
    selectNode(id)

    // Don't re-expand already expanded nodes
    if (data.expanded) return
    if (isGenerating) return

    setGenerating(true, id)
    try {
      const result = await generateBranches({
        context: data.content,
        summary: storySummary,
        genre:   storyGenre,
        tone:    storyTone,
      })

      const branches = result.branches.map((b) => ({
        ...b,
        id: b.id || nanoid(),
      }))

      addBranches(id, branches)

      // Fit view after a tick to include new nodes
      setTimeout(() => {
        fitView({ padding: 0.25, duration: 600 })
      }, 50)
    } catch (err) {
      console.error('[StoryWeaver] Branch generation failed:', err)
      // Show error toast — minimal in-graph indicator
      alert(`Generation error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }, [
    isGenerating, storySummary, storyGenre, storyTone,
    selectNode, addBranches, setGenerating, fitView,
  ])

  // ── Hover tooltip ─────────────────────────────────────────────────
  const handleNodeMouseEnter = useCallback((_evt, node) => {
    clearTimeout(tooltipTimeout.current)
    // Get screen coords from DOM element
    const el = document.querySelector(`[data-id="${node.id}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    setTooltip({
      text: node.data.content,
      x: rect.right,
      y: rect.top + rect.height / 2,
    })
  }, [setTooltip])

  const handleNodeMouseLeave = useCallback(() => {
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 200)
  }, [setTooltip])

  // ── Highlighted edge styles based on path ──────────────────────
  const styledEdges = useMemo(() => {
    const store = useStoryStore.getState()
    const { highlightedPath } = store
    return edges.map((e) => {
      const onPath = highlightedPath.includes(e.source) && highlightedPath.includes(e.target)
      return {
        ...e,
        className: onPath ? 'path-highlighted' : '',
        style: onPath
          ? { stroke: '#f59e0b', strokeWidth: 2.5 }
          : { stroke: '#30363d', strokeWidth: 1.5 },
      }
    })
  }, [edges])

  return (
    <div className="flex-1 relative overflow-hidden">
      <GeneratingBadge visible={isGenerating} />
      <Tooltip tooltip={tooltip} />

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#30363d', strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.15}
        maxZoom={2}
        snapToGrid={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#21262d"
        />
        <Controls
          position="bottom-right"
          showInteractive={false}
        />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => {
            const type = n.data?.type
            const colors = {
              root: '#f59e0b', logical: '#2dd4bf',
              twist: '#a78bfa', dramatic: '#f87171', creative: '#34d399',
            }
            return colors[type] || '#484f58'
          }}
          maskColor="rgba(8,10,15,0.75)"
          style={{ borderRadius: 8, overflow: 'hidden' }}
        />
      </ReactFlow>

      {nodes.length === 0 && <EmptyState />}
    </div>
  )
}

// ─── Public export: wraps in ReactFlowProvider ─────────────────────────────
export default function GraphView() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  )
}
