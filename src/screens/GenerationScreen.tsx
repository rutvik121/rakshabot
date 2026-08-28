import { useCallback, useEffect, useRef, useState } from 'react'
import { RakshaBotMascot } from '@/components/decorative/RakshaBotMascot'
import { StarDoodle } from '@/components/decorative/Doodles'
import { Button } from '@/components/ui/Button'
import { ReviewGenerationError } from '@/lib/review'

interface GenerationScreenProps {
  /** Kicks off the real generation; rejects when the AI pipeline fails. */
  generate: () => Promise<unknown>
  onComplete: () => void
  onExit: () => void
}

const STEPS = [
  'Investigating annoying habits',
  'Reviewing suspicious behaviour',
  'Calculating emotional damage',
  'Identifying good qualities',
]

const CURRENT_LABEL = 'Writing brutally honest manager feedback...'

const STEP_DURATION_MS = 900
const FINAL_HOLD_MS = 700

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
    geminiApiKey?: { configured?: boolean; problems?: string[] }
    warning?: string
    model?: string
  }
  if (h.warning) return h.warning
  if (!h.geminiApiKey?.configured) return 'the server has no GEMINI_API_KEY set'
  if (h.geminiApiKey.problems?.length) return `the key ${h.geminiApiKey.problems[0]}`
  return `server configured, model ${h.model ?? 'unknown'}`
}

export function GenerationScreen({ generate, onComplete, onExit }: GenerationScreenProps) {
  const [completed, setCompleted] = useState(0)
  const [generationDone, setGenerationDone] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const run = useCallback(() => {
    setError(null)
    setDiagnosis(null)
    setGenerationDone(false)
    setCompleted(0)
    generate()
      .then(() => setGenerationDone(true))
      .catch((e: unknown) => {
        setError({
          message: e instanceof Error ? e.message : 'RakshaBot hit a snag.',
          code: e instanceof ReviewGenerationError ? e.code : undefined,
        })
      })
  }, [generate])

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

  // Start generation once per attempt — the checklist is theatre played over a
  // real request, never a substitute for one.
  const startedFor = useRef(-1)
  useEffect(() => {
    if (startedFor.current === attempt) return
    startedFor.current = attempt
    run()
  }, [attempt, run])

  // Walk the checklist.
  useEffect(() => {
    if (error || completed >= STEPS.length) return
    const tick = setTimeout(() => setCompleted((c) => c + 1), STEP_DURATION_MS)
    return () => clearTimeout(tick)
  }, [completed, error])

  // Advance only when the animation has played AND the review actually exists.
  const stepsDone = completed >= STEPS.length
  useEffect(() => {
    if (error || !stepsDone || !generationDone) return
    const finish = setTimeout(onComplete, FINAL_HOLD_MS)
    return () => clearTimeout(finish)
  }, [stepsDone, generationDone, error, onComplete])

  const progressPct = stepsDone
    ? generationDone
      ? 100
      : 92
    : Math.round(((completed + 0.5) / (STEPS.length + 1)) * 100)

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
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
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-2xl font-extrabold text-cream sm:text-3xl">
                Reviewing employee performance...
              </h1>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-cream/40">
                RakshaBot HR is on the case
              </p>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-hotpink to-orange transition-[width] duration-[900ms] ease-in-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex w-full flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft px-5 py-5 text-left">
              {STEPS.map((label, i) => {
                const done = i < completed
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 text-sm transition-all duration-500 ease-out ${
                      done ? 'translate-x-0 text-cream/80' : '-translate-x-1 text-cream/30'
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] transition-all duration-500 ${
                        done
                          ? 'scale-100 border-hotpink bg-hotpink/20 text-pink'
                          : 'scale-90 border-ink-line text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    {label}
                  </div>
                )
              })}

              <div className="flex items-center gap-3 text-sm font-medium text-cream">
                <span className="flex shrink-0 gap-0.5">
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-pink [animation-delay:-0.2s]" />
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-pink" />
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-pink [animation-delay:0.2s]" />
                </span>
                {CURRENT_LABEL}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
