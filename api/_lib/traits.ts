import type { PersonalityTheme } from './types'

/**
 * A recognisable sibling behaviour, with the vocabulary to write about it.
 *
 * The fallback generator reads the user's answers for these, then builds the
 * review out of whichever ones it finds — so two different siblings produce two
 * different documents even with no model in the loop.
 */
export interface Trait {
  id: string
  /** Matched against the user's raw answers */
  test: RegExp
  theme: PersonalityTheme
  /** Metric labels, bureaucratic names for the behaviour (≤ LIMITS.metricLabel) */
  metrics: { emoji: string; label: string; low: number; high: number }[]
  /** Candidate joke job titles (≤ LIMITS.positionLine) */
  positions: string[]
  awards: { emoji: string; title: string; description: string }[]
  /** Clause for the manager's review, written to follow "the employee" */
  clauses: string[]
}

export const TRAITS: Trait[] = [
  {
    id: 'food',
    test: /\b(food|eat|eats|eating|snack|snacks|hungry|pizza|burger|chocolate|maggi|biryani|fridge|plate|momos|noodles|chips|cake|leftovers?)\b/i,
    theme: 'chaotic',
    metrics: [
      { emoji: '🍔', label: 'Unauthorized Snacking', low: 92, high: 100 },
      { emoji: '🍕', label: 'Plate Encroachment', low: 88, high: 99 },
      { emoji: '🥡', label: 'Leftover Survival Rate', low: 4, high: 18 },
    ],
    positions: ['Director of Snack Acquisition', 'Head of Fridge Operations'],
    awards: [
      {
        emoji: '🍔',
        title: 'Most Wanted For Food Theft',
        description: 'Still at large. Still hungry.',
      },
      {
        emoji: '🥇',
        title: 'Excellence In Plate Reduction',
        description: 'No plate has ever survived a full meal nearby.',
      },
    ],
    clauses: [
      'runs an unlicensed food redistribution scheme with my plate as the primary supply chain',
      'treats the fridge as a shared resource and my share as a rounding error',
    ],
  },
  {
    id: 'sleep',
    test: /\b(sleep|sleeps|sleeping|nap|naps|bed|lazy|wake|woke|alarm|snooze|tired|blanket)\b/i,
    theme: 'midnight',
    metrics: [
      { emoji: '😴', label: 'Commitment To Sleeping', low: 94, high: 100 },
      { emoji: '⏰', label: 'Alarm Compliance', low: 3, high: 22 },
      { emoji: '🛏️', label: 'Bed Occupancy Rate', low: 85, high: 99 },
    ],
    positions: ['Chief Sleeping Officer', 'Head of Doing Nothing'],
    awards: [
      {
        emoji: '😴',
        title: 'Outstanding Commitment To Doing Nothing',
        description: 'Achieved without leaving the bed once.',
      },
      {
        emoji: '⏰',
        title: 'Lifetime Achievement In Snoozing',
        description: 'Nine alarms. Zero consequences.',
      },
    ],
    clauses: [
      'maintains a sleep schedule that would concern a medical professional',
      'has never once been awake at the hour they promised to be awake',
    ],
  },
  {
    id: 'shopping',
    test: /\b(shoe|shoes|sneaker|clothes|shop|shopping|buy|buys|dress|makeup|amazon|myntra|cart|sale|haul|skincare|bag|bags)\b/i,
    theme: 'royal',
    metrics: [
      { emoji: '👟', label: 'Financial Decisions', low: 12, high: 34 },
      { emoji: '🛍️', label: 'Cart Abandonment Rate', low: 2, high: 14 },
      { emoji: '💳', label: 'Impulse Control', low: 6, high: 26 },
    ],
    positions: ['VP of Questionable Purchases', 'Head of Retail Emergencies'],
    awards: [
      {
        emoji: '👟',
        title: 'Financially Brave, Emotionally Supported',
        description: 'The cart was full. The regret was empty.',
      },
      {
        emoji: '💳',
        title: 'Excellence In Impulse Spending',
        description: 'Budget consulted. Budget ignored.',
      },
    ],
    clauses: [
      'makes financial decisions that would not survive a single round of due diligence',
      'treats a sale notification as a legally binding instruction',
    ],
  },
  {
    id: 'phone',
    test: /\b(phone|instagram|insta|reels|scroll|scrolling|screen|whatsapp|online|text|texts|snap|tiktok|reply|replies|replying|seen)\b/i,
    theme: 'neon',
    metrics: [
      { emoji: '📵', label: 'Reply Latency', low: 6, high: 24 },
      { emoji: '📱', label: 'Screen Time Discipline', low: 4, high: 20 },
      { emoji: '👀', label: 'Message Read Receipts', low: 90, high: 100 },
    ],
    positions: ['Head of Unread Messages', 'Director of Being Online'],
    awards: [
      {
        emoji: '📵',
        title: 'Excellence In Leaving People On Read',
        description: 'Online for six hours. Replied to nothing.',
      },
      {
        emoji: '📱',
        title: 'Lifetime Achievement In Scrolling',
        description: 'No thumb has worked harder for less reason.',
      },
    ],
    clauses: [
      'has been visibly online for the entire duration of every unanswered message I have ever sent',
      'reads every message immediately and replies to approximately none of them',
    ],
  },
  {
    id: 'gaming',
    test: /\b(game|games|gaming|gamer|pubg|bgmi|valorant|xbox|playstation|ps5|console|fifa|minecraft|steam|controller)\b/i,
    theme: 'neon',
    metrics: [
      { emoji: '🎮', label: 'Hours Logged In-Game', low: 93, high: 100 },
      { emoji: '🔇', label: 'Response While Gaming', low: 1, high: 12 },
      { emoji: '🏅', label: 'Rank Over Family', low: 82, high: 97 },
    ],
    positions: ['Head of Competitive Shouting', 'Director of One More Game'],
    awards: [
      {
        emoji: '🎮',
        title: 'Outstanding Service To One More Game',
        description: 'It was never one more game.',
      },
      {
        emoji: '🔇',
        title: 'Excellence In Selective Hearing',
        description: 'Hears a footstep in-game. Not their own name.',
      },
    ],
    clauses: [
      'can hear an enemy footstep through a wall but not their own name from the next room',
      'has said "one more game" more times than any auditable record can support',
    ],
  },
  {
    id: 'steal',
    test: /\b(steal|steals|stole|stealing|hoodie|charger|shirt|jacket|socks|borrow|borrows|took|takes|earphone|headphone|perfume)\b/i,
    theme: 'confidential',
    metrics: [
      { emoji: '🕵️', label: 'Item Return Rate', low: 2, high: 16 },
      { emoji: '🧥', label: 'Wardrobe Sovereignty', low: 88, high: 99 },
      { emoji: '🔌', label: 'Charger Custody Record', low: 5, high: 20 },
    ],
    positions: ['Head of Permanent Borrowing', 'Director of Asset Transfer'],
    awards: [
      {
        emoji: '🕵️',
        title: 'Lifetime Achievement In Borrowing',
        description: 'Nothing borrowed has ever been seen again.',
      },
      {
        emoji: '🧥',
        title: 'Excellence In Wardrobe Annexation',
        description: 'Ownership is a suggestion, apparently.',
      },
    ],
    clauses: [
      'operates a one-way lending library in which nothing has ever been returned',
      'considers ownership a formality and my wardrobe a shared jurisdiction',
    ],
  },
  {
    id: 'drama',
    test: /\b(drama|fight|fights|argue|argues|shout|shouts|tantrum|mood|moody|attitude|sulk|angry|annoy|annoys|annoying|irritat|bug|bugs|tease|nag)\b/i,
    theme: 'chaotic',
    metrics: [
      { emoji: '😈', label: 'Professional Annoyance', low: 94, high: 100 },
      { emoji: '🎭', label: 'Dramatic Escalation', low: 86, high: 99 },
      { emoji: '🧨', label: 'Argument Initiation', low: 80, high: 97 },
    ],
    positions: ['Head of Unprovoked Conflict', 'Director of Minor Chaos'],
    awards: [
      {
        emoji: '🎭',
        title: 'Best Performance In Starting Fights',
        description: 'Nominated by everyone. Voted by no one.',
      },
      {
        emoji: '😈',
        title: 'Lifetime Achievement In Being Impossible',
        description: 'A category invented specifically for this.',
      },
    ],
    clauses: [
      'can start an argument in a silent room with no participants',
      'escalates a question about dinner into a matter of principle',
    ],
  },
  {
    id: 'mess',
    test: /\b(mess|messy|dirty|clean|room|laundry|organiz|organis|clutter|towel|plates?|wash)\b/i,
    theme: 'chaotic',
    metrics: [
      { emoji: '🧺', label: 'Floor Visibility', low: 8, high: 28 },
      { emoji: '🧽', label: 'Cleanup Participation', low: 4, high: 22 },
    ],
    positions: ['Head of Floor Storage', 'Director of Later'],
    awards: [
      {
        emoji: '🧺',
        title: 'Excellence In Horizontal Storage',
        description: 'Every surface is a shelf if you believe.',
      },
    ],
    clauses: [
      'treats every horizontal surface in the house as available storage',
      'has a room that would fail a basic structural inspection',
    ],
  },
  {
    id: 'study',
    test: /\b(study|studies|exam|exams|topper|marks|school|college|assignment|homework|degree|class|deadline)\b/i,
    theme: 'royal',
    metrics: [
      { emoji: '📚', label: 'Last-Minute Prep', low: 88, high: 99 },
      { emoji: '🎓', label: 'Unearned Confidence', low: 84, high: 98 },
    ],
    positions: ['Head of Last-Minute Everything', 'Director of Somehow Passing'],
    awards: [
      {
        emoji: '🎓',
        title: 'Results Without Evidence Of Work',
        description: 'The method remains classified.',
      },
    ],
    clauses: [
      'begins every deadline at the last possible hour and somehow clears it',
      'produces results with no observable working process',
    ],
  },
  {
    id: 'music',
    test: /\b(music|sing|sings|singing|guitar|dance|dances|song|songs|playlist|piano|loud|speaker)\b/i,
    theme: 'neon',
    metrics: [
      { emoji: '🎧', label: 'Household Volume', low: 86, high: 99 },
      { emoji: '🎤', label: 'Unrequested Concerts', low: 82, high: 97 },
    ],
    positions: ['Head of Unrequested Concerts', 'Director of Volume'],
    awards: [
      {
        emoji: '🎤',
        title: 'Excellence In Unsolicited Performance',
        description: 'No stage. No warning. No stopping.',
      },
    ],
    clauses: [
      'performs at a volume no one in the building consented to',
      'has never once used headphones when headphones were the obvious answer',
    ],
  },
  {
    id: 'cooking',
    test: /\b(cook|cooks|cooking|bake|bakes|baking|chef|recipe|kitchen)\b/i,
    theme: 'warm',
    metrics: [
      { emoji: '👨‍🍳', label: 'Surprise Cooking Skill', low: 84, high: 97 },
      { emoji: '🍳', label: 'Kitchen Cleanup After', low: 6, high: 26 },
    ],
    positions: ['Head of Suspicious Cooking', 'Director of Kitchen Chaos'],
    awards: [
      {
        emoji: '👨‍🍳',
        title: 'Excellence In Unexpected Competence',
        description: 'Nobody saw this skill coming.',
      },
    ],
    clauses: [
      'can genuinely cook, which nobody in this family was prepared for',
      'produces excellent food and leaves the kitchen looking like evidence',
    ],
  },
  {
    id: 'talent',
    test: /\b(good at|talent|talented|skill|skilled|draw|draws|art|paint|design|fix|fixes|code|codes|photo|write|writes)\b/i,
    theme: 'royal',
    metrics: [
      { emoji: '🎯', label: 'Hidden Competence', low: 86, high: 98 },
      { emoji: '🤫', label: 'Willingness To Mention', low: 8, high: 30 },
    ],
    positions: ['Head of Secret Competence', 'Director of Quiet Talent'],
    awards: [
      {
        emoji: '🎯',
        title: 'Excellence In Quiet Competence',
        description: 'Never mentioned it once. Typical.',
      },
    ],
    clauses: [
      'is quietly excellent at something they have never once brought up',
      'possesses a genuine talent they refuse to take any credit for',
    ],
  },
  {
    id: 'support',
    test: /\b(support|supportive|there for|listen|listens|help|helps|care|cares|protect|comfort|show up|shows up|advice|calm|safe)\b/i,
    theme: 'warm',
    metrics: [
      { emoji: '❤️', label: 'Emergency Support', low: 94, high: 100 },
      { emoji: '🫶', label: 'Shows Up When Needed', low: 95, high: 100 },
    ],
    positions: ['Head of Turning Up Anyway', 'Director of Quiet Rescues'],
    awards: [
      {
        emoji: '🫶',
        title: 'Best Supporting Human',
        description: 'Unpaid. Unasked. Unmatched.',
      },
      {
        emoji: '❤️',
        title: 'Employee Of The Family',
        description: 'The only unanimous decision this year.',
      },
    ],
    clauses: [
      'has shown up every single time it actually mattered, without being asked',
      'is the first call in an emergency and has never once made that a problem',
    ],
  },
  {
    id: 'funny',
    test: /\b(funny|laugh|laughs|joke|jokes|humour|humor|meme|memes|silly|comedy)\b/i,
    theme: 'neon',
    metrics: [
      { emoji: '😂', label: 'Making Me Laugh', low: 90, high: 100 },
      { emoji: '🃏', label: 'Timing Of Jokes', low: 74, high: 94 },
    ],
    positions: ['Head of Household Comedy', 'Director of Bad Timing'],
    awards: [
      {
        emoji: '😂',
        title: 'Outstanding Contribution To Laughing',
        description: 'Mostly at the worst possible moment.',
      },
    ],
    clauses: [
      'is genuinely funny, usually at the least appropriate moment available',
      'can defuse anything with a joke and routinely chooses violence instead',
    ],
  },
]

/** Used when the answers are too sparse to match anything specific. */
export const GENERIC_METRICS = [
  { emoji: '🤝', label: 'General Cooperation', low: 40, high: 70 },
  { emoji: '⏳', label: 'Punctuality', low: 20, high: 55 },
  { emoji: '🔊', label: 'Household Noise Output', low: 60, high: 92 },
  { emoji: '🧠', label: 'Decision Making', low: 35, high: 68 },
  { emoji: '✨', label: 'Overall Vibes', low: 80, high: 98 },
]
