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
| Backend | Gemini API (`GEMINI_API_KEY`) or Vertex AI (`GOOGLE_SERVICE_ACCOUNT_KEY`) |
| Model | `gemini-3.7-flash` (override with `GEMINI_MODEL`) |
| Structured output | `responseMimeType: application/json` + `responseJsonSchema` |
| Route | `api/generate-review.ts` (`POST /api/generate-review`) |

### Setup

```bash
cp .env.example .env.local     # .env.local is gitignored
# add GEMINI_API_KEY=...
npm run dev
```

`vite.config.ts` loads the server-side variables from `.env.local` into
`process.env` for the dev API route. Vite itself only exposes `VITE_`-prefixed
variables, and only to the client, so without that step they would be invisible
to the server. In production the host provides them directly.

The route checks the credential's shape before making a request, because a
credential of the wrong kind does not get cleanly rejected — it hangs until the
deadline and reports a timeout, which blames the model for something the
environment did. Wrong credentials are named rather than merely refused (an
OAuth token, a service-account JSON where a key belongs, a project id), and
paste damage is reported even on a valid key, since a trailing newline is
invisible in a dashboard field and breaks the request header.

If the credential is wrong or lacks access, the route says so specifically
(`invalid_api_key`, `invalid_service_account`, `api_not_enabled`,
`permission_denied`, `model_not_found`, `rate_limited`) rather than failing
generically.

Credentials are read only inside `api/`, which no client code imports — they
and the SDK are absent from the browser bundle. Never prefix one with `VITE_`:
Vite inlines those into the client bundle.

### If your API key starts with `AQ.`

AI Studio has begun issuing keys prefixed `AQ.` in place of the older `AIza`,
and `generativelanguage.googleapis.com` currently rejects them with
`401 ACCESS_TOKEN_TYPE_UNSUPPORTED` — through the SDK, through
`x-goog-api-key`, and through `?key=` alike. It is a Google-side issue with no
client-side fix, and some accounts can no longer obtain an `AIza` key at all
(Cloud Console issues `AQ.` too).

**Vertex AI serves the same models under different authentication**, so it is
the way out. Set `GOOGLE_SERVICE_ACCOUNT_KEY` and the app switches backends —
no code change, and `GEMINI_API_KEY` is then ignored.

1. In the [Google Cloud Console](https://console.cloud.google.com), pick or
   create a project and note its **project id**.
2. **APIs & Services → Enable APIs** → enable **Vertex AI API**.
3. **IAM & Admin → Service Accounts → Create service account**. Give it the
   **Vertex AI User** role.
4. On that service account: **Keys → Add key → Create new key → JSON**. A file
   downloads.
5. Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the entire contents of that file (one
   line is fine; base64 also works if the dashboard mangles it), and
   `GOOGLE_CLOUD_PROJECT` to the project id if the key does not carry one.
   Locally that is `.env.local`; on Vercel it is **Settings → Environment
   Variables**, then redeploy.
6. Confirm with `/api/health?live=1` — it should report
   `backend.kind: "vertex"` and `gemini.reachable: true`.

`GOOGLE_CLOUD_LOCATION` defaults to `global`, which is where Vertex serves the
newest models; set a region only if you need one. Vertex AI is billed per
token, so the project needs billing enabled — that is the real cost of this
route, and the reason the API key remains the default when one works.

The service-account JSON is a private key. It is read server-side only, never
returned by `/api/health`, and `.env.local` is gitignored — do not commit it.

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
which backend is selected, whether it is ready, and — on the API-key path — the
key's length and any paste damage that makes a valid key fail (wrapping quotes,
a stray newline, the `VITE_` prefix). It never returns credential material.

```
/api/health           config only, no API call
/api/health?live=1    also makes one tiny real call to the model
/api/health?models=1  lists the models this key can reach (API-key path only)
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

Everything the function imports lives under `api/`, and every relative import
carries an explicit `.js` extension. The platform transpiles each file rather
than bundling it, and Node's ESM resolver does not guess extensions — an
extensionless import resolves in Vite and in every local test, then fails at
runtime as a 500 with no body. `api/tsconfig.json` uses `NodeNext`, so the
compiler rejects that mistake rather than letting it reach production.

Set `GEMINI_API_KEY` in the Vercel project's environment variables — or
`GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_CLOUD_PROJECT` for the Vertex path.
**Not** `VITE_`-prefixed — anything with that prefix is inlined into the browser
bundle. Leave `ALLOW_DEV_FALLBACK` unset in production. Environment variables
are read at request time, but a change still needs a redeploy to reach the
running functions.

### Testing

```bash
npm run typecheck              # tsc -b --noEmit — the root tsconfig is a
                               # solution file, so `tsc -p` checks nothing
npm run test:profiles          # offline generator, no key needed
npm run test:profiles -- --api # the real Gemini pipeline (needs a key + dev server)
npm run test:visual            # layout regressions, boots its own dev server
```

`test:visual` covers the two bugs typechecking cannot see: copy overrunning the
fixed canvas, and the on-screen keyboard covering the field being typed into.
The second only reproduces when the page lays out tall and the *visual*
viewport shrinks afterwards — what a phone does, and what resizing a browser
window does not — so it fakes `visualViewport` rather than the window. Needs
`npx playwright install chromium` once.

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
