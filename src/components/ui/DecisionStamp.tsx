interface DecisionStampProps {
  /** e.g. "RETAINED" */
  decision: string
  /** e.g. "❤️" */
  emoji?: string
  rotate?: number
  className?: string
}

/**
 * The climax of the review: an oversized rubber-stamp treatment of the final
 * verdict, sized in container units so it scales with the poster and never
 * overflows. Deliberately a touch off-axis so it reads as stamped by hand.
 */
export function DecisionStamp({
  decision,
  emoji,
  rotate = -3.5,
  className = '',
}: DecisionStampProps) {
  return (
    <div className={`relative flex justify-center ${className}`}>
      {/*
        A whisper of warmth behind the stamp, not a neon halo — the rest of the
        poster is ink on paper, and a glowing verdict would break that language.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -inset-x-[4cqw] rounded-full opacity-30 blur-[5cqw]"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in srgb, var(--card-stamp, #ff3d81) 34%, transparent), transparent 72%)',
        }}
      />

      <div
        className="relative rounded-[1.2cqw] border-[0.65cqw] border-hotpink px-[4cqw] py-[1.4cqw]"
        style={{
          transform: `rotate(${rotate}deg)`,
          // double rule, the way a real rubber stamp bites twice
          boxShadow:
            'inset 0 0 0 0.5cqw rgba(11,10,19,0.92), inset 0 0 0 1cqw rgba(255,61,129,0.9)',
          opacity: 0.96,
        }}
      >
        <div className="flex items-center gap-[1.5cqw]">
          <span className="font-display text-[8.2cqw] font-extrabold uppercase leading-none tracking-[0.01em] text-hotpink">
            {decision}
          </span>
          {emoji && (
            <span className="text-[6.5cqw] leading-none" aria-hidden>
              {emoji}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
