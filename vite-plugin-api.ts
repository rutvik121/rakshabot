import type { Connect, Plugin } from 'vite'

/**
 * Serves `api/generate-review.ts` during `npm run dev`.
 *
 * In production the file is deployed as a serverless function; this plugin gives
 * it the same URL locally so the client's fetch path never changes between
 * environments. The module is loaded through Vite's SSR pipeline on each request
 * so edits are picked up without a restart.
 *
 * The error envelope here must match the serverless handler's exactly — the
 * client keys its messages off `error.code`, so a differently-shaped dev error
 * would silently degrade every failure to a generic message.
 */
function sendJson(
  res: Parameters<Connect.NextHandleFunction>[1],
  status: number,
  body: unknown,
): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function apiRoutes(): Plugin {
  return {
    name: 'rakshabot-api-routes',
    configureServer(server) {
      const handle: Connect.NextHandleFunction = async (req, res, next) => {
        if (!req.url?.startsWith('/api/generate-review')) return next()

        if (req.method !== 'POST') {
          sendJson(res, 405, {
            error: { code: 'method_not_allowed', message: 'Method not allowed' },
          })
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : {}

          const mod = await server.ssrLoadModule('/api/generate-review.ts')
          sendJson(res, 200, await mod.handleGenerateReview(body))
        } catch (error) {
          const e = error as { status?: unknown; code?: unknown; message?: unknown }
          const status = Number(e?.status) || 500
          const code = typeof e?.code === 'string' ? e.code : 'generation_failed'
          const message = error instanceof Error ? error.message : 'Generation failed'
          // Surfaced in the dev console so a broken pipeline is never silent.
          server.config.logger.error(`[api/generate-review] ${code}: ${message}`)
          sendJson(res, status, { error: { code, message } })
        }
      }

      server.middlewares.use(handle)
    },
  }
}
