import type { ReviewData } from '@/types'
import { PerformanceMetric } from './PerformanceMetric'
import { DecisionStamp } from './DecisionStamp'
import { AwardBand } from './AwardBand'
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
    <div className="flex items-center gap-[1.2cqw]">
      <span className="whitespace-nowrap font-mono text-[1.6cqw] font-semibold uppercase tracking-[0.2em] text-cream/45">
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-cream/12" />
    </div>
  )
}

/**
 * THE artifact: the complete annual review as a single 4:5 poster (1080×1350),
 * so it exports and shares as one image and needs no scrolling to read.
 *
 * Every dimension is expressed in container units, so the poster is
 * resolution-independent — it renders identically as a 340px preview and as a
 * 1080px export.
 */
export function ReviewCard({ review, className = '' }: ReviewCardProps) {
  /*
   * The poster is a fixed frame, so the name must never wrap — a second line
   * would push everything below it out of the card. Scaling the type down as
   * the name gets longer keeps it on one line at any length the input allows.
   */
  const nameSize = Math.min(4.2, 46 / Math.max(review.employeeName.length, 1))

  return (
    <article
      className={`bg-grain @container relative isolate aspect-[1080/1350] w-full max-w-[400px] overflow-hidden rounded-[3cqw] border border-cream/12 bg-ink-soft shadow-card ${className}`}
    >
      {/* ambient wash so the dark poster never reads flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[18cqw] left-1/2 -z-10 h-[60cqw] w-[60cqw] -translate-x-1/2 rounded-full opacity-50 blur-[12cqw]"
        style={{
          background:
            'radial-gradient(circle, rgba(145,97,255,0.55), rgba(255,61,129,0.3) 50%, transparent 72%)',
        }}
      />

      {/* printer's crop marks */}
      <CropMark className="pointer-events-none absolute left-[1.5cqw] top-[1.5cqw] h-[2cqw] w-[2cqw] text-cream/20" />
      <CropMark className="pointer-events-none absolute right-[1.5cqw] top-[1.5cqw] h-[2cqw] w-[2cqw] text-cream/20" />
      <CropMark className="pointer-events-none absolute bottom-[1.5cqw] left-[1.5cqw] h-[2cqw] w-[2cqw] text-cream/20" />
      <CropMark className="pointer-events-none absolute bottom-[1.5cqw] right-[1.5cqw] h-[2cqw] w-[2cqw] text-cream/20" />

      <div className="flex h-full flex-col px-[4.6cqw] py-[3.6cqw]">
        {/* ─── document metadata ──────────────────────────────── */}
        <div className="flex items-center justify-between font-mono text-[1.55cqw] uppercase tracking-[0.16em] text-cream/40">
          <span>Doc · {review.documentId}</span>
          <span className="flex items-center gap-[1cqw]">
            <span className="h-[0.7cqw] w-[0.7cqw] rounded-full bg-coral" />
            Classified
          </span>
        </div>

        {/* ─── masthead ───────────────────────────────────────── */}
        <header className="mt-[1cqw] flex flex-col items-center">
          <CrownDoodle className="h-[3.4cqw] w-[3.4cqw] text-orange drop-shadow-[0_0.4cqw_1cqw_rgba(255,154,61,0.5)]" />
          <h1 className="mt-[0.5cqw] font-display text-[7.4cqw] font-extrabold uppercase leading-[0.88] tracking-[-0.03em] text-cream">
            Annual Review
          </h1>
          <div className="mt-[0.8cqw] flex items-center gap-[1.2cqw]">
            <StarDoodle className="h-[1.3cqw] w-[1.3cqw] text-pink" />
            <span className="font-mono text-[1.8cqw] font-medium uppercase tracking-[0.28em] text-orange">
              {review.reviewPeriod}
            </span>
            <StarDoodle className="h-[1.3cqw] w-[1.3cqw] text-pink" />
          </div>
        </header>

        {/* ─── employee + metrics, paired so the poster reads across ── */}
        <div className="mt-[2.6cqw] flex gap-[3cqw]">
          <section className="relative flex w-[36%] shrink-0 flex-col items-center text-center">
            <Polaroid
              emoji={review.photoEmoji}
              photoUrl={review.photoUrl}
              photoAlt={review.employeeName}
              rotate={-4}
              className="w-[17.5cqw]"
            />
            <span className="mt-[1.8cqw] font-mono text-[1.6cqw] uppercase tracking-[0.2em] text-cream/40">
              Employee
            </span>
            <h2
              className="mt-[0.4cqw] whitespace-nowrap font-display font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-cream"
              style={{ fontSize: `${nameSize}cqw` }}
            >
              {review.employeeName}{' '}
              <span className="align-middle" style={{ fontSize: `${nameSize * 0.79}cqw` }} aria-hidden>
                {review.employeeEmoji}
              </span>
            </h2>
            <span className="mt-[1.3cqw] font-mono text-[1.6cqw] uppercase tracking-[0.2em] text-cream/40">
              Position
            </span>
            <p className="mt-[0.3cqw] font-serif text-[2.7cqw] leading-[1.18] text-pink">
              {review.position[0]}
              <br />
              <span className="text-orange">{review.position[1]}</span>
            </p>

            {/* stamped across the file, balancing the polaroid's paperclip */}
            <Stamp className="absolute -left-[3cqw] top-[14cqw] z-20" rotate={-14} />
          </section>

          <section className="flex min-w-0 flex-1 flex-col gap-[1.1cqw]">
            <SectionRule label="Performance Metrics" />
            <div className="flex flex-col gap-[1cqw]">
              {review.metrics.map((metric) => (
                <PerformanceMetric key={metric.label} {...metric} />
              ))}
            </div>
          </section>
        </div>

        {/* ─── manager's review + award, paired ───────────────── */}
        <div className="mt-[3cqw] flex items-stretch gap-[2.2cqw]">
          <section className="flex min-w-0 flex-1 flex-col gap-[1.2cqw]">
            <SectionRule label="Manager's Review" />
            <figure className="relative flex flex-1 flex-col rounded-[0.8cqw] bg-paper px-[2.4cqw] pb-[1.4cqw] pt-[1.8cqw] text-ink shadow-[0_2cqw_4cqw_-2.5cqw_rgba(0,0,0,0.8)]">
              <span
                aria-hidden
                className="absolute left-[1.2cqw] top-[0.1cqw] font-serif text-[6cqw] leading-none text-ink/15"
              >
                &ldquo;
              </span>
              <blockquote className="relative flex-1 font-serif text-[2.35cqw] leading-[1.3] text-ink/85">
                {review.managerReview}
              </blockquote>
              <figcaption className="mt-[1cqw] flex items-center justify-between border-t border-ink/12 pt-[0.9cqw] font-mono text-[1.4cqw] uppercase tracking-[0.14em] text-ink/45">
                <span>Reviewed by</span>
                <span className="font-serif text-[2cqw] italic normal-case tracking-normal text-ink/70">
                  {review.reviewedBy}
                </span>
              </figcaption>
            </figure>
          </section>

          <AwardBand award={review.award} className="w-[36%] shrink-0 self-end" />
        </div>

        {/* ─── final decision ─────────────────────────────────── */}
        <section className="mt-[3cqw] flex flex-col items-center gap-[1.2cqw]">
          <SectionRule label="Final Decision" />
          <DecisionStamp
            decision={review.finalDecision}
            emoji={review.decisionEmoji}
            className="mt-[0.6cqw] w-full"
          />
          <div className="mt-[1.2cqw] flex flex-col items-center gap-[0.2cqw] text-center">
            <span className="font-mono text-[1.5cqw] uppercase tracking-[0.2em] text-cream/40">
              Reason
            </span>
            <p className="font-serif text-[2.7cqw] italic leading-snug text-cream">
              {review.decisionReason}
            </p>
          </div>
        </section>

        {/* ─── footer ─────────────────────────────────────────── */}
        <footer className="mt-auto flex items-end justify-between gap-[3cqw] border-t border-dashed border-cream/15 pt-[1.6cqw]">
          <div className="flex min-w-0 flex-col gap-[0.5cqw] overflow-hidden">
            <Barcode className="h-[2.1cqw] w-[14cqw] text-cream/55" />
            <span className="font-mono text-[1.4cqw] uppercase tracking-[0.14em] text-cream/35">
              {review.documentId}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-[0.2cqw] text-right">
            <span className="whitespace-nowrap font-display text-[1.85cqw] font-bold text-cream/85">
              Generated by RakshaBot 🤖
            </span>
            <span className="whitespace-nowrap font-mono text-[1.6cqw] tracking-[0.03em] text-pink/80">
              {review.hashtag}
            </span>
          </div>
        </footer>
      </div>
    </article>
  )
}
