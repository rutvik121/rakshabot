/**
 * ONE SIBLING. MANY WORLDS.
 *
 * A sibling is not always an employee. The model reads the answers and decides
 * which universe describes this particular person — an investigation, an awards
 * ceremony, a year in review, a scrapbook, a stock, a character sheet — and the
 * app renders the matching artifact.
 *
 * Every style shares the outer envelope (who this is, the headline, the
 * verdict) and nothing else: `content` has a different shape per style, so a
 * case file cannot accidentally be rendered as a stock report.
 */

export const OUTPUT_STYLES = [
  'CASE_FILE',
  'AWARDS_NIGHT',
  'SIBLING_WRAPPED',
  'SCRAPBOOK',
  'STOCK_REPORT',
  'CHARACTER_STATS',
] as const

export type OutputStyle = (typeof OUTPUT_STYLES)[number]

/** What the reveal sequence announces once the model has chosen. */
export const STYLE_REVEAL: Record<OutputStyle, { emoji: string; label: string }> = {
  CASE_FILE: { emoji: '🕵️', label: 'Case file assigned' },
  AWARDS_NIGHT: { emoji: '🏆', label: 'Awards ceremony initiated' },
  SIBLING_WRAPPED: { emoji: '🎧', label: 'Generating Sibling Wrapped' },
  SCRAPBOOK: { emoji: '📸', label: 'Opening memory archive' },
  STOCK_REPORT: { emoji: '📈', label: 'Analysing sibling market value' },
  CHARACTER_STATS: { emoji: '🎮', label: 'Loading character profile' },
}

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const TREND_DIRECTIONS = ['UP', 'DOWN', 'VOLATILE'] as const
export type TrendDirection = (typeof TREND_DIRECTIONS)[number]

export const RECOMMENDATIONS = ['STRONG BUY', 'HOLD FOREVER', 'TOO VALUABLE TO SELL'] as const
export type Recommendation = (typeof RECOMMENDATIONS)[number]

export const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const
export type Rarity = (typeof RARITIES)[number]

// ── per-style content ────────────────────────────────────────────────────────

export interface Charge {
  emoji: string
  title: string
  /** 0–100 */
  severity: number
}

export interface CaseFileContent {
  caseNumber: string
  subject: string
  aliases: string[]
  charges: Charge[]
  evidence: string
  caseSummary: string
  riskLevel: RiskLevel
}

export interface Award {
  emoji: string
  category: string
  citation: string
}

export interface AwardsNightContent {
  ceremony: string
  nominee: string
  awards: Award[]
  mainAward: { title: string; reason: string }
}

export interface WrappedStat {
  value: string
  label: string
  description: string
}

export interface SiblingWrappedContent {
  year: string
  stats: WrappedStat[]
  topActivity: string
  mostUsedLine: string
  relationshipStatus: string
}

export interface ScrapbookContent {
  title: string
  thingsThatAnnoyMe: string[]
  thingsILove: string[]
  secretNote: string
  memoryCaption: string
}

export interface PerformanceRow {
  metric: string
  direction: TrendDirection
  value: string
}

export interface StockReportContent {
  ticker: string
  performanceOverview: PerformanceRow[]
  analystNotes: string[]
  recommendation: Recommendation
  riskFactor: string
  longTermOutlook: string
}

export interface CharacterStat {
  label: string
  /** 0–100 */
  value: number
}

export interface CharacterStatsContent {
  player: string
  level: string
  class: string
  stats: CharacterStat[]
  specialAbility: string
  weakness: string
  rarity: Rarity
}

// ── the envelope ─────────────────────────────────────────────────────────────

interface StyledReviewBase {
  /** Why this universe fits — kept for debugging, never rendered to the user. */
  styleReason: string
  subjectName: string
  subjectEmoji: string
  relationshipType: string
  headline: string
  subtitle: string
  finalVerdict: { title: string; reason: string }
  visualTheme: { accent: string; mood: string }
}

export type StyledReview = StyledReviewBase &
  (
    | { style: 'CASE_FILE'; content: CaseFileContent }
    | { style: 'AWARDS_NIGHT'; content: AwardsNightContent }
    | { style: 'SIBLING_WRAPPED'; content: SiblingWrappedContent }
    | { style: 'SCRAPBOOK'; content: ScrapbookContent }
    | { style: 'STOCK_REPORT'; content: StockReportContent }
    | { style: 'CHARACTER_STATS'; content: CharacterStatsContent }
  )

/** A photo the user supplied, carried alongside the model's data. */
export interface StyledReviewView {
  review: StyledReview
  photoUrl?: string
}
