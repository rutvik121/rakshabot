import { clamp } from './clamp'
import { COUNTS, LIMITS } from './styleSchema'
import { TRAITS } from './traits'
import type { OutputStyle, StyledReview } from './styles'
import type { ReviewInput } from './types'

/**
 * A styled artifact built without a model.
 *
 * This exists for the landing page's preview card, for working on the UI with
 * no key, and so the offline tests can prove that different siblings land in
 * different universes. It is deliberately not a fallback for the live
 * generation path — a real model failure stays visible.
 *
 * Everything is derived from a hash of the answers, so the same sibling always
 * gets the same artifact while two different siblings get different ones.
 */

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Re-hash per slot, so choices made from one seed do not move together. */
function mix(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length]
}

function spread(low: number, high: number, seed: number): number {
  return low + (seed % Math.max(1, high - low + 1))
}

/** A usable phrase from a raw answer: trimmed, de-capitalised, length-capped. */
function fragment(answer: string, max: number): string {
  const cleaned = answer.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '')
  if (!cleaned) return ''
  return clamp(cleaned.charAt(0).toLowerCase() + cleaned.slice(1), max)
}

function sentence(answer: string, max: number): string {
  const f = fragment(answer, max)
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : ''
}

/**
 * Which universe each behaviour argues for.
 *
 * A sibling usually matches several traits, so these are votes rather than a
 * lookup: the style with the most support wins, and the seed breaks ties. That
 * is what stops every answer mentioning food from producing the same card.
 */
const TRAIT_VOTES: Record<string, OutputStyle> = {
  steal: 'CASE_FILE',
  mess: 'CASE_FILE',
  phone: 'CASE_FILE',
  drama: 'AWARDS_NIGHT',
  talent: 'AWARDS_NIGHT',
  music: 'AWARDS_NIGHT',
  gaming: 'CHARACTER_STATS',
  study: 'CHARACTER_STATS',
  support: 'SCRAPBOOK',
  funny: 'SCRAPBOOK',
  cooking: 'SCRAPBOOK',
  food: 'SIBLING_WRAPPED',
  sleep: 'SIBLING_WRAPPED',
  shopping: 'STOCK_REPORT',
}

const ALL_STYLES: OutputStyle[] = [
  'CASE_FILE',
  'AWARDS_NIGHT',
  'SIBLING_WRAPPED',
  'SCRAPBOOK',
  'STOCK_REPORT',
  'CHARACTER_STATS',
]

function chooseStyle(input: ReviewInput, seed: number): OutputStyle {
  const haystack = Object.values(input.answers).join(' \n ')
  const tally = new Map<OutputStyle, number>()

  for (const trait of TRAITS) {
    if (!trait.test.test(haystack)) continue
    const style = TRAIT_VOTES[trait.id]
    if (style) tally.set(style, (tally.get(style) ?? 0) + 1)
  }
  // A mention of money is a stronger signal for the market read than for shopping.
  if (/\b(spend|spends|money|₹|rupees|expensive|buy|buys|invest)\b/i.test(haystack)) {
    tally.set('STOCK_REPORT', (tally.get('STOCK_REPORT') ?? 0) + 1)
  }
  if (tally.size === 0) return pick(ALL_STYLES, mix(seed, 91))

  const best = Math.max(...tally.values())
  const leaders = [...tally.entries()].filter(([, n]) => n === best).map(([s]) => s)
  return pick(leaders, mix(seed, 92))
}

const EMOJI = ['🕶️', '👑', '🎧', '🌼', '📈', '🎮', '😤', '🧃', '🛼', '🪩']

const RELATIONSHIPS = [
  'Sibling, permanent fixture',
  'Sibling, chief instigator',
  'Sibling, unpaid roommate',
  'Sibling, co-conspirator',
]

export function buildStyledFallback(input: ReviewInput, salt = 0): StyledReview {
  const name = clamp(input.siblingName.trim() || 'My Sibling', LIMITS.subjectName)
  const a = input.answers
  const seed = hash(JSON.stringify(a) + name) + salt

  const habit = fragment(a.habit ?? '', LIMITS.scrapItem)
  const spend = fragment(a.spend ?? '', LIMITS.scrapItem)
  const talent = fragment(a.talent ?? '', LIMITS.scrapItem)
  const steals = fragment(a.steals ?? '', LIMITS.scrapItem)
  const love = fragment(a.love ?? '', LIMITS.scrapItem)
  const given = [habit, spend, talent, steals, love].filter(Boolean)
  /** Falls back through whatever the user actually answered. */
  const any = (...preferred: string[]) =>
    preferred.find(Boolean) ?? given[mix(seed, 7) % Math.max(given.length, 1)] ?? 'being themselves'

  const style = chooseStyle(input, seed)
  const base = {
    styleReason: 'Chosen offline from the behaviours named in the answers.',
    subjectName: name,
    subjectEmoji: pick(EMOJI, mix(seed, 3)),
    relationshipType: pick(RELATIONSHIPS, mix(seed, 4)),
    visualTheme: { accent: 'offline', mood: 'sample text' },
  }

  switch (style) {
    case 'CASE_FILE':
      return {
        ...base,
        style,
        headline: 'Case File',
        subtitle: 'Standard evaluation not appropriate.',
        content: {
          caseNumber: `RB-2026-${String(seed % 9000 + 1000)}`,
          subject: clamp(`${name}, subject of an ongoing enquiry`, LIMITS.subjectName * 2),
          aliases: ['The Vanisher', 'Fridge Ghost', 'Denier-in-Chief'].slice(0, COUNTS.aliases),
          charges: [
            { emoji: '🚨', title: clamp(any(habit), LIMITS.chargeTitle), severity: spread(88, 100, mix(seed, 11)) },
            { emoji: '🧦', title: clamp(any(steals, habit), LIMITS.chargeTitle), severity: spread(80, 96, mix(seed, 12)) },
            { emoji: '💸', title: clamp(any(spend, habit), LIMITS.chargeTitle), severity: spread(70, 92, mix(seed, 13)) },
            { emoji: '🎯', title: clamp(any(talent, habit), LIMITS.chargeTitle), severity: spread(64, 88, mix(seed, 14)) },
            { emoji: '❤️', title: clamp(any(love, talent), LIMITS.chargeTitle), severity: spread(94, 100, mix(seed, 15)) },
          ],
          evidence: sentence(any(steals, habit), LIMITS.evidence),
          caseSummary: clamp(
            `Subject continues to ${any(habit)} without explanation. Denies everything. ` +
              `Nonetheless, ${any(love, talent)} — which the file cannot ignore.`,
            LIMITS.caseSummary,
          ),
          riskLevel: 'EXTREME',
        },
        finalVerdict: { title: 'Case closed: retained', reason: 'Too dangerous to lose.' },
      }

    case 'AWARDS_NIGHT':
      return {
        ...base,
        style,
        headline: 'The 2026 Sibling Awards',
        subtitle: 'Presented to someone who has never entered quietly.',
        content: {
          ceremony: 'The 2026 Sibling Awards',
          nominee: name,
          awards: [
            { emoji: '🎭', category: clamp(`Best performance in ${any(habit)}`, LIMITS.awardCategory), citation: 'Nightly. Unprompted.' },
            { emoji: '💸', category: clamp(`Outstanding achievement in ${any(spend, habit)}`, LIMITS.awardCategory), citation: 'Budget was not consulted.' },
            { emoji: '🏆', category: clamp(`Lifetime achievement: ${any(talent)}`, LIMITS.awardCategory), citation: 'Never once mentioned it.' },
            { emoji: '🧥', category: clamp(`Best supporting theft: ${any(steals, habit)}`, LIMITS.awardCategory), citation: 'Never returned.' },
            { emoji: '🛡️', category: clamp(`Best supporting sibling`, LIMITS.awardCategory), citation: clamp(sentence(any(love, talent), LIMITS.awardCitation), LIMITS.awardCitation) },
          ],
          mainAward: {
            title: 'Sibling of the Year',
            reason: clamp(`Because ${any(love, talent)}, and nobody else does.`, LIMITS.mainAwardReason),
          },
        },
        finalVerdict: { title: 'Winner. Retained.', reason: 'The category was never competitive.' },
      }

    case 'SIBLING_WRAPPED':
      return {
        ...base,
        style,
        headline: 'Sibling Wrapped',
        subtitle: 'Your year together, by RakshaBot estimates.',
        content: {
          year: '2026',
          stats: [
            {
              value: (spread(2000, 9000, mix(seed, 21))).toLocaleString('en-IN'),
              label: 'minutes arguing',
              description: clamp(`Mostly about ${any(habit)}.`, LIMITS.statDescription),
            },
            {
              value: String(spread(60, 480, mix(seed, 22))),
              label: 'items borrowed',
              description: clamp(sentence(any(steals, habit), LIMITS.statDescription), LIMITS.statDescription),
            },
            {
              value: `${spread(92, 99, mix(seed, 23))}%`,
              label: 'emotional support',
              description: clamp(`Delivered badly, always delivered.`, LIMITS.statDescription),
            },
          ],
          topActivity: clamp(any(habit), LIMITS.topActivity),
          mostUsedLine: '"It is genuinely not my fault"',
          relationshipStatus: 'Chaotically inseparable',
        },
        finalVerdict: { title: 'Wrapped. Retained.', reason: 'Thanks for the memories.' },
      }

    case 'SCRAPBOOK':
      return {
        ...base,
        style,
        headline: 'A collection of our chaos',
        subtitle: 'Some of it embarrassing. All of it kept.',
        content: {
          title: 'A collection of our chaos',
          thingsThatAnnoyMe: [
            clamp(any(habit), LIMITS.scrapItem),
            clamp(any(steals, habit), LIMITS.scrapItem),
            clamp(any(spend, habit), LIMITS.scrapItem),
            'You reply to texts eleven days later',
          ].slice(0, COUNTS.annoyances),
          thingsILove: [
            clamp(any(love, talent), LIMITS.scrapItem),
            clamp(any(talent, love), LIMITS.scrapItem),
            'You show up before I ask',
          ].slice(0, COUNTS.loves),
          secretNote: clamp(
            `I have never told you this, but ${any(love, talent)} is the thing I would keep if I could only keep one.`,
            LIMITS.secretNote,
          ),
          memoryCaption: 'We fight. We make up. We are family.',
        },
        finalVerdict: { title: 'Kept. Always.', reason: 'Some bonds are not up for review.' },
      }

    case 'STOCK_REPORT': {
      const ticker = `$${name.split(/\s+/)[0].toUpperCase()}`
      return {
        ...base,
        style,
        headline: ticker,
        subtitle: 'Sibling Stock Report · FY 2025–26',
        content: {
          ticker: clamp(ticker, LIMITS.ticker),
          performanceOverview: [
            { metric: clamp(any(habit), LIMITS.metricName), direction: 'UP', value: `${spread(92, 100, mix(seed, 31))}%` },
            { metric: clamp(any(spend), LIMITS.metricName), direction: 'UP', value: `${spread(84, 99, mix(seed, 32))}%` },
            { metric: 'Emotional support', direction: 'UP', value: `${spread(90, 99, mix(seed, 33))}%` },
            { metric: clamp(any(steals, habit), LIMITS.metricName), direction: 'VOLATILE', value: `${spread(70, 94, mix(seed, 34))}%` },
            { metric: 'Financial sense', direction: 'DOWN', value: `${spread(28, 55, mix(seed, 35))}%` },
          ],
          analystNotes: [
            clamp(sentence(any(spend, habit), LIMITS.analystNote), LIMITS.analystNote),
            'Volatility high. The long-term hold has never been in question.',
          ],
          recommendation: 'STRONG BUY',
          riskFactor: clamp(any(habit), LIMITS.riskFactor),
          longTermOutlook: clamp(`Irreplaceable asset. ${sentence(any(love, talent), 40)}`, LIMITS.longTermOutlook),
        },
        finalVerdict: { title: 'Strong buy. Held.', reason: 'The fundamentals are unbeatable.' },
      }
    }

    case 'CHARACTER_STATS':
      return {
        ...base,
        style,
        headline: 'Character Profile',
        subtitle: 'Unlocked after years of continuous play.',
        content: {
          player: 'PLAYER 2',
          level: String(spread(15, 34, mix(seed, 41))),
          class: clamp(any(talent, habit), LIMITS.characterClass),
          stats: [
            { label: clamp(any(habit), LIMITS.statName), value: spread(90, 100, mix(seed, 42)) },
            { label: clamp(any(steals, habit), LIMITS.statName), value: spread(80, 97, mix(seed, 43)) },
            { label: 'Loyalty', value: spread(92, 100, mix(seed, 44)) },
            { label: clamp(any(spend, habit), LIMITS.statName), value: spread(60, 92, mix(seed, 45)) },
            { label: 'Emotional support', value: spread(88, 99, mix(seed, 46)) },
          ],
          specialAbility: clamp(any(talent, habit), LIMITS.specialAbility),
          weakness: clamp(any(spend, habit), LIMITS.weakness),
          rarity: 'LEGENDARY',
        },
        finalVerdict: { title: 'Permanently in party', reason: 'Every team needs the one who stays.' },
      }
  }
}
