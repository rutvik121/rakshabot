import { createBackend, describeBackend } from './_lib/backend.js'
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
 * It never returns credential material — only which backend is selected, and
 * what is wrong with it.
 */

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.7-flash'

/** Maps an upstream failure to a cause, without echoing Google's error body. */
function diagnose(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  if (/API_KEY_INVALID|API key not valid/i.test(raw)) return 'the key was rejected by Google'
  if (/ACCESS_TOKEN_TYPE_UNSUPPORTED/.test(raw)) {
    return 'Google refused to treat the key as an API key — the "AQ." key problem'
  }
  if (/has not been used in project|SERVICE_DISABLED|is disabled/i.test(raw)) {
    return 'the Vertex AI API is not enabled on this Google Cloud project'
  }
  if (/PERMISSION_DENIED|403/.test(raw)) return 'the credential lacks access to this model'
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(raw)) return 'the credential is over its quota'
  if (/NOT_FOUND|404/.test(raw)) return `the model "${MODEL}" is not available here`
  if (/abort|timeout/i.test(raw)) return 'Google did not respond in time'
  return 'the request to Google failed'
}

/**
 * What this credential can actually reach.
 *
 * A generation failure that is not about the credential is usually about the
 * model, and guessing which model is reachable is how several rounds of this
 * got spent. Asking is one request and settles it.
 */
async function listModels(ai: GoogleGenAI): Promise<unknown> {
  try {
    const names: string[] = []
    for await (const model of await ai.models.list()) {
      if (model.name) names.push(model.name.replace(/^models\//, ''))
      if (names.length >= 60) break
    }
    return names.length ? names : 'this credential can reach no models'
  } catch (error) {
    console.error('[health] model list failed:', error)
    return { failed: diagnose(error) }
  }
}

export async function checkHealth(live: boolean, models = false) {
  const backend = describeBackend()

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
    backend,
    node: process.version,
    devFallbackEnabled: process.env.ALLOW_DEV_FALLBACK === 'true',
  }

  // A key added with the VITE_ prefix is both a leak and useless to the server.
  if (process.env.VITE_GEMINI_API_KEY) {
    report.warning =
      'VITE_GEMINI_API_KEY is set. That prefix publishes the key in the browser bundle and the server does not read it. Remove it and set GEMINI_API_KEY instead.'
  }

  if (!backend.ready) {
    report.gemini = 'not tested — the backend is not configured'
    return report
  }

  /*
   * Building the client can itself fail — a malformed service account is caught
   * here rather than as an opaque 500.
   */
  let ai: GoogleGenAI
  try {
    ai = createBackend().ai
  } catch (error) {
    report.gemini = { reachable: false, cause: error instanceof Error ? error.message : 'unknown' }
    return report
  }

  if (models) {
    // Vertex's list endpoint returns the project's own tuned models, not the
    // published ones, so it answers a different question than it does here.
    report.models =
      backend.kind === 'vertex'
        ? 'not listed — on Vertex, model availability is per region; use ?live=1 instead'
        : await listModels(ai)
  }

  if (!live) {
    report.gemini = 'not tested — add ?live=1 to make one real call'
    return report
  }

  // One deliberately tiny call: enough to prove the credential and model work.
  try {
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
  const url = req.url ?? ''
  const live = /[?&]live=1\b/.test(url)
  const models = /[?&]models=1\b/.test(url)
  res.status(200).json(await checkHealth(live, models))
}
