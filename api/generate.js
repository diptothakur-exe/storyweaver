/**
 * POST /api/generate
 *
 * Generates 4 story branches using OpenRouter AI via the Vercel
 * serverless function runtime.
 *
 * Environment variables required:
 *   OPENROUTER_API_KEY — your OpenRouter API key
 *   OPENROUTER_MODEL   — model string (default: meta-llama/llama-3-8b-instruct:free)
 *   YOUR_SITE_URL      — your deployed site URL (for OpenRouter referrer)
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL   = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free'
const SITE_URL           = process.env.YOUR_SITE_URL    || 'https://storyweaver.app'
const SITE_NAME          = 'StoryWeaver'

// ─── Validation ────────────────────────────────────────────────────────────

function validateBody(body) {
  const { context, summary, genre, tone } = body || {}
  if (!context || typeof context !== 'string' || context.trim().length < 5) {
    return 'context is required and must be a non-empty string'
  }
  if (context.length > 2000) {
    return 'context must be 2000 characters or fewer'
  }
  return null
}

// ─── Prompt builder ────────────────────────────────────────────────────────

function buildPrompt({ context, summary, genre, tone }) {
  return `You are a storytelling engine. Generate 4 distinct branches:
1. Logical continuation
2. Unexpected twist
3. Dramatic/high-stakes
4. Creative/experimental

Each branch must be 15–30 words. Continue from this scene:
${context.trim()}

Story summary:
${(summary || context).trim()}

Genre: ${genre || 'general'}
Tone: ${tone || 'neutral'}

Return ONLY valid JSON with no extra text, no markdown, no code fences:
{ "branches": [{ "id": "1", "type": "logical", "text": "..." }, { "id": "2", "type": "twist", "text": "..." }, { "id": "3", "type": "dramatic", "text": "..." }, { "id": "4", "type": "creative", "text": "..." }] }`
}

// ─── Response parser ────────────────────────────────────────────────────────

const VALID_TYPES = ['logical', 'twist', 'dramatic', 'creative']
const TYPE_MAP = {
  '1': 'logical',
  '2': 'twist',
  '3': 'dramatic',
  '4': 'creative',
  logical: 'logical',
  twist: 'twist',
  dramatic: 'dramatic',
  creative: 'creative',
}

function parseBranches(rawText) {
  // Strip markdown fences if model ignores instructions
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Attempt to extract JSON object from surrounding text
    const match = cleaned.match(/\{[\s\S]*"branches"[\s\S]*\}/)
    if (!match) throw new Error('No valid JSON found in model response')
    parsed = JSON.parse(match[0])
  }

  if (!parsed.branches || !Array.isArray(parsed.branches)) {
    throw new Error('Response missing branches array')
  }

  // Normalize and validate each branch
  const normalized = parsed.branches.slice(0, 4).map((b, i) => {
    const type = TYPE_MAP[b.type] || TYPE_MAP[String(i + 1)] || VALID_TYPES[i]
    return {
      id:   b.id   ? String(b.id)   : String(i + 1),
      type: type   || 'logical',
      text: b.text ? String(b.text).trim() : '',
    }
  })

  // Must have exactly 4 branches with content
  const valid = normalized.filter((b) => b.text.length > 0)
  if (valid.length < 2) {
    throw new Error(`Only ${valid.length} valid branches parsed — model output was malformed`)
  }

  return valid
}

// ─── Main handler ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // API key guard
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY is not configured on the server',
    })
  }

  // Validate request body
  const validationError = validateBody(req.body)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const { context, summary, genre, tone } = req.body
  const prompt = buildPrompt({ context, summary, genre, tone })

  try {
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization':      `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer':        SITE_URL,
        'X-Title':             SITE_NAME,
        'Content-Type':        'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON-only storytelling engine. Output ONLY valid JSON objects. ' +
              'No markdown, no explanation, no code fences. Start your response with { and end with }.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature:       0.85,
        max_tokens:        600,
        top_p:             0.95,
        frequency_penalty: 0.3,
        presence_penalty:  0.3,
      }),
    })

    if (!openRouterRes.ok) {
      const errBody = await openRouterRes.text()
      console.error('[StoryWeaver API] OpenRouter error:', openRouterRes.status, errBody)
      return res.status(502).json({
        error: `AI provider error (${openRouterRes.status}). Please try again.`,
      })
    }

    const completion = await openRouterRes.json()

    // Extract content from response
    const rawContent = completion?.choices?.[0]?.message?.content
    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from AI provider' })
    }

    // Parse and normalize branches
    const branches = parseBranches(rawContent)

    return res.status(200).json({ branches })
  } catch (err) {
    console.error('[StoryWeaver API] Unhandled error:', err)
    return res.status(500).json({
      error: err.message || 'Internal server error',
    })
  }
}
