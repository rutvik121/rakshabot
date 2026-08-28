import { buildFallbackReview } from './fallback'
import { validateGeneratedReview } from './schema'
import type { GeneratedReview, ReviewInput } from './types'

export * from './types'
export { buildFallbackReview } from './fallback'
export { toReviewData } from './toReviewData'
export { validateGeneratedReview } from './schema'

/**
 * Generation is a user-facing wait, so it gets a hard ceiling.
 *
 * It sits above the server's own deadline (60s across both attempts) so a real
 * model failure comes back as a specific error rather than as a bare client
 * abort that says nothing about what went wrong.
 */
const REQUEST_TIMEOUT_MS = 65_000

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
    case 'invalid_api_key':
    case 'permission_denied':
    case 'model_not_found':
      return 'RakshaBot is not configured to reach its brain right now.'
    case 'rate_limited':
      return 'RakshaBot is being asked for too many reviews at once.'
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
  /*
   * Demo builds (`VITE_DEMO_MODE=true`) generate locally so the app can be
   * shown without a server — a static export has no API to call.
   *
   * The flag is a compile-time constant, so with it unset this branch is
   * eliminated and a production build can never reach the local generator from
   * here. (The generator itself still ships, because the landing page's preview
   * card is built with it.) Anything produced here is labelled `dev-fallback`
   * and the result screen shows a badge, so a demo review can never pass as
   * real model output.
   */
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return { review: buildFallbackReview(input, Date.now()), source: 'dev-fallback' }
  }

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
