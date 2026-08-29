import { buildStyledFallback } from '@/lib/review'
import type { StyledReview } from '@/lib/review/styles'

/**
 * The card shown on the landing page.
 *
 * Built by the same generator the product uses, from a worked example of the
 * answers a user would give — so the preview can never drift from what the app
 * actually produces, including which universe those answers land in.
 */
export const PREVIEW_REVIEW: StyledReview = buildStyledFallback({
  siblingName: 'Ananya',
  answers: {
    habit: 'Never replies but is always online on WhatsApp',
    spend: 'Another pair of sneakers she does not need',
    talent: 'Cooking actually incredible food at 1am',
    steals: 'My hoodie and every charger in the house',
    love: 'She shows up the second anything goes wrong',
  },
})
