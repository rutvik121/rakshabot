import {
  PERSONALITY_THEMES,
  type GeneratedReview,
  type PersonalityTheme,
} from './types'

export const METRIC_COUNT = 5

/**
 * JSON Schema handed to Gemini as `responseJsonSchema`, which constrains
 * generation to this exact shape.
 *
 * The validator below is still the gate before anything renders — a constrained
 * response is well-formed, but we own the semantic limits (score ranges, string
 * lengths, metric count) that keep the copy inside a fixed-size poster.
 */
export const REVIEW_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  // Non-standard but supported by Gemini: writing the roast before the warm
  // fields gives the model the same order the card is read in.
  propertyOrdering: [
    'employeeName',
    'employeeEmoji',
    'relationshipType',
    'positionLine1',
    'positionLine2',
    'metrics',
    'managerReview',
    'award',
    'finalDecision',
    'reason',
    'personalityTheme',
    'visualMood',
    'confidence',
  ],
  required: [
    'employeeName',
    'employeeEmoji',
    'relationshipType',
    'positionLine1',
    'positionLine2',
    'metrics',
    'managerReview',
    'award',
    'finalDecision',
    'reason',
    'personalityTheme',
    'visualMood',
    'confidence',
  ],
  properties: {
    employeeName: { type: 'string' },
    employeeEmoji: { type: 'string' },
    relationshipType: { type: 'string' },
    positionLine1: { type: 'string' },
    positionLine2: { type: 'string' },
    metrics: {
      type: 'array',
      minItems: METRIC_COUNT,
      maxItems: METRIC_COUNT,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['emoji', 'label', 'score'],
        properties: {
          emoji: { type: 'string' },
          label: { type: 'string' },
          score: { type: 'integer', minimum: 0, maximum: 100 },
        },
      },
    },
    managerReview: { type: 'string' },
    award: {
      type: 'object',
      additionalProperties: false,
      required: ['emoji', 'title', 'description'],
      properties: {
        emoji: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
      },
    },
    finalDecision: { type: 'string' },
    reason: { type: 'string' },
    personalityTheme: { type: 'string', enum: [...PERSONALITY_THEMES] },
    visualMood: { type: 'string' },
    confidence: { type: 'integer', minimum: 0, maximum: 100 },
  },
} as const

/*
 * The poster is a fixed 4:5 frame, so over-long strings would push content out
 * of the card rather than making it taller. These caps are the contract between
 * the generator and the layout.
 */
export const LIMITS = {
  employeeName: 22,
  relationshipType: 40,
  positionLine: 30,
  metricLabel: 22,
  managerReview: 200,
  awardTitle: 40,
  awardDescription: 90,
  reason: 58,
  visualMood: 40,
} as const

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Words that read as unfinished when a trim happens to land on them. */
const DANGLING =
  /[\s,;:]+(and|or|but|the|a|an|of|to|with|for|on|in|at|my|his|her|their|its|every|some|any|very|really|just)$/i

/**
 * Trims to a limit on a word boundary, then drops a trailing function word.
 *
 * Cutting on a word boundary alone still leaves copy like "every single." —
 * technically whole words, but visibly unfinished.
 */
export function clamp(value: string, max: number): string {
  const s = value.trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)

  /*
   * Prefer a clause boundary. Cutting "…without asking, every single time" at a
   * word boundary yields "…every single", which reads as broken; cutting at the
   * comma yields "…without asking", which reads as finished.
   */
  const lastComma = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '))
  if (lastComma > max * 0.5) return cut.slice(0, lastComma).trim()

  const lastSpace = cut.lastIndexOf(' ')
  let out = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()
  // A trim can strand several in a row ("... with every" → "...").
  for (let i = 0; i < 3 && DANGLING.test(out); i++) out = out.replace(DANGLING, '')
  return out.replace(/[\s,;:]+$/, '')
}

function clampScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

/**
 * Validates and normalises a model response into a renderable review.
 *
 * Returns null when the payload is unusable, so the caller can fall back rather
 * than render something broken. Anything salvageable is clamped rather than
 * rejected — a slightly long award title is not worth losing a whole review to.
 */
export function validateGeneratedReview(value: unknown): GeneratedReview | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>

  const employeeName = str(v.employeeName)
  const managerReview = str(v.managerReview)
  const reason = str(v.reason)
  if (!employeeName || !managerReview || !reason) return null

  if (!Array.isArray(v.metrics) || v.metrics.length !== METRIC_COUNT) return null
  const metrics = []
  for (const raw of v.metrics) {
    if (typeof raw !== 'object' || raw === null) return null
    const m = raw as Record<string, unknown>
    const label = str(m.label)
    const score = clampScore(m.score)
    if (!label || score === null) return null
    metrics.push({
      emoji: str(m.emoji) || '•',
      label: clamp(label, LIMITS.metricLabel),
      score,
    })
  }

  const awardRaw = v.award
  if (typeof awardRaw !== 'object' || awardRaw === null) return null
  const a = awardRaw as Record<string, unknown>
  const awardTitle = str(a.title)
  if (!awardTitle) return null

  const theme = str(v.personalityTheme) as PersonalityTheme
  const confidence = clampScore(v.confidence)

  return {
    employeeName: clamp(employeeName, LIMITS.employeeName),
    employeeEmoji: str(v.employeeEmoji) || '😤',
    relationshipType: clamp(str(v.relationshipType) || 'Sibling', LIMITS.relationshipType),
    positionLine1: clamp(str(v.positionLine1) || 'Full-Time Sibling', LIMITS.positionLine),
    positionLine2: clamp(str(v.positionLine2) || 'Part-Time Best Friend', LIMITS.positionLine),
    metrics,
    managerReview: clamp(managerReview, LIMITS.managerReview),
    award: {
      emoji: str(a.emoji) || '🏆',
      title: clamp(awardTitle, LIMITS.awardTitle),
      description: clamp(str(a.description), LIMITS.awardDescription),
    },
    // v1 always retains; the reason is what carries the personalisation.
    finalDecision: 'RETAINED',
    reason: clamp(reason, LIMITS.reason),
    personalityTheme: PERSONALITY_THEMES.includes(theme) ? theme : 'confidential',
    visualMood: clamp(str(v.visualMood) || 'warm chaos', LIMITS.visualMood),
    confidence: confidence ?? 80,
  }
}
