interface StampProps {
  text?: string
  rotate?: number
  className?: string
}

/** Small inked classification stamp. Sized in container units to scale with the poster. */
export function Stamp({ text = 'CONFIDENTIAL', rotate = -10, className = '' }: StampProps) {
  return (
    <div
      className={`pointer-events-none select-none whitespace-nowrap rounded-[0.6cqw] border-[0.55cqw] px-[1.6cqw] py-[0.7cqw] font-mono text-[1.9cqw] font-semibold tracking-[0.18em] ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        borderColor: 'color-mix(in srgb, var(--card-classified, #ff6b5e) 80%, transparent)',
        color: 'color-mix(in srgb, var(--card-classified, #ff6b5e) 90%, transparent)',
        boxShadow: 'inset 0 0 0 0.2cqw color-mix(in srgb, var(--card-classified, #ff6b5e) 30%, transparent)',
      }}
    >
      {text}
    </div>
  )
}
