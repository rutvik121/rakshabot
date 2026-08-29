import type { Question } from '../../src/types.js'

/*
 * The question set lives here rather than under src/ because the serverless
 * function needs it at runtime to build the prompt, and a function must be able
 * to resolve everything it imports from inside api/. `src/data/mockData.ts`
 * re-exports it, so the app still reads it from where app content belongs.
 *
 * The Question type above is a type-only import: erased at build time, so it
 * never becomes a runtime dependency on src/.
 */

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
