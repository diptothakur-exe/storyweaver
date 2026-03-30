-- ============================================================
-- StoryWeaver — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Stories ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
  id          TEXT PRIMARY KEY,                       -- nanoid generated on client
  title       TEXT NOT NULL DEFAULT 'Untitled Story',
  summary     TEXT,
  genre       TEXT NOT NULL DEFAULT 'fantasy',
  tone        TEXT NOT NULL DEFAULT 'dramatic',
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stories IS 'Top-level story metadata';

-- ─── Nodes ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,                       -- nanoid
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'logical'
                CHECK (type IN ('root','logical','twist','dramatic','creative')),
  title       TEXT,
  parent_id   TEXT REFERENCES nodes(id) ON DELETE SET NULL,
  expanded    BOOLEAN NOT NULL DEFAULT FALSE,
  depth       INT NOT NULL DEFAULT 0,
  pos_x       INT NOT NULL DEFAULT 0,
  pos_y       INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_story_id  ON nodes(story_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);

COMMENT ON TABLE nodes IS 'Individual story scene nodes';
COMMENT ON COLUMN nodes.type IS 'Branch category: root|logical|twist|dramatic|creative';
COMMENT ON COLUMN nodes.depth IS 'Depth in the narrative tree (0 = root)';

-- ─── Edges ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_edges (
  id          TEXT PRIMARY KEY,
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  source      TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target      TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'smoothstep',
  edge_type   TEXT,                                   -- matches branch type
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source, target)
);

CREATE INDEX IF NOT EXISTS idx_edges_story_id ON story_edges(story_id);
CREATE INDEX IF NOT EXISTS idx_edges_source   ON story_edges(source);
CREATE INDEX IF NOT EXISTS idx_edges_target   ON story_edges(target);

COMMENT ON TABLE story_edges IS 'Graph edges connecting story nodes';

-- ─── Row Level Security ────────────────────────────────────────────────────
-- Enable RLS so each user only sees their own stories.
-- For a public/demo app without auth, you can skip this
-- and use the open policies below instead.

ALTER TABLE stories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_edges ENABLE ROW LEVEL SECURITY;

-- ── Option A: Auth-gated (recommended for production) ─────────────────────

-- Stories: user sees and modifies their own rows
CREATE POLICY "stories_select_own"  ON stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stories_insert_own"  ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_update_own"  ON stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stories_delete_own"  ON stories FOR DELETE USING (auth.uid() = user_id);

-- Nodes: access if story belongs to user
CREATE POLICY "nodes_select_own"    ON nodes FOR SELECT
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));
CREATE POLICY "nodes_insert_own"    ON nodes FOR INSERT
  WITH CHECK (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));
CREATE POLICY "nodes_update_own"    ON nodes FOR UPDATE
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));
CREATE POLICY "nodes_delete_own"    ON nodes FOR DELETE
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));

-- Edges
CREATE POLICY "edges_select_own"    ON story_edges FOR SELECT
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));
CREATE POLICY "edges_insert_own"    ON story_edges FOR INSERT
  WITH CHECK (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));
CREATE POLICY "edges_update_own"    ON story_edges FOR UPDATE
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));
CREATE POLICY "edges_delete_own"    ON story_edges FOR DELETE
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));

-- ── Option B: Open (for demo/local dev — comment out Option A first) ───────
-- Uncomment the block below to allow all anon access:

/*
CREATE POLICY "stories_open"     ON stories     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nodes_open"       ON nodes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "story_edges_open" ON story_edges FOR ALL USING (true) WITH CHECK (true);
*/

-- ─── Updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Useful views ──────────────────────────────────────────────────────────

-- Story summary with node count
CREATE OR REPLACE VIEW story_overview AS
SELECT
  s.id,
  s.title,
  s.genre,
  s.tone,
  s.created_at,
  s.updated_at,
  COUNT(DISTINCT n.id)  AS node_count,
  COUNT(DISTINCT e.id)  AS edge_count
FROM stories s
LEFT JOIN nodes       n ON n.story_id = s.id
LEFT JOIN story_edges e ON e.story_id = s.id
GROUP BY s.id, s.title, s.genre, s.tone, s.created_at, s.updated_at;

COMMENT ON VIEW story_overview IS 'Aggregated story metadata with graph stats';
