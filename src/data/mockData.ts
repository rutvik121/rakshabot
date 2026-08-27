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
  employeeName: 'Ananya "Chaos Goblin" Sharma',
  avatarEmoji: '👑',
  position: 'Senior Sibling & Chief Snack Officer',
  reviewPeriod: 'FY 2025–26',
  employeeId: 'SIB-0007',
  metrics: [
    { label: 'Reply Speed', score: 22, emoji: '📵' },
    { label: 'Emotional Damage Caused', score: 91, emoji: '💥' },
    { label: 'Snack Theft Rate', score: 87, emoji: '🍫' },
    { label: 'Showing Up When It Matters', score: 98, emoji: '🫶' },
    { label: 'Overall Vibes', score: 95, emoji: '✨' },
  ],
  managerReview:
    'Consistently unavailable during working hours, yet mysteriously present the moment there is food, drama, or a family WhatsApp group emergency. Shows exceptional leadership in stealing chargers with zero remorse. Despite chronic lateness and a personality that runs entirely on sarcasm, has an unmatched ability to make everything feel okay. Promotion recommended. Reluctantly.',
  strengths: [
    'Turns up uninvited exactly when needed',
    'World-class at finding the last piece of cake',
    'Unofficial therapist, 24x7, no appointment needed',
  ],
  finalDecision: 'RETAINED ❤️',
  decisionReason: 'Unfortunately, irreplaceable.',
}
