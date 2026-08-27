export interface Question {
  id: string
  emoji: string
  prompt: string
  helper?: string
  placeholder: string
}

export type Answers = Record<string, string>

export interface PerformanceMetric {
  /** Short, punchy metric name, e.g. "Annoying Me" */
  label: string
  /** 0–100 */
  score: number
  emoji: string
  /**
   * Emotional valence, which drives the meter's colour. Ordering roast metrics
   * before love metrics makes the card warm from orange to pink as it's read.
   */
  tone: 'roast' | 'love'
}

export interface Award {
  emoji: string
  /** The award's name, e.g. "Most Likely To Steal Food Without Regret" */
  title: string
}

export interface ReviewData {
  /** Document identifier printed on the report, e.g. "RB-2026-0007" */
  documentId: string
  /** e.g. "FY 2025–26" */
  reviewPeriod: string
  /** How the employee is named on the report, e.g. "MY SISTER" */
  employeeName: string
  /** Emoji trailing the name, e.g. "😤" */
  employeeEmoji: string
  /** Emoji used as the polaroid photo placeholder */
  photoEmoji: string
  /** Optional real photo; falls back to photoEmoji when absent */
  photoUrl?: string
  /** Two-line job title, e.g. ["Full-Time Annoyance", "Part-Time Best Friend"] */
  position: [string, string]
  metrics: PerformanceMetric[]
  managerReview: string
  /** Name signed under the manager's review */
  reviewedBy: string
  /** A personalised, stamped-certificate style honour, shown before the verdict */
  award: Award
  /** The climax stamp text, e.g. "RETAINED" */
  finalDecision: string
  /** Emoji beside the decision, e.g. "❤️" */
  decisionEmoji: string
  /** e.g. "Unfortunately, irreplaceable." */
  decisionReason: string
  hashtag: string
}
