import { useCallback, useEffect, useRef, useState } from 'react'
import { RakshaBotMascot } from '@/components/decorative/RakshaBotMascot'
import { StarDoodle } from '@/components/decorative/Doodles'
import { Button } from '@/components/ui/Button'
import { ReviewGenerationError, type ReviewResult } from '@/lib/review'
import { STYLE_REVEAL, type OutputStyle } from '@/lib/review/styles'

interface GenerationScreenProps {
  /** Kicks off the real generation; rejects when the AI pipeline fails. */
  generate: () => Promise<ReviewResult>
  onComplete: () => void
  onExit: () => void
}

const STEPS = [
  'Reviewing behavioural evidence',
  'Detecting personality patterns',
  'Measuring chaos levels',
  'Identifying emotional attachment',
]

/**
 * The wait is a reveal, not a spinner.
 *
 * The product's claim is that this sibling gets an artifact chosen for *them*,
 * so the moment that claim becomes visible — the system declining to run a
 * standard review and assigning something else instead — is worth staging.
 * Generation runs underneath the whole time; the assignment beat simply cannot
 * play until the model has actually chosen, so the theatre never outruns the
 * truth.
 */
type Phase = 'analysing' | 'determining' | 'verdict' | 'assigned'

const STEP_MS = 720
const DETERMINING_MS = 1100
const VERDICT_MS = 1300
const ASSIGNED_MS = 1500

/**
 * Turns the server's self-report into one line a person can act on.
 *
 * A generation failure is usually a deployment problem, and the person looking
 * at this screen is the one who can fix it — but only if they are told which
 * problem it is. Everything here comes from `/api/health`, which never returns
 * key material.
 */
function summariseHealth(health: unknown): string | null {
  if (typeof health !== 'object' || health === null) return null
  const h = health as {
    backend?: { kind?: string; ready?: boolean; project?: string; problems?: string[] }
    warning?: string
    model?: string
    build?: { commit?: string }
  }
  const build = h.build?.commit ? `build ${h.build.commit} · ` : ''
  if (h.warning) return build + h.warning

  const backend = h.backend
  if (!backend) return `${build}the server did not report its configuration`
  const via = backend.kind === 'vertex' ? `vertex${backend.project ? ` ${backend.project}` : ''}` : 'api key'
  if (backend.problems?.length) return `${build}${via}: ${backend.problems[0]}`
  if (!backend.ready) return `${build}${via} is not configured`
  return `${build}${via} configured, model ${h.model ?? 'unknown'}`
}

export function GenerationScreen({ generate, onComplete, onExit }: GenerationScreenProps) {
  const [phase, setPhase] = useState<Phase>('analysing')
  const [completed, setCompleted] = useState(0)
  const [style, setStyle] = useState<OutputStyle | null>(null)
  const [error, setError] = useState<{ message: string; code?: string; detail?: string } | null>(
    null,
  )
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const run = useCallback(() => {
    setError(null)
    setDiagnosis(null)
    setStyle(null)
    setCompleted(0)
    setPhase('analysing')
    generate()
      .then((result) => setStyle(result.review.style))
      .catch((e: unknown) => {
        setError({
          message: e instanceof Error ? e.message : 'RakshaBot hit a snag.',
          code: e instanceof ReviewGenerationError ? e.code : undefined,
          detail: e instanceof ReviewGenerationError ? e.detail : undefined,
        })
      })
  }, [generate])

  // Start generation once per attempt — the sequence is played over a real
  // request, never as a substitute for one.
  const startedFor = useRef(-1)
  useEffect(() => {
    if (startedFor.current === attempt) return
    startedFor.current = attempt
    run()
  }, [attempt, run])

  /*
   * Once generation has failed, ask the server what it can see about its own
   * configuration. This runs only on the failure path, so a working app never
   * makes the call.
   */
  useEffect(() => {
    if (!error) return
    let cancelled = false
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((health: unknown) => {
        if (!cancelled) setDiagnosis(summariseHealth(health))
      })
      .catch(() => {
        if (!cancelled) {
          setDiagnosis('the /api routes are not responding — functions may not be deployed')
        }
      })
    return () => {
      cancelled = true
    }
  }, [error])

  // The analysis checklist ticks through on its own.
  useEffect(() => {
    if (error || phase !== 'analysing') return
    if (completed >= STEPS.length) {
      const t = setTimeout(() => setPhase('determining'), 320)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCompleted((n) => n + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [completed, phase, error])

  /*
   * The assignment beat waits for the model. Holding here rather than guessing
   * is the whole reason the reveal is honest: the style named on screen is the
   * style that was actually chosen.
   */
  useEffect(() => {
    if (error || phase !== 'determining' || !style) return
    const t = setTimeout(() => setPhase('verdict'), DETERMINING_MS)
    return () => clearTimeout(t)
  }, [phase, style, error])

  useEffect(() => {
    if (error || phase !== 'verdict') return
    const t = setTimeout(() => setPhase('assigned'), VERDICT_MS)
    return () => clearTimeout(t)
  }, [phase, error])

  useEffect(() => {
    if (error || phase !== 'assigned') return
    const t = setTimeout(onComplete, ASSIGNED_MS)
    return () => clearTimeout(t)
  }, [phase, error, onComplete])

  const reveal = style ? STYLE_REVEAL[style] : null

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple/25 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-7 text-center">
        <div className="relative">
          <RakshaBotMascot className="h-36 w-36 drop-shadow-[0_12px_28px_rgba(255,61,129,0.28)]" />
          <StarDoodle className="animate-pulse-dot absolute -right-2 top-3 h-4 w-4 text-orange" />
          <StarDoodle className="animate-pulse-dot absolute -left-3 bottom-10 h-3 w-3 text-pink [animation-delay:-0.6s]" />
        </div>

        {error ? (
          <div role="alert" className="flex flex-col items-center gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-2xl font-extrabold text-cream sm:text-3xl">
                RakshaBot had a small processing glitch 🤖
              </h1>
              <p className="text-sm leading-relaxed text-cream/60">
                Your sibling is still being investigated. Try again.
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-coral/80">
                {error.message}
              </p>
              {/*
                The reason, verbatim. Every friendly message above covers several
                distinct failures, so without this a broken deployment is
                indistinguishable from a rate limit — for the user reporting it
                and for whoever has to fix it.
              */}
              {(error.code || diagnosis) && (
                <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-cream/30">
                  {error.code}
                  {error.code && diagnosis ? ' · ' : ''}
                  {diagnosis}
                </p>
              )}
              {/* What the server itself said, when it managed to say anything. */}
              {error.detail && (
                <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-cream/25">
                  {error.detail}
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button onClick={() => setAttempt((a) => a + 1)} className="w-full">
                Try Again <span aria-hidden>↻</span>
              </Button>
              <button
                onClick={onExit}
                className="self-center px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cream/45 transition-colors hover:text-cream"
              >
                Start over
              </button>
            </div>
          </div>
        ) : phase === 'analysing' || phase === 'determining' ? (
          <div className="flex w-full flex-col items-center gap-5" aria-live="polite">
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-cream sm:text-3xl">
              Analysing sibling…
            </h1>

            <ul className="flex w-full flex-col gap-2 text-left">
              {STEPS.map((step, i) => {
                const done = i < completed
                return (
                  <li
                    key={step}
                    className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                      done ? 'text-cream/80' : 'text-cream/25'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] transition-colors duration-500 ${
                        done
                          ? 'border-hotpink bg-hotpink/15 text-hotpink'
                          : 'border-cream/15 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    {step}
                  </li>
                )
              })}
            </ul>

            <p
              className={`font-mono text-[11px] uppercase tracking-[0.18em] transition-opacity duration-500 ${
                phase === 'determining' ? 'text-orange opacity-100' : 'opacity-0'
              }`}
            >
              Determining appropriate evaluation system…
            </p>
          </div>
        ) : phase === 'verdict' ? (
          <div className="flex flex-col items-center gap-3" aria-live="polite">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">
              Standard review not suitable.
            </p>
            <h1 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-cream sm:text-3xl">
              Assigning evaluation method…
            </h1>
          </div>
        ) : (
          <div className="flex animate-[fade-up_420ms_ease-out] flex-col items-center gap-3" aria-live="polite">
            <span aria-hidden className="text-5xl leading-none">
              {reveal?.emoji}
            </span>
            <h1 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-cream sm:text-[32px]">
              {reveal?.label}
            </h1>
            <p className="text-sm text-cream/55">Building their artifact…</p>
          </div>
        )}
      </div>
    </div>
  )
}
