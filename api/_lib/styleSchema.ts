import { clamp } from './clamp.js'
import {
  OUTPUT_STYLES,
  RARITIES,
  RECOMMENDATIONS,
  RISK_LEVELS,
  TREND_DIRECTIONS,
  type OutputStyle,
  type Rarity,
  type Recommendation,
  type RiskLevel,
  type StyledReview,
  type TrendDirection,
} from './styles.js'

/**
 * Length and count limits for every style.
 *
 * Each artifact is a fixed 1080×1350 frame with no scrolling, so copy length is
 * a layout constraint rather than a preference. These are the numbers the cards
 * are designed against; the validator clamps to them so a chatty model cannot
 * push content out of the frame.
 */
export const LIMITS = {
  subjectName: 22,
  relationshipType: 42,
  headline: 34,
  subtitle: 64,
  verdictTitle: 26,
  verdictReason: 64,
  mood: 28,

  caseNumber: 14,
  alias: 22,
  chargeTitle: 30,
  evidence: 110,
  caseSummary: 190,

  ceremony: 34,
  awardCategory: 38,
  awardCitation: 62,
  mainAwardTitle: 26,
  mainAwardReason: 82,

  statValue: 12,
  statLabel: 26,
  statDescription: 58,
  topActivity: 34,
  mostUsedLine: 46,
  relationshipStatus: 26,

  scrapTitle: 34,
  scrapItem: 42,
  secretNote: 150,
  memoryCaption: 62,

  ticker: 14,
  metricName: 26,
  metricValue: 10,
  analystNote: 64,
  riskFactor: 40,
  longTermOutlook: 62,

  player: 10,
  level: 6,
  characterClass: 30,
  statName: 22,
  specialAbility: 40,
  weakness: 36,
} as const

/** Exact list lengths each card's layout is built around. */
export const COUNTS = {
  charges: 5,
  aliases: 3,
  awards: 5,
  wrappedStats: 3,
  annoyances: 4,
  loves: 3,
  performanceRows: 5,
  analystNotes: 2,
  characterStats: 5,
} as const

// ── the schema handed to the model ───────────────────────────────────────────

const strField = (description: string) => ({ type: 'string', description })

/**
 * `content` is declared as the union of every style's fields, all optional.
 *
 * Structured output cannot express "these fields when style is X, those when it
 * is Y" in a form every model honours reliably, so the shape is permissive here
 * and `validateStyledReview` enforces the real contract per style. A response
 * that fills the wrong set is rejected and retried with a correction rather
 * than rendered half-empty.
 */
export const STYLED_REVIEW_JSON_SCHEMA = {
  type: 'object',
  properties: {
    style: { type: 'string', enum: [...OUTPUT_STYLES] },
    styleReason: strField('Why this universe fits this sibling. One sentence.'),
    subjectName: strField('The sibling name, exactly as the user typed it'),
    subjectEmoji: strField('One emoji that suits them'),
    relationshipType: strField('A short personalised title for the relationship'),
    headline: strField('The artifact headline, in the register of the chosen style'),
    subtitle: strField('One supporting line under the headline'),
    content: {
      type: 'object',
      properties: {
        // CASE_FILE
        caseNumber: strField('CASE_FILE only: e.g. RB-2026-0413'),
        subject: strField('CASE_FILE only: how the subject is described'),
        aliases: { type: 'array', items: { type: 'string' } },
        charges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emoji: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'integer' },
            },
            required: ['emoji', 'title', 'severity'],
            propertyOrdering: ['emoji', 'title', 'severity'],
          },
        },
        evidence: strField('CASE_FILE only: one specific piece of evidence'),
        caseSummary: strField('CASE_FILE only: 2-3 sentences'),
        riskLevel: { type: 'string', enum: [...RISK_LEVELS] },

        // AWARDS_NIGHT
        ceremony: strField('AWARDS_NIGHT only: the ceremony name'),
        nominee: strField('AWARDS_NIGHT only: the nominee'),
        awards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emoji: { type: 'string' },
              category: { type: 'string' },
              citation: { type: 'string' },
            },
            required: ['emoji', 'category', 'citation'],
            propertyOrdering: ['emoji', 'category', 'citation'],
          },
        },
        mainAward: {
          type: 'object',
          properties: { title: { type: 'string' }, reason: { type: 'string' } },
          required: ['title', 'reason'],
          propertyOrdering: ['title', 'reason'],
        },

        // SIBLING_WRAPPED
        year: strField('SIBLING_WRAPPED only: the year'),
        stats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              label: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['value', 'label', 'description'],
            propertyOrdering: ['value', 'label', 'description'],
          },
        },
        topActivity: strField('SIBLING_WRAPPED only'),
        mostUsedLine: strField('SIBLING_WRAPPED only: something they always say'),
        relationshipStatus: strField('SIBLING_WRAPPED only'),

        // SCRAPBOOK
        title: strField('SCRAPBOOK only: a handwritten-feeling title'),
        thingsThatAnnoyMe: { type: 'array', items: { type: 'string' } },
        thingsILove: { type: 'array', items: { type: 'string' } },
        secretNote: strField('SCRAPBOOK only: the thing they would never say out loud'),
        memoryCaption: strField('SCRAPBOOK only: a short nostalgic caption'),

        // STOCK_REPORT
        ticker: strField('STOCK_REPORT only: e.g. $BROTHER'),
        performanceOverview: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              direction: { type: 'string', enum: [...TREND_DIRECTIONS] },
              value: { type: 'string' },
            },
            required: ['metric', 'direction', 'value'],
            propertyOrdering: ['metric', 'direction', 'value'],
          },
        },
        analystNotes: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string', enum: [...RECOMMENDATIONS] },
        riskFactor: strField('STOCK_REPORT only: a funny risk'),
        longTermOutlook: strField('STOCK_REPORT only: the emotional conclusion'),

        // CHARACTER_STATS
        player: strField('CHARACTER_STATS only: PLAYER 1 or PLAYER 2'),
        level: strField('CHARACTER_STATS only: their age, as a string'),
        class: strField('CHARACTER_STATS only: a funny class name'),
        statBars: {
          type: 'array',
          items: {
            type: 'object',
            properties: { label: { type: 'string' }, value: { type: 'integer' } },
            required: ['label', 'value'],
            propertyOrdering: ['label', 'value'],
          },
        },
        specialAbility: strField('CHARACTER_STATS only'),
        weakness: strField('CHARACTER_STATS only'),
        rarity: { type: 'string', enum: [...RARITIES] },
      },
    },
    finalVerdict: {
      type: 'object',
      properties: { title: { type: 'string' }, reason: { type: 'string' } },
      required: ['title', 'reason'],
      propertyOrdering: ['title', 'reason'],
    },
    visualTheme: {
      type: 'object',
      properties: { accent: { type: 'string' }, mood: { type: 'string' } },
      required: ['accent', 'mood'],
      propertyOrdering: ['accent', 'mood'],
    },
  },
  required: [
    'style',
    'styleReason',
    'subjectName',
    'subjectEmoji',
    'relationshipType',
    'headline',
    'subtitle',
    'content',
    'finalVerdict',
    'visualTheme',
  ],
  propertyOrdering: [
    'style',
    'styleReason',
    'subjectName',
    'subjectEmoji',
    'relationshipType',
    'headline',
    'subtitle',
    'content',
    'finalVerdict',
    'visualTheme',
  ],
} as const

// ── validation ───────────────────────────────────────────────────────────────

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? clamp(value, max) : ''
}

function score(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const s = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback
}

/**
 * Takes exactly `n` entries, mapping each through `map`.
 *
 * Returns null when there are too few or any entry is unusable: the cards are
 * built for a known number of rows, so a short list is a layout hole, not a
 * degradation worth shipping.
 */
function exactly<T>(value: unknown, n: number, map: (item: Record<string, unknown>) => T | null) {
  if (!Array.isArray(value) || value.length < n) return null
  const out: T[] = []
  for (const item of value.slice(0, n)) {
    if (typeof item !== 'object' || item === null) return null
    const mapped = map(item as Record<string, unknown>)
    if (mapped === null) return null
    out.push(mapped)
  }
  return out
}

/** Same, for plain string lists. */
function exactlyStrings(value: unknown, n: number, max: number): string[] | null {
  if (!Array.isArray(value) || value.length < n) return null
  const out = value.slice(0, n).map((s) => text(s, max))
  return out.every(Boolean) ? out : null
}

function emoji(value: unknown, fallback: string): string {
  const s = typeof value === 'string' ? value.trim() : ''
  // Emoji only, and at most two — a stray sentence here breaks every layout.
  return s && s.length <= 8 && !/[a-z0-9]/i.test(s) ? s : fallback
}

type Content = Record<string, unknown>

function caseFile(c: Content) {
  const charges = exactly(c.charges, COUNTS.charges, (x) => {
    const title = text(x.title, LIMITS.chargeTitle)
    return title ? { emoji: emoji(x.emoji, '🚨'), title, severity: score(x.severity) } : null
  })
  const aliases = exactlyStrings(c.aliases, COUNTS.aliases, LIMITS.alias)
  const caseSummary = text(c.caseSummary, LIMITS.caseSummary)
  if (!charges || !aliases || !caseSummary) return null
  return {
    caseNumber: text(c.caseNumber, LIMITS.caseNumber) || 'RB-2026-0001',
    subject: text(c.subject, LIMITS.subjectName * 2) || 'Unknown subject',
    aliases,
    charges,
    evidence: text(c.evidence, LIMITS.evidence),
    caseSummary,
    riskLevel: oneOf<RiskLevel>(c.riskLevel, RISK_LEVELS, 'HIGH'),
  }
}

function awardsNight(c: Content) {
  const awards = exactly(c.awards, COUNTS.awards, (x) => {
    const category = text(x.category, LIMITS.awardCategory)
    return category
      ? { emoji: emoji(x.emoji, '🏆'), category, citation: text(x.citation, LIMITS.awardCitation) }
      : null
  })
  const main = (c.mainAward ?? {}) as Content
  const title = text(main.title, LIMITS.mainAwardTitle)
  const reason = text(main.reason, LIMITS.mainAwardReason)
  if (!awards || !title || !reason) return null
  return {
    ceremony: text(c.ceremony, LIMITS.ceremony) || 'The 2026 Sibling Awards',
    nominee: text(c.nominee, LIMITS.subjectName * 2),
    awards,
    mainAward: { title, reason },
  }
}

function siblingWrapped(c: Content) {
  const stats = exactly(c.stats, COUNTS.wrappedStats, (x) => {
    const value = text(x.value, LIMITS.statValue)
    const label = text(x.label, LIMITS.statLabel)
    return value && label
      ? { value, label, description: text(x.description, LIMITS.statDescription) }
      : null
  })
  const topActivity = text(c.topActivity, LIMITS.topActivity)
  if (!stats || !topActivity) return null
  return {
    year: text(c.year, 6) || '2026',
    stats,
    topActivity,
    mostUsedLine: text(c.mostUsedLine, LIMITS.mostUsedLine),
    relationshipStatus: text(c.relationshipStatus, LIMITS.relationshipStatus) || 'INSEPARABLE',
  }
}

function scrapbook(c: Content) {
  const thingsThatAnnoyMe = exactlyStrings(c.thingsThatAnnoyMe, COUNTS.annoyances, LIMITS.scrapItem)
  const thingsILove = exactlyStrings(c.thingsILove, COUNTS.loves, LIMITS.scrapItem)
  const secretNote = text(c.secretNote, LIMITS.secretNote)
  if (!thingsThatAnnoyMe || !thingsILove || !secretNote) return null
  return {
    title: text(c.title, LIMITS.scrapTitle) || 'A collection of our chaos',
    thingsThatAnnoyMe,
    thingsILove,
    secretNote,
    memoryCaption: text(c.memoryCaption, LIMITS.memoryCaption),
  }
}

function stockReport(c: Content) {
  const performanceOverview = exactly(c.performanceOverview, COUNTS.performanceRows, (x) => {
    const metric = text(x.metric, LIMITS.metricName)
    return metric
      ? {
          metric,
          direction: oneOf<TrendDirection>(x.direction, TREND_DIRECTIONS, 'UP'),
          value: text(x.value, LIMITS.metricValue) || '—',
        }
      : null
  })
  const analystNotes = exactlyStrings(c.analystNotes, COUNTS.analystNotes, LIMITS.analystNote)
  const longTermOutlook = text(c.longTermOutlook, LIMITS.longTermOutlook)
  if (!performanceOverview || !analystNotes || !longTermOutlook) return null
  return {
    ticker: text(c.ticker, LIMITS.ticker) || '$SIBLING',
    performanceOverview,
    analystNotes,
    recommendation: oneOf<Recommendation>(c.recommendation, RECOMMENDATIONS, 'STRONG BUY'),
    riskFactor: text(c.riskFactor, LIMITS.riskFactor),
    longTermOutlook,
  }
}

function characterStats(c: Content) {
  // The model is asked for `statBars` because `stats` already means something
  // else on SIBLING_WRAPPED; accept either rather than fail on the collision.
  const stats = exactly(c.statBars ?? c.stats, COUNTS.characterStats, (x) => {
    const label = text(x.label, LIMITS.statName)
    return label ? { label, value: score(x.value) } : null
  })
  const specialAbility = text(c.specialAbility, LIMITS.specialAbility)
  const weakness = text(c.weakness, LIMITS.weakness)
  if (!stats || !specialAbility || !weakness) return null
  return {
    player: text(c.player, LIMITS.player) || 'PLAYER 2',
    level: text(c.level, LIMITS.level) || '24',
    class: text(c.class, LIMITS.characterClass) || 'Professional Annoyance',
    stats,
    specialAbility,
    weakness,
    rarity: oneOf<Rarity>(c.rarity, RARITIES, 'LEGENDARY'),
  }
}

/**
 * Validates a model response into a renderable artifact.
 *
 * Returns null when the payload cannot fill the chosen style's layout, so the
 * caller retries with a correction rather than rendering a card with holes in
 * it. Copy that is merely too long is clamped, not rejected.
 */
export function validateStyledReview(value: unknown): StyledReview | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>

  const style = typeof v.style === 'string' ? (v.style.trim().toUpperCase() as OutputStyle) : null
  if (!style || !OUTPUT_STYLES.includes(style)) return null

  const subjectName = text(v.subjectName, LIMITS.subjectName)
  const headline = text(v.headline, LIMITS.headline)
  const verdict = (v.finalVerdict ?? {}) as Content
  const verdictTitle = text(verdict.title, LIMITS.verdictTitle)
  const verdictReason = text(verdict.reason, LIMITS.verdictReason)
  if (!subjectName || !headline || !verdictTitle || !verdictReason) return null

  const theme = (v.visualTheme ?? {}) as Content
  const base = {
    styleReason: text(v.styleReason, 200),
    subjectName,
    subjectEmoji: emoji(v.subjectEmoji, '🙂'),
    relationshipType: text(v.relationshipType, LIMITS.relationshipType),
    headline,
    subtitle: text(v.subtitle, LIMITS.subtitle),
    finalVerdict: { title: verdictTitle, reason: verdictReason },
    visualTheme: {
      accent: text(theme.accent, 24),
      mood: text(theme.mood, LIMITS.mood),
    },
  }

  const c = (typeof v.content === 'object' && v.content !== null ? v.content : {}) as Content

  switch (style) {
    case 'CASE_FILE': {
      const content = caseFile(c)
      return content ? { ...base, style, content } : null
    }
    case 'AWARDS_NIGHT': {
      const content = awardsNight(c)
      return content ? { ...base, style, content } : null
    }
    case 'SIBLING_WRAPPED': {
      const content = siblingWrapped(c)
      return content ? { ...base, style, content } : null
    }
    case 'SCRAPBOOK': {
      const content = scrapbook(c)
      return content ? { ...base, style, content } : null
    }
    case 'STOCK_REPORT': {
      const content = stockReport(c)
      return content ? { ...base, style, content } : null
    }
    case 'CHARACTER_STATS': {
      const content = characterStats(c)
      return content ? { ...base, style, content } : null
    }
  }
}
