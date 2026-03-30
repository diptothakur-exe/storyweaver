import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[StoryWeaver] Supabase env vars not set. ' +
    'Storage features will be disabled.'
  )
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Stories ────────────────────────────────────────────────────

/**
 * Save or upsert a story + its nodes/edges
 */
export async function saveStory({ storyId, title, genre, tone, summary, nodes, edges }) {
  if (!supabase) throw new Error('Supabase not configured')

  // Upsert story record
  const { data: story, error: storyErr } = await supabase
    .from('stories')
    .upsert({
      id: storyId,
      title,
      genre,
      tone,
      summary,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (storyErr) throw storyErr

  // Delete old nodes for this story, then re-insert
  await supabase.from('nodes').delete().eq('story_id', storyId)
  await supabase.from('story_edges').delete().eq('story_id', storyId)

  if (nodes.length > 0) {
    const { error: nodesErr } = await supabase.from('nodes').insert(
      nodes.map((n) => ({
        id:         n.id,
        story_id:   storyId,
        content:    n.data.content,
        type:       n.data.type,
        title:      n.data.title,
        parent_id:  n.data.parentId,
        expanded:   n.data.expanded,
        depth:      n.data.depth,
        pos_x:      Math.round(n.position.x),
        pos_y:      Math.round(n.position.y),
        created_at: new Date().toISOString(),
      }))
    )
    if (nodesErr) throw nodesErr
  }

  if (edges.length > 0) {
    const { error: edgesErr } = await supabase.from('story_edges').insert(
      edges.map((e) => ({
        id:       e.id,
        story_id: storyId,
        source:   e.source,
        target:   e.target,
        type:     e.type,
        edge_type: e.data?.type,
      }))
    )
    if (edgesErr) throw edgesErr
  }

  return story
}

/**
 * Load all stories (metadata only)
 */
export async function listStories() {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('stories')
    .select('id, title, genre, tone, summary, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

/**
 * Load a specific story with nodes + edges
 */
export async function loadStory(storyId) {
  if (!supabase) throw new Error('Supabase not configured')

  const [{ data: story, error: se }, { data: dbNodes, error: ne }, { data: dbEdges, error: ee }] =
    await Promise.all([
      supabase.from('stories').select('*').eq('id', storyId).single(),
      supabase.from('nodes').select('*').eq('story_id', storyId),
      supabase.from('story_edges').select('*').eq('story_id', storyId),
    ])

  if (se) throw se
  if (ne) throw ne
  if (ee) throw ee

  // Reconstruct React Flow node/edge format
  const nodes = dbNodes.map((n) => ({
    id: n.id,
    type: 'storyNode',
    position: { x: n.pos_x, y: n.pos_y },
    data: {
      content:  n.content,
      type:     n.type,
      title:    n.title,
      expanded: n.expanded,
      depth:    n.depth,
      parentId: n.parent_id,
    },
  }))

  const edges = dbEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type || 'smoothstep',
    animated: false,
    data: { type: e.edge_type },
  }))

  return {
    storyId: story.id,
    title:   story.title,
    genre:   story.genre,
    tone:    story.tone,
    summary: story.summary,
    nodes,
    edges,
  }
}

/**
 * Check if branches for a node are already cached
 */
export async function getCachedBranches(nodeId) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('nodes')
    .select('id, content, type, title')
    .eq('parent_id', nodeId)

  if (error || !data || data.length === 0) return null
  return data
}
