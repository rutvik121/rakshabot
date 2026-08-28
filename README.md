# RakshaBot

Rate. Roast. Retain. ❤️

Give your sibling their Annual Performance Review for Raksha Bandhan — a
shareable, Spotify-Wrapped-meets-confidential-HR-document card built with
React, TypeScript, Tailwind CSS, and Vite.

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

Answers are turned into a structured review by **Google Gemini**, server-side.
The model returns review **data** only — the card is rendered by the app, never
by the model.

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

### Testing

```bash
npm run test:profiles          # offline generator, no key needed
npm run test:profiles -- --api # the real Gemini pipeline (needs a key + dev server)
```

Both assert that five very different siblings produce different metrics, awards,
manager reviews, positions, reasons and themes, that every review reuses at
least two of the user's own words, and that no copy overflows the card. `--api`
additionally checks that repeating one input varies the wording.

## Project structure

```
src/
  components/
    ui/           Reusable UI primitives (Button, Badge, Stamp, ShareCard, ...)
    decorative/    Small SVG doodles (stars, hearts, crown, tape, barcode)
  screens/         Landing, question flow, generation, and result screens
  lib/review/      Generation: schema, prompt, offline fallback, card mapping
  data/            The question set and the landing-page preview
  types.ts         Shared domain types
```

`src/data/mockData.ts` holds the question set. There is no auth and no database;
the only server-side piece is the generation route.
