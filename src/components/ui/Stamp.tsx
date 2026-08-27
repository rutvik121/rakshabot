interface StampProps {
  text?: string
  rotate?: number
  className?: string
}

/** Small inked classification stamp. Sized in container units to scale with the poster. */
export function Stamp({ text = 'CONFIDENTIAL', rotate = -10, className = '' }: StampProps) {
  return (
    <div
      className={`pointer-events-none select-none whitespace-nowrap rounded-[0.6cqw] border-[0.55cqw] border-coral/80 px-[1.6cqw] py-[0.7cqw] font-mono text-[1.9cqw] font-semibold tracking-[0.18em] text-coral/90 ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        boxShadow: 'inset 0 0 0 0.2cqw rgba(255,107,94,0.3)',
      }}
    >
      {text}
    </div>
  )
}
