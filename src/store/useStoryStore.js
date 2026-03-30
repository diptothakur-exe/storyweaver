import { create } from 'zustand'
import { nanoid } from 'nanoid'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'

/**
 * Branch type metadata
 */
export const BRANCH_TYPES = {
  root:      { label: 'Origin',     color: '#f59e0b', icon: '◈' },
  logical:   { label: 'Logical',    color: '#2dd4bf', icon: '→' },
  twist:     { label: 'Twist',      color: '#a78bfa', icon: '◌' },
  dramatic:  { label: 'Dramatic',   color: '#f87171', icon: '!' },
  creative:  { label: 'Creative',   color: '#34d399', icon: '✦' },
}

/**
 * Calculate layout position for new child nodes
 * radiates outward from parent based on sibling index
 */
export function calcChildPosition(parentPos, siblingIndex, totalSiblings) {
  const RADIUS   = 320
  const ARC      = Math.PI * 0.9           // 162° spread
  const startAngle = -ARC / 2 + Math.PI / 2
  const step     = totalSiblings > 1 ? ARC / (totalSiblings - 1) : 0
  const angle    = startAngle + step * siblingIndex
  return {
    x: parentPos.x + Math.cos(angle) * RADIUS,
    y: parentPos.y + Math.sin(angle) * RADIUS,
  }
}

const useStoryStore = create((set, get) => ({
  // ── Flow state ──────────────────────────────────────────────
  nodes: [],
  edges: [],
  selectedNodeId: null,
  highlightedPath: [],           // array of node ids on active path

  // ── Story metadata ──────────────────────────────────────────
  storyId: null,
  storyTitle: '',
  storyGenre: 'fantasy',
  storyTone: 'dramatic',
  storySummary: '',

  // ── UI state ────────────────────────────────────────────────
  isGenerating: false,
  generatingNodeId: null,        // which node is being expanded
  tooltip: null,                 // { text, x, y }
  saveStatus: 'idle',            // 'idle' | 'saving' | 'saved' | 'error'
  loadedStories: [],
  showLoadPanel: false,
  initialized: false,

  // ── React Flow callbacks ─────────────────────────────────────
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) =>
    set((state) => ({ edges: addEdge(connection, state.edges) })),

  // ── Story initialization ─────────────────────────────────────
  startStory: ({ title, content, genre, tone, summary }) => {
    const rootId = nanoid()
    const rootNode = {
      id: rootId,
      type: 'storyNode',
      position: { x: 0, y: 0 },
      data: {
        content,
        type: 'root',
        title: title || 'Chapter One',
        expanded: false,
        depth: 0,
        parentId: null,
      },
    }
    set({
      nodes: [rootNode],
      edges: [],
      storyId: nanoid(),
      storyTitle: title,
      storyGenre: genre,
      storyTone: tone,
      storySummary: summary,
      selectedNodeId: rootId,
      highlightedPath: [rootId],
      initialized: true,
      saveStatus: 'idle',
    })
  },

  // ── Node selection & path highlighting ──────────────────────
  selectNode: (nodeId) => {
    if (!nodeId) {
      set({ selectedNodeId: null, highlightedPath: [] })
      return
    }
    // Build path from root to this node
    const { nodes, edges } = get()
    const path = []
    let current = nodeId
    while (current) {
      path.unshift(current)
      const inEdge = edges.find((e) => e.target === current)
      current = inEdge ? inEdge.source : null
    }
    set({ selectedNodeId: nodeId, highlightedPath: path })
  },

  // ── Branch expansion ─────────────────────────────────────────
  addBranches: (parentId, branches) => {
    const { nodes, edges } = get()
    const parentNode = nodes.find((n) => n.id === parentId)
    if (!parentNode) return

    const newNodes = branches.map((branch, i) => {
      const position = calcChildPosition(
        parentNode.position,
        i,
        branches.length
      )
      return {
        id: branch.id,
        type: 'storyNode',
        position,
        data: {
          content: branch.text,
          type: branch.type,
          title: BRANCH_TYPES[branch.type]?.label || 'Branch',
          expanded: false,
          depth: (parentNode.data.depth || 0) + 1,
          parentId,
        },
      }
    })

    const newEdges = branches.map((branch) => ({
      id: `e-${parentId}-${branch.id}`,
      source: parentId,
      target: branch.id,
      type: 'smoothstep',
      animated: false,
      data: { type: branch.type },
    }))

    // Mark parent as expanded
    const updatedNodes = nodes.map((n) =>
      n.id === parentId
        ? { ...n, data: { ...n.data, expanded: true } }
        : n
    )

    set({
      nodes: [...updatedNodes, ...newNodes],
      edges: [...edges, ...newEdges],
    })
  },

  // ── Tooltip ──────────────────────────────────────────────────
  setTooltip: (tooltip) => set({ tooltip }),

  // ── Loading state ─────────────────────────────────────────────
  setGenerating: (isGenerating, nodeId = null) =>
    set({ isGenerating, generatingNodeId: isGenerating ? nodeId : null }),

  // ── Save/load status ──────────────────────────────────────────
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setLoadedStories: (loadedStories) => set({ loadedStories }),
  setShowLoadPanel: (showLoadPanel) => set({ showLoadPanel }),

  // ── Load a saved story ────────────────────────────────────────
  loadStory: ({ storyId, title, genre, tone, summary, nodes, edges }) => {
    set({
      storyId,
      storyTitle: title,
      storyGenre: genre || 'fantasy',
      storyTone: tone || 'dramatic',
      storySummary: summary || '',
      nodes,
      edges,
      selectedNodeId: null,
      highlightedPath: [],
      initialized: true,
      showLoadPanel: false,
      saveStatus: 'idle',
    })
  },

  // ── Reset ─────────────────────────────────────────────────────
  reset: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      highlightedPath: [],
      storyId: null,
      storyTitle: '',
      storySummary: '',
      initialized: false,
      saveStatus: 'idle',
    }),
}))

export default useStoryStore
