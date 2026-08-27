import { Paperclip, TapePiece } from '@/components/decorative/Doodles'

interface PolaroidProps {
  /** Emoji shown when no photo is supplied */
  emoji: string
  photoUrl?: string
  /** Handwritten-feeling caption on the polaroid's bottom lip */
  caption?: string
  rotate?: number
  className?: string
}

/** A photo attached to the report with tape and a paperclip. */
export function Polaroid({ emoji, photoUrl, caption, rotate = -4, className = '' }: PolaroidProps) {
  return (
    <div className={`relative ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <TapePiece className="absolute -top-3 left-1/2 z-20 -translate-x-1/2" rotate={5} />
      <Paperclip
        className="absolute -right-2 -top-4 z-20 h-11 w-5 text-cream/45"
        rotate={22}
      />

      <div className="rounded-[3px] bg-paper p-2.5 pb-7 shadow-[0_18px_34px_-14px_rgba(0,0,0,0.75)]">
        <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[2px] bg-gradient-to-br from-hotpink/25 via-purple/20 to-orange/25 sm:h-32 sm:w-32">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-6xl" aria-hidden>
              {emoji}
            </span>
          )}
        </div>
        {caption && (
          <p className="absolute inset-x-0 bottom-1.5 text-center font-serif text-[13px] italic text-ink/60">
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}
