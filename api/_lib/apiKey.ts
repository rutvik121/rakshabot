/**
 * Reading the Gemini API key, and naming what was supplied instead.
 *
 * Google hands out several credentials that look plausible in an environment
 * variable and none of which the Gemini API accepts. Saying only "this is not a
 * key" sends someone back to the same page they got it from; saying "this is an
 * OAuth access token, they expire hourly, you want an AI Studio key" ends the
 * problem in one step.
 *
 * Nothing here ever returns key material — only its length and its shape.
 */

/** AI Studio keys: `AIza` and roughly 35 more characters. */
const AI_STUDIO_KEY = /^AIza[\w-]{20,}$/

/** Credentials people reach for by mistake, and what they actually are. */
const IMPOSTORS: { test: RegExp; what: string }[] = [
  {
    test: /^(AQ\.|ya29\.)/,
    what:
      'a Google OAuth access token, not an API key. Those expire after about an hour and the Gemini API does not accept them',
  },
  { test: /^\s*\{/, what: 'a service-account JSON file, which the Gemini API does not accept' },
  {
    test: /^(sk-|sk_)/,
    what: 'an OpenAI-style key, which will not work against Google',
  },
  {
    test: /^[a-z0-9-]+$/,
    what: 'a project id rather than a key',
  },
]

export interface KeyReport {
  configured: boolean
  length?: number
  /** Paste damage and wrong-credential diagnoses, most useful first. */
  problems?: string[]
}

/** Strips the damage a paste introduces, without judging the result. */
export function normaliseKey(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^["']|["']$/g, '')
}

export function isUsableKey(raw: string | undefined): boolean {
  return AI_STUDIO_KEY.test(normaliseKey(raw))
}

/** What is wrong with this value, in the order worth reading. */
export function describeKey(raw: string | undefined): KeyReport {
  if (!raw?.trim()) return { configured: false }

  const key = normaliseKey(raw)
  const problems: string[] = []

  const impostor = IMPOSTORS.find((i) => i.test.test(key))
  if (impostor) {
    problems.push(`looks like ${impostor.what}`)
  } else if (!key.startsWith('AIza')) {
    problems.push('does not start with "AIza", which Google AI Studio keys do')
  } else if (!AI_STUDIO_KEY.test(key)) {
    problems.push('starts with "AIza" but looks truncated')
  }

  // Paste damage is worth reporting even when the key is otherwise the right
  // shape — it is invisible in a dashboard field and breaks the request header.
  if (raw !== raw.trim()) problems.push('has leading or trailing whitespace')
  if (/^["']|["']$/.test(raw.trim())) problems.push('is wrapped in quotes — paste it bare')
  if (/\s/.test(key)) problems.push('contains a space or newline')

  return { configured: true, length: raw.length, ...(problems.length ? { problems } : {}) }
}
