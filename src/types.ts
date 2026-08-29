export interface Question {
  id: string
  emoji: string
  prompt: string
  helper?: string
  placeholder: string
}

export type Answers = Record<string, string>

/** Who is being reviewed. Collected before the questions. */
export interface SiblingIdentity {
  name: string
  /** Object URL for a photo the user picked; the card falls back to an emoji */
  photoUrl?: string
}

/** Longest sibling name the poster can set without overflowing its fixed frame. */
export const MAX_NAME_LENGTH = 22
