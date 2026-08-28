import { clamp, LIMITS, METRIC_COUNT } from './schema'
import { GENERIC_METRICS, TRAITS, type Trait } from './traits'
import type { GeneratedReview, PersonalityTheme, ReviewInput } from './types'

/**
 * Builds a review from the user's answers with no model in the loop.
 *
 * This is not a placeholder: it reads the answers for recognisable sibling
 * behaviours and assembles metrics, positions, an award and a manager's review
 * out of what it finds, so two different siblings still get two different
 * documents. It runs whenever the API is unreachable or misconfigured.
 */

/** Stable 32-bit hash, so a given input picks the same variants every time. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Re-mixes the seed so each slot varies independently of the others. */
function mix(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length]
}

/** Deterministic value in [low, high], derived from the seed. */
function spread(low: number, high: number, seed: number): number {
  if (high <= low) return low
  return low + (seed % (high - low + 1))
}

/**
 * Turns a raw answer into a clause that can sit mid-sentence.
 *
 * The subject is deliberately kept — answers arrive both as "she eats my food"
 * and as "eats my food", and dropping a leading pronoun turned the first kind
 * into a verb-initial fragment that broke whatever sentence it was slotted into.
 * The templates below are written to read either way.
 */
function fragment(answer: string, max = 90): string {
  const cleaned = answer.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
  if (!cleaned) return ''
  const lowered = cleaned.charAt(0).toLowerCase() + cleaned.slice(1)
  return clamp(lowered, max)
}

function detectTraits(input: ReviewInput): Trait[] {
  const haystack = Object.values(input.answers).join(' \n ')
  return TRAITS.filter((t) => t.test.test(haystack))
}

const REASONS = [
  'Too annoying to recommend. Too important to lose.',
  'Performance questionable. Presence non-negotiable.',
  'Contract extended indefinitely. Dependency suspected.',
  'No available replacement for this specific chaos.',
  'Reviewed thoroughly. Kept anyway.',
  'Impossible to work with. Worse to be without.',
  'Terminating this would require emotional paperwork.',
  'Objectively difficult. Somehow non-negotiable.',
  'The paperwork to replace them does not exist.',
  'Fails most metrics. Passes the only one that counts.',
  'Not good at this. Somehow still essential.',
  'Retained under protest. Mine, apparently.',
  'A liability on paper. Not one in practice.',
  'Every alternative was considered and rejected immediately.',
]

const RELATIONSHIPS = [
  'Chief Chaos Officer',
  'Resident Menace',
  'Household Wildcard',
  'Full-Time Sibling',
  'Certified Nuisance',
  'Chosen Chaos',
]

const MOODS: Record<PersonalityTheme, string[]> = {
  confidential: ['quietly suspicious', 'redacted mischief'],
  midnight: ['calm and nocturnal', 'soft nostalgia'],
  neon: ['loud and unstoppable', 'high-voltage chaos'],
  warm: ['soft-hearted menace', 'quietly devoted'],
  chaotic: ['unfiltered chaos', 'gloriously unpredictable'],
  royal: ['dramatic and iconic', 'expensive energy'],
}

const WARM_POSITIONS = [
  'Unofficial Emotional Support',
  'Part-Time Best Friend',
  'Emergency Contact For Everything',
  'The One Who Actually Shows Up',
]

export function buildFallbackReview(input: ReviewInput, salt = 0): GeneratedReview {
  const name = input.siblingName.trim() || 'My Sibling'
  const answers = input.answers
  const base = hash(JSON.stringify(answers) + name) + salt

  const matched = detectTraits(input)
  // Roast traits read first so the metric block warms as it is read.
  const warmIds = new Set(['support', 'talent', 'funny', 'cooking'])
  const roastTraits = matched.filter((t) => !warmIds.has(t.id))
  const warmTraits = matched.filter((t) => warmIds.has(t.id))
  const ordered = [...roastTraits, ...warmTraits]

  // ── metrics ───────────────────────────────────────────────────────
  const metrics: GeneratedReview['metrics'] = []
  const usedLabels = new Set<string>()
  ordered.forEach((trait, i) => {
    if (metrics.length >= METRIC_COUNT) return
    const m = pick(trait.metrics, mix(base, 100 + i))
    if (usedLabels.has(m.label)) return
    usedLabels.add(m.label)
    metrics.push({
      emoji: m.emoji,
      label: clamp(m.label, LIMITS.metricLabel),
      score: spread(m.low, m.high, mix(base, 200 + i)),
    })
  })
  // Top up from the generic set, offset by the seed so the filler varies too.
  for (let i = 0; metrics.length < METRIC_COUNT && i < GENERIC_METRICS.length * 2; i++) {
    const g = GENERIC_METRICS[mix(base, 300 + i) % GENERIC_METRICS.length]
    if (usedLabels.has(g.label)) continue
    usedLabels.add(g.label)
    metrics.push({
      emoji: g.emoji,
      label: g.label,
      score: spread(g.low, g.high, mix(base, 400 + i)),
    })
  }

  // ── positions ─────────────────────────────────────────────────────
  const roastTrait = roastTraits[0] ?? ordered[0]
  const positionLine1 = roastTrait
    ? clamp(pick(roastTrait.positions, mix(base, 7)), LIMITS.positionLine)
    : 'Full-Time Annoyance'
  const positionLine2 = clamp(pick(WARM_POSITIONS, mix(base, 13)), LIMITS.positionLine)

  // ── manager's review, built from their actual words ───────────────
  const habit = fragment(answers.habit ?? '', 58)
  const steals = fragment(answers.steals ?? '', 42)
  const love = fragment(answers.love ?? '', 68)
  const talent = fragment(answers.talent ?? '', 44)
  const spend = fragment(answers.spend ?? '', 42)

  const opening = habit
    ? `Noted this review period: ${habit}.`
    : roastTrait
      ? `The employee ${pick(roastTrait.clauses, mix(base, 17))}.`
      : 'The employee remains under permanent review.'
  const middle = steals
    ? `Continues to hold ${steals} indefinitely.`
    : spend
      ? `Allocates household funds toward ${spend}.`
      : talent
        ? `Is also, inconveniently, good at ${talent}.`
        : ''
  const closing = love
    ? `Still — ${love}. That part is not in dispute.`
    : 'Still shows up when it counts, unasked. That part is not in dispute.'

  /*
   * The memo box holds four lines, and the closing turn is the whole point of
   * the document — so it is budgeted first and the optional middle sentence is
   * what gives way. Letting the box clamp instead would cut the payoff off.
   */
  const budget = LIMITS.managerReview
  const managerReview =
    [opening, middle, closing].filter(Boolean).join(' ').length <= budget
      ? [opening, middle, closing].filter(Boolean).join(' ')
      : `${opening} ${closing}`.length <= budget
        ? `${opening} ${closing}`
        : closing

  // ── award ─────────────────────────────────────────────────────────
  const awardTrait = roastTrait ?? warmTraits[0]
  const award = awardTrait
    ? pick(awardTrait.awards, mix(base, 23))
    : {
        emoji: '👑',
        title: 'Employee Of The Family',
        description: 'Won by default. Still counts.',
      }

  // ── theme ─────────────────────────────────────────────────────────
  const theme: PersonalityTheme = ordered[0]?.theme ?? 'confidential'

  return {
    employeeName: clamp(name, LIMITS.employeeName),
    employeeEmoji: roastTrait?.metrics[0].emoji ?? '😤',
    relationshipType: clamp(pick(RELATIONSHIPS, mix(base, 37)), LIMITS.relationshipType),
    positionLine1,
    positionLine2,
    metrics: metrics.slice(0, METRIC_COUNT),
    managerReview: clamp(managerReview, LIMITS.managerReview),
    award: {
      emoji: award.emoji,
      title: clamp(award.title, LIMITS.awardTitle),
      description: clamp(award.description, LIMITS.awardDescription),
    },
    finalDecision: 'RETAINED',
    reason: clamp(pick(REASONS, mix(base, 31)), LIMITS.reason),
    personalityTheme: theme,
    visualMood: clamp(pick(MOODS[theme], mix(base, 41)), LIMITS.visualMood),
    // Sparse answers give a weaker read of the person, and it shows.
    confidence: Math.min(96, 46 + matched.length * 12),
  }
}
