# RakshaBot

Rate. Roast. Retain. ❤️

**One sibling. Many worlds.**

Answer five questions about your sibling and RakshaBot decides how they should
be remembered — then builds that artifact. Not every sibling deserves a
performance review; some deserve an investigation.

| Style | For the sibling who is… |
|---|---|
| `CASE_FILE` | suspicious, chaotic, denies everything |
| `AWARDS_NIGHT` | iconic, dramatic, legendary in the family |
| `SIBLING_WRAPPED` | the same fights, jokes and rituals on repeat |
| `SCRAPBOOK` | nostalgic, tender, tied up with childhood |
| `STOCK_REPORT` | expensive, volatile, impossible to divest |
| `CHARACTER_STATS` | competitive, obsessive, a fictional character |

The model chooses the style *and* writes its content; the app renders the
matching template. Every artifact is one 1080×1350 portrait image that reads
standalone in a feed, with no scrolling.

## Stack

- React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Vite

## Getting started

```bash
npm install
npm run dev
```

## AI review generation

Answers are turned into a structured artifact by **Google Gemini**, server-side.
The model returns **data** only — including which of the six styles fits this
sibling — and the app renders it. The model never describes layout or colour.

`content` is a discriminated union: a different shape per style, validated
server-side against the counts and lengths each template is built for. A
response that fills the wrong set of fields is rejected and retried with a
correction rather than rendered with holes in it.

| | |
|---|---|
| SDK | `@google/genai` |
| Model | `gemini-3.7-flash` (override with `GEMINI_MODEL`) |
| Structured output | `responseMimeType: application/json` + `responseJsonSchema` |
| Route | `api/generate-review.ts` (`POST /api/generate-review`) |

### Setup

```bash
cp .env.example .env.local     # .env.local is gitignored
# add GEMINI_API_KEY=...
npm run dev
```

`vite.config.ts` loads the server-side keys from `.env.local` into `process.env`
for the dev API route. Vite itself only exposes `VITE_`-prefixed variables, and
only to the client, so without that step the key would be invisible to the
server. In production the host provides these directly.

If the key is wrong or lacks access, the route says so specifically
(`invalid_api_key`, `permission_denied`, `model_not_found`, `rate_limited`)
rather than failing generically.

`GEMINI_API_KEY` is read only inside `api/generate-review.ts`, which no client
code imports — the key and the SDK are absent from the browser bundle. Never
prefix it with `VITE_`: Vite inlines those into the client bundle.

`api/generate-review.ts` is a Vercel-style serverless function; `vite-plugin-api.ts`
serves it at the same URL during `npm run dev`, so the client's fetch path never
changes between environments.

### Validation and failure

Gemini is constrained by the JSON schema, then the response is validated
server-side against the semantic limits the fixed-size card needs (exactly 5
metrics, scores 0–100, per-field length caps). **If validation fails the request
is retried once** with an instruction naming what was wrong.

Thinking is turned down to `LOW` — a five-metric review does not need extended
reasoning, and the default budget is most of the latency. Each attempt gets 35s
and the pair share a 60s deadline, so the retry cannot double the worst case.

If generation still fails, the route returns a real error and the UI shows a
retryable error state. **It never silently substitutes generated-looking text** —
that would make a broken AI pipeline indistinguishable from a working one.

`ALLOW_DEV_FALLBACK=true` enables a local, non-AI generator for working on the
UI without a key. Its responses are labelled `source: "dev-fallback"`, and the
`--api` test refuses to pass on one.

### Demo builds

`VITE_DEMO_MODE=true npm run build` produces a static build that generates
locally, for showing the app where no server is available. Reviews it produces
carry a visible "Demo · sample text, not AI" badge. The flag is a compile-time
constant, so the branch is eliminated from a normal build.

### Diagnosing a deployment

`GET /api/health` reports what the server can see about its own configuration:
whether `GEMINI_API_KEY` is set, its length, and whether it shows any of the
paste damage that makes a valid key fail (wrapping quotes, a stray newline, the
`VITE_` prefix). It never returns key material.

```
/api/health           config only, no API call
/api/health?live=1    also makes one tiny real call to the model
```

Generation failing in production is nearly always the environment rather than
the code, and the environment is the one thing that cannot be inspected from a
laptop. This turns that into a single URL.

### Deploying to Vercel

`vercel.json` sets the framework preset and, importantly, raises the function
ceiling — the platform default is well under the time a generation can take, and
a platform kill is an opaque 504 with no body for the UI to read. The route's own
deadline sits below that ceiling so a slow model comes back as a friendly,
retryable error instead.

Modules reachable from `api/` import each other **relatively**, never through the
`@/` alias. Vite resolves the alias; the function bundler does not, and would ship
`@/data/mockData` as an unresolved import that fails at runtime on every request.

Set `GEMINI_API_KEY` in the Vercel project's environment variables. **Not**
`VITE_GEMINI_API_KEY` — anything `VITE_`-prefixed is inlined into the browser
bundle. Leave `ALLOW_DEV_FALLBACK` unset in production.

### Testing

```bash
npm run test:profiles          # offline generator, no key needed
npm run test:profiles -- --api # the real Gemini pipeline (needs a key + dev server)
```

Both assert that six very different siblings land in different universes and
produce different content, that every card reuses at least three of the user's
own words, and that nothing overruns the fixed frame. `--api` additionally
checks that repeating one input varies the wording.

Under `npm run dev`, `?preview=all` renders every template side by side,
`?preview=<STYLE>` renders one, `?preview=stress` renders a worst-case artifact,
and `&width=1080` renders at true export size. DEV only.

## Project structure

```
src/
  components/
    ui/           Reusable UI primitives (Button, Badge, Stamp, ShareCard, ...)
    decorative/    Small SVG doodles (stars, hearts, crown, tape, barcode)
  screens/         Landing, question flow, generation, and result screens
  components/
    result/        The six output templates and the style renderer
  lib/review/      Client generation entry; re-exports the shared api/_lib types
  dev/             DEV-only template gallery
  data/            The question set and the landing-page preview
  types.ts         Shared domain types
```

`src/data/mockData.ts` holds the question set. There is no auth and no database;
the only server-side piece is the generation route.
