import { useEffect, useState } from 'react'
import { StarDoodle } from '@/components/decorative/Doodles'

interface GenerationScreenProps {
  onComplete: () => void
}

const STEPS = [
  'Investigating annoying habits',
  'Reviewing suspicious behaviour',
  'Calculating emotional damage',
  'Identifying good qualities',
]

const CURRENT_LABEL = 'Writing brutally honest manager feedback...'

const STEP_DURATION_MS = 650
const FINAL_HOLD_MS = 900

export function GenerationScreen({ onComplete }: GenerationScreenProps) {
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (completed >= STEPS.length) {
      const finish = setTimeout(onComplete, FINAL_HOLD_MS)
      return () => clearTimeout(finish)
    }
    const tick = setTimeout(() => setCompleted((c) => c + 1), STEP_DURATION_MS)
    return () => clearTimeout(tick)
  }, [completed, onComplete])

  const progressPct = Math.min(
    100,
    Math.round(((completed + (completed < STEPS.length ? 0.5 : 1)) / (STEPS.length + 1)) * 100),
  )

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple/25 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* mascot */}
        <div className="relative">
          <div className="grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br from-hotpink via-coral to-orange text-5xl shadow-[0_20px_40px_-12px_rgba(255,61,129,0.55)]">
            <span className="animate-float" aria-hidden>
              🤖
            </span>
          </div>
          <StarDoodle className="absolute -right-3 -top-3 h-5 w-5 animate-pulse-dot text-orange" />
          <StarDoodle className="absolute -bottom-2 -left-3 h-4 w-4 animate-pulse-dot text-pink" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-extrabold text-cream sm:text-3xl">
            Reviewing employee performance...
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cream/40">
            RakshaBot HR is on the case
          </p>
        </div>

        {/* progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-hotpink to-orange transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* checklist */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft px-5 py-5 text-left">
          {STEPS.map((label, i) => {
            const done = i < completed
            return (
              <div
                key={label}
                className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${
                  done ? 'text-cream/80' : 'text-cream/30'
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                    done
                      ? 'border-hotpink bg-hotpink/20 text-pink'
                      : 'border-ink-line text-transparent'
                  }`}
                >
                  {done ? '✓' : ''}
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
