/** The six visual treatments the card can take, chosen from the sibling's personality. */
export const PERSONALITY_THEMES = [
  'confidential',
  'midnight',
  'neon',
  'warm',
  'chaotic',
  'royal',
] as const

export type PersonalityTheme = (typeof PERSONALITY_THEMES)[number]

/** What the user told us, as collected by the question flow. */
export interface ReviewInput {
  siblingName: string
  /** Keyed by question id: habit, spend, talent, steals, love */
  answers: Record<string, string>
}

export interface GeneratedMetric {
  emoji: string
  label: string
  /** 0–100 */
  score: number
}

export interface GeneratedAward {
  emoji: string
  title: string
  description: string
}

/** The structured review the model returns. Never any rendering — data only. */
export interface GeneratedReview {
  employeeName: string
  employeeEmoji: string
  relationshipType: string
  positionLine1: string
  positionLine2: string
  metrics: GeneratedMetric[]
  managerReview: string
  award: GeneratedAward
  finalDecision: string
  reason: string
  personalityTheme: PersonalityTheme
  visualMood: string
  /** 0–100 */
  confidence: number
}

/** How a given review was produced — surfaced for debugging, never to the user. */
export type ReviewSource = 'ai' | 'fallback'

export interface ReviewResult {
  review: GeneratedReview
  source: ReviewSource
}
