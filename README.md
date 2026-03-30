# StoryWeaver — AI Narrative Engine

> Build branching stories powered by AI. Visualize your narrative as a living node graph.

![StoryWeaver](https://img.shields.io/badge/StoryWeaver-v1.0-amber?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-purple?style=flat-square&logo=vite)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)

---

## Overview

StoryWeaver is a full-stack interactive storytelling application. Users enter an opening scene and the AI generates **4 diverging narrative branches** — logical, twist, dramatic, and creative. Each branch can be further expanded, creating a living graph of story possibilities.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18 + Vite 5                               |
| Styling    | Tailwind CSS 3                                  |
| Graph UI   | React Flow (@xyflow/react v12)                  |
| Animation  | Framer Motion                                   |
| State      | Zustand                                         |
| Backend    | Vercel Serverless Functions (`/api`)            |
| AI         | OpenRouter API (meta-llama/llama-3-8b-instruct) |
| Database   | Supabase (PostgreSQL)                           |

---

## Project Structure

```
storyweaver/
├── api/
│   └── generate.js          # Vercel serverless function — AI branch generation
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── StoryInput.jsx   # Left panel: input, controls, save/load
│   │   ├── GraphView.jsx    # React Flow canvas + interaction logic
│   │   └── NodeComponent.jsx # Custom story node renderer
│   ├── lib/
│   │   ├── api.js           # Frontend API client
│   │   └── supabase.js      # Supabase client + CRUD helpers
│   ├── store/
│   │   └── useStoryStore.js # Zustand global state
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── schema.sql               # Supabase PostgreSQL schema
├── .env.example             # Environment variable template
├── vercel.json              # Vercel deployment config
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Prerequisites

- Node.js **18+**
- npm or yarn
- [Vercel CLI](https://vercel.com/docs/cli) (for local dev with serverless functions)
- [Supabase account](https://supabase.com) (free tier works)
- [OpenRouter account](https://openrouter.ai) (free tier works)

---

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/yourname/storyweaver.git
cd storyweaver
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (server-side only)
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free

# Site URL
YOUR_SITE_URL=http://localhost:3000
```

### 3. Set up Supabase database

1. Go to [supabase.com](https://supabase.com) → create a new project
2. Open the **SQL Editor** tab
3. Paste the entire contents of `schema.sql` and click **Run**
4. Copy your project URL and anon key from **Settings → API**

> **For local dev without auth:** In `schema.sql`, comment out Option A policies and uncomment the Option B open policies block before running.

### 4. Get an OpenRouter API key

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create a new key (free tier gives you access to Llama 3 8B)
3. Add it to `.env.local` as `OPENROUTER_API_KEY`

### 5. Run the development server

**Option A — Vercel CLI (recommended, runs API routes correctly):**

```bash
npm install -g vercel
vercel dev
```

The app will be at `http://localhost:3000`.

**Option B — Vite only (frontend, no API):**

```bash
npm run dev
```

> Note: Without Vercel CLI, the `/api/generate` endpoint won't work. You'll need to run it separately or mock the response.

---

## API Reference

### `POST /api/generate`

Generates 4 narrative branches from a story context.

**Request body:**

```json
{
  "context": "Elara stood at the edge of the archive, the last book in her hands glowing faintly.",
  "summary": "A librarian discovers the last magical tome in a collapsing world.",
  "genre": "fantasy",
  "tone": "dramatic"
}
```

**Response:**

```json
{
  "branches": [
    { "id": "1", "type": "logical",  "text": "She carefully opened the cover, revealing a map that pulsed with living light, pointing north." },
    { "id": "2", "type": "twist",    "text": "The book whispered her name — it had been waiting for her specifically, for three hundred years." },
    { "id": "3", "type": "dramatic", "text": "The floor collapsed. Elara leapt, clutching the tome as the archive crumbled into the abyss below." },
    { "id": "4", "type": "creative", "text": "The book dissolved into butterflies made of text, each one carrying a fragment of the story forward." }
  ]
}
```

**Error responses:**

| Status | Meaning                                         |
|--------|-------------------------------------------------|
| 400    | Invalid request body (missing/bad `context`)    |
| 405    | Wrong HTTP method                               |
| 500    | Server misconfiguration (missing API key)       |
| 502    | OpenRouter upstream error                       |

---

## Branch Types

| Type      | Icon | Color  | Description                           |
|-----------|------|--------|---------------------------------------|
| root      | ◈    | Amber  | The opening scene                     |
| logical   | →    | Teal   | Natural continuation of events        |
| twist     | ◌    | Violet | Unexpected turn or revelation         |
| dramatic  | !    | Crimson| High-stakes conflict or crisis        |
| creative  | ✦    | Green  | Experimental/surreal narrative choice |

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Vercel auto-detects the Vite framework

### 3. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable              | Value                                    | Environment     |
|-----------------------|------------------------------------------|-----------------|
| `OPENROUTER_API_KEY`  | `sk-or-v1-your-key`                      | Production, Preview |
| `OPENROUTER_MODEL`    | `meta-llama/llama-3-8b-instruct:free`    | All             |
| `YOUR_SITE_URL`       | `https://your-app.vercel.app`            | Production      |
| `VITE_SUPABASE_URL`   | `https://your-ref.supabase.co`           | All             |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key`                       | All             |

> ⚠️ `OPENROUTER_API_KEY` must NOT have the `VITE_` prefix — it stays server-side only.

### 4. Deploy

```bash
vercel --prod
```

---

## Supabase Row-Level Security

By default, the schema uses **auth-gated RLS** (Option A), meaning each user only sees their own stories. This requires Supabase Auth to be set up.

**For a public demo app without auth:**
1. In `schema.sql`, comment out the Option A policy block
2. Uncomment the Option B `*_open` policies
3. Re-run the SQL

**To add auth later:**
- Integrate `@supabase/auth-ui-react` for a drop-in login UI
- The `saveStory()` function in `src/lib/supabase.js` already sends `user_id` from `supabase.auth.getUser()`

---

## Customizing the AI Model

Change `OPENROUTER_MODEL` to any model on OpenRouter:

| Model                                    | Quality  | Speed | Free |
|------------------------------------------|----------|-------|------|
| `meta-llama/llama-3-8b-instruct:free`    | Good     | Fast  | ✅   |
| `mistralai/mistral-7b-instruct:free`     | Good     | Fast  | ✅   |
| `google/gemma-2-9b-it:free`              | Great    | Med   | ✅   |
| `anthropic/claude-3-haiku`               | Excellent| Fast  | ❌   |
| `openai/gpt-4o-mini`                     | Excellent| Fast  | ❌   |

---

## State Architecture

Zustand store (`src/store/useStoryStore.js`) manages:

```
StoryStore
├── nodes[]              — React Flow node array
├── edges[]              — React Flow edge array
├── selectedNodeId       — currently selected node
├── highlightedPath[]    — node IDs from root → selected
├── storyId / storyTitle / storyGenre / storyTone / storySummary
├── isGenerating         — AI request in-flight
├── generatingNodeId     — which node is loading
├── saveStatus           — 'idle' | 'saving' | 'saved' | 'error'
└── loadedStories[]      — stories fetched from Supabase
```

Key actions: `startStory`, `selectNode`, `addBranches`, `loadStory`, `reset`

---

## Performance Notes

- **Branch caching:** Once a node is expanded (`data.expanded = true`), clicking it again does nothing — no duplicate API calls
- **Supabase cache:** `getCachedBranches(nodeId)` can be called before hitting OpenRouter to check if branches already exist in the DB (wire this up in `GraphView.jsx` if you want full caching)
- **Node limit:** Soft limit via UI (no expand on expanded nodes). Hard limit can be enforced by checking `data.depth >= MAX_DEPTH`
- **Graph layout:** Nodes are positioned with a radial spread algorithm (`calcChildPosition` in the store). For very deep trees, consider integrating `dagre` for auto-layout

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `OPENROUTER_API_KEY not configured` | Add the key to Vercel env vars or `.env.local` |
| Branches return garbled JSON | Switch to a more instruction-following model (e.g., `google/gemma-2-9b-it:free`) |
| Supabase save fails with 403 | RLS policy mismatch — use Option B open policies for dev |
| Graph nodes overlap | Click Controls → "Fit View" or zoom out with scroll wheel |
| API 404 in dev | Use `vercel dev` not `npm run dev` — Vite doesn't serve `/api` routes |

---

## License

MIT — feel free to adapt for your own narrative projects.
