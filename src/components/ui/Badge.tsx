import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  tone?: 'pink' | 'purple' | 'coral' | 'orange' | 'outline'
  className?: string
}

const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  pink: 'bg-hotpink/15 text-pink border-hotpink/40',
  purple: 'bg-purple/15 text-purple border-purple/40',
  coral: 'bg-coral/15 text-coral border-coral/40',
  orange: 'bg-orange/15 text-orange border-orange/40',
  outline: 'bg-transparent text-cream/70 border-ink-line',
}

export function Badge({ children, tone = 'outline', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
