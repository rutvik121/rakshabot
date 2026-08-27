import { Button } from '@/components/ui/Button'
import { ShareCard } from '@/components/ui/ShareCard'
import type { ReviewData } from '@/types'

interface ReviewResultScreenProps {
  review: ReviewData
  onRestart: () => void
}

export function ReviewResultScreen({ review, onRestart }: ReviewResultScreenProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center px-6 pb-16 pt-10 sm:pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-hotpink/20 blur-3xl"
      />

      <div className="relative z-10 flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/40">
          Review complete
        </span>
        <h1 className="font-display text-2xl font-extrabold text-cream sm:text-3xl">
          Their file is ready. <span className="text-pink">Screenshot it.</span>
        </h1>
      </div>

      <div className="relative z-10 mt-8 w-full max-w-sm">
        <ShareCard review={review} />
      </div>

      <div className="relative z-10 mt-8 flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button className="w-full sm:w-auto">
          Share to Story <span aria-hidden>↗</span>
        </Button>
        <Button variant="secondary" onClick={onRestart} className="w-full sm:w-auto">
          Review Another Sibling
        </Button>
      </div>
    </div>
  )
}
