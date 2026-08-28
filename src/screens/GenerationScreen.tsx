import { useEffect, useRef, useState } from 'react'
import { RakshaBotMascot } from '@/components/decorative/RakshaBotMascot'
import { StarDoodle } from '@/components/decorative/Doodles'

interface GenerationScreenProps {
  /** Kicks off the real generation; resolves once the review is ready. */
  generate: () => Promise<unknown>
  onComplete: () => void
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

export function GenerationScreen({ generate, onComplete }: GenerationScreenProps) {
  const [completed, setCompleted] = useState(0)
  const [generationDone, setGenerationDone] = useState(false)

  // Start generation once, immediately — the checklist is theatre played over
  // a real request, not a substitute for one.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    generate()
      .catch((error) => console.error('[rakshabot] generation failed:', error))
      .finally(() => setGenerationDone(true))
  }, [generate])

  // Walk the checklist.
  useEffect(() => {
    if (completed >= STEPS.length) return
    const tick = setTimeout(() => setCompleted((c) => c + 1), STEP_DURATION_MS)
    return () => clearTimeout(tick)
  }, [completed])

  // Advance only when the animation has played AND the review actually exists.
  const stepsDone = completed >= STEPS.length
  useEffect(() => {
    if (!stepsDone || !generationDone) return
    const finish = setTimeout(onComplete, FINAL_HOLD_MS)
    return () => clearTimeout(finish)
  }, [stepsDone, generationDone, onComplete])

  // Hold just short of full while the write-up is still coming back.
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
      </div>
    </div>
  )
}
