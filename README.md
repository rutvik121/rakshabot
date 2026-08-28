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

Answers are turned into a structured review by Claude, server-side. The model
returns review **data** only — the card is rendered by the app, never by the
model.

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # or run `ant auth login`
npm run dev                            # /api/generate-review is served in dev
```

`api/generate-review.ts` is a Vercel-style serverless function; `vite-plugin-api.ts`
serves it at the same URL during `npm run dev`, so the client's fetch path never
changes between environments.

**Without credentials the app still works.** `src/lib/review/fallback.ts` reads
the same answers for recognisable sibling behaviours and assembles a
personalised review offline, so a missing key degrades the writing rather than
breaking the experience.

```bash
npm run test:profiles          # 5 very different siblings must differ
npm run test:profiles -- --api # same, through the running API
```

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
