import Anthropic from '@anthropic-ai/sdk'
import { buildUserPrompt, SYSTEM_PROMPT } from '../src/lib/review/prompt'
import { REVIEW_JSON_SCHEMA, validateGeneratedReview } from '../src/lib/review/schema'
import { buildFallbackReview } from '../src/lib/review/fallback'
import type { GeneratedReview, ReviewInput } from '../src/lib/review/types'

const MODEL = 'claude-opus-5'

/** Longest answer we will forward, so one pasted essay can't blow up the prompt. */
const MAX_ANSWER_LENGTH = 600
const MAX_NAME_LENGTH = 40

export class GenerateReviewError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GenerateReviewError'
    this.status = status
  }
}

/** Narrows untrusted request bodies to the shape the generator expects. */
export function parseReviewInput(body: unknown): ReviewInput {
  if (typeof body !== 'object' || body === null) {
    throw new GenerateReviewError('Expected a JSON object', 400)
  }
  const b = body as Record<string, unknown>
  const siblingName = typeof b.siblingName === 'string' ? b.siblingName.trim() : ''
  if (!siblingName) throw new GenerateReviewError('siblingName is required', 400)

  const rawAnswers = b.answers
  if (typeof rawAnswers !== 'object' || rawAnswers === null) {
    throw new GenerateReviewError('answers is required', 400)
  }

  const answers: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawAnswers as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) {
      answers[key] = value.trim().slice(0, MAX_ANSWER_LENGTH)
    }
  }
  if (Object.keys(answers).length === 0) {
    throw new GenerateReviewError('At least one answer is required', 400)
  }

  return { siblingName: siblingName.slice(0, MAX_NAME_LENGTH), answers }
}

/**
 * Writes the review with Claude, constrained to our schema.
 *
 * Structured outputs (`output_config.format`) makes the model emit exactly the
 * shape we asked for, so there is no prose to parse and no JSON to repair. We
 * still validate before returning — the schema guarantees the shape, not that
 * the content fits a fixed-size poster.
 */
export async function generateReviewWithClaude(input: ReviewInput): Promise<GeneratedReview> {
  // Zero-arg constructor: resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN,
  // or an `ant auth login` profile.
  const client = new Anthropic()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
    output_config: {
      // Comedy writing does not need deep reasoning, and this is a user-facing
      // wait — low effort keeps generation fast and cheap.
      effort: 'low',
      format: { type: 'json_schema', schema: REVIEW_JSON_SCHEMA },
    },
  })

  if (response.stop_reason === 'refusal') {
    throw new GenerateReviewError('Generation was declined', 422)
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new GenerateReviewError('Model returned unparseable JSON', 502)
  }

  const review = validateGeneratedReview(parsed)
  if (!review) throw new GenerateReviewError('Model returned an unusable review', 502)

  // The model is told to echo the name; make certain it is theirs.
  return { ...review, employeeName: input.siblingName.slice(0, 22) }
}

/**
 * Produces a review for the given request body.
 *
 * A bad request is an error the caller should see. A failure of the model —
 * missing credentials, rate limit, a refusal — is not: the user still gets a
 * personalised review built from their own answers.
 */
export async function handleGenerateReview(body: unknown): Promise<GeneratedReview> {
  const input = parseReviewInput(body)
  try {
    return await generateReviewWithClaude(input)
  } catch (error) {
    if (error instanceof GenerateReviewError && error.status === 400) throw error
    console.error('[generate-review] falling back to local generation:', error)
    return buildFallbackReview(input, Date.now())
  }
}

/** Vercel-style handler. Any Node host can wrap `handleGenerateReview` the same way. */
export default async function handler(
  req: { method?: string; body?: unknown },
  res: {
    status: (code: number) => {
      json: (body: unknown) => void
      end: () => void
    }
  },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    res.status(200).json(await handleGenerateReview(req.body))
  } catch (error) {
    const status = error instanceof GenerateReviewError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Generation failed'
    res.status(status).json({ error: message })
  }
}
