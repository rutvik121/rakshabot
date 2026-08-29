import type { StyledReview, TrendDirection } from '@/lib/review/styles'
import { PosterFrame } from './PosterFrame'
import { fitOneLine } from './fit'

type StockReport = Extract<StyledReview, { style: 'STOCK_REPORT' }>

const CYAN = '#3ddbff'
const UP = '#3dffa8'
const DOWN = '#ff5d6c'
const AMBER = '#ffbe3d'

const TREND: Record<TrendDirection, { glyph: string; ink: string }> = {
  UP: { glyph: '▲', ink: UP },
  DOWN: { glyph: '▼', ink: DOWN },
  VOLATILE: { glyph: '◆', ink: AMBER },
}

/** A terminal panel: hairline border, label in the corner, dense rows inside. */
function Panel({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[1cqw] px-[2.6cqw] pb-[2cqw] pt-[1.6cqw] ${className}`}
      style={{ background: 'rgba(61,219,255,0.05)', border: `1px solid ${CYAN}33` }}
    >
      <p
        className="font-mono text-[1.35cqw] uppercase tracking-[0.24em]"
        style={{ color: `${CYAN}cc` }}
      >
        {label}
      </p>
      <div className="mt-[1.2cqw]">{children}</div>
    </section>
  )
}

/** A rising line, drawn from the metric values so it tracks the actual data. */
function TrendLine({ values }: { values: number[] }) {
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${100 - Math.max(4, Math.min(96, v))}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <polyline points={points} fill="none" stroke={CYAN} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,100 ${points} 100,100`} fill={`${CYAN}22`} />
    </svg>
  )
}

/**
 * The market analysis.
 *
 * The only tabular universe: a dense ledger of metrics with direction arrows,
 * read left to right, the way a terminal is. The recommendation is the payoff
 * and gets the largest type on the card — everything above it is the working
 * that justifies it.
 */
export function StockReportCard({ review }: { review: StockReport; photoUrl?: string }) {
  const c = review.content
  const tickerSize = fitOneLine(c.ticker, 8.6, 42)
  const callSize = fitOneLine(c.recommendation, 7.4, 82)
  /*
   * A decorative sparkline drawn from the metric magnitudes, sorted ascending.
   * The metrics are not a time series, and plotting them in list order made the
   * line fall away under a STRONG BUY — a chart that argues with the headline
   * beside it. Sorted, it reads as the shape it is: a summary, not a history.
   */
  const series = c.performanceOverview
    .map((r, i) => {
      const n = Number(r.value.replace(/[^\d.]/g, ''))
      return Number.isFinite(n) && n > 0 ? n : 40 + i * 10
    })
    .sort((a, b) => a - b)

  return (
    <PosterFrame
      background="linear-gradient(170deg,#04131b 0%,#02090f 60%,#040d14 100%)"
      accent={CYAN}
      border="rgba(61,219,255,0.28)"
      code={`${c.ticker} · FY 2025–26`}
    >
      {/* grid rule, faint, so the card reads as a terminal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16]"
        style={{
          backgroundImage: `linear-gradient(${CYAN}22 1px, transparent 1px), linear-gradient(90deg, ${CYAN}22 1px, transparent 1px)`,
          backgroundSize: '6cqw 6cqw',
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col gap-[2cqw] px-[5cqw] pt-[4.5cqw]">
        <header className="flex items-start justify-between gap-[3cqw]">
          <div className="min-w-0">
            <h1
              className="truncate font-display font-extrabold leading-none"
              style={{ fontSize: `${tickerSize}cqw`, color: CYAN }}
            >
              {c.ticker}
            </h1>
            <p className="mt-[0.6cqw] truncate font-mono text-[1.7cqw] uppercase tracking-[0.2em] opacity-65">
              Sibling stock report
            </p>
            <p className="truncate font-mono text-[1.5cqw] opacity-45">{review.subtitle}</p>
          </div>
          <div className="h-[11cqw] w-[26cqw] shrink-0">
            <TrendLine values={series} />
          </div>
        </header>

        <Panel label="Performance overview">
          <ul className="flex flex-col gap-[1.15cqw]">
            {c.performanceOverview.map((row) => {
              const t = TREND[row.direction]
              return (
                <li key={row.metric} className="flex items-center gap-[1.6cqw]">
                  <span className="min-w-0 flex-1 truncate text-[2.05cqw]">{row.metric}</span>
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-[1.9cqw] leading-none"
                    style={{ color: t.ink }}
                  >
                    {t.glyph}
                  </span>
                  <span
                    className="w-[9cqw] shrink-0 text-right font-mono text-[2.1cqw] font-bold"
                    style={{ color: t.ink }}
                  >
                    {row.value}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel label="Analyst notes">
          <ul className="flex flex-col gap-[0.9cqw]">
            {c.analystNotes.map((note) => (
              <li key={note} className="flex items-start gap-[1.2cqw]">
                <span aria-hidden className="shrink-0 text-[1.7cqw]" style={{ color: CYAN }}>
                  ›
                </span>
                <span className="min-w-0 flex-1 line-clamp-2 text-[1.95cqw] leading-snug opacity-85">
                  {note}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* the call */}
        <section className="mt-auto text-center">
          <p
            className="font-mono text-[1.4cqw] uppercase tracking-[0.3em]"
            style={{ color: `${CYAN}aa` }}
          >
            Analyst recommendation
          </p>
          <p
            className="whitespace-nowrap font-display font-extrabold uppercase leading-none"
            style={{ color: UP, fontSize: `${callSize}cqw` }}
          >
            {c.recommendation}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-[1.8cqw]">
          <Panel label="Risk factor">
            <p className="line-clamp-2 text-[1.95cqw] leading-snug" style={{ color: DOWN }}>
              {c.riskFactor}
            </p>
          </Panel>
          <Panel label="Long-term outlook">
            <p className="line-clamp-2 text-[1.95cqw] leading-snug opacity-90">
              {c.longTermOutlook}
            </p>
          </Panel>
        </div>

        <p className="pb-[1cqw] text-center font-serif text-[2.2cqw] italic leading-snug opacity-75">
          {review.finalVerdict.reason}
        </p>
      </div>
    </PosterFrame>
  )
}
