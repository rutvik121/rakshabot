interface StampProps {
  text?: string
  rotate?: number
  className?: string
}

export function Stamp({ text = 'CONFIDENTIAL', rotate = -10, className = '' }: StampProps) {
  return (
    <div
      className={`pointer-events-none select-none rounded-md border-[3px] border-coral/80 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-coral/90 ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        boxShadow: 'inset 0 0 0 1px rgba(255,107,94,0.3)',
      }}
    >
      {text}
    </div>
  )
}
