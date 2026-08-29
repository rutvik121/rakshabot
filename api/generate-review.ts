import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { normaliseKey } from './_lib/apiKey.js'
import { createBackend, type Backend, type BackendKind } from './_lib/backend.js'
import { GenerateReviewError } from './_lib/errors.js'
import type { StyledReview } from './_lib/styles.js'
import type { ReviewInput } from './_lib/types.js'

export { GenerateReviewError }

/**
 * The prompt, schema and offline generator, loaded on first use.
 *
 * Anything imported at module scope that fails to load takes the whole function
 * down before the handler exists, and the platform answers that with a bare 500
 * — no body, no reason, nothing to act on. Loading inside the handler's guarded
 * path means a module problem arrives as an ordinary error with its message
 * intact, which is the difference between a diagnosis and a guess.
 *
 * Memoised, so the cost is paid once per warm instance rather than per request.
 */
let modules: Promise<{
  buildStyledUserPrompt: typeof import('./_lib/stylePrompt.js').buildStyledUserPrompt
  STYLED_SYSTEM_PROMPT: string
  STYLED_REVIEW_JSON_SCHEMA: typeof import('./_lib/styleSchema.js').STYLED_REVIEW_JSON_SCHEMA
  validateStyledReview: typeof import('./_lib/styleSchema.js').validateStyledReview
  buildStyledFallback: typeof import('./_lib/styleFallback.js').buildStyledFallback
}> | null = null

function load() {
  modules ??= (async () => {
    const [prompt, schema, fallback] = await Promise.all([
      import('./_lib/stylePrompt.js'),
      import('./_lib/styleSchema.js'),
      import('./_lib/styleFallback.js'),
    ])
    return {
      buildStyledUserPrompt: prompt.buildStyledUserPrompt,
      STYLED_SYSTEM_PROMPT: prompt.STYLED_SYSTEM_PROMPT,
      STYLED_REVIEW_JSON_SCHEMA: schema.STYLED_REVIEW_JSON_SCHEMA,
      validateStyledReview: schema.validateStyledReview,
      buildStyledFallback: fallback.buildStyledFallback,
    }
  })().catch((error: unknown) => {
    // Let the next request try again rather than caching a failure forever.
    modules = null
    const detail = error instanceof Error ? error.message : String(error)
    throw new GenerateReviewError(`Server modules failed to load: ${detail}`, 500, 'module_error')
  })
  return modules
}

/**
 * Server-side review generation.
 *
 * The API key is read from the server environment and never leaves this module —
 * nothing here is imported by client code, so the key cannot reach the browser
 * bundle.
 */

/** Fast, cost-efficient Flash-class model; override without a code change. */
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.7-flash'

/**
 * Generation is a user-facing wait, so it gets a hard ceiling — one per attempt,
 * plus an overall deadline so the retry cannot double the worst case.
 *
 * A Flash-class model with thinking turned down answers this prompt in a few
 * seconds; these numbers are the ceiling before we give up, not the expectation.
 */
const ATTEMPT_TIMEOUT_MS = 35_000
/*
 * Kept under the platform's own function ceiling (`maxDuration` in
 * vercel.json) so a slow model comes back as our friendly, retryable
 * `timeout` — a platform kill is an opaque 504 with no body for the UI to
 * read. Raise both together or neither.
 */
const TOTAL_TIMEOUT_MS = 50_000

/** Longest answer we will forward, so one pasted essay can't blow up the prompt. */
const MAX_ANSWER_LENGTH = 600
const MAX_NAME_LENGTH = 40

/**
 * Opt-in, local-only escape hatch for working on the UI without a key.
 *
 * It is off unless explicitly enabled, and when it does run the response is
 * labelled `dev-fallback` so it can never be mistaken for real model output.
 */
const DEV_FALLBACK_ENABLED = process.env.ALLOW_DEV_FALLBACK === 'true'

export type ReviewSource = 'ai' | 'dev-fallback'

export interface GenerateReviewResponse {
  review: StyledReview
  source: ReviewSource
  model: string
  /** Which way in was used — 'vertex' or 'api-key'. */
  backend?: string
}

/**
 * Narrows untrusted request bodies to the shape the generator expects.
 *
 * Hosts disagree about how a JSON body arrives: some parse it, some hand over
 * the raw string or a Buffer. Accepting all three means the same request works
 * against the dev middleware and whatever the platform does in production —
 * the difference is invisible until deployed, and shows up as every request
 * failing `bad_request`.
 */
export function parseReviewInput(rawBody: unknown): ReviewInput {
  let body = rawBody
  if (body instanceof Uint8Array) body = new TextDecoder().decode(body)
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      throw new GenerateReviewError('Body was not valid JSON', 400, 'bad_request')
    }
  }

  if (typeof body !== 'object' || body === null) {
    throw new GenerateReviewError('Expected a JSON object', 400, 'bad_request')
  }
  const b = body as Record<string, unknown>
  const siblingName = typeof b.siblingName === 'string' ? b.siblingName.trim() : ''
  if (!siblingName) {
    throw new GenerateReviewError('siblingName is required', 400, 'bad_request')
  }

  const rawAnswers = b.answers
  if (typeof rawAnswers !== 'object' || rawAnswers === null) {
    throw new GenerateReviewError('answers is required', 400, 'bad_request')
  }

  const answers: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawAnswers as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) {
      answers[key] = value.trim().slice(0, MAX_ANSWER_LENGTH)
    }
  }
  if (Object.keys(answers).length === 0) {
    throw new GenerateReviewError('At least one answer is required', 400, 'bad_request')
  }

  return { siblingName: siblingName.slice(0, MAX_NAME_LENGTH), answers }
}

/**
 * Maps a provider failure to our own error.
 *
 * Upstream error bodies are logged but never forwarded to the client — they can
 * carry request details and internals that have no business in a browser.
 */
/**
 * The upstream failure, reduced to something safe to show.
 *
 * Google's reason is the single most useful fact when a request fails, and
 * withholding it entirely left the app saying "could not complete the request"
 * — true, useless, and indistinguishable from every other failure. This keeps
 * the HTTP code, the status enum and a short slice of the message, and strips
 * anything key-shaped on the way out.
 */
export function upstreamDetail(raw: string): string {
  const status = /"?status"?\s*[:=]\s*"?([A-Z_]{4,})/.exec(raw)?.[1]
  const code = /"?code"?\s*[:=]\s*"?(\d{3})/.exec(raw)?.[1] ?? /\[(\d{3})\s/.exec(raw)?.[1]
  const message = /"message"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(raw)?.[1] ?? raw

  const summary = message
    .replace(/\\n/g, ' ')
    .replace(/\b(AQ\.[\w.-]+|AIza[\w-]+|ya29\.[\w.-]+)/g, '[key]')
    .trim()
    .slice(0, 160)

  return [code, status, summary].filter(Boolean).join(' ')
}

function fromProviderError(error: unknown, backend: BackendKind): GenerateReviewError {
  const raw = error instanceof Error ? error.message : String(error)

  if (/API_KEY_INVALID|API key not valid/i.test(raw)) {
    return new GenerateReviewError(
      'The configured GEMINI_API_KEY was rejected by Google',
      503,
      'invalid_api_key',
    )
  }
  /*
   * A 401 here is not a wrong key — it is Google declining to treat the key as
   * a key at all. Keys issued with the `AQ.` prefix are currently rejected by
   * generativelanguage.googleapis.com however they are sent, which is a
   * Google-side issue rather than anything the request can fix. Saying so
   * stops it reading as an application bug.
   */
  if (/UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED|\b401\b/.test(raw)) {
    if (backend === 'vertex') {
      return new GenerateReviewError(
        'Vertex AI would not accept the service account — check the key has not been deleted or ' +
          `disabled in Cloud Console. ${upstreamDetail(raw)}`,
        503,
        'invalid_service_account',
      )
    }
    const looksNewFormat = normaliseKey(process.env.GEMINI_API_KEY).startsWith('AQ.')
    return new GenerateReviewError(
      looksNewFormat
        ? 'Google rejected this key. Keys beginning "AQ." are currently not accepted by the ' +
          'Gemini API, however they are sent — a known Google-side issue with no client fix. ' +
          'Switch this deployment to Vertex AI: set GOOGLE_SERVICE_ACCOUNT_KEY (and ' +
          'GOOGLE_CLOUD_PROJECT) and the same models are reached with service-account auth instead. ' +
          'See README → "If your API key starts with AQ.".'
        : `Google rejected the credentials. ${upstreamDetail(raw)}`,
      503,
      'invalid_api_key',
    )
  }
  if (/has not been used in project|SERVICE_DISABLED|API has not been used/i.test(raw)) {
    const api = backend === 'vertex' ? 'Vertex AI API' : 'Generative Language API'
    return new GenerateReviewError(
      `The ${api} is not enabled on this Google Cloud project. Enable it in the Cloud Console ` +
        `(/api/health names the project), then retry. ${upstreamDetail(raw)}`,
      503,
      'api_not_enabled',
    )
  }
  if (/PERMISSION_DENIED|403/.test(raw)) {
    return new GenerateReviewError(
      backend === 'vertex'
        ? 'The service account lacks access. Grant it the "Vertex AI User" role on the project ' +
          `(IAM → Grant access), then retry. ${upstreamDetail(raw)}`
        : 'The API key lacks access to this model',
      503,
      'permission_denied',
    )
  }
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(raw)) {
    return new GenerateReviewError('Rate limited by Gemini', 429, 'rate_limited')
  }
  if (/NOT_FOUND|404/.test(raw)) {
    return new GenerateReviewError(
      backend === 'vertex'
        ? `Model "${MODEL}" is not available in this Vertex region. Set GOOGLE_CLOUD_LOCATION to ` +
          `"global", or GEMINI_MODEL to a model the region serves. ${upstreamDetail(raw)}`
        : `Model "${MODEL}" was not found — set GEMINI_MODEL to a model your key can use. ${upstreamDetail(raw)}`,
      503,
      'model_not_found',
    )
  }
  if (/abort/i.test(raw)) {
    return new GenerateReviewError('Gemini took too long to respond', 504, 'timeout')
  }
  /*
   * Signing failed before a request was ever made. OpenSSL reports this as
   * "DECODER routines::unsupported", which names nothing a person can act on —
   * the actual cause is always the same, a private key that lost its newlines
   * or its header on the way into an environment variable.
   */
  if (backend === 'vertex' && /DECODER routines|ERR_OSSL|no start line|PEM/i.test(raw)) {
    return new GenerateReviewError(
      'The private_key in GOOGLE_SERVICE_ACCOUNT_KEY could not be read — it is truncated, or its ' +
        'line breaks were lost. Re-paste the downloaded key file exactly, or set the variable to ' +
        'its base64 encoding instead.',
      503,
      'invalid_service_account',
    )
  }
  if (backend === 'vertex' && /invalid_grant|invalid_client|JWT/i.test(raw)) {
    return new GenerateReviewError(
      'Google signed the request but would not issue a token for this service account. Either it ' +
        'no longer exists (deleted, or its key revoked), or GOOGLE_CLOUD_PROJECT names a different ' +
        `project to the one the key was created in. ${upstreamDetail(raw)}`,
      503,
      'invalid_service_account',
    )
  }
  return new GenerateReviewError(
    `Gemini could not complete the request — ${upstreamDetail(raw)}`,
    502,
    'generation_failed',
  )
}

/** Sent on the retry, naming what was wrong with the first attempt. */
function correctionPrompt(previous: string, problem: string): string {
  return [
    'Your previous response could not be used.',
    `Problem: ${problem}`,
    '',
    'Previous response:',
    previous.slice(0, 2000),
    '',
    'Return corrected JSON matching the schema exactly. Respect every length limit,',
    'return exactly 5 metrics, and keep referencing the specific details the user gave.',
  ].join('\n')
}

/**
 * Thinking is on by default on Flash-class models and dominates the latency
 * here, while five short metrics and a two-line memo do not need it.
 *
 * Not every model accepts the setting, so one that rejects it is retried
 * without it and remembered, rather than failing every request from then on.
 */
/**
 * Request features, in the order they are given up.
 *
 * Every one of these is an optimisation, not a requirement. `thinkingConfig`
 * buys latency, `responseJsonSchema` and JSON mode buy a cleaner first draft —
 * but the prompt already spells the schema out in full, and the response is
 * validated and retried server-side regardless. So when the API refuses a
 * feature, the right move is to drop it and keep going rather than fail the
 * request.
 *
 * Which features an API version and model accept varies, and a rejection
 * arrives as an opaque `400 INVALID_ARGUMENT` that does not always name the
 * offending field. Rather than guess, the call walks down this ladder until
 * something is accepted, then remembers where it landed for the rest of the
 * instance's life.
 */
const LADDER = [
  { thinking: true, schema: true, jsonMime: true },
  { thinking: false, schema: true, jsonMime: true },
  { thinking: false, schema: false, jsonMime: true },
  { thinking: false, schema: false, jsonMime: false },
] as const

type Features = (typeof LADDER)[number]

/** Where the last successful call landed, so later requests start there. */
let rung = 0

interface PromptParts {
  STYLED_SYSTEM_PROMPT: string
  STYLED_REVIEW_JSON_SCHEMA: unknown
}

function generate(
  ai: GoogleGenAI,
  contents: string,
  signal: AbortSignal,
  features: Features,
  parts: PromptParts,
) {
  return ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: parts.STYLED_SYSTEM_PROMPT,
      // Comedy needs room to vary — the same answers should not produce
      // identical wording twice.
      temperature: 1.0,
      ...(features.thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      ...(features.jsonMime ? { responseMimeType: 'application/json' } : {}),
      ...(features.schema ? { responseJsonSchema: parts.STYLED_REVIEW_JSON_SCHEMA } : {}),
      abortSignal: signal,
    },
  })
}

/** A refusal of the request's shape, as opposed to a real failure. */
function isFeatureRejection(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error)
  if (/abort/i.test(raw)) return false
  return (
    /INVALID_ARGUMENT|\b400\b/.test(raw) ||
    /unknown name|not supported|unsupported|is not enabled|unexpected/i.test(raw)
  )
}

/**
 * Runs `attempt` with the richest feature set the model has accepted so far,
 * dropping features and retrying while it keeps refusing the request's shape.
 *
 * Only shape refusals walk the ladder. A rate limit, a bad key or a timeout is
 * a real failure and is raised immediately — degrading on those would turn one
 * clear error into four slow ones.
 */
export async function withSupportedFeatures<T>(
  attempt: (features: Features) => Promise<T>,
): Promise<T> {
  let lastError: unknown

  for (let step = rung; step < LADDER.length; step++) {
    try {
      const result = await attempt(LADDER[step])
      if (step !== rung) {
        console.warn(
          `[generate-review] request shape refused; settled on ${JSON.stringify(LADDER[step])}`,
        )
        rung = step
      }
      return result
    } catch (error) {
      lastError = error
      if (!isFeatureRejection(error)) throw error
    }
  }
  throw lastError
}

/** Test seam: forget which rung worked, so cases do not leak into each other. */
export function resetFeatureMemory(): void {
  rung = 0
}

async function callGemini(
  backend: Backend,
  contents: string,
  signal: AbortSignal,
  parts: PromptParts,
): Promise<string> {
  let response
  try {
    response = await withSupportedFeatures((features) =>
      generate(backend.ai, contents, signal, features, parts),
    )
  } catch (error) {
    throw fromProviderError(error, backend.kind)
  }

  const text = response.text
  if (!text) {
    throw new GenerateReviewError('Model returned an empty response', 502, 'empty_response')
  }
  return text
}

/**
 * Runs one attempt against its own timeout.
 *
 * Each attempt gets a fresh AbortController — sharing one across the retry would
 * leave the second attempt with whatever was left of the first one's budget,
 * which is usually nothing.
 */
async function callGeminiWithTimeout(
  backend: Backend,
  contents: string,
  deadline: number,
  parts: PromptParts,
): Promise<string> {
  const budget = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now())
  if (budget <= 0) {
    throw new GenerateReviewError('Gemini took too long to respond', 504, 'timeout')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), budget)
  try {
    return await callGemini(backend, contents, controller.signal, parts)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Reads JSON out of a model response.
 *
 * With JSON mode on, the body is already JSON. Once the ladder has had to drop
 * it, the model tends to wrap the object in a markdown fence or introduce it
 * with a sentence, so the object is extracted rather than assumed.
 */
export function parseJson(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Fenced block first, then the outermost braces.
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed)?.[1]
    const candidate = fenced ?? trimmed.slice(trimmed.indexOf('{'), trimmed.lastIndexOf('}') + 1)
    return JSON.parse(candidate)
  }
}

/**
 * Generates a review with Gemini, retrying once with a correction instruction.
 *
 * The schema constrains the shape, but not the semantics we care about — metric
 * count, score ranges, and the length limits that keep copy inside the fixed
 * poster. When the first attempt violates those, the model is told exactly what
 * was wrong and asked again; a second failure is a real error, not a fallback.
 */
export async function generateReviewWithGemini(
  input: ReviewInput,
): Promise<{ review: StyledReview; backend: string }> {
  /*
   * Credentials are settled before anything else runs. A credential of the
   * wrong kind does not come back as a clean rejection — the request simply
   * hangs until the deadline, so the user waits the better part of a minute to
   * be told "took too long", which points at the model rather than at the
   * environment.
   */
  const backend = createBackend()

  const m = await load()
  const deadline = Date.now() + TOTAL_TIMEOUT_MS
  let contents = m.buildStyledUserPrompt(input)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await callGeminiWithTimeout(backend, contents, deadline, m)

    let parsed: unknown
    try {
      parsed = parseJson(text)
    } catch {
      if (attempt === 2) {
        throw new GenerateReviewError('Model returned unparseable JSON', 502, 'invalid_json')
      }
      contents = correctionPrompt(text, 'the response was not valid JSON')
      continue
    }

    const review = m.validateStyledReview(parsed)
    if (review) {
      // The model is told to echo the name; make certain it is theirs.
      return {
        review: { ...review, subjectName: input.siblingName.slice(0, 22) },
        backend: backend.label,
      }
    }

    if (attempt === 2) {
      throw new GenerateReviewError(
        'Model returned a review that failed validation twice',
        502,
        'invalid_schema',
      )
    }
    contents = correctionPrompt(
      text,
      'the JSON did not satisfy the schema — check that `content` holds exactly the fields for the style you chose, that every list has the required number of entries, that scores are integers 0-100, and that no required field is missing or empty',
    )
  }

  // Unreachable: the loop either returns or throws.
  throw new GenerateReviewError('Generation failed', 502, 'generation_failed')
}

/**
 * Produces a review for the given request body.
 *
 * A model failure is surfaced as an error rather than papered over: a silent
 * fallback would make a broken AI pipeline indistinguishable from a working one.
 * The offline generator is only reachable when ALLOW_DEV_FALLBACK is set, and
 * what it returns is labelled as such.
 */
export async function handleGenerateReview(body: unknown): Promise<GenerateReviewResponse> {
  const input = parseReviewInput(body)

  try {
    const { review, backend } = await generateReviewWithGemini(input)
    return { review, source: 'ai', model: MODEL, backend }
  } catch (error) {
    if (error instanceof GenerateReviewError && error.status === 400) throw error

    console.error('[generate-review] Gemini generation failed:', error)

    if (DEV_FALLBACK_ENABLED) {
      console.warn(
        '[generate-review] ALLOW_DEV_FALLBACK is on — returning a LOCAL, NON-AI review',
      )
      return {
        review: (await load()).buildStyledFallback(input, Date.now()),
        source: 'dev-fallback',
        model: 'local-fallback',
      }
    }
    throw error
  }
}

/** Vercel-style handler. Any Node host can wrap `handleGenerateReview` the same way. */
export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== 'POST') {
    res.status(405).json({
      error: { code: 'method_not_allowed', message: 'Method not allowed' },
    })
    return
  }
  try {
    res.status(200).json(await handleGenerateReview(req.body))
  } catch (error) {
    const status = error instanceof GenerateReviewError ? error.status : 500
    const code = error instanceof GenerateReviewError ? error.code : 'generation_failed'
    const message = error instanceof Error ? error.message : 'Generation failed'
    res.status(status).json({ error: { code, message } })
  }
}
