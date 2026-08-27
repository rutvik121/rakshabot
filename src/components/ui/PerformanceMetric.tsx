import type { PerformanceMetric as PerformanceMetricType } from '@/types'

export function PerformanceMetric({ label, score, emoji }: PerformanceMetricType) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-cream/60">
        <span className="flex items-center gap-1.5">
          <span aria-hidden>{emoji}</span>
          {label}
        </span>
        <span className="font-semibold text-cream/90">{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-line/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-hotpink via-coral to-orange"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
