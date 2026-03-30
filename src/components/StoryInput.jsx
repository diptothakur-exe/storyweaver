import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Sparkles, Save, FolderOpen, ChevronDown,
  RotateCcw, Loader2, Check, AlertCircle, Clock,
} from 'lucide-react'
import useStoryStore from '../store/useStoryStore'
import { saveStory, listStories, loadStory } from '../lib/supabase'
import { BRANCH_TYPES } from '../store/useStoryStore'
import clsx from 'clsx'

const GENRES = ['fantasy', 'sci-fi', 'thriller', 'romance', 'horror', 'mystery', 'adventure']
const TONES  = ['dramatic', 'whimsical', 'dark', 'hopeful', 'tense', 'melancholic', 'epic']

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field appearance-none pr-8 capitalize"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-ink-900 capitalize">{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
      </div>
    </div>
  )
}

function SaveStatus({ status }) {
  const configs = {
    saving: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: 'Saving…',  cls: 'text-amber-400' },
    saved:  { icon: <Check    className="w-3.5 h-3.5" />,             text: 'Saved',     cls: 'text-teal-400'  },
    error:  { icon: <AlertCircle className="w-3.5 h-3.5" />,          text: 'Error',     cls: 'text-crimson-400' },
  }
  const cfg = configs[status]
  if (!cfg) return null
  return (
    <span className={clsx('flex items-center gap-1 text-xs font-medium', cfg.cls)}>
      {cfg.icon} {cfg.text}
    </span>
  )
}

function StoryCard({ story, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onSelect(story.id)}
      className="w-full text-left px-3 py-2.5 rounded-lg bg-ink-800 hover:bg-ink-700
        border border-ink-700 hover:border-amber-500/40
        transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-ink-100 group-hover:text-amber-300 transition-colors line-clamp-1">
          {story.title || 'Untitled Story'}
        </span>
        <span className="badge bg-ink-700 text-ink-400 shrink-0 capitalize">{story.genre}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Clock className="w-3 h-3 text-ink-500" />
        <span className="text-xs text-ink-500">
          {new Date(story.updated_at).toLocaleDateString()}
        </span>
      </div>
    </motion.button>
  )
}

export default function StoryInput() {
  const store = useStoryStore()
  const {
    initialized, storyTitle, storyGenre, storyTone,
    storySummary, storyId, nodes, edges,
    saveStatus, loadedStories, showLoadPanel,
    setSaveStatus, setLoadedStories, setShowLoadPanel,
    startStory, loadStory: loadStoreStory, reset,
  } = store

  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [genre,   setGenre]   = useState('fantasy')
  const [tone,    setTone]    = useState('dramatic')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const supEnabled = !!(import.meta.env.VITE_SUPABASE_URL)

  // ── Start a new story ──────────────────────────────────────────
  const handleStart = () => {
    if (!content.trim()) return
    startStory({
      title:   title.trim() || 'Untitled Story',
      content: content.trim(),
      genre,
      tone,
      summary: summary.trim() || content.trim(),
    })
  }

  // ── Save current story ─────────────────────────────────────────
  const handleSave = async () => {
    if (!supEnabled) { alert('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'); return }
    setSaveStatus('saving')
    try {
      await saveStory({
        storyId, title: storyTitle, genre: storyGenre,
        tone: storyTone, summary: storySummary, nodes, edges,
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      console.error(err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // ── Open load panel ────────────────────────────────────────────
  const handleOpenLoad = async () => {
    if (!supEnabled) { alert('Supabase not configured.'); return }
    setLoadError('')
    setShowLoadPanel(true)
    try {
      const stories = await listStories()
      setLoadedStories(stories)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  // ── Load a story ───────────────────────────────────────────────
  const handleSelectStory = async (id) => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await loadStory(id)
      loadStoreStory(data)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Legend ─────────────────────────────────────────────────────
  const legend = Object.entries(BRANCH_TYPES).filter(([k]) => k !== 'root')

  return (
    <aside className="w-72 shrink-0 h-full bg-ink-900 border-r border-ink-700
      flex flex-col shadow-panel overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-ink-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20
            flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-base font-semibold text-ink-50 leading-tight">
              StoryWeaver
            </h1>
            <p className="text-xs text-ink-500 font-body">AI Narrative Engine</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto panel-scroll px-5 py-4 space-y-5">

        {!initialized ? (
          /* ── New Story Form ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="panel-section">
              <p className="text-xs text-ink-400 font-body leading-relaxed">
                Begin your narrative. AI will branch each scene into{' '}
                <span className="text-amber-400 font-semibold">4 diverging paths</span>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Story Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Last Archive…"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Opening Scene</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the opening scene of your story…"
                  rows={5}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Story Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief context to guide the AI…"
                  rows={2}
                  className="input-field"
                />
              </div>

              <Select label="Genre" value={genre} onChange={setGenre} options={GENRES} />
              <Select label="Tone"  value={tone}  onChange={setTone}  options={TONES}  />
            </div>

            <button
              onClick={handleStart}
              disabled={!content.trim()}
              className="btn-primary w-full"
            >
              <Sparkles className="w-4 h-4" />
              Start Story Graph
            </button>

            {/* Load existing */}
            <button onClick={handleOpenLoad} className="btn-secondary w-full">
              <FolderOpen className="w-4 h-4" />
              Load Saved Story
            </button>
          </motion.div>
        ) : (
          /* ── Active Story Controls ── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="panel-section">
              <div className="mb-2">
                <span className="label">Active Story</span>
                <p className="text-sm font-display font-semibold text-amber-300 truncate">
                  {storyTitle || 'Untitled'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="badge bg-ink-800 text-ink-300 capitalize">{storyGenre}</span>
                <span className="badge bg-ink-800 text-ink-300 capitalize">{storyTone}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="panel-section">
              <span className="label">How to use</span>
              <ul className="space-y-2">
                {[
                  'Click any node to generate branches',
                  'Hover a node to preview content',
                  'Selected path highlights in gold',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink-400">
                    <span className="text-amber-500 mt-0.5 font-mono">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Branch type legend */}
            <div className="panel-section">
              <span className="label">Branch Types</span>
              <div className="space-y-1.5">
                {legend.map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: val.color }}
                    />
                    <span className="text-xs text-ink-300 font-body">{val.label}</span>
                    <span className="text-xs text-ink-600 ml-auto font-mono">{val.icon}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="panel-section">
              <span className="label">Graph Stats</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Scenes',  value: nodes.length },
                  { label: 'Choices', value: edges.length },
                ].map((s) => (
                  <div key={s.label} className="bg-ink-800 rounded-lg px-3 py-2 border border-ink-700">
                    <p className="font-display text-xl font-bold text-amber-400">{s.value}</p>
                    <p className="text-xs text-ink-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save / Load / Reset */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button onClick={handleSave} disabled={saveStatus === 'saving'} className="btn-primary flex-1 mr-2">
                  {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                <button onClick={handleOpenLoad} className="btn-secondary px-3">
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between h-5">
                <SaveStatus status={saveStatus} />
                {!supEnabled && (
                  <span className="text-xs text-ink-500">Configure Supabase to save</span>
                )}
              </div>
              <button onClick={reset} className="btn-ghost w-full text-crimson-400 hover:text-crimson-300 hover:bg-crimson-500/10">
                <RotateCcw className="w-3.5 h-3.5" />
                New Story
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Load Panel Overlay ── */}
      <AnimatePresence>
        {showLoadPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-ink-950/95 backdrop-blur-sm
              flex flex-col p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-ink-50">Saved Stories</h3>
              <button
                onClick={() => setShowLoadPanel(false)}
                className="btn-ghost p-1.5"
              >✕</button>
            </div>

            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
            )}
            {loadError && (
              <p className="text-xs text-crimson-400 bg-crimson-500/10 rounded-lg p-3">
                {loadError}
              </p>
            )}
            {!loading && !loadError && (
              <div className="flex-1 overflow-y-auto panel-scroll space-y-2">
                {loadedStories.length === 0 ? (
                  <p className="text-sm text-ink-500 text-center py-8">No saved stories yet.</p>
                ) : (
                  loadedStories.map((s) => (
                    <StoryCard key={s.id} story={s} onSelect={handleSelectStory} />
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
