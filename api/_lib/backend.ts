/**
 * Choosing how to reach Gemini, and saying so when the choice cannot be made.
 *
 * There are two ways in. The Gemini API wants a single API key, which is by far
 * the simpler setup. Vertex AI wants a Google Cloud service account, which is
 * more work — but it authenticates with a signed JWT rather than a key string,
 * so it is unaffected by whatever AI Studio is currently issuing.
 *
 * That second path exists because it had to: AI Studio has begun handing out
 * keys prefixed `AQ.` which generativelanguage.googleapis.com rejects with 401
 * however they are sent, and for some accounts there is no way to get an older
 * `AIza` key back. Vertex is the same models under different auth.
 *
 * Nothing here ever returns credential material — only which backend is
 * selected, and what is wrong with its configuration.
 */

import { GoogleGenAI } from '@google/genai'
import { describeKey, isUsableKey, normaliseKey } from './apiKey.js'
import { GenerateReviewError } from './errors.js'

export type BackendKind = 'vertex' | 'api-key'

/** Vertex serves the newest models from `global` rather than a named region. */
const DEFAULT_LOCATION = 'global'

/** The three fields of a service-account JSON that authentication needs. */
interface ServiceAccount {
  client_email: string
  private_key: string
  project_id?: string
}

export interface BackendReport {
  kind: BackendKind
  /** Whether a request could be attempted at all. */
  ready: boolean
  /** Google Cloud project, on the Vertex path. */
  project?: string
  location?: string
  /** Key shape and paste damage, on the API-key path. */
  apiKey?: ReturnType<typeof describeKey>
  /** What stops this backend working, most useful first. */
  problems?: string[]
}

/** First of these variables that holds something. */
function env(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return undefined
}

function rawServiceAccount(): string | undefined {
  return env('GOOGLE_SERVICE_ACCOUNT_KEY', 'GCP_SERVICE_ACCOUNT_KEY', 'GOOGLE_CREDENTIALS')
}

/**
 * Vertex is used whenever a service account is present.
 *
 * Presence, not validity — a malformed service account should be reported as a
 * broken Vertex setup rather than silently falling through to an API key the
 * person had already given up on.
 */
export function backendKind(): BackendKind {
  return rawServiceAccount() ? 'vertex' : 'api-key'
}

/**
 * Reads a service-account JSON out of an environment variable.
 *
 * Both shapes people arrive with are accepted: the file's contents pasted
 * whole, and the same thing base64-encoded — which is what anyone does after a
 * dashboard mangles a multi-line value. The private key's newlines are
 * restored either way, since a JSON blob that has been through a shell often
 * carries them as literal backslash-n and google-auth-library will not sign
 * with that.
 */
export function parseServiceAccount(raw: string): ServiceAccount {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '')
  let text = trimmed

  if (!text.startsWith('{')) {
    try {
      text = Buffer.from(trimmed, 'base64').toString('utf8').trim()
    } catch {
      text = trimmed
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new GenerateReviewError(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the whole service-account key file, ' +
        'or its base64 encoding.',
      503,
      'invalid_service_account',
    )
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new GenerateReviewError(
      'GOOGLE_SERVICE_ACCOUNT_KEY did not contain a JSON object',
      503,
      'invalid_service_account',
    )
  }

  const sa = parsed as Record<string, unknown>
  const clientEmail = typeof sa.client_email === 'string' ? sa.client_email : ''
  const privateKey = typeof sa.private_key === 'string' ? sa.private_key.replace(/\\n/g, '\n') : ''

  if (!clientEmail || !privateKey) {
    throw new GenerateReviewError(
      'GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key — that is a different ' +
        'file to the one Cloud Console downloads for a service-account key.',
      503,
      'invalid_service_account',
    )
  }
  if (!privateKey.includes('BEGIN')) {
    throw new GenerateReviewError(
      'The private_key in GOOGLE_SERVICE_ACCOUNT_KEY looks truncated — it should begin ' +
        '"-----BEGIN PRIVATE KEY-----".',
      503,
      'invalid_service_account',
    )
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
    ...(typeof sa.project_id === 'string' ? { project_id: sa.project_id } : {}),
  }
}

function vertexLocation(): string {
  return env('GOOGLE_CLOUD_LOCATION', 'GOOGLE_VERTEX_LOCATION', 'VERTEX_LOCATION') ?? DEFAULT_LOCATION
}

function vertexProject(sa?: ServiceAccount): string | undefined {
  return env('GOOGLE_CLOUD_PROJECT', 'GOOGLE_VERTEX_PROJECT', 'VERTEX_PROJECT') ?? sa?.project_id
}

/** What is configured and what is missing, without disclosing any of it. */
export function describeBackend(): BackendReport {
  const raw = rawServiceAccount()

  if (!raw) {
    const key = describeKey(process.env.GEMINI_API_KEY)
    const problems: string[] = []
    if (!key.configured) {
      problems.push('no GEMINI_API_KEY is set, and no service account is configured either')
    } else if (!isUsableKey(process.env.GEMINI_API_KEY)) {
      problems.push(`GEMINI_API_KEY ${key.problems?.[0] ?? 'does not look like a Gemini API key'}`)
    } else if (key.problems?.length) {
      problems.push(`GEMINI_API_KEY ${key.problems[0]}`)
    }
    return {
      kind: 'api-key',
      ready: key.configured && isUsableKey(process.env.GEMINI_API_KEY),
      apiKey: key,
      ...(problems.length ? { problems } : {}),
    }
  }

  const location = vertexLocation()
  try {
    const sa = parseServiceAccount(raw)
    const project = vertexProject(sa)
    if (!project) {
      return {
        kind: 'vertex',
        ready: false,
        location,
        problems: [
          'the service account carries no project_id — set GOOGLE_CLOUD_PROJECT to your Google Cloud project id',
        ],
      }
    }
    return { kind: 'vertex', ready: true, project, location }
  } catch (error) {
    return {
      kind: 'vertex',
      ready: false,
      location,
      problems: [error instanceof Error ? error.message : 'the service account could not be read'],
    }
  }
}

export interface Backend {
  ai: GoogleGenAI
  kind: BackendKind
  /** Where the request is going, for logs and the health report. */
  label: string
}

/**
 * Builds the client for whichever backend is configured, or explains why it
 * cannot.
 *
 * Refusing here rather than letting the request go out matters: a credential of
 * the wrong kind does not come back as a clean rejection, it hangs until the
 * deadline, and the user is told the model was slow when the real problem was
 * an environment variable.
 */
export function createBackend(): Backend {
  const raw = rawServiceAccount()

  if (raw) {
    const sa = parseServiceAccount(raw)
    const project = vertexProject(sa)
    const location = vertexLocation()

    if (!project) {
      throw new GenerateReviewError(
        'Vertex AI needs a project id. The service account did not carry one, so set ' +
          'GOOGLE_CLOUD_PROJECT to your Google Cloud project id.',
        503,
        'missing_project',
      )
    }

    return {
      kind: 'vertex',
      label: `vertex ${project}/${location}`,
      ai: new GoogleGenAI({
        vertexai: true,
        project,
        location,
        googleAuthOptions: {
          projectId: project,
          credentials: { client_email: sa.client_email, private_key: sa.private_key },
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        },
      }),
    }
  }

  const key = process.env.GEMINI_API_KEY
  const report = describeKey(key)

  if (!report.configured) {
    throw new GenerateReviewError(
      'The server has no credentials. Set GEMINI_API_KEY, or — if AI Studio only issues "AQ." ' +
        'keys for your account — set GOOGLE_SERVICE_ACCOUNT_KEY to use Vertex AI instead.',
      503,
      'missing_api_key',
    )
  }
  if (!isUsableKey(key)) {
    throw new GenerateReviewError(
      `GEMINI_API_KEY ${report.problems?.[0] ?? 'does not look like a Gemini API key'}. ` +
        'Get one at aistudio.google.com/apikey and set it in the deployment environment.',
      503,
      'invalid_api_key',
    )
  }

  return { kind: 'api-key', label: 'gemini api key', ai: new GoogleGenAI({ apiKey: normaliseKey(key) }) }
}
