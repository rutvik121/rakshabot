import type { SVGProps } from 'react'

export function StarDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 1.5c.6 4.6 1.9 5.9 6.5 6.5-4.6.6-5.9 1.9-6.5 6.5-.6-4.6-1.9-5.9-6.5-6.5 4.6-.6 5.9-1.9 6.5-6.5z"
        fill="currentColor"
      />
    </svg>
  )
}

export function HeartDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 20.5s-8-4.9-8-11.2C4 5.9 6.4 3.5 9.4 3.5c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 3 0 5.4 2.4 5.4 5.8 0 6.3-8 11.2-8 11.2z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CrownDoodle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 18.5l-1.4-9 5 3.3L12 5l5.4 7.8 5-3.3-1.4 9H3z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="3" y="19.5" width="18" height="2.2" rx="1" fill="currentColor" />
    </svg>
  )
}

export function TapePiece({
  className = '',
  rotate = -4,
}: {
  className?: string
  rotate?: number
}) {
  return (
    <div
      className={`h-7 w-20 border border-white/20 bg-cream/25 shadow-sm backdrop-blur-[1px] ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        clipPath:
          'polygon(3% 0, 97% 0, 100% 20%, 96% 40%, 100% 60%, 95% 80%, 100% 100%, 2% 100%, 0 78%, 5% 55%, 0 35%, 4% 15%)',
      }}
    />
  )
}

export function Barcode({ className = '' }: { className?: string }) {
  const bars = [2, 1, 3, 1, 1, 2, 1, 4, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1, 4, 1]
  return (
    <div className={`flex h-8 items-stretch gap-[2px] ${className}`}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w }} className="bg-current" />
      ))}
    </div>
  )
}

export function SparkleRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StarDoodle className="h-3 w-3 text-orange" />
      <StarDoodle className="h-2 w-2 text-pink" />
      <StarDoodle className="h-4 w-4 text-hotpink" />
    </div>
  )
}
