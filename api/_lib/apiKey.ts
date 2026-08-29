/**
 * Reading the Gemini API key, and naming what was supplied instead.
 *
 * Google hands out several credentials that look plausible in an environment
 * variable and that the Gemini API does not accept. Saying only "this is not a
 * key" sends someone back to the same page they got it from; naming what they
 * actually supplied ends the problem in one step.
 *
 * Being wrong in the other direction is worse: a validator that rejects a key
 * which works is a self-inflicted outage. So the accepted set is deliberately
 * broad, and only credentials that are unmistakably something else are refused.
 *
 * Nothing here ever returns key material — only its length and its shape.
 */

/**
 * The two shapes AI Studio has issued.
 *
 * `AQ.` is the current format; `AIza` is the older one, still working but being
 * retired. Both are accepted, because a key that works today should not be
 * refused on the grounds of being the wrong vintage.
 */
const API_KEY = /^(AQ\.[\w.-]{16,}|AIza[\w-]{20,})$/

/** Credentials people reach for by mistake, and what they actually are. */
const IMPOSTORS: { test: RegExp; what: string }[] = [
  {
    test: /^ya29\./,
    what:
      'a Google OAuth access token, not an API key. Those expire after about an hour and the Gemini API does not accept them',
  },
  { test: /^\s*\{/, what: 'a service-account JSON file, which the Gemini API does not accept' },
  { test: /^(sk-|sk_)/, what: 'an OpenAI-style key, which will not work against Google' },
  { test: /^[a-z0-9-]+$/, what: 'a project id rather than a key' },
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
  return API_KEY.test(normaliseKey(raw))
}

/** What is wrong with this value, in the order worth reading. */
export function describeKey(raw: string | undefined): KeyReport {
  if (!raw?.trim()) return { configured: false }

  const key = normaliseKey(raw)
  const problems: string[] = []

  const impostor = IMPOSTORS.find((i) => i.test.test(key))
  if (impostor) {
    problems.push(`looks like ${impostor.what}`)
  } else if (!API_KEY.test(key)) {
    problems.push(
      /^(AQ\.|AIza)/.test(key)
        ? 'starts correctly but looks truncated — check the whole key was copied'
        : 'does not look like a Gemini API key. AI Studio keys start with "AQ." (or "AIza" if older)',
    )
  }

  /*
   * Shape-valid but currently unusable: AI Studio has begun issuing `AQ.` keys
   * that generativelanguage.googleapis.com rejects with 401 however they are
   * sent. Worth flagging up front, since the request will fail and the cause
   * is not in this codebase.
   */
  if (key.startsWith('AQ.')) {
    problems.push(
      'is an "AQ." key, which the Gemini API is currently rejecting with 401 — a known ' +
        'Google-side issue. An "AIza" key works',
    )
  }

  // Paste damage is worth reporting even when the key is otherwise the right
  // shape — it is invisible in a dashboard field and breaks the request header.
  if (raw !== raw.trim()) problems.push('has leading or trailing whitespace')
  if (/^["']|["']$/.test(raw.trim())) problems.push('is wrapped in quotes — paste it bare')
  if (/\s/.test(key)) problems.push('contains a space or newline')

  return { configured: true, length: raw.length, ...(problems.length ? { problems } : {}) }
}
