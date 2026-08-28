import { buildFallbackReview } from './fallback'
import { validateGeneratedReview } from './schema'
import type { ReviewInput, ReviewResult } from './types'

export * from './types'
export { buildFallbackReview } from './fallback'
export { toReviewData } from './toReviewData'
export { validateGeneratedReview } from './schema'

/** Generation is a user-facing wait, so it gets a hard ceiling. */
const REQUEST_TIMEOUT_MS = 25_000

/**
 * Asks the server to write the review, falling back to local generation.
 *
 * The fallback is never a blank card: it reads the same answers and builds a
 * personalised review from them, so a missing API key or a failed request
 * degrades the writing quality without breaking the experience.
 */
export async function generateReview(input: ReviewInput): Promise<ReviewResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('/api/generate-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`generate-review responded ${response.status}`)

    const review = validateGeneratedReview(await response.json())
    if (!review) throw new Error('generate-review returned an unusable payload')

    return { review, source: 'ai' }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[rakshabot] falling back to local review generation:', error)
    }
    return { review: buildFallbackReview(input, Date.now()), source: 'fallback' }
  } finally {
    clearTimeout(timeout)
  }
}
