import type { PerformanceMetric as PerformanceMetricType } from '@/types'

const SEGMENTS = 14

/*
 * Flat ink, not gradients. A gradient fill reads as a dashboard progress bar;
 * a single flat colour with uneven pressure reads as something stamped onto a
 * form, which is the language the rest of the poster speaks.
 */
const TONES = {
  roast: { ink: '#ff8a3d', score: 'text-orange' },
  love: { ink: '#ff4d92', score: 'text-pink' },
} as const

/**
 * Deterministic 0–1 value from a label and index.
 *
 * The cells are given a hand-stamped wobble, but a poster must render the same
 * way every time — so the variance is hashed from the content rather than drawn
 * from Math.random, which would reshuffle on every re-render.
 */
function stampJitter(seed: string, index: number): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= index
  h = Math.imul(h, 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/**
 * A metric as a row on a printed form: the label with a dotted leader to the
 * score, and a scale of cells stamped in by hand — each one sitting at its own
 * slight angle and ink density, on a ruled baseline. Roast metrics stamp warm
 * orange and love metrics pink, so the sheet warms as it is read.
 */
export function PerformanceMetric({ label, score, emoji, tone }: PerformanceMetricType) {
  const filled = Math.round((score / 100) * SEGMENTS)
  const t = TONES[tone]

  return (
    <div className="flex flex-col gap-[0.55cqw]">
      <div className="flex items-baseline gap-[1cqw] leading-none">
        <span className="shrink-0 text-[2.1cqw] leading-none" aria-hidden>
          {emoji}
        </span>
        <span className="shrink-0 font-mono text-[1.9cqw] font-medium uppercase leading-none tracking-[0.07em] text-cream/75">
          {label}
        </span>
        <span
          aria-hidden
          className="min-w-[1cqw] flex-1 translate-y-[-0.5cqw] border-b border-dotted border-cream/20"
        />
        <span
          className={`shrink-0 font-mono text-[2.1cqw] font-bold leading-none tabular-nums ${t.score}`}
        >
          {score}%
        </span>
      </div>

      {/* stamped scale, sitting on a printed rule */}
      <div
        className="flex gap-[0.7cqw] border-b border-cream/15 pb-[0.45cqw]"
        role="img"
        aria-label={`${label}: ${score} percent`}
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filled
          const j = stampJitter(label, i)
          return (
            <span
              key={i}
              className="h-[1.5cqw] flex-1 rounded-[0.12cqw]"
              style={
                isFilled
                  ? {
                      background: t.ink,
                      // uneven pressure, the way a ribbon or stamp actually lands
                      opacity: 0.76 + j * 0.24,
                      transform: `rotate(${(j - 0.5) * 5}deg) translateY(${(j - 0.5) * 0.9}px)`,
                    }
                  : {
                      // an unstamped cell left blank on the form
                      boxShadow: 'inset 0 0 0 1px rgba(255,242,223,0.16)',
                      transform: `rotate(${(j - 0.5) * 2}deg)`,
                    }
              }
            />
          )
        })}
      </div>
    </div>
  )
}
