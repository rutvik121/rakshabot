import type { CSSProperties } from 'react'
import type { PersonalityTheme } from '@/lib/review/types'

/**
 * Per-theme accent tokens for the review card.
 *
 * The layout never changes — only these values do. The card must stay
 * recognisably RakshaBot whichever personality it is dressed for, so every
 * theme keeps the dark ground, the document furniture and the type scale, and
 * varies only accent hue, the ambient wash, and a couple of decorative marks.
 */
export interface CardTheme {
  /** Ink for roast metrics */
  roastInk: string
  /** Ink for affectionate metrics */
  loveInk: string
  /** The verdict stamp, and the strongest accent on the card */
  stampInk: string
  /** Classification stamp + "Classified" dot */
  classifiedInk: string
  /** Award band accent */
  awardInk: string
  /** Small type accents: FY line, position line 1 / line 2 */
  periodInk: string
  positionInk: string
  positionAltInk: string
  /** The radial wash behind the masthead */
  wash: string
  /** Extra decorative stars scattered on the card */
  sparkles: number
  /** Degrees of extra tilt applied to the stamps, for the messier personalities */
  tilt: number
}

const THEMES: Record<PersonalityTheme, CardTheme> = {
  // secretive, mischievous, suspicious — the default document look
  confidential: {
    roastInk: '#ff9a3d',
    loveInk: '#ff4d92',
    stampInk: '#ff3d81',
    classifiedInk: '#ff6b5e',
    awardInk: '#ff9a3d',
    periodInk: '#ff9a3d',
    positionInk: '#ff5fa2',
    positionAltInk: '#ff9a3d',
    wash: 'radial-gradient(circle, rgba(145,97,255,0.55), rgba(255,61,129,0.3) 50%, transparent 72%)',
    sparkles: 0,
    tilt: 0,
  },
  // emotional, calm, nostalgic
  midnight: {
    roastInk: '#7f8cff',
    loveInk: '#c084fc',
    stampInk: '#9161ff',
    classifiedInk: '#7f8cff',
    awardInk: '#a5b4fc',
    periodInk: '#a5b4fc',
    positionInk: '#c084fc',
    positionAltInk: '#7f8cff',
    wash: 'radial-gradient(circle, rgba(99,102,241,0.6), rgba(145,97,255,0.32) 50%, transparent 74%)',
    sparkles: 3,
    tilt: 0,
  },
  // chaotic, energetic, funny
  neon: {
    roastInk: '#ffb020',
    loveInk: '#ff2d9b',
    stampInk: '#ff2d9b',
    classifiedInk: '#ffb020',
    awardInk: '#ffd23d',
    periodInk: '#ffd23d',
    positionInk: '#ff2d9b',
    positionAltInk: '#ffb020',
    wash: 'radial-gradient(circle, rgba(255,45,155,0.6), rgba(255,176,32,0.34) 50%, transparent 74%)',
    sparkles: 2,
    tilt: 1,
  },
  // sweet, supportive, emotional
  warm: {
    roastInk: '#ff8a5c',
    loveInk: '#ff6f91',
    stampInk: '#ff6f91',
    classifiedInk: '#ffb08a',
    awardInk: '#ffc48a',
    periodInk: '#ffc48a',
    positionInk: '#ff6f91',
    positionAltInk: '#ffb08a',
    wash: 'radial-gradient(circle, rgba(255,154,61,0.5), rgba(255,111,145,0.32) 52%, transparent 74%)',
    sparkles: 1,
    tilt: 0,
  },
  // wild, unpredictable, funny
  chaotic: {
    roastInk: '#ff7a3d',
    loveInk: '#ff3d81',
    stampInk: '#ff4d2d',
    classifiedInk: '#ffd23d',
    awardInk: '#7fe08a',
    periodInk: '#7fe08a',
    positionInk: '#ff3d81',
    positionAltInk: '#ffd23d',
    wash: 'radial-gradient(circle, rgba(255,77,45,0.5), rgba(127,224,138,0.26) 52%, transparent 74%)',
    sparkles: 4,
    tilt: 3,
  },
  // dramatic, confident, spoiled or iconic
  royal: {
    roastInk: '#e8b44a',
    loveInk: '#ff5fa2',
    stampInk: '#e8b44a',
    classifiedInk: '#e8b44a',
    awardInk: '#f5d580',
    periodInk: '#f5d580',
    positionInk: '#f5d580',
    positionAltInk: '#ff5fa2',
    wash: 'radial-gradient(circle, rgba(232,180,74,0.45), rgba(145,97,255,0.3) 52%, transparent 74%)',
    sparkles: 2,
    tilt: 0,
  },
}

export function getCardTheme(theme: PersonalityTheme = 'confidential'): CardTheme {
  return THEMES[theme] ?? THEMES.confidential
}

/** Exposes the theme to the card's subtree as CSS variables. */
export function themeVars(t: CardTheme): CSSProperties {
  return {
    '--card-roast': t.roastInk,
    '--card-love': t.loveInk,
    '--card-stamp': t.stampInk,
    '--card-classified': t.classifiedInk,
    '--card-award': t.awardInk,
    '--card-period': t.periodInk,
    '--card-position': t.positionInk,
    '--card-position-alt': t.positionAltInk,
  } as CSSProperties
}
