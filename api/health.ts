import { GoogleGenAI } from '@google/genai'

/**
 * Configuration check for the deployed generation route.
 *
 * When generation fails in production the cause is almost always the
 * environment rather than the code, and the environment is exactly what cannot
 * be inspected from a laptop. This reports what the server can see about its
 * own configuration, so diagnosing a broken deploy is one URL rather than a
 * dig through dashboards and logs.
 *
 * It never returns key material — only whether a key is present, how long it
 * is, and which of the usual paste mistakes it shows signs of.
 */

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.7-flash'

interface KeyReport {
  configured: boolean
  length?: number
  /** Paste damage that makes a valid key fail: quotes, spaces, a newline. */
  problems?: string[]
}

function inspectKey(raw: string | undefined): KeyReport {
  if (!raw) return { configured: false }

  const problems: string[] = []
  if (raw !== raw.trim()) problems.push('has leading or trailing whitespace')
  const trimmed = raw.trim()
  if (/^["']|["']$/.test(trimmed)) problems.push('is wrapped in quotes — paste the key without them')
  if (/\s/.test(trimmed)) problems.push('contains a space or newline')
  if (trimmed.startsWith('AIza') === false) problems.push('does not start with "AIza", which Google keys do')
  if (trimmed.length < 30) problems.push('looks too short to be a full key')

  return { configured: true, length: raw.length, ...(problems.length ? { problems } : {}) }
}

/** Maps an upstream failure to a cause, without echoing Google's error body. */
function diagnose(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  if (/API_KEY_INVALID|API key not valid/i.test(raw)) return 'the key was rejected by Google'
  if (/PERMISSION_DENIED|403/.test(raw)) return 'the key exists but lacks access to this model'
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(raw)) return 'the key is over its quota'
  if (/NOT_FOUND|404/.test(raw)) return `the model "${MODEL}" does not exist for this key`
  if (/abort|timeout/i.test(raw)) return 'Google did not respond in time'
  return 'the request to Google failed'
}

export async function checkHealth(live: boolean) {
  const key = inspectKey(process.env.GEMINI_API_KEY)

  const report: Record<string, unknown> = {
    route: 'ok',
    /*
     * Which build is answering. "Redeploy" on an older deployment rebuilds that
     * older commit, so a fix can look deployed without being deployed — this
     * makes the difference visible instead of assumed.
     */
    build: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown',
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'unknown',
      environment: process.env.VERCEL_ENV ?? 'local',
    },
    model: MODEL,
    geminiApiKey: key,
    node: process.version,
    devFallbackEnabled: process.env.ALLOW_DEV_FALLBACK === 'true',
  }

  // A key added with the VITE_ prefix is both a leak and useless to the server.
  if (process.env.VITE_GEMINI_API_KEY) {
    report.warning =
      'VITE_GEMINI_API_KEY is set. That prefix publishes the key in the browser bundle and the server does not read it. Remove it and set GEMINI_API_KEY instead.'
  }

  if (!live) {
    report.gemini = 'not tested — add ?live=1 to make one real call'
    return report
  }
  if (!key.configured) {
    report.gemini = 'not tested — no key configured'
    return report
  }

  // One deliberately tiny call: enough to prove the key and model work.
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: 'Reply with the single word: ok',
        config: { maxOutputTokens: 8, abortSignal: controller.signal },
      })
      report.gemini = { reachable: true, replied: (res.text ?? '').trim().slice(0, 20) }
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    console.error('[health] Gemini probe failed:', error)
    report.gemini = { reachable: false, cause: diagnose(error) }
  }

  return report
}

export default async function handler(
  req: { method?: string; url?: string },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method not allowed' } })
    return
  }
  const live = /[?&]live=1\b/.test(req.url ?? '')
  res.status(200).json(await checkHealth(live))
}
