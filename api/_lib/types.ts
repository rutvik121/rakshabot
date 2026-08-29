import type { StyledReview } from './styles'

/** What the user told us, as collected by the question flow. */
export interface ReviewInput {
  siblingName: string
  /** Keyed by question id: habit, spend, talent, steals, love */
  answers: Record<string, string>
}

/** How a given review was produced — surfaced for debugging, never to the user. */
export type ReviewSource = 'ai' | 'fallback'

export interface ReviewResult {
  review: StyledReview
  source: ReviewSource
}
