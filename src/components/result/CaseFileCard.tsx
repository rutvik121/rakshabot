import type { StyledReview } from '@/lib/review/styles'
import { PosterFrame, SubjectFace } from './PosterFrame'
import { fitOneLine } from './fit'
import { Paperclip } from '@/components/decorative/Doodles'

type CaseFile = Extract<StyledReview, { style: 'CASE_FILE' }>

const INK = '#ff5a45'
const PAPER = '#f6ecda'

/**
 * The investigation.
 *
 * Reads top-down like a police file: identity first, then the charges against
 * them ranked by severity, then the summary, then the verdict stamped across
 * the bottom. The severity bars are the visual spine — the eye scans the
 * charge sheet before it reads a word of prose.
 */
export function CaseFileCard({ review, photoUrl }: { review: CaseFile; photoUrl?: string }) {
  const c = review.content
  // A long name would wrap and push the charge sheet off the card.
  const nameSize = fitOneLine(review.subjectName, 6.4, 52)
  const verdictSize = fitOneLine(review.finalVerdict.title, 5, 74)

  return (
    <PosterFrame
      background="linear-gradient(168deg,#171320 0%,#0e0b14 55%,#140f1a 100%)"
      accent={INK}
      border="rgba(255,90,69,0.28)"
      code={c.caseNumber}
    >
      {/* case tape across the top corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[12cqw] top-[6cqw] z-20 w-[46cqw] rotate-[38deg] py-[1cqw] text-center font-mono text-[1.5cqw] font-bold uppercase tracking-[0.3em]"
        style={{ background: INK, color: '#140f1a' }}
      >
        Classified
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-[5cqw] pt-[4.5cqw]">
        <header className="flex items-start justify-between gap-[3cqw]">
          <div className="min-w-0">
            <p
              className="font-mono text-[1.5cqw] uppercase tracking-[0.28em]"
              style={{ color: `${INK}cc` }}
            >
              {c.caseNumber} · Risk {c.riskLevel}
            </p>
            {/* the file label, torn off a paper folder */}
            <h1
              className="mt-[1.2cqw] inline-block -rotate-[1.2deg] px-[2.4cqw] py-[0.8cqw] font-display text-[6.6cqw] font-extrabold uppercase leading-none tracking-tight"
              style={{ background: PAPER, color: '#171320' }}
            >
              {review.headline}
            </h1>
          </div>
        </header>

        {/* subject + evidence photo */}
        <section className="mt-[3.4cqw] flex items-start gap-[3.4cqw]">
          <div className="min-w-0 flex-1">
            <p
              className="font-mono text-[1.5cqw] uppercase tracking-[0.24em]"
              style={{ color: `${INK}aa` }}
            >
              Subject
            </p>
            <p
              className="truncate font-serif italic leading-none"
              style={{ fontSize: `${nameSize}cqw`, color: PAPER }}
            >
              {review.subjectName}
            </p>
            <p className="mt-[1cqw] line-clamp-2 text-[2.1cqw] leading-snug opacity-60">
              {c.subject}
            </p>

            <p
              className="mt-[2cqw] font-mono text-[1.45cqw] uppercase tracking-[0.24em]"
              style={{ color: `${INK}aa` }}
            >
              Known aliases
            </p>
            <p className="truncate font-mono text-[1.85cqw] opacity-85">{c.aliases.join(' · ')}</p>
          </div>

          <div className="relative shrink-0">
            <Paperclip className="absolute -left-[1.6cqw] -top-[1.6cqw] z-20 h-[5cqw] w-[3cqw] text-cream/50" />
            <div
              className="h-[21cqw] w-[17cqw] rotate-[2deg] overflow-hidden p-[0.9cqw]"
              style={{ background: PAPER }}
            >
              <div className="h-full w-full overflow-hidden bg-[#241d2e] grayscale">
                <SubjectFace
                  photoUrl={photoUrl}
                  emoji={review.subjectEmoji}
                  alt={review.subjectName}
                  emojiSize="7.5cqw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* charge sheet */}
        <section className="mt-[3.2cqw]">
          <div className="flex items-center gap-[1.4cqw]">
            <span
              className="whitespace-nowrap font-mono text-[1.5cqw] font-bold uppercase tracking-[0.24em]"
              style={{ color: INK }}
            >
              Charges
            </span>
            <span aria-hidden className="h-px flex-1" style={{ background: `${INK}44` }} />
          </div>

          <ul className="mt-[1.6cqw] flex flex-col gap-[1.35cqw]">
            {c.charges.map((charge) => (
              <li key={charge.title} className="flex items-center gap-[1.8cqw]">
                <span aria-hidden className="w-[3cqw] shrink-0 text-[2.4cqw] leading-none">
                  {charge.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-[2.15cqw] leading-tight">
                  {charge.title}
                </span>
                <span
                  aria-hidden
                  className="h-[0.7cqw] w-[13cqw] shrink-0 overflow-hidden rounded-full"
                  style={{ background: 'rgba(246,236,218,0.14)' }}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${charge.severity}%`, background: INK }}
                  />
                </span>
                <span
                  className="w-[6cqw] shrink-0 text-right font-mono text-[1.9cqw] font-bold"
                  style={{ color: INK }}
                >
                  {charge.severity}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* summary */}
        <section
          className="mt-[3cqw] rounded-[1.2cqw] px-[2.6cqw] py-[2cqw]"
          style={{ background: 'rgba(246,236,218,0.05)', border: '1px solid rgba(246,236,218,0.1)' }}
        >
          <p
            className="font-mono text-[1.4cqw] uppercase tracking-[0.24em]"
            style={{ color: `${INK}aa` }}
          >
            Case summary
          </p>
          <p className="mt-[0.8cqw] line-clamp-4 text-[2.05cqw] leading-snug opacity-90">
            {c.caseSummary}
          </p>
        </section>

        {/* verdict */}
        <section className="mb-[1.5cqw] mt-auto flex flex-col items-center">
          <div
            className="-rotate-[2.5deg] px-[4cqw] py-[1.4cqw] text-center"
            style={{ border: `0.45cqw solid ${INK}`, borderRadius: '1cqw' }}
          >
            <p
              className="font-mono text-[1.4cqw] uppercase tracking-[0.3em]"
              style={{ color: `${INK}bb` }}
            >
              Verdict
            </p>
            <p
              className="whitespace-nowrap font-display font-extrabold uppercase leading-none"
              style={{ color: INK, fontSize: `${verdictSize}cqw` }}
            >
              {review.finalVerdict.title}
            </p>
          </div>
          <p className="mt-[1.6cqw] line-clamp-2 px-[4cqw] text-center font-serif text-[2.4cqw] italic leading-snug opacity-85">
            {review.finalVerdict.reason}
          </p>
        </section>
      </div>
    </PosterFrame>
  )
}
