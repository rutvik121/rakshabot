interface ProgressIndicatorProps {
  total: number
  current: number
}

export function ProgressIndicator({ total, current }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current
        const isActive = i === current
        return (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isActive
                ? 'w-8 bg-gradient-to-r from-hotpink to-orange'
                : isDone
                  ? 'w-4 bg-pink/60'
                  : 'w-4 bg-ink-line'
            }`}
          />
        )
      })}
      <span className="ml-2 font-mono text-xs text-cream/50">
        {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  )
}
