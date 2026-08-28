import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { buildUserPrompt, SYSTEM_PROMPT } from '../src/lib/review/prompt'
import { REVIEW_JSON_SCHEMA, validateGeneratedReview } from '../src/lib/review/schema'
import { buildFallbackReview } from '../src/lib/review/fallback'
import type { GeneratedReview, ReviewInput } from '../src/lib/review/types'

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
const TOTAL_TIMEOUT_MS = 60_000

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
  review: GeneratedReview
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

/** Narrows untrusted request bodies to the shape the generator expects. */
export function parseReviewInput(body: unknown): ReviewInput {
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

function generate(ai: GoogleGenAI, contents: string, signal: AbortSignal, withThinking: boolean) {
  return ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      // Comedy needs room to vary — the same answers should not produce
      // identical wording twice.
      temperature: 1.0,
      ...(withThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      responseMimeType: 'application/json',
      responseJsonSchema: REVIEW_JSON_SCHEMA,
      abortSignal: signal,
    },
  })
}

async function callGemini(
  ai: GoogleGenAI,
  contents: string,
  signal: AbortSignal,
): Promise<string> {
  let response
  try {
    response = await generate(ai, contents, signal, thinkingLevelSupported)
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    if (!thinkingLevelSupported || !/thinking/i.test(raw)) throw fromProviderError(error)

    console.warn(`[generate-review] "${MODEL}" rejected thinkingLevel — retrying without it`)
    thinkingLevelSupported = false
    try {
      response = await generate(ai, contents, signal, false)
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
): Promise<string> {
  const budget = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now())
  if (budget <= 0) {
    throw new GenerateReviewError('Gemini took too long to respond', 504, 'timeout')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), budget)
  try {
    return await callGemini(ai, contents, controller.signal)
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
export async function generateReviewWithGemini(input: ReviewInput): Promise<GeneratedReview> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GenerateReviewError(
      'GEMINI_API_KEY is not set on the server',
      503,
      'missing_api_key',
    )
  }

  const ai = new GoogleGenAI({ apiKey })
  const deadline = Date.now() + TOTAL_TIMEOUT_MS
  let contents = buildUserPrompt(input)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await callGeminiWithTimeout(ai, contents, deadline)

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

    const review = validateGeneratedReview(parsed)
    if (review) {
      // The model is told to echo the name; make certain it is theirs.
      return { ...review, employeeName: input.siblingName.slice(0, 22) }
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
      'the JSON did not satisfy the schema — check that metrics has exactly 5 entries, every score is an integer 0-100, and no required field is missing or empty',
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
        review: buildFallbackReview(input, Date.now()),
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
