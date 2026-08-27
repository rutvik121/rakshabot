import type { ReviewData } from '@/types'
import { PerformanceMetric } from './PerformanceMetric'
import { ReviewSection } from './ReviewSection'
import { Stamp } from './Stamp'
import { Barcode, CrownDoodle, StarDoodle, TapePiece } from '@/components/decorative/Doodles'

interface ShareCardProps {
  review: ReviewData
  className?: string
}

export function ShareCard({ review, className = '' }: ShareCardProps) {
  return (
    <div
      className={`bg-grain relative w-full max-w-sm overflow-hidden rounded-[28px] border border-ink-line bg-ink-soft shadow-card ${className}`}
    >
      {/* corner decoration */}
      <TapePiece className="absolute -top-2 left-6 z-10" rotate={-8} />
      <TapePiece className="absolute -top-2 right-8 z-10" rotate={6} />
      <Stamp className="absolute right-4 top-6 z-10" rotate={9} />

      <div className="relative flex flex-col gap-6 px-6 pb-8 pt-10 sm:px-8">
        {/* masthead */}
        <div className="flex items-center justify-between border-b border-dashed border-ink-line pb-4">
          <div className="flex flex-col">
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-cream/80">
              RakshaBot HR
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/40">
              Annual Performance Review
            </span>
          </div>
          <StarDoodle className="h-5 w-5 text-orange" />
        </div>

        {/* avatar / polaroid */}
        <div className="mx-auto flex flex-col items-center gap-4 pt-1">
          <div className="rotate-[-3deg] rounded-xl bg-paper p-3 pb-6 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.55)]">
            <div className="flex h-28 w-28 items-center justify-center rounded-md bg-gradient-to-br from-hotpink/20 via-purple/20 to-orange/20 text-6xl sm:h-32 sm:w-32">
              <span aria-hidden>{review.avatarEmoji}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2">
              <CrownDoodle className="h-4 w-4 text-orange" />
              <h2 className="font-display text-2xl font-extrabold leading-tight text-cream sm:text-[26px]">
                {review.employeeName}
              </h2>
            </div>
            <p className="font-mono text-xs text-pink">{review.position}</p>
          </div>
        </div>

        {/* metadata row */}
        <div className="flex items-center justify-between rounded-xl border border-ink-line bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-cream/45">
          <span>ID: {review.employeeId}</span>
          <span>{review.reviewPeriod}</span>
        </div>

        {/* metrics */}
        <ReviewSection label="Performance Metrics" icon="📊">
          <div className="flex flex-col gap-3.5 pt-1">
            {review.metrics.map((m) => (
              <PerformanceMetric key={m.label} {...m} />
            ))}
          </div>
        </ReviewSection>

        {/* manager review */}
        <ReviewSection label="Manager's Review" icon="🖊️">
          <p className="rounded-xl border border-ink-line bg-ink px-4 py-3.5 font-sans text-[13.5px] leading-relaxed text-cream/80">
            {review.managerReview}
          </p>
        </ReviewSection>

        {/* strengths */}
        <ReviewSection label="Key Strengths" icon="🌟">
          <ul className="flex flex-col gap-1.5 pt-1">
            {review.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-[13.5px] text-cream/75">
                <StarDoodle className="mt-1 h-2.5 w-2.5 shrink-0 text-pink" />
                {s}
              </li>
            ))}
          </ul>
        </ReviewSection>

        {/* final decision */}
        <div className="mt-1 flex flex-col items-center gap-1.5 rounded-2xl border-2 border-hotpink/50 bg-gradient-to-br from-hotpink/15 via-purple/10 to-orange/10 px-5 py-5 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/50">
            Final Decision
          </span>
          <span className="font-display text-3xl font-extrabold text-cream">
            {review.finalDecision}
          </span>
          <span className="font-sans text-sm italic text-cream/60">{review.decisionReason}</span>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-dashed border-ink-line pt-4">
          <Barcode className="w-24 text-cream/30" />
          <span className="font-display text-xs font-semibold text-cream/40">rakshabot.app</span>
        </div>
      </div>
    </div>
  )
}
