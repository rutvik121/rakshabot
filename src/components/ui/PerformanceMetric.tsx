import type { PerformanceMetric as PerformanceMetricType } from '@/types'

const SEGMENTS = 14

const TONES = {
  roast: {
    fill: 'bg-gradient-to-b from-orange to-coral',
    score: 'text-orange',
  },
  love: {
    fill: 'bg-gradient-to-b from-hotpink to-purple',
    score: 'text-pink',
  },
} as const

/**
 * A metric rendered as a printed report row: label with a dotted leader to the
 * score, and a run of discrete blocks beneath — closer to `██████░░░░` typed on
 * a document than to a dashboard progress bar. Roast metrics run warm orange,
 * love metrics run pink, so the block warms as the card is read.
 *
 * Sized in container units so it scales with the poster.
 */
export function PerformanceMetric({ label, score, emoji, tone }: PerformanceMetricType) {
  const filled = Math.round((score / 100) * SEGMENTS)
  const t = TONES[tone]

  return (
    <div className="flex flex-col gap-[0.45cqw]">
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

      <div className="flex gap-[0.45cqw]" role="img" aria-label={`${label}: ${score} percent`}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className={`h-[1.3cqw] flex-1 rounded-[0.28cqw] ${
              i < filled ? t.fill : 'bg-cream/8 ring-1 ring-inset ring-cream/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
