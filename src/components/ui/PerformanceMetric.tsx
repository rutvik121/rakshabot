import type { PerformanceMetric as PerformanceMetricType } from '@/types'

/*
 * Hairline ink, not blocks and not a gradient pill.
 *
 * A thick segmented bar reads as an arcade health meter and a gradient pill
 * reads as a dashboard; both fight the premium editorial document the rest of
 * the poster is. A fine ruled scale with a precision tick at the value reads as
 * a measuring instrument printed on the page, which is the language we want.
 */
const TONES = {
  roast: { ink: 'var(--card-roast, #ff9a3d)' },
  love: { ink: 'var(--card-love, #ff4d92)' },
} as const

/** Quarter marks, so the rule reads as a graduated scale rather than a bar. */
const GRADUATIONS = [25, 50, 75]

export function PerformanceMetric({ label, score, emoji, tone }: PerformanceMetricType) {
  const t = TONES[tone]

  return (
    <div className="flex flex-col gap-[0.9cqw]">
      <div className="flex items-baseline gap-[1cqw] leading-none">
        <span className="shrink-0 text-[2.1cqw] leading-none" aria-hidden>
          {emoji}
        </span>
        <span className="min-w-0 truncate font-mono text-[1.9cqw] font-medium uppercase leading-none tracking-[0.07em] text-cream/75">
          {label}
        </span>
        <span
          aria-hidden
          className="min-w-[1cqw] flex-1 translate-y-[-0.5cqw] border-b border-dotted border-cream/20"
        />
        <span
          className="shrink-0 font-mono text-[2.1cqw] font-bold leading-none tabular-nums"
          style={{ color: t.ink }}
        >
          {score}%
        </span>
      </div>

      <div
        className="relative h-[1.5cqw] w-full"
        role="img"
        aria-label={`${label}: ${score} percent`}
      >
        {/* the printed rule */}
        <div className="absolute inset-x-0 top-1/2 h-[0.28cqw] -translate-y-1/2 bg-cream/14" />

        {/* graduations */}
        {GRADUATIONS.map((g) => (
          <div
            key={g}
            aria-hidden
            className="absolute top-1/2 h-[0.8cqw] w-px -translate-y-1/2 bg-cream/18"
            style={{ left: `${g}%` }}
          />
        ))}

        {/* inked to the score */}
        <div
          className="absolute left-0 top-1/2 h-[0.28cqw] -translate-y-1/2"
          style={{ width: `${score}%`, background: t.ink }}
        />

        {/* the reading */}
        <div
          className="absolute top-1/2 h-[1.5cqw] w-[0.4cqw] -translate-x-1/2 -translate-y-1/2 rounded-[0.1cqw]"
          style={{ left: `${score}%`, background: t.ink }}
        />
      </div>
    </div>
  )
}
