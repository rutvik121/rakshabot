import type { StyledReview } from '@/lib/review/styles'
import { PosterFrame } from './PosterFrame'

type Wrapped = Extract<StyledReview, { style: 'SIBLING_WRAPPED' }>

const LIME = '#c8ff3d'
const VIOLET = '#9161ff'
const PINK = '#ff3d81'

/** A colour-blocked panel — the unit this whole universe is built from. */
function Block({
  children,
  bg,
  ink = '#0b0a13',
  className = '',
}: {
  children: React.ReactNode
  bg: string
  ink?: string
  className?: string
}) {
  return (
    <div
      className={`min-w-0 rounded-[2cqw] px-[2.8cqw] py-[2.2cqw] ${className}`}
      style={{ background: bg, color: ink }}
    >
      {children}
    </div>
  )
}

/**
 * The year in review.
 *
 * Built from stacked colour blocks rather than a document flow, with one
 * enormous number carrying the whole card. Everything else is a caption to it.
 * The numbers are framed as estimates in the footer line, because they are
 * jokes rather than telemetry.
 */
export function SiblingWrappedCard({ review }: { review: Wrapped; photoUrl?: string }) {
  const c = review.content
  const [hero, ...rest] = c.stats
  // The hero number is the card; it shrinks only as far as it must to fit.
  const heroSize = Math.min(15, 108 / Math.max(hero.value.length, 1))

  return (
    <PosterFrame
      background="linear-gradient(180deg,#101014 0%,#08080b 100%)"
      accent={LIME}
      border="rgba(200,255,61,0.25)"
      code={`Wrapped ${c.year} · RakshaBot estimates`}
    >
      <div className="relative z-10 flex flex-1 flex-col gap-[1.8cqw] px-[5cqw] pt-[4.5cqw]">
        <header className="flex items-end justify-between gap-[2cqw]">
          <h1 className="font-display text-[7.4cqw] font-extrabold uppercase leading-[0.88] tracking-tight">
            Sibling
            <br />
            <span style={{ color: LIME }}>Wrapped</span>
          </h1>
          <span
            className="shrink-0 font-display text-[5.4cqw] font-extrabold leading-none"
            style={{ color: `${LIME}55` }}
          >
            {c.year}
          </span>
        </header>

        <p className="-mt-[0.6cqw] line-clamp-1 text-[2cqw] opacity-55">
          {review.subjectEmoji} {review.subjectName} · {review.relationshipType}
        </p>

        {/* the hero number */}
        <Block bg={LIME}>
          <p className="font-mono text-[1.5cqw] font-bold uppercase tracking-[0.2em] opacity-70">
            You spent
          </p>
          <p
            className="font-display font-extrabold leading-[0.85] tracking-tight"
            style={{ fontSize: `${heroSize}cqw` }}
          >
            {hero.value}
          </p>
          <p className="truncate font-display text-[3.4cqw] font-extrabold uppercase leading-tight">
            {hero.label}
          </p>
          <p className="mt-[0.4cqw] line-clamp-2 text-[1.95cqw] leading-snug opacity-70">
            {hero.description}
          </p>
        </Block>

        {/* two supporting stats side by side */}
        <div className="grid grid-cols-2 gap-[1.8cqw]">
          {rest.map((stat, i) => (
            <Block key={stat.label} bg={i === 0 ? VIOLET : PINK} ink="#fff2df">
              <p className="font-display text-[5.6cqw] font-extrabold leading-none">{stat.value}</p>
              <p className="mt-[0.4cqw] truncate font-mono text-[1.5cqw] uppercase tracking-[0.14em] opacity-85">
                {stat.label}
              </p>
              <p className="mt-[0.6cqw] line-clamp-2 text-[1.8cqw] leading-snug opacity-75">
                {stat.description}
              </p>
            </Block>
          ))}
        </div>

        {/* rituals */}
        <Block bg="rgba(255,242,223,0.07)" ink="#fff2df">
          <p
            className="font-mono text-[1.45cqw] uppercase tracking-[0.22em]"
            style={{ color: LIME }}
          >
            Top activity
          </p>
          <p className="truncate font-display text-[3.2cqw] font-bold leading-tight">
            {c.topActivity}
          </p>
        </Block>

        <Block bg="rgba(255,242,223,0.07)" ink="#fff2df">
          <p
            className="font-mono text-[1.45cqw] uppercase tracking-[0.22em]"
            style={{ color: LIME }}
          >
            Most used line
          </p>
          <p className="truncate font-serif text-[2.9cqw] italic leading-tight">{c.mostUsedLine}</p>
        </Block>

        {/* status */}
        <Block bg="rgba(255,242,223,0.07)" ink="#fff2df" className="mt-auto text-center">
          <p className="font-mono text-[1.45cqw] uppercase tracking-[0.22em] opacity-55">
            Relationship status
          </p>
          <p
            className="truncate font-display text-[4.4cqw] font-extrabold uppercase leading-tight"
            style={{ color: LIME }}
          >
            {c.relationshipStatus}
          </p>
          <p className="mt-[0.4cqw] line-clamp-1 text-[1.9cqw] opacity-65">
            {review.finalVerdict.reason}
          </p>
        </Block>
      </div>
    </PosterFrame>
  )
}
