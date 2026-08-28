import type { Connect, Plugin } from 'vite'

/**
 * Serves `api/generate-review.ts` during `npm run dev`.
 *
 * In production the file is deployed as a serverless function; this plugin gives
 * it the same URL locally so the client's fetch path never changes between
 * environments. The module is loaded through Vite's SSR pipeline on each request
 * so edits are picked up without a restart.
 */
export function apiRoutes(): Plugin {
  return {
    name: 'rakshabot-api-routes',
    configureServer(server) {
      const handle: Connect.NextHandleFunction = async (req, res, next) => {
        if (!req.url?.startsWith('/api/generate-review')) return next()

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : {}

          const mod = await server.ssrLoadModule('/api/generate-review.ts')
          const review = await mod.handleGenerateReview(body)

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(review))
        } catch (error) {
          const status =
            typeof error === 'object' && error !== null && 'status' in error
              ? Number((error as { status: unknown }).status) || 500
              : 500
          const message = error instanceof Error ? error.message : 'Generation failed'
          server.config.logger.error(`[api/generate-review] ${message}`)
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      }

      server.middlewares.use(handle)
    },
  }
}
