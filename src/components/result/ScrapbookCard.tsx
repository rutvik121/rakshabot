import type { StyledReview } from '@/lib/review/styles'
import { PosterFrame, SubjectFace } from './PosterFrame'
import { fitOneLine } from './fit'
import { HeartDoodle, TapePiece } from '@/components/decorative/Doodles'

type Scrapbook = Extract<StyledReview, { style: 'SCRAPBOOK' }>

const PAPER = '#f6ecda'
const PAPER_DIM = '#e7dcc6'
const PINK = '#ff5fa2'
const INK = '#2a2233'

/** A note torn out and stuck down, rotated slightly so nothing sits square. */
function Note({
  children,
  bg,
  rotate,
  className = '',
}: {
  children: React.ReactNode
  bg: string
  rotate: number
  className?: string
}) {
  return (
    <div
      className={`relative rounded-[0.8cqw] px-[2.6cqw] py-[2cqw] ${className}`}
      style={{
        background: bg,
        color: INK,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 1.4cqw 3cqw rgba(0,0,0,0.35)',
      }}
    >
      {children}
    </div>
  )
}

/**
 * The memory archive.
 *
 * The only light-ground artifact of the six, and the only one that abandons the
 * grid: overlapping notes at slight angles, taped photo, handwriting. Nothing
 * is scored or ranked here — the two lists are deliberately unmeasured, because
 * this universe is the one where the joke stops being the point.
 */
export function ScrapbookCard({ review, photoUrl }: { review: Scrapbook; photoUrl?: string }) {
  const c = review.content
  const verdictSize = fitOneLine(review.finalVerdict.title, 5.2, 80)

  return (
    <PosterFrame
      background="linear-gradient(160deg,#efe4cf 0%,#e3d5bd 55%,#d9c9ad 100%)"
      accent="#8a6f52"
      ink={INK}
      border="rgba(42,34,51,0.18)"
      code={review.subjectName}
    >
      <div className="relative z-10 flex flex-1 flex-col px-[5cqw] pt-[5cqw]">
        <h1
          className="text-center font-serif text-[5.4cqw] italic leading-tight"
          style={{ color: INK }}
        >
          {c.title}
        </h1>
        <p className="mt-[0.4cqw] text-center font-mono text-[1.5cqw] uppercase tracking-[0.22em] opacity-50">
          {review.subjectName} · {review.relationshipType}
        </p>

        {/* taped photo */}
        <div className="mt-[2.4cqw] flex justify-center">
          <div className="relative">
            <TapePiece className="absolute -left-[3cqw] -top-[2cqw] z-20 h-[4cqw] w-[12cqw] -rotate-[18deg]" />
            <TapePiece className="absolute -right-[3cqw] -top-[2cqw] z-20 h-[4cqw] w-[12cqw] rotate-[16deg]" />
            <div
              className="rotate-[-1.5deg] p-[1.1cqw] pb-[3.4cqw]"
              style={{ background: '#fffaf0', boxShadow: '0 1.6cqw 3cqw rgba(0,0,0,0.3)' }}
            >
              <div className="h-[20cqw] w-[27cqw] overflow-hidden bg-[#d7c9b4]">
                <SubjectFace
                  photoUrl={photoUrl}
                  emoji={review.subjectEmoji}
                  alt={review.subjectName}
                  emojiSize="8cqw"
                />
              </div>
            </div>
          </div>
        </div>

        {/* the two lists */}
        <div className="mt-[2.4cqw] flex flex-col gap-[1.9cqw]">
          <Note bg={PAPER} rotate={-1.1}>
            <p className="font-serif text-[2.5cqw] italic" style={{ color: INK }}>
              Things you do that annoy me:
            </p>
            <ul className="mt-[1cqw] flex flex-col gap-[0.6cqw]">
              {c.thingsThatAnnoyMe.map((item) => (
                <li key={item} className="flex items-start gap-[1.2cqw]">
                  <span aria-hidden className="shrink-0 text-[1.9cqw]" style={{ color: PINK }}>
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[1.95cqw] leading-snug opacity-85">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Note>

          <Note bg="#ffd9e7" rotate={1.3}>
            <p className="font-serif text-[2.5cqw] italic" style={{ color: '#7a2447' }}>
              Things I would never trade:
            </p>
            <ul className="mt-[1cqw] flex flex-col gap-[0.6cqw]">
              {c.thingsILove.map((item) => (
                <li key={item} className="flex items-start gap-[1.2cqw]">
                  <HeartDoodle className="mt-[0.5cqw] h-[1.6cqw] w-[1.6cqw] shrink-0" style={{ color: PINK }} />
                  <span
                    className="min-w-0 flex-1 truncate text-[1.95cqw] leading-snug"
                    style={{ color: '#5c1c35' }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Note>

          {/* the thing they would never say out loud */}
          <Note bg={PAPER_DIM} rotate={-0.6}>
            <p className="font-mono text-[1.4cqw] uppercase tracking-[0.22em] opacity-45">
              Things I would never say out loud
            </p>
            <p
              className="mt-[0.7cqw] line-clamp-3 font-serif text-[2.15cqw] italic leading-snug"
              style={{ color: INK }}
            >
              {c.secretNote}
            </p>
          </Note>
        </div>

        {/* verdict, handwritten */}
        <div className="mt-auto pb-[1cqw] text-center">
          <p className="font-serif text-[2.3cqw] italic opacity-70">{c.memoryCaption}</p>
          <p
            className="mt-[0.6cqw] whitespace-nowrap font-display font-extrabold uppercase leading-none"
            style={{ color: PINK, fontSize: `${verdictSize}cqw` }}
          >
            {review.finalVerdict.title}
          </p>
          <p className="mt-[0.5cqw] line-clamp-1 font-serif text-[2.1cqw] italic opacity-60">
            {review.finalVerdict.reason}
          </p>
        </div>
      </div>
    </PosterFrame>
  )
}
