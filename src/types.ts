export interface Question {
  id: string
  emoji: string
  prompt: string
  helper?: string
  placeholder: string
}

export type Answers = Record<string, string>

export interface PerformanceMetric {
  label: string
  score: number
  emoji: string
}

export interface ReviewData {
  employeeName: string
  avatarEmoji: string
  position: string
  reviewPeriod: string
  employeeId: string
  metrics: PerformanceMetric[]
  managerReview: string
  strengths: string[]
  finalDecision: string
  decisionReason: string
}
