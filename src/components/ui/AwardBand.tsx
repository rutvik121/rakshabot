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
      className={`relative flex flex-col items-center gap-[0.7cqw] overflow-hidden rounded-[1cqw] border border-dashed px-[1.8cqw] py-[1.5cqw] text-center ${className}`}
      style={{
        borderColor: 'color-mix(in srgb, var(--card-award, #ff9a3d) 55%, transparent)',
        background: 'color-mix(in srgb, var(--card-award, #ff9a3d) 8%, transparent)',
      }}
    >
      {/* rosette */}
      <div className="relative grid place-items-center">
        <div
          className="grid h-[6.2cqw] w-[6.2cqw] place-items-center rounded-full border text-[3.2cqw] leading-none"
          style={{
            borderColor: 'color-mix(in srgb, var(--card-award, #ff9a3d) 45%, transparent)',
            background: 'color-mix(in srgb, var(--card-award, #ff9a3d) 15%, transparent)',
          }}
        >
          <span aria-hidden>{award.emoji}</span>
        </div>
        <StarDoodle
          className="absolute -right-[0.4cqw] -top-[0.4cqw] h-[1.5cqw] w-[1.5cqw]"
          style={{ color: 'var(--card-award, #ff9a3d)' }}
        />
      </div>

      <span
        className="font-mono text-[1.45cqw] font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'color-mix(in srgb, var(--card-award, #ff9a3d) 85%, transparent)' }}
      >
        Award of the Year
      </span>
      <span className="line-clamp-3 text-balance font-display text-[2.4cqw] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-cream">
        {award.title}
      </span>
    </div>
  )
}
