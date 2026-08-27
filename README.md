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

## Project structure

```
src/
  components/
    ui/           Reusable UI primitives (Button, Badge, Stamp, ShareCard, ...)
    decorative/    Small SVG doodles (stars, hearts, crown, tape, barcode)
  screens/         Landing, question flow, generation, and result screens
  data/            Local mock questions + a sample review
  types.ts         Shared domain types
```

Everything currently runs on local mock data — there is no backend, auth, or
AI generation wired up yet. `src/data/mockData.ts` is the single place to
edit the question set or the sample review output.
