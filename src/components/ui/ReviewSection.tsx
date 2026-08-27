import type { ReactNode } from 'react'

interface ReviewSectionProps {
  label: string
  icon?: string
  children: ReactNode
  className?: string
}

export function ReviewSection({ label, icon, children, className = '' }: ReviewSectionProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-purple/80">
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </div>
      {children}
    </div>
  )
}
