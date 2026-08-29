import type { Rarity, StyledReview } from '@/lib/review/styles'
import { PosterFrame, SubjectFace } from './PosterFrame'
import { fitOneLine } from './fit'

type CharacterStats = Extract<StyledReview, { style: 'CHARACTER_STATS' }>

const VIOLET = '#a877ff'
const CYAN = '#5ce1ff'
const PINK = '#ff4fa3'

const RARITY_INK: Record<Rarity, string> = {
  COMMON: '#9aa4b2',
  RARE: CYAN,
  EPIC: VIOLET,
  LEGENDARY: '#ffc84f',
}

/** A HUD panel: hard corners, thin glowing edge, label above the value. */
function Slot({
  label,
  value,
  ink = '#fff2df',
  className = '',
}: {
  label: string
  value: string
  ink?: string
  className?: string
}) {
  return (
    <div
      className={`min-w-0 px-[2cqw] py-[1.3cqw] ${className}`}
      style={{
        background: 'rgba(168,119,255,0.09)',
        border: `1px solid ${VIOLET}44`,
        clipPath: 'polygon(0 0, calc(100% - 1.6cqw) 0, 100% 1.6cqw, 100% 100%, 1.6cqw 100%, 0 calc(100% - 1.6cqw))',
      }}
    >
      <p className="font-mono text-[1.3cqw] uppercase tracking-[0.22em] opacity-50">{label}</p>
      <p
        className="truncate font-display text-[2.6cqw] font-bold uppercase leading-tight"
        style={{ color: ink }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * The character sheet.
 *
 * A game HUD: portrait locked to the left, attributes in slots, stats as
 * horizontal bars with numbers on the right. This is the only universe where
 * the subject is rendered as a *build* — a set of numbers that add up to a
 * playable character — which is what keeps it distinct from the case file's
 * severity bars.
 */
export function CharacterStatsCard({
  review,
  photoUrl,
}: {
  review: CharacterStats
  photoUrl?: string
}) {
  const c = review.content
  const rarityInk = RARITY_INK[c.rarity]
  const statusSize = fitOneLine(review.finalVerdict.title, 5.4, 78)

  return (
    <PosterFrame
      background="linear-gradient(165deg,#1a1030 0%,#0d0819 55%,#150c26 100%)"
      accent={VIOLET}
      border="rgba(168,119,255,0.35)"
      code={`${c.player} · LV ${c.level} · ${c.rarity}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[14cqw] -top-[14cqw] -z-10 h-[52cqw] w-[52cqw] rounded-full opacity-45 blur-[11cqw]"
        style={{ background: `radial-gradient(circle, ${VIOLET}, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-1 flex-col gap-[1.8cqw] px-[5cqw] pt-[4.5cqw]">
        <header className="flex items-start justify-between gap-[2cqw]">
          <h1 className="font-display text-[6.2cqw] font-extrabold uppercase leading-[0.9] tracking-tight">
            Character
            <br />
            Profile
          </h1>
          <span
            className="shrink-0 font-mono text-[1.5cqw] uppercase tracking-[0.24em]"
            style={{ color: VIOLET }}
          >
            {c.player}
          </span>
        </header>

        {/* portrait + attributes */}
        <section className="flex items-stretch gap-[2.2cqw]">
          <div
            className="h-[26cqw] w-[24cqw] shrink-0 overflow-hidden"
            style={{
              background: 'rgba(168,119,255,0.12)',
              border: `1px solid ${VIOLET}66`,
              clipPath:
                'polygon(0 0, calc(100% - 2.4cqw) 0, 100% 2.4cqw, 100% 100%, 2.4cqw 100%, 0 calc(100% - 2.4cqw))',
            }}
          >
            <SubjectFace
              photoUrl={photoUrl}
              emoji={review.subjectEmoji}
              alt={review.subjectName}
              emojiSize="10cqw"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-[1.2cqw]">
            <Slot label="Name" value={`${review.subjectName} ${review.subjectEmoji}`} />
            <Slot label="Level" value={c.level} ink={CYAN} />
            <Slot label="Class" value={c.class} />
            <Slot label="Rarity" value={c.rarity} ink={rarityInk} />
          </div>
        </section>

        {/* stat bars */}
        <section>
          <p
            className="font-mono text-[1.4cqw] uppercase tracking-[0.26em]"
            style={{ color: VIOLET }}
          >
            Stats
          </p>
          <ul className="mt-[1.2cqw] flex flex-col gap-[1.1cqw]">
            {c.stats.map((stat) => (
              <li key={stat.label} className="flex items-center gap-[1.6cqw]">
                <span className="w-[24cqw] shrink-0 truncate text-[1.95cqw]">{stat.label}</span>
                <span
                  aria-hidden
                  className="h-[1.1cqw] flex-1 overflow-hidden"
                  style={{ background: 'rgba(255,242,223,0.1)' }}
                >
                  <span
                    className="block h-full"
                    style={{
                      width: `${stat.value}%`,
                      background: `linear-gradient(90deg, ${VIOLET}, ${PINK})`,
                    }}
                  />
                </span>
                <span
                  className="w-[5.5cqw] shrink-0 text-right font-mono text-[1.9cqw] font-bold"
                  style={{ color: CYAN }}
                >
                  {stat.value}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* abilities */}
        <div className="flex flex-col gap-[1.2cqw]">
          <Slot label="Special ability" value={c.specialAbility} ink={CYAN} />
          <Slot label="Weakness" value={c.weakness} ink={PINK} />
        </div>

        {/* party status */}
        <section
          className="mt-auto mb-[0.6cqw] px-[3cqw] py-[2cqw] text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(255,79,163,0.16), rgba(168,119,255,0.08))',
            border: `1px solid ${PINK}66`,
            clipPath:
              'polygon(0 0, calc(100% - 2.4cqw) 0, 100% 2.4cqw, 100% 100%, 2.4cqw 100%, 0 calc(100% - 2.4cqw))',
          }}
        >
          <p className="font-mono text-[1.4cqw] uppercase tracking-[0.3em] opacity-55">
            Ultimate status
          </p>
          <p
            className="whitespace-nowrap font-display font-extrabold uppercase leading-none"
            style={{ color: PINK, fontSize: `${statusSize}cqw` }}
          >
            {review.finalVerdict.title}
          </p>
          <p className="mt-[0.7cqw] line-clamp-2 text-[2cqw] leading-snug opacity-80">
            {review.finalVerdict.reason}
          </p>
        </section>
      </div>
    </PosterFrame>
  )
}
