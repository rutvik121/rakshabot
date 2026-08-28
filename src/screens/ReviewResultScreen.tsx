import { Button } from '@/components/ui/Button'
import { ReviewCard } from '@/components/ui/ReviewCard'
import { HeartDoodle } from '@/components/decorative/Doodles'
import type { ReviewData } from '@/types'
import type { ReviewSource } from '@/lib/review'

interface ReviewResultScreenProps {
  review: ReviewData
  /** Anything other than 'ai' is labelled on screen, never passed off as real. */
  source?: ReviewSource
  onRestart: () => void
}

export function ReviewResultScreen({ review, source = 'ai', onRestart }: ReviewResultScreenProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center overflow-hidden px-5 pb-12 pt-9 sm:px-6 sm:pt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,61,129,0.5), rgba(145,97,255,0.3) 50%, transparent 72%)',
        }}
      />

      <header className="relative z-10 flex flex-col items-center gap-1.5 text-center">
        {source === 'ai' ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/45">
            Review complete
          </span>
        ) : (
          <span className="rounded-full border border-orange/50 bg-orange/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
            Demo · sample text, not AI
          </span>
        )}
        <h1 className="font-display text-[26px] font-extrabold leading-tight text-cream sm:text-[32px]">
          The verdict is in.
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-cream/55">
          Send it to them. They will pretend to be offended for about four seconds.
        </p>
      </header>

      <div className="relative z-10 mt-8 flex w-full justify-center">
        <ReviewCard review={review} />
      </div>

      {/* actions */}
      <div className="relative z-10 mt-9 flex w-full max-w-[400px] flex-col gap-3">
        <Button className="w-full">
          Share My Review <span aria-hidden>↗</span>
        </Button>
        <Button variant="secondary" className="w-full">
          Download <span aria-hidden>↓</span>
        </Button>
        <button
          onClick={onRestart}
          className="mt-1 self-center px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cream/45 transition-colors hover:text-cream"
        >
          Review another sibling
        </button>
      </div>

      <p className="relative z-10 mt-7 flex items-center gap-1.5 text-center text-[11px] text-cream/35">
        <HeartDoodle className="h-3 w-3 text-hotpink" />
        Screenshot works too. We are not precious about it.
      </p>
    </div>
  )
}
