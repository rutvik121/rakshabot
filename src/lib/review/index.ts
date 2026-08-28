import { validateGeneratedReview } from './schema'
import type { GeneratedReview, ReviewInput } from './types'

export * from './types'
export { buildFallbackReview } from './fallback'
export { toReviewData } from './toReviewData'
export { validateGeneratedReview } from './schema'

/** Generation is a user-facing wait, so it gets a hard ceiling. */
const REQUEST_TIMEOUT_MS = 30_000

/** 'ai' is a real model response; 'dev-fallback' is the local, non-AI generator. */
export type ReviewSource = 'ai' | 'dev-fallback'

export interface ReviewResult {
  review: GeneratedReview
  source: ReviewSource
}

export class ReviewGenerationError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'ReviewGenerationError'
    this.code = code
  }
}

function messageFor(code: string, fallback: string): string {
  switch (code) {
    case 'missing_api_key':
      return 'RakshaBot is not configured to reach its brain right now.'
    case 'timeout':
      return 'RakshaBot took too long thinking about your sibling.'
    case 'invalid_schema':
    case 'invalid_json':
    case 'empty_response':
      return 'RakshaBot wrote something unreadable and is embarrassed about it.'
    case 'offline':
      return "RakshaBot can't reach the internet from here."
    default:
      return fallback
  }
}

/**
 * Asks the server to write the review.
 *
 * There is deliberately no fallback here. A failure of the real pipeline must be
 * visible — silently substituting locally generated text would make a broken
 * integration look like a working one, both to the user and to us.
 */
export async function generateReview(input: ReviewInput): Promise<ReviewResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch('/api/generate-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    const code = aborted ? 'timeout' : 'offline'
    throw new ReviewGenerationError(messageFor(code, 'RakshaBot could not be reached.'), code)
  } finally {
    clearTimeout(timeout)
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const err =
      typeof payload === 'object' && payload !== null
        ? (payload as { error?: { code?: string; message?: string } }).error
        : undefined
    const code = err?.code ?? 'generation_failed'
    if (import.meta.env.DEV) {
      console.error('[rakshabot] generation failed:', response.status, err?.message ?? payload)
    }
    throw new ReviewGenerationError(messageFor(code, 'RakshaBot hit a snag.'), code)
  }

  const body = payload as { review?: unknown; source?: ReviewSource } | null
  const review = validateGeneratedReview(body?.review)
  if (!review) {
    throw new ReviewGenerationError(
      messageFor('invalid_schema', 'RakshaBot returned something unusable.'),
      'invalid_schema',
    )
  }

  return { review, source: body?.source === 'dev-fallback' ? 'dev-fallback' : 'ai' }
}
