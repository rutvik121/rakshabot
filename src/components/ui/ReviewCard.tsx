import type { ReviewData } from '@/types'
import { PerformanceMetric } from './PerformanceMetric'
import { DecisionStamp } from './DecisionStamp'
import { Polaroid } from './Polaroid'
import { Stamp } from './Stamp'
import { Barcode, CropMark, CrownDoodle, StarDoodle } from '@/components/decorative/Doodles'

interface ReviewCardProps {
  review: ReviewData
  className?: string
}

/** Thin ruled heading used to open each section of the report. */
function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em] text-cream/45">
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-cream/12" />
    </div>
  )
}

/**
 * THE artifact. A confidential-looking annual performance review for a sibling,
 * designed to hold up as a standalone portrait image in a feed or a chat —
 * with no surrounding app for context.
 */
export function ReviewCard({ review, className = '' }: ReviewCardProps) {
  return (
    <article
      className={`bg-grain @container relative isolate w-full max-w-[400px] overflow-hidden rounded-[20px] border border-cream/12 bg-ink-soft px-6 pb-7 pt-6 shadow-card sm:px-7 ${className}`}
    >
      {/* ambient wash so the dark card never reads flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(145,97,255,0.55), rgba(255,61,129,0.3) 50%, transparent 72%)',
        }}
      />

      {/* printer's crop marks */}
      <CropMark className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 text-cream/20" />
      <CropMark className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 text-cream/20" />
      <CropMark className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 text-cream/20" />
      <CropMark className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 text-cream/20" />

      {/* ─── masthead ─────────────────────────────────────────── */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">
          <span>Doc · {review.documentId}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-coral" />
            Classified
          </span>
        </div>

        <div className="relative flex flex-col items-center pt-1 text-center">
          <CrownDoodle className="h-6 w-6 text-orange drop-shadow-[0_2px_6px_rgba(255,154,61,0.5)]" />
          <h1 className="mt-1.5 font-display text-[38px] font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-cream sm:text-[42px]">
            Annual
            <br />
            Review
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <StarDoodle className="h-2.5 w-2.5 text-pink" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-orange">
              {review.reviewPeriod}
            </span>
            <StarDoodle className="h-2.5 w-2.5 text-pink" />
          </div>
        </div>
      </header>

      {/* ─── employee ─────────────────────────────────────────── */}
      <section className="relative mt-6 flex flex-col items-center gap-3.5">
        {/* stamped across the file, balancing the polaroid's paperclip */}
        <Stamp className="absolute left-0 top-8 z-20" rotate={-14} />
        <Polaroid emoji={review.photoEmoji} photoUrl={review.photoUrl} rotate={-4} />

        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-cream/40">
            Employee
          </span>
          <h2 className="font-display text-[30px] font-extrabold uppercase leading-none tracking-[-0.01em] text-cream sm:text-[34px]">
            {review.employeeName}{' '}
            <span className="align-middle text-[26px]" aria-hidden>
              {review.employeeEmoji}
            </span>
          </h2>

          <div className="mt-2 flex flex-col items-center">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-cream/40">
              Position
            </span>
            <p className="mt-1 font-serif text-[19px] leading-[1.25] text-pink">
              {review.position[0]}
              <br />
              <span className="text-orange">{review.position[1]}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── metrics ──────────────────────────────────────────── */}
      <section className="mt-6 flex flex-col gap-3">
        <SectionRule label="Performance Metrics" />
        <div className="flex flex-col gap-2.5">
          {review.metrics.map((metric) => (
            <PerformanceMetric key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      {/* ─── manager's review (pasted-in memo) ────────────────── */}
      <section className="mt-6 flex flex-col gap-2.5">
        <SectionRule label="Manager's Review" />

        <figure className="relative rounded-[4px] bg-paper px-4.5 pb-3.5 pt-4 text-ink shadow-[0_14px_28px_-16px_rgba(0,0,0,0.8)]">
          <span
            aria-hidden
            className="absolute left-2.5 top-0 font-serif text-[48px] leading-none text-ink/15"
          >
            &ldquo;
          </span>
          <blockquote className="relative font-serif text-[16.5px] leading-[1.38] text-ink/85">
            {review.managerReview}
          </blockquote>
          <figcaption className="mt-2.5 flex items-center justify-between border-t border-ink/12 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
            <span>Reviewed by</span>
            <span className="font-serif text-[14px] italic normal-case tracking-normal text-ink/70">
              {review.reviewedBy}
            </span>
          </figcaption>
        </figure>
      </section>

      {/* ─── final decision ───────────────────────────────────── */}
      <section className="mt-7 flex flex-col items-center gap-2.5">
        <SectionRule label="Final Decision" />

        <DecisionStamp
          decision={review.finalDecision}
          emoji={review.decisionEmoji}
          className="mt-1.5 w-full"
        />

        <div className="mt-2.5 flex flex-col items-center gap-0.5 text-center">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-cream/40">
            Reason
          </span>
          <p className="font-serif text-[19px] italic leading-snug text-cream">
            {review.decisionReason}
          </p>
        </div>
      </section>

      {/* ─── footer ───────────────────────────────────────────── */}
      <footer className="mt-6 flex flex-col gap-3 border-t border-dashed border-cream/15 pt-3.5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1 overflow-hidden">
            <Barcode className="h-6 w-20 text-cream/55 sm:w-24" />
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-cream/35">
              {review.documentId}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <span className="whitespace-nowrap font-display text-[11.5px] font-bold text-cream/85">
              Generated by RakshaBot 🤖
            </span>
            <span className="whitespace-nowrap font-mono text-[8.5px] tracking-[0.04em] text-pink/80">
              {review.hashtag}
            </span>
          </div>
        </div>
      </footer>
    </article>
  )
}
