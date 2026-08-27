import { Paperclip, TapePiece } from '@/components/decorative/Doodles'

interface PolaroidProps {
  /** Emoji avatar used when no photo has been supplied */
  emoji: string
  /**
   * A sibling's photo. Ready for either an uploaded image or a generated
   * avatar URL; falls back to the emoji when absent.
   */
  photoUrl?: string
  /** Describes the photo for screen readers; ignored in the emoji fallback */
  photoAlt?: string
  rotate?: number
  className?: string
}

/**
 * A photo attached to the report with tape and a paperclip.
 *
 * The polaroid is its own query container, so everything inside it — frame,
 * tape, paperclip, emoji — is sized against the polaroid's own width. Set its
 * width from the caller and the whole assembly scales as one piece.
 */
export function Polaroid({
  emoji,
  photoUrl,
  photoAlt = '',
  rotate = -4,
  className = '',
}: PolaroidProps) {
  return (
    <div
      className={`@container relative ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <TapePiece
        className="absolute left-1/2 z-20 h-[13cqw] w-[44cqw] -translate-x-1/2 -translate-y-1/2"
        rotate={5}
      />
      <Paperclip className="absolute -right-[5cqw] -top-[7cqw] z-20 h-[26cqw] w-[12cqw] text-cream/45" rotate={22} />

      <div className="rounded-[2.5cqw] bg-paper p-[6cqw] pb-[16cqw] shadow-[0_8cqw_16cqw_-8cqw_rgba(0,0,0,0.75)]">
        <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-[1.5cqw] bg-gradient-to-br from-hotpink/25 via-purple/20 to-orange/25">
          {photoUrl ? (
            <img src={photoUrl} alt={photoAlt} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[58cqw] leading-none" aria-hidden>
              {emoji}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
