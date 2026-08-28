/**
 * Differentiation test for the review generator.
 *
 * Five very different siblings must produce five visibly different reviews.
 * "Same input, same review" was the exact failure this layer exists to fix, so
 * this asserts on the axes that matter: metrics, awards, positions, manager
 * reviews, reasons and themes — plus that each review echoes the user's own
 * words, and that repeating one input still varies the wording.
 *
 *   npm run test:profiles          offline generator (no key needed)
 *   npm run test:profiles -- --api the real Gemini pipeline via the dev server
 *
 * --api is the one that proves the AI layer works; run it before shipping.
 */
import { buildFallbackReview } from '../api/_lib/fallback'
import { LIMITS } from '../api/_lib/schema'
import { GENERIC_METRICS, TRAITS } from '../api/_lib/traits'
import type { GeneratedReview, ReviewInput } from '../api/_lib/types'

const PROFILES: { label: string; input: ReviewInput }[] = [
  {
    label: '1. Food-stealing mischief',
    input: {
      siblingName: 'Rhea',
      answers: {
        habit: 'Eats my food off my plate without asking, every single time',
        spend: 'Ordering way too much food on Swiggy',
        talent: 'Somehow always knows when the fridge has been restocked',
        steals: 'My snacks, my leftovers, my last piece of chocolate',
        love: 'She saves me the last bite when it actually matters',
      },
    },
  },
  {
    label: '2. Shoe-shopping spender',
    input: {
      siblingName: 'Aditi',
      answers: {
        habit: 'Shopping online at 2am and forgetting what she ordered',
        spend: 'Another pair of sneakers she absolutely does not need',
        talent: 'Finding a sale nobody else can find',
        steals: 'My jacket and never returning it',
        love: 'She buys me things she thinks I need without telling me',
      },
    },
  },
  {
    label: '3. Quiet but supportive',
    input: {
      siblingName: 'Meera',
      answers: {
        habit: 'Never says what is wrong, just goes quiet for days',
        spend: 'Probably books or something for the house',
        talent: 'Listening without making it about herself',
        steals: 'Nothing really, she asks first',
        love: 'She shows up and helps me every time I fall apart, no questions',
      },
    },
  },
  {
    label: '4. Chaotic gamer',
    input: {
      siblingName: 'Kabir',
      answers: {
        habit: 'Screaming at his game at 3am while everyone is asleep',
        spend: 'Skins in Valorant, obviously',
        talent: 'Winning games he has no business winning',
        steals: 'My headphones and my charger constantly',
        love: 'He is genuinely the funniest person I know',
      },
    },
  },
  {
    label: '5. Responsible but annoying elder',
    input: {
      siblingName: 'Arjun',
      answers: {
        habit: 'Lecturing me about my life choices unprompted',
        spend: 'Something sensible like an investment, boringly',
        talent: 'Fixing anything that breaks in the house',
        steals: 'My charger, and then telling me I lose things',
        love: 'He has quietly handled things for me my whole life',
      },
    },
  },
]

async function generateViaApi(input: ReviewInput): Promise<GeneratedReview> {
  const res = await fetch('http://localhost:5173/api/generate-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = (await res.json()) as {
    review?: GeneratedReview
    source?: string
    error?: { code?: string; message?: string }
  }
  if (!res.ok || !body.review) {
    throw new Error(
      `API ${res.status} ${body.error?.code ?? 'unknown'}: ${body.error?.message ?? 'no review returned'}`,
    )
  }
  // A dev-fallback response is not evidence the AI pipeline works, so --api
  // refuses to pass on one.
  if (body.source !== 'ai') {
    throw new Error(
      `Expected a real AI response but got source="${body.source}". ` +
        'Unset ALLOW_DEV_FALLBACK and set GEMINI_API_KEY to test the real pipeline.',
    )
  }
  return body.review
}

function uniq(values: string[]): number {
  return new Set(values.map((v) => v.toLowerCase().trim())).size
}

async function main() {
  const useApi = process.argv.includes('--api')
  console.log(`\nGenerating 5 profiles via ${useApi ? 'the API' : 'the offline generator'}\n`)

  const reviews: GeneratedReview[] = []
  for (const { label, input } of PROFILES) {
    const review = useApi ? await generateViaApi(input) : buildFallbackReview(input)
    reviews.push(review)

    console.log('─'.repeat(74))
    console.log(`${label}  —  ${review.employeeName}`)
    console.log('─'.repeat(74))
    console.log(`  theme      ${review.personalityTheme}  (${review.visualMood})`)
    console.log(`  position   ${review.positionLine1} / ${review.positionLine2}`)
    console.log(`  metrics    ${review.metrics.map((m) => `${m.label} ${m.score}`).join(' · ')}`)
    console.log(`  award      ${review.award.emoji} ${review.award.title}`)
    console.log(`  review     ${review.managerReview}`)
    console.log(`  reason     ${review.reason}`)
    console.log()
  }

  // ── assertions ───────────────────────────────────────────────────
  const checks: { name: string; got: number; want: number }[] = [
    {
      name: 'distinct metric sets',
      got: uniq(reviews.map((r) => r.metrics.map((m) => m.label).join('|'))),
      want: 5,
    },
    { name: 'distinct awards', got: uniq(reviews.map((r) => r.award.title)), want: 4 },
    { name: 'distinct manager reviews', got: uniq(reviews.map((r) => r.managerReview)), want: 5 },
    {
      name: 'distinct positions',
      got: uniq(reviews.map((r) => `${r.positionLine1}/${r.positionLine2}`)),
      want: 4,
    },
    { name: 'distinct reasons', got: uniq(reviews.map((r) => r.reason)), want: 4 },
    { name: 'distinct themes', got: uniq(reviews.map((r) => r.personalityTheme)), want: 3 },
  ]

  // Every review must echo the user's own words back at them.
  let echoFailures = 0
  PROFILES.forEach((p, i) => {
    const answerWords = Object.values(p.input.answers)
      .join(' ')
      .toLowerCase()
      .match(/[a-z]{5,}/g)
    const blob = [reviews[i].managerReview, reviews[i].positionLine1, reviews[i].award.title]
      .join(' ')
      .toLowerCase()
      const hits = new Set((answerWords ?? []).filter((w) => blob.includes(w)))
    if (hits.size < 2) {
      console.log(`  ✗ ${p.label}: only ${hits.size} of the user's own words survived`)
      echoFailures++
    }
  })

  /*
   * The card truncates over-long strings so a stray model response can never
   * break the fixed frame — but the offline generator should never rely on that
   * safety net, or its own copy renders with an ellipsis mid-phrase.
   */
  const overBudget: string[] = []
  for (const m of [...TRAITS.flatMap((t) => t.metrics), ...GENERIC_METRICS]) {
    if (m.label.length > LIMITS.metricLabel) overBudget.push(`metric "${m.label}"`)
  }
  for (const t of TRAITS) {
    for (const pos of t.positions) {
      if (pos.length > LIMITS.positionLine) overBudget.push(`position "${pos}"`)
    }
    for (const a of t.awards) {
      if (a.title.length > LIMITS.awardTitle) overBudget.push(`award "${a.title}"`)
    }
  }
  for (const r of reviews) {
    if (r.managerReview.length > LIMITS.managerReview) {
      overBudget.push(`manager review for ${r.employeeName}`)
    }
  }

  /*
   * The same answers should not produce word-for-word identical copy twice.
   * Only meaningful against the real model — the offline generator is seeded
   * from the input by design, so it is skipped there.
   */
  let variationNote = 'skipped (offline generator is deterministic by design)'
  let variationOk = true
  if (useApi) {
    const a = await generateViaApi(PROFILES[0].input)
    const b = await generateViaApi(PROFILES[0].input)
    variationOk = a.managerReview !== b.managerReview || a.reason !== b.reason
    variationNote = variationOk
      ? 'same input produced different wording'
      : 'same input produced identical wording twice'
  }

  console.log('─'.repeat(74))
  let failed = echoFailures > 0 || overBudget.length > 0 || !variationOk
  for (const c of checks) {
    const ok = c.got >= c.want
    if (!ok) failed = true
    console.log(`  ${ok ? '✓' : '✗'} ${c.name}: ${c.got}/5 distinct (need ≥ ${c.want})`)
  }
  console.log(
    `  ${echoFailures === 0 ? '✓' : '✗'} personalisation: every review reuses ≥2 of the user's words`,
  )
  console.log(
    `  ${overBudget.length === 0 ? '✓' : '✗'} copy fits the card without truncation` +
      (overBudget.length ? `: ${overBudget.join(', ')}` : ''),
  )
  console.log(`  ${variationOk ? '✓' : '✗'} repeat variation: ${variationNote}`)
  console.log('─'.repeat(74))

  if (failed) {
    console.error('\nFAILED — different answers are still producing similar reviews.\n')
    process.exit(1)
  }
  console.log('\nAll profiles differentiated.\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
