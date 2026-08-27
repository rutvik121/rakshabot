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
 * verdict, built to be the thing people screenshot.
 */
export function DecisionStamp({
  decision,
  emoji,
  rotate = -4,
  className = '',
}: DecisionStampProps) {
  return (
    <div className={`relative flex justify-center ${className}`}>
      {/* heat behind the stamp */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -inset-x-6 rounded-full opacity-55 blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,61,129,0.42), rgba(255,107,94,0.18) 55%, transparent 75%)',
        }}
      />

      <div
        className="relative rounded-xl border-[3px] border-hotpink px-[4.5cqw] py-[2.5cqw]"
        style={{
          transform: `rotate(${rotate}deg)`,
          boxShadow:
            'inset 0 0 0 2px rgba(11,10,19,0.9), inset 0 0 0 4px rgba(255,61,129,0.85), 0 10px 24px -14px rgba(255,61,129,0.6)',
        }}
      >
        {/* sized against the card, not the viewport, so the stamp always fits */}
        <div className="flex items-center gap-[2cqw]">
          <span className="font-display text-[clamp(26px,10.5cqw,48px)] font-extrabold uppercase leading-none tracking-[0.02em] text-hotpink">
            {decision}
          </span>
          {emoji && (
            <span className="text-[clamp(21px,8.5cqw,38px)] leading-none" aria-hidden>
              {emoji}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
