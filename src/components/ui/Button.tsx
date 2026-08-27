import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-hotpink to-orange text-ink px-7 py-4 text-base shadow-[0_10px_30px_-8px_rgba(255,61,129,0.55)] hover:shadow-[0_14px_36px_-6px_rgba(255,61,129,0.7)] hover:-translate-y-0.5',
  secondary:
    'bg-ink-raised text-cream border border-ink-line px-6 py-3.5 text-base hover:border-white/30 hover:-translate-y-0.5',
  ghost: 'text-cream/70 hover:text-cream px-4 py-2 text-sm',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
