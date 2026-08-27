import type { Question, ReviewData } from '@/types'

export const QUESTIONS: Question[] = [
  {
    id: 'habit',
    emoji: '😤',
    prompt: 'What is their biggest annoying habit?',
    helper: 'Be honest. This is confidential. Mostly.',
    placeholder: 'e.g. Never replies but is "online" on WhatsApp...',
  },
  {
    id: 'spend',
    emoji: '💸',
    prompt: 'What would they spend ₹10,000 on?',
    helper: 'Think fast. No overthinking allowed.',
    placeholder: 'e.g. Some app subscription they forgot to cancel...',
  },
  {
    id: 'talent',
    emoji: '🏆',
    prompt: 'What are they surprisingly good at?',
    helper: 'The talent they never brag about.',
    placeholder: 'e.g. Finding the cheapest flight tickets at 2am...',
  },
  {
    id: 'steals',
    emoji: '🕵️',
    prompt: 'What do they love stealing from you?',
    helper: 'Clothes, chargers, snacks — name it.',
    placeholder: 'e.g. My hoodie. I will never see it again...',
  },
  {
    id: 'love',
    emoji: '❤️',
    prompt: 'What do you love about them but never say?',
    helper: 'Last one. Make it count.',
    placeholder: 'e.g. They always show up when it matters...',
  },
]

export const SAMPLE_REVIEW: ReviewData = {
  documentId: 'RB-2026-0007',
  reviewPeriod: 'FY 2025–26',
  employeeName: 'My Sister',
  employeeEmoji: '😤',
  photoEmoji: '👧',
  position: ['Full-Time Annoyance', 'Part-Time Best Friend'],
  metrics: [
    { label: 'Annoying Me', score: 100, emoji: '😡', tone: 'roast' },
    { label: 'Stealing My Food', score: 94, emoji: '🍔', tone: 'roast' },
    { label: 'Keeping Secrets', score: 72, emoji: '🔒', tone: 'roast' },
    { label: 'Being Supportive', score: 98, emoji: '❤️', tone: 'love' },
    { label: 'Making Me Laugh', score: 91, emoji: '😂', tone: 'love' },
  ],
  managerReview:
    'Despite repeatedly testing my patience, the employee has demonstrated exceptional performance as a sibling. Shows up without being asked. Remembers what I forget.',
  reviewedBy: 'The Management (me)',
  finalDecision: 'RETAINED',
  decisionEmoji: '❤️',
  decisionReason: 'Unfortunately, irreplaceable.',
  hashtag: '#SiblingPerformanceReview',
}
