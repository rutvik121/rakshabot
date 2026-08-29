import type { OutputStyle, StyledReview } from '@/lib/review/styles'

/**
 * One convincing artifact per style, for building and testing the templates.
 *
 * These are deliberately six *different siblings* rather than one sibling in
 * six costumes: a card only earns its universe if the content could not
 * plausibly have been written for any of the others. Text lengths vary on
 * purpose, including a few that sit right on the limits, so the layouts are
 * exercised rather than flattered.
 */
/** Each key narrows to its own variant, so a sample can be spread and edited. */
type SampleMap = { [K in OutputStyle]: Extract<StyledReview, { style: K }> }

export const SAMPLE_REVIEWS: SampleMap = {
  CASE_FILE: {
    style: 'CASE_FILE',
    styleReason: 'Every answer describes theft, denial or vanishing without explanation.',
    subjectName: 'Aarav',
    subjectEmoji: '🕶️',
    relationshipType: 'Younger brother, prime suspect',
    headline: 'Case File',
    subtitle: 'Standard evaluation not appropriate. Subject requires investigation.',
    content: {
      caseNumber: 'RB-2026-1083',
      subject: 'Aarav, 19, resident of the room with the locked door',
      aliases: ['Fridge Ghost', 'Charger Bandit', 'Late Night Ninja'],
      charges: [
        { emoji: '🍕', title: 'Unauthorised food acquisition', severity: 100 },
        { emoji: '🔌', title: 'Charger removal without notice', severity: 94 },
        { emoji: '🚪', title: 'Leaving at 2am, explaining nothing', severity: 88 },
        { emoji: '🧦', title: 'Wearing my hoodie in public', severity: 76 },
        { emoji: '❤️', title: 'Unexpectedly caring, when it counts', severity: 98 },
      ],
      evidence: 'Half a chocolate bar returned to the fridge, rewrapped, as if nothing happened.',
      caseSummary:
        'Highly unpredictable individual. Keeps operations hidden, denies everything with total confidence, and returns nothing he borrows. Nonetheless shows up the moment something actually goes wrong.',
      riskLevel: 'EXTREME',
    },
    finalVerdict: {
      title: 'Case closed: retained',
      reason: 'Too dangerous to lose.',
    },
    visualTheme: { accent: 'evidence-red', mood: 'suspicious and amused' },
  },

  AWARDS_NIGHT: {
    style: 'AWARDS_NIGHT',
    styleReason: 'She is described entirely in superlatives — dramatic, iconic, always on stage.',
    subjectName: 'Meera',
    subjectEmoji: '👑',
    relationshipType: 'Elder sister, permanent main character',
    headline: 'The 2026 Sibling Awards',
    subtitle: 'Proudly presented to a woman who has never once entered a room quietly.',
    content: {
      ceremony: 'The 2026 Sibling Awards',
      nominee: 'Meera',
      awards: [
        {
          emoji: '🎭',
          category: 'Best performance in a minor inconvenience',
          citation: 'For crying about the wifi for forty minutes',
        },
        {
          emoji: '💄',
          category: 'Outstanding achievement in getting ready',
          citation: 'Three hours. Every single time.',
        },
        {
          emoji: '📸',
          category: 'Lifetime achievement in photo retakes',
          citation: 'Ninety-one attempts at one picture',
        },
        {
          emoji: '🎤',
          category: 'Most likely to make it about her',
          citation: 'At my own birthday dinner',
        },
        {
          emoji: '🛡️',
          category: 'Best supporting sister',
          citation: 'Fought a shopkeeper who overcharged me',
        },
      ],
      mainAward: {
        title: 'Sibling of the Year',
        reason: 'Because nobody else could hold a room the way she does, and nobody else would.',
      },
    },
    finalVerdict: {
      title: 'Winner. Retained forever.',
      reason: 'The category was never competitive.',
    },
    visualTheme: { accent: 'gold-spotlight', mood: 'theatrical and warm' },
  },

  SIBLING_WRAPPED: {
    style: 'SIBLING_WRAPPED',
    styleReason: 'The answers are all repeated rituals — the same fights, the same jokes, daily.',
    subjectName: 'Rohan',
    subjectEmoji: '🎧',
    relationshipType: 'Twin brother, co-defendant',
    headline: 'Sibling Wrapped',
    subtitle: 'Your year together, according to RakshaBot estimates.',
    content: {
      year: '2026',
      stats: [
        {
          value: '6,572',
          label: 'minutes arguing',
          description: 'Mostly about who gets the front seat.',
        },
        {
          value: '412',
          label: 'stolen fries',
          description: 'Taken from my plate while maintaining eye contact.',
        },
        {
          value: '98%',
          label: 'emotional support',
          description: 'Delivered badly, but always delivered.',
        },
      ],
      topActivity: 'Fighting over the aux cable',
      mostUsedLine: '"It is genuinely not my fault"',
      relationshipStatus: 'Chaotically inseparable',
    },
    finalVerdict: {
      title: 'Wrapped. Retained.',
      reason: 'Thanks for the memories, and the fries.',
    },
    visualTheme: { accent: 'wrapped-lime', mood: 'loud and nostalgic' },
  },

  SCRAPBOOK: {
    style: 'SCRAPBOOK',
    styleReason: 'Every answer reaches backwards — childhood, home, the version of her I miss.',
    subjectName: 'Ananya',
    subjectEmoji: '🌼',
    relationshipType: 'Big sister, keeper of the good version of me',
    headline: 'A collection of our chaos',
    subtitle: 'Some of it is embarrassing. All of it is being kept.',
    content: {
      title: 'A collection of our chaos',
      thingsThatAnnoyMe: [
        'You still call me by the nickname from 2009',
        'You reply to texts eleven days later',
        'You reorganise my room without asking',
        'You tell Mum everything. Everything.',
      ],
      thingsILove: [
        'You waited outside my exam hall for three hours',
        'You remember every single thing I have ever liked',
        'You still make the sandwich the way you did when we were kids',
      ],
      secretNote:
        'I have never told you that I copied how you talk to people. You made being kind look easy, and I have been imitating you ever since.',
      memoryCaption: 'We fight. We make up. We are family.',
    },
    finalVerdict: {
      title: 'Kept. Always.',
      reason: 'Because some bonds are not up for review.',
    },
    visualTheme: { accent: 'paper-warm', mood: 'nostalgic and tender' },
  },

  STOCK_REPORT: {
    style: 'STOCK_REPORT',
    styleReason: 'He is expensive, volatile, occasionally brilliant, and impossible to divest.',
    subjectName: 'Kabir',
    subjectEmoji: '📈',
    relationshipType: 'Younger brother, high-risk holding',
    headline: '$KABIR',
    subtitle: 'Sibling Stock Report · FY 2025–26',
    content: {
      ticker: '$KABIR',
      performanceOverview: [
        { metric: 'Annoyance index', direction: 'UP', value: '100%' },
        { metric: 'Snack expenditure', direction: 'UP', value: '94%' },
        { metric: 'Emotional support', direction: 'UP', value: '98%' },
        { metric: 'Drama generation', direction: 'VOLATILE', value: '91%' },
        { metric: 'Financial sense', direction: 'DOWN', value: '42%' },
      ],
      analystNotes: [
        'Spends ₹10,000 on a keyboard, then borrows bus fare.',
        'Volatility high, but the long-term hold has never been in question.',
      ],
      recommendation: 'STRONG BUY',
      riskFactor: 'Extremely annoying, without warning',
      longTermOutlook: 'Irreplaceable asset. Do not divest under any conditions.',
    },
    finalVerdict: {
      title: 'Strong buy. Held forever.',
      reason: 'The fundamentals are unbeatable.',
    },
    visualTheme: { accent: 'terminal-cyan', mood: 'analytical and fond' },
  },

  CHARACTER_STATS: {
    style: 'CHARACTER_STATS',
    styleReason: 'Described exactly like a game character: skills, obsessions, one fatal weakness.',
    subjectName: 'Vihaan',
    subjectEmoji: '🎮',
    relationshipType: 'Older brother, permanent party member',
    headline: 'Character Profile',
    subtitle: 'Unlocked after 24 years of continuous play.',
    content: {
      player: 'PLAYER 2',
      level: '24',
      class: 'Professional Annoyance',
      stats: [
        { label: 'Annoyance', value: 100 },
        { label: 'Snack theft', value: 94 },
        { label: 'Loyalty', value: 98 },
        { label: 'Drama', value: 91 },
        { label: 'Emotional support', value: 97 },
      ],
      specialAbility: 'Starting fights over absolutely nothing',
      weakness: "Mum's disappointed face",
      rarity: 'LEGENDARY',
    },
    finalVerdict: {
      title: 'Permanently in party',
      reason: 'Because every team needs the one who never leaves.',
    },
    visualTheme: { accent: 'arcade-violet', mood: 'competitive and loyal' },
  },
}

/** A worst-case artifact for layout testing: every field at or over its limit. */
export const STRESS_REVIEW: SampleMap['CASE_FILE'] = {
  ...SAMPLE_REVIEWS.CASE_FILE,
  subjectName: 'Bartholomew Kumaraswamy',
  relationshipType: 'Considerably older brother and legal guardian of the remote',
  headline: 'Confidential Case File Dossier',
  subtitle:
    'Standard performance evaluation was found to be entirely inappropriate for this subject.',
  content: {
    ...SAMPLE_REVIEWS.CASE_FILE.content,
    caseNumber: 'RB-2026-100839',
    aliases: [
      'The Refrigerator Phantom',
      'Chief Charger Liberator',
      'Nocturnal Kitchen Operative',
    ],
    charges: [
      { emoji: '🍕', title: 'Unauthorised acquisition of every snack', severity: 100 },
      { emoji: '🔌', title: 'Systematic charger displacement operations', severity: 94 },
      { emoji: '🚪', title: 'Departing at 2am with no explanation given', severity: 88 },
      { emoji: '🧦', title: 'Wearing my clothing in public without asking', severity: 76 },
      { emoji: '❤️', title: 'Being unexpectedly and inconveniently caring', severity: 98 },
    ],
    evidence:
      'Half a chocolate bar returned to the fridge, carefully rewrapped, as though nothing had ever happened at all.',
    caseSummary:
      'Highly unpredictable individual who keeps every operation hidden and denies all involvement with total confidence. Returns nothing he borrows, ever. Nonetheless shows up the exact moment something actually goes wrong, without being asked.',
  },
  finalVerdict: {
    title: 'Case closed: retained forever',
    reason: 'Categorically far too dangerous to ever lose or replace.',
  },
}
