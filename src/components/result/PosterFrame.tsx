import type { CSSProperties, ReactNode } from 'react'
import { Barcode } from '@/components/decorative/Doodles'

interface PosterFrameProps {
  children: ReactNode
  /** The card's ground — a gradient or flat colour, entirely style-specific. */
  background: string
  /** Ink for the footer rule, barcode and hashtag. */
  accent: string
  /** Base text colour for the card. */
  ink?: string
  /** Frame edge. */
  border?: string
  /** The small identifier printed at bottom left. */
  code: string
  className?: string
  style?: CSSProperties
}

/**
 * The shared shell every output universe is built inside.
 *
 * This is deliberately only a *frame*: the 1080×1350 canvas, the container
 * context that makes every child resolution-independent, and the RakshaBot
 * signature strip. It holds no layout opinions of its own — each style composes
 * its own interior, which is what keeps a case file and a stock report from
 * being the same card in different colours while still reading as siblings.
 *
 * Sizing children in `cqw` rather than viewport units is what lets one
 * component render identically as a 340px preview and a 1080px export.
 */
export function PosterFrame({
  children,
  background,
  accent,
  ink = '#fff2df',
  border = 'rgba(255,242,223,0.12)',
  code,
  className = '',
  style,
}: PosterFrameProps) {
  return (
    <article
      className={`@container relative isolate flex aspect-[1080/1350] w-full flex-col overflow-hidden rounded-[3cqw] shadow-card ${className}`}
      style={{ background, color: ink, border: `1px solid ${border}`, ...style }}
    >
      {children}

      <footer
        className="relative z-10 mt-auto flex items-end justify-between gap-[3cqw] px-[5cqw] pb-[4cqw] pt-[1.8cqw]"
        style={{ borderTop: `1px dashed ${accent}44` }}
      >
        <div className="flex min-w-0 flex-col gap-[0.5cqw]">
          <Barcode className="h-[2.1cqw] w-[14cqw]" style={{ color: `${accent}99` }} />
          <span
            className="truncate font-mono text-[1.35cqw] uppercase tracking-[0.14em]"
            style={{ color: `${accent}88` }}
          >
            {code}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-[0.2cqw] text-right">
          <span className="whitespace-nowrap font-display text-[1.85cqw] font-bold opacity-90">
            RakshaBot 🤖
          </span>
          <span
            className="whitespace-nowrap font-mono text-[1.55cqw] tracking-[0.03em]"
            style={{ color: accent }}
          >
            #SiblingPerformanceReview
          </span>
        </div>
      </footer>
    </article>
  )
}

/**
 * The subject's face: their photo when they gave one, their emoji when not.
 *
 * Each style frames this differently — an evidence photo, a taped polaroid, a
 * character portrait — so this resolves the content and leaves the treatment to
 * the caller.
 */
export function SubjectFace({
  photoUrl,
  emoji,
  alt,
  className = '',
  emojiSize = '9cqw',
}: {
  photoUrl?: string
  emoji: string
  alt: string
  className?: string
  emojiSize?: string
}) {
  if (photoUrl) {
    return <img src={photoUrl} alt={alt} className={`h-full w-full object-cover ${className}`} />
  }
  return (
    <span
      aria-hidden
      className={`grid h-full w-full place-items-center leading-none ${className}`}
      style={{ fontSize: emojiSize }}
    >
      {emoji}
    </span>
  )
}
