import type { PerformanceMetric as PerformanceMetricType } from '@/types'

const SEGMENTS = 14

const TONES = {
  roast: {
    fill: 'bg-gradient-to-b from-orange to-coral',
    glow: 'shadow-[0_0_7px_-2px_rgba(255,154,61,0.75)]',
    score: 'text-orange',
  },
  love: {
    fill: 'bg-gradient-to-b from-hotpink to-purple',
    glow: 'shadow-[0_0_7px_-2px_rgba(255,61,129,0.75)]',
    score: 'text-pink',
  },
} as const

/**
 * A metric rendered as a printed report row: label with a dotted leader to the
 * score, and a run of discrete blocks beneath — closer to `██████░░░░` typed on
 * a document than to a dashboard progress bar. Roast metrics run warm orange,
 * love metrics run pink, so the block warms as the card is read.
 */
export function PerformanceMetric({ label, score, emoji, tone }: PerformanceMetricType) {
  const filled = Math.round((score / 100) * SEGMENTS)
  const t = TONES[tone]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-[12px] leading-none" aria-hidden>
          {emoji}
        </span>
        <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.09em] text-cream/75">
          {label}
        </span>
        <span
          aria-hidden
          className="min-w-3 flex-1 translate-y-[-3px] border-b border-dotted border-cream/20"
        />
        <span className={`shrink-0 font-mono text-[11px] font-bold tabular-nums ${t.score}`}>
          {score}%
        </span>
      </div>

      <div className="flex gap-[3px]" role="img" aria-label={`${label}: ${score} percent`}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-[2px] ${
              i < filled ? `${t.fill} ${t.glow}` : 'bg-cream/8 ring-1 ring-inset ring-cream/10'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
