/**
 * API client for StoryWeaver backend
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Generate 4 story branches from a given context
 *
 * @param {{ context: string, summary: string, genre: string, tone: string }} params
 * @returns {Promise<{ branches: Array<{ id: string, type: string, text: string }> }>}
 */
export async function generateBranches({ context, summary, genre, tone }) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, summary, genre, tone }),
  })

  if (!res.ok) {
    let message = `Generation failed (${res.status})`
    try {
      const err = await res.json()
      message = err.error || message
    } catch (_) {}
    throw new Error(message)
  }

  const data = await res.json()

  if (!data.branches || !Array.isArray(data.branches)) {
    throw new Error('Invalid response format from generation API')
  }

  return data
}
