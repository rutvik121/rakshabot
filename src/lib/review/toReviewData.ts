import type { ReviewData } from '@/types'
import type { GeneratedReview } from '../../../api/_lib/types'

/** Roast metrics run warm orange, affectionate ones pink. */
const WARM_METRIC = /love|support|laugh|care|hug|kind|show|talent|good|help|best|heart|funny/i

function toneFor(label: string, emoji: string): 'roast' | 'love' {
  if (/❤️|🫶|😂|🥰|🤗|💖|🎯/.test(emoji)) return 'love'
  return WARM_METRIC.test(label) ? 'love' : 'roast'
}

/** Six-digit document id derived from the review, so it is stable per review. */
function documentId(review: GeneratedReview): string {
  let h = 2166136261
  const seed = review.employeeName + review.reason + review.award.title
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `RB-2026-${String((h >>> 0) % 9000 + 1000)}`
}

/**
 * Adapts the model's structured review into the props the card renders.
 *
 * The card's shape stays stable — all reconciliation between the generation
 * schema and the layout happens here, in one place.
 */
export function toReviewData(review: GeneratedReview, photoUrl?: string): ReviewData {
  return {
    documentId: documentId(review),
    reviewPeriod: 'FY 2025–26',
    employeeName: review.employeeName,
    employeeEmoji: review.employeeEmoji,
    photoEmoji: '👧',
    photoUrl,
    position: [review.positionLine1, review.positionLine2],
    metrics: review.metrics.map((m) => ({
      emoji: m.emoji,
      label: m.label,
      score: m.score,
      tone: toneFor(m.label, m.emoji),
    })),
    managerReview: review.managerReview,
    reviewedBy: 'The Management (me)',
    award: { emoji: review.award.emoji, title: review.award.title },
    finalDecision: review.finalDecision,
    decisionEmoji: '❤️',
    decisionReason: review.reason,
    hashtag: '#SiblingPerformanceReview',
    theme: review.personalityTheme,
  }
}
