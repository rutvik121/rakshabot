/**
 * Differentiation test for the styled generator.
 *
 * Six very different siblings must land in different universes and produce
 * visibly different artifacts. "Same input, same output" was the failure this
 * whole layer exists to fix, so this asserts on the axes that matter: which
 * style was chosen, the headline and verdict copy, whether the user's own words
 * survived, and whether anything overruns the fixed card.
 *
 *   npm run test:profiles          offline generator (no key needed)
 *   npm run test:profiles -- --api the real Gemini pipeline via the dev server
 *
 * --api is the one that proves the AI layer works; run it before shipping.
 */
import { buildStyledFallback } from '../api/_lib/styleFallback'
import { validateStyledReview } from '../api/_lib/styleSchema'
import type { StyledReview } from '../api/_lib/styles'
import type { ReviewInput } from '../api/_lib/types'

const PROFILES: { label: string; input: ReviewInput }[] = [
  {
    label: '1. Thief, denies everything',
    input: {
      siblingName: 'Rhea',
      answers: {
        habit: 'Takes my things and swears she never touched them',
        spend: 'Ordering way too much food on Swiggy at midnight',
        talent: 'Somehow always knows when the fridge has been restocked',
        steals: 'My snacks, my hoodie, my last piece of chocolate',
        love: 'She saves me the last bite when it actually matters',
      },
    },
  },
  {
    label: '2. Dramatic and iconic',
    input: {
      siblingName: 'Aditi',
      answers: {
        habit: 'Making an entire scene about the wifi being slow',
        spend: 'Another pair of sneakers she absolutely does not need',
        talent: 'Walking into a room and owning it instantly',
        steals: 'My jacket, for the photos, every weekend',
        love: 'She fought a shopkeeper who overcharged me',
      },
    },
  },
  {
    label: '3. Quiet, nostalgic, supportive',
    input: {
      siblingName: 'Meera',
      answers: {
        habit: 'Never says what is wrong, just goes quiet for days',
        spend: 'Probably books or something for the house',
        talent: 'Listening without ever making it about herself',
        steals: 'Nothing really, she asks first',
        love: 'She waited outside my exam hall for three hours',
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
    label: '5. Expensive and unpredictable',
    input: {
      siblingName: 'Arjun',
      answers: {
        habit: 'Buying things he cannot afford and asking to borrow money',
        spend: 'A mechanical keyboard, then bus fare off me',
        talent: 'Fixing anything that breaks in the house',
        steals: 'My charger, then telling me I lose things',
        love: 'He has quietly handled things for me my whole life',
      },
    },
  },
  {
    label: '6. Sleeps, eats, repeats',
    input: {
      siblingName: 'Vihaan',
      answers: {
        habit: 'Sleeping until 2pm and calling it a schedule',
        spend: 'Food. Always food. Every single time.',
        talent: 'Falling asleep anywhere within ninety seconds',
        steals: 'The last plate of biryani, always',
        love: 'He makes chai for me without being asked',
      },
    },
  },
]

async function generateViaApi(input: ReviewInput): Promise<StyledReview> {
  const res = await fetch('http://localhost:5173/api/generate-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = (await res.json()) as {
    review?: StyledReview
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

/** Every string in the artifact, for word-echo and length checks. */
function allText(review: StyledReview): string {
  return JSON.stringify(review).toLowerCase()
}

/** A one-line summary of what the card will actually say. */
function describe(review: StyledReview): string[] {
  const c = review.content as Record<string, unknown>
  const lines = [
    `  style      ${review.style}`,
    `  headline   ${review.headline}`,
    `  verdict    ${review.finalVerdict.title} — ${review.finalVerdict.reason}`,
  ]
  switch (review.style) {
    case 'CASE_FILE':
      lines.push(`  charges    ${review.content.charges.map((x) => x.title).join(' · ')}`)
      break
    case 'AWARDS_NIGHT':
      lines.push(`  awards     ${review.content.awards.map((x) => x.category).join(' · ')}`)
      break
    case 'SIBLING_WRAPPED':
      lines.push(
        `  stats      ${review.content.stats.map((x) => `${x.value} ${x.label}`).join(' · ')}`,
      )
      break
    case 'SCRAPBOOK':
      lines.push(`  annoys     ${review.content.thingsThatAnnoyMe.join(' · ')}`)
      lines.push(`  secret     ${review.content.secretNote}`)
      break
    case 'STOCK_REPORT':
      lines.push(
        `  metrics    ${review.content.performanceOverview.map((x) => `${x.metric} ${x.value}`).join(' · ')}`,
      )
      break
    case 'CHARACTER_STATS':
      lines.push(`  build      LV${review.content.level} ${review.content.class} · ${c.rarity}`)
      lines.push(`  ability    ${review.content.specialAbility}`)
      break
  }
  return lines
}

async function main() {
  const useApi = process.argv.includes('--api')
  console.log(
    `\nGenerating ${PROFILES.length} profiles via ${useApi ? 'the API' : 'the offline generator'}\n`,
  )

  const reviews: StyledReview[] = []
  for (const { label, input } of PROFILES) {
    const review = useApi ? await generateViaApi(input) : buildStyledFallback(input)
    reviews.push(review)
    console.log('─'.repeat(74))
    console.log(`${label}  —  ${review.subjectName}`)
    console.log('─'.repeat(74))
    for (const line of describe(review)) console.log(line)
    console.log()
  }

  // ── assertions ───────────────────────────────────────────────────
  const checks: { name: string; got: number; want: number; of: number }[] = [
    {
      name: 'different siblings get different universes',
      got: uniq(reviews.map((r) => r.style)),
      want: 3,
      of: PROFILES.length,
    },
    {
      name: 'distinct headlines',
      got: uniq(reviews.map((r) => r.headline)),
      want: 3,
      of: PROFILES.length,
    },
    {
      name: 'distinct verdict reasons',
      got: uniq(reviews.map((r) => r.finalVerdict.reason)),
      want: 3,
      of: PROFILES.length,
    },
    {
      name: 'distinct card contents',
      got: uniq(reviews.map((r) => JSON.stringify(r.content))),
      want: PROFILES.length,
      of: PROFILES.length,
    },
  ]

  /*
   * The whole promise is that the card could not have been written without
   * these answers, so at least three of the user's own words must survive.
   */
  let echoFailures = 0
  PROFILES.forEach((p, i) => {
    const answerWords = new Set(
      Object.values(p.input.answers).join(' ').toLowerCase().match(/[a-z]{5,}/g) ?? [],
    )
    const blob = allText(reviews[i])
    const hits = [...answerWords].filter((w) => blob.includes(w))
    if (hits.length < 3) {
      console.log(`  ✗ ${p.label}: only ${hits.length} of the user's own words survived`)
      echoFailures++
    }
  })

  /*
   * Round-tripping through the validator clamps anything over budget. If that
   * changes the artifact, the generator is relying on the card's truncation
   * safety net — which renders as an ellipsis mid-phrase.
   */
  // The validator rebuilds objects, so compare by value rather than key order.
  const stable = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, val]) => [k, stable(val)]),
          )
        : v

  const overBudget = reviews
    .filter((r) => {
      const round = validateStyledReview(JSON.parse(JSON.stringify(r)))
      return JSON.stringify(stable(round)) !== JSON.stringify(stable(r))
    })
    .map((r) => `${r.subjectName} (${r.style})`)

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
    variationOk = JSON.stringify(a.content) !== JSON.stringify(b.content)
    variationNote = variationOk
      ? 'same input produced different wording'
      : 'same input produced identical wording twice'
  }

  console.log('─'.repeat(74))
  let failed = echoFailures > 0 || overBudget.length > 0 || !variationOk
  for (const c of checks) {
    const ok = c.got >= c.want
    if (!ok) failed = true
    console.log(`  ${ok ? '✓' : '✗'} ${c.name}: ${c.got}/${c.of} distinct (need ≥ ${c.want})`)
  }
  console.log(
    `  ${echoFailures === 0 ? '✓' : '✗'} personalisation: every card reuses ≥3 of the user's words`,
  )
  console.log(
    `  ${overBudget.length === 0 ? '✓' : '✗'} copy fits the card without truncation` +
      (overBudget.length ? `: ${overBudget.join(', ')}` : ''),
  )
  console.log(`  ${variationOk ? '✓' : '✗'} repeat variation: ${variationNote}`)
  console.log('─'.repeat(74))

  if (failed) {
    console.error('\nFAILED — different answers are still producing similar artifacts.\n')
    process.exit(1)
  }
  console.log('\nAll profiles differentiated.\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
