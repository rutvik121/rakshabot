import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { describeKey, isUsableKey, normaliseKey } from './_lib/apiKey.js'
import type { StyledReview } from './_lib/styles.js'
import type { ReviewInput } from './_lib/types.js'

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
}

export class GenerateReviewError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'GenerateReviewError'
    this.status = status
    this.code = code
  }
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
function fromProviderError(error: unknown): GenerateReviewError {
  const raw = error instanceof Error ? error.message : String(error)

  if (/API_KEY_INVALID|API key not valid/i.test(raw)) {
    return new GenerateReviewError(
      'The configured GEMINI_API_KEY was rejected by Google',
      503,
      'invalid_api_key',
    )
  }
  if (/PERMISSION_DENIED|403/.test(raw)) {
    return new GenerateReviewError(
      'The API key lacks access to this model',
      503,
      'permission_denied',
    )
  }
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(raw)) {
    return new GenerateReviewError('Rate limited by Gemini', 429, 'rate_limited')
  }
  if (/NOT_FOUND|404/.test(raw)) {
    return new GenerateReviewError(
      `Model "${MODEL}" was not found — set GEMINI_MODEL to a model your key can use`,
      503,
      'model_not_found',
    )
  }
  if (/abort/i.test(raw)) {
    return new GenerateReviewError('Gemini took too long to respond', 504, 'timeout')
  }
  return new GenerateReviewError(
    'Gemini could not complete the request',
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
let thinkingLevelSupported = true

interface PromptParts {
  STYLED_SYSTEM_PROMPT: string
  STYLED_REVIEW_JSON_SCHEMA: unknown
}

function generate(
  ai: GoogleGenAI,
  contents: string,
  signal: AbortSignal,
  withThinking: boolean,
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
      ...(withThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseMimeType: 'application/json',
      responseJsonSchema: parts.STYLED_REVIEW_JSON_SCHEMA,
      abortSignal: signal,
    },
  })
}

async function callGemini(
  ai: GoogleGenAI,
  contents: string,
  signal: AbortSignal,
  parts: PromptParts,
): Promise<string> {
  let response
  try {
    response = await generate(ai, contents, signal, thinkingLevelSupported, parts)
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    if (!thinkingLevelSupported || !/thinking/i.test(raw)) throw fromProviderError(error)

    console.warn(`[generate-review] "${MODEL}" rejected thinkingLevel — retrying without it`)
    thinkingLevelSupported = false
    try {
      response = await generate(ai, contents, signal, false, parts)
    } catch (retryError) {
      throw fromProviderError(retryError)
    }
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
  ai: GoogleGenAI,
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
    return await callGemini(ai, contents, controller.signal, parts)
  } finally {
    clearTimeout(timeout)
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
/**
 * Rejects a key that cannot possibly work, before spending the timeout on it.
 *
 * A credential of the wrong kind does not come back as a clean rejection — the
 * request simply hangs until the deadline, so the user waits the better part of
 * a minute to be told "took too long", which points at the model rather than at
 * the key.
 */
function readApiKey(): string {
  const raw = process.env.GEMINI_API_KEY
  const report = describeKey(raw)

  if (!report.configured) {
    throw new GenerateReviewError('GEMINI_API_KEY is not set on the server', 503, 'missing_api_key')
  }
  if (!isUsableKey(raw)) {
    throw new GenerateReviewError(
      `GEMINI_API_KEY ${report.problems?.[0] ?? 'does not look like a Gemini API key'}. ` +
        'Get one at aistudio.google.com/apikey and set it in the deployment environment.',
      503,
      'invalid_api_key',
    )
  }
  return normaliseKey(raw)
}

export async function generateReviewWithGemini(input: ReviewInput): Promise<StyledReview> {
  const apiKey = readApiKey()

  const m = await load()
  const ai = new GoogleGenAI({ apiKey })
  const deadline = Date.now() + TOTAL_TIMEOUT_MS
  let contents = m.buildStyledUserPrompt(input)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await callGeminiWithTimeout(ai, contents, deadline, m)

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
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
      return { ...review, subjectName: input.siblingName.slice(0, 22) }
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
    const review = await generateReviewWithGemini(input)
    return { review, source: 'ai', model: MODEL }
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
