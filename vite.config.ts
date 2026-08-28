import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { apiRoutes } from './vite-plugin-api'

/**
 * Server-side variables the dev API route reads from `process.env`.
 *
 * Vite only ever exposes `VITE_`-prefixed variables, and only to the client, so
 * without this the values in `.env.local` are invisible to `api/generate-review.ts`
 * and every request fails with `missing_api_key`. These are deliberately loaded
 * into the Node process only — they are never given to the client bundle, which
 * is what keeps the API key out of the browser.
 *
 * In production the host (Vercel and friends) provides these directly, so this
 * is a development-only convenience.
 */
const SERVER_ENV_KEYS = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'ALLOW_DEV_FALLBACK'] as const

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  for (const key of SERVER_ENV_KEYS) {
    // A real environment variable wins, so `GEMINI_API_KEY=... npm run dev`
    // still overrides whatever is in .env.local.
    if (!process.env[key] && fileEnv[key]) process.env[key] = fileEnv[key]
  }

  return {
    plugins: [react(), tailwindcss(), apiRoutes()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
