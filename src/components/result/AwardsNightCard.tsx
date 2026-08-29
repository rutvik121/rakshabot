import type { StyledReview } from '@/lib/review/styles'
import { PosterFrame, SubjectFace } from './PosterFrame'
import { fitOneLine } from './fit'
import { SparkleRow, StarDoodle } from '@/components/decorative/Doodles'

type AwardsNight = Extract<StyledReview, { style: 'AWARDS_NIGHT' }>

const GOLD = '#f0c05a'
const GOLD_DIM = '#c9974a'

/**
 * The ceremony.
 *
 * Centred and symmetrical, the way a programme is: the ceremony name arrives
 * first and biggest, the nominee is presented, then the citation list, then the
 * headline award. Nothing is ranked or measured — this universe has no numbers
 * in it at all, which is most of what separates it from the case file.
 */
export function AwardsNightCard({ review, photoUrl }: { review: AwardsNight; photoUrl?: string }) {
  const c = review.content
  const nameSize = fitOneLine(review.subjectName, 6.8, 48)
  const verdictSize = fitOneLine(review.finalVerdict.title, 5.2, 80)

  return (
    <PosterFrame
      background="radial-gradient(120% 70% at 50% 0%, #3b2a10 0%, #1a1206 45%, #0c0904 100%)"
      accent={GOLD}
      border="rgba(240,192,90,0.3)"
      code={c.ceremony}
    >
      {/* spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[52cqw] w-[70cqw] -translate-x-1/2 opacity-55 blur-[9cqw]"
        style={{ background: 'radial-gradient(ellipse at top, rgba(240,192,90,0.55), transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center px-[6cqw] pt-[4.5cqw] text-center">
        <SparkleRow className="w-[22cqw]" style={{ color: `${GOLD}cc` }} />

        <p
          className="mt-[1.4cqw] font-mono text-[1.7cqw] uppercase tracking-[0.4em]"
          style={{ color: GOLD_DIM }}
        >
          The 2026
        </p>
        <h1
          className="font-display text-[8.4cqw] font-extrabold uppercase leading-[0.95]"
          style={{
            backgroundImage: `linear-gradient(180deg, #fff0c4 0%, ${GOLD} 45%, ${GOLD_DIM} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Sibling
          <br />
          Awards
        </h1>

        <p
          className="mt-[1.6cqw] font-mono text-[1.5cqw] uppercase tracking-[0.32em]"
          style={{ color: GOLD_DIM }}
        >
          Proudly presented to
        </p>

        {/* nominee */}
        <div className="mt-[1cqw] flex items-center justify-center gap-[2.4cqw]">
          <div
            className="h-[13cqw] w-[13cqw] shrink-0 overflow-hidden rounded-full"
            style={{ border: `0.5cqw solid ${GOLD}`, background: '#241a08' }}
          >
            <SubjectFace
              photoUrl={photoUrl}
              emoji={review.subjectEmoji}
              alt={review.subjectName}
              emojiSize="6.5cqw"
            />
          </div>
          <span
            className="min-w-0 truncate font-display font-extrabold leading-none"
            style={{ fontSize: `${nameSize}cqw`, color: '#fff4dc' }}
          >
            {review.subjectName}
          </span>
        </div>
        <p className="mt-[1cqw] w-full truncate px-[4cqw] text-[1.95cqw] italic opacity-60">
          {review.relationshipType}
        </p>

        {/* citations */}
        <div className="mt-[3cqw] w-full">
          <div className="flex items-center gap-[1.6cqw]">
            <span aria-hidden className="h-px flex-1" style={{ background: `${GOLD}40` }} />
            <span
              className="whitespace-nowrap font-mono text-[1.5cqw] font-bold uppercase tracking-[0.3em]"
              style={{ color: GOLD }}
            >
              Winner of
            </span>
            <span aria-hidden className="h-px flex-1" style={{ background: `${GOLD}40` }} />
          </div>

          <ul className="mt-[1.8cqw] flex flex-col gap-[1.5cqw] text-left">
            {c.awards.map((award) => (
              <li key={award.category} className="flex items-start gap-[1.8cqw]">
                <span aria-hidden className="w-[3cqw] shrink-0 text-[2.4cqw] leading-none">
                  {award.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[2.15cqw] font-semibold leading-tight">
                    {award.category}
                  </p>
                  <p
                    className="truncate font-serif text-[1.8cqw] italic leading-tight"
                    style={{ color: `${GOLD}aa` }}
                  >
                    {award.citation}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* the big one */}
        <div
          className="mb-[1cqw] mt-auto w-full rounded-[1.4cqw] px-[3cqw] py-[2.2cqw]"
          style={{
            background: 'linear-gradient(180deg, rgba(240,192,90,0.16), rgba(240,192,90,0.04))',
            border: `1px solid ${GOLD}55`,
          }}
        >
          <div className="flex items-center justify-center gap-[1.2cqw]">
            <StarDoodle className="h-[2cqw] w-[2cqw]" style={{ color: GOLD }} />
            <p
              className="font-mono text-[1.45cqw] uppercase tracking-[0.3em]"
              style={{ color: GOLD_DIM }}
            >
              Sibling of the year
            </p>
            <StarDoodle className="h-[2cqw] w-[2cqw]" style={{ color: GOLD }} />
          </div>
          <p
            className="mt-[0.6cqw] whitespace-nowrap font-display font-extrabold uppercase leading-none"
            style={{ color: '#fff4dc', fontSize: `${verdictSize}cqw` }}
          >
            {review.finalVerdict.title}
          </p>
          <p className="mt-[1cqw] line-clamp-2 font-serif text-[2.2cqw] italic leading-snug opacity-80">
            {c.mainAward.reason}
          </p>
        </div>
      </div>
    </PosterFrame>
  )
}
