import type { Award } from '@/types'
import { StarDoodle } from '@/components/decorative/Doodles'

interface AwardBandProps {
  award: Award
  className?: string
}

/**
 * A personalised honour, presented as a stamped certificate. Runs gold so it
 * reads as a distinct award rather than competing with the pink verdict stamp
 * below it.
 */
export function AwardBand({ award, className = '' }: AwardBandProps) {
  return (
    <div
      className={`relative flex flex-col items-center gap-[0.7cqw] overflow-hidden rounded-[1cqw] border border-dashed border-orange/55 bg-orange/8 px-[1.8cqw] py-[1.5cqw] text-center ${className}`}
    >
      {/* rosette */}
      <div className="relative grid place-items-center">
        <div className="grid h-[6.2cqw] w-[6.2cqw] place-items-center rounded-full border border-orange/45 bg-orange/15 text-[3.2cqw] leading-none">
          <span aria-hidden>{award.emoji}</span>
        </div>
        <StarDoodle className="absolute -right-[0.4cqw] -top-[0.4cqw] h-[1.5cqw] w-[1.5cqw] text-orange" />
      </div>

      <span className="font-mono text-[1.45cqw] font-semibold uppercase tracking-[0.18em] text-orange/85">
        Award of the Year
      </span>
      <span className="text-balance font-display text-[2.4cqw] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-cream">
        {award.title}
      </span>
    </div>
  )
}
