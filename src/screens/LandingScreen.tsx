import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ResultCard } from '@/components/result/ResultCard'
import { HeartDoodle, StarDoodle } from '@/components/decorative/Doodles'
import { PREVIEW_REVIEW } from '@/data/previewReview'

interface LandingScreenProps {
  onStart: () => void
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,61,129,0.5), rgba(145,97,255,0.35) 45%, transparent 70%)',
        }}
      />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-hotpink/15 text-lg">
            👑
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-cream">
            RakshaBot
          </span>
        </div>
        <Badge tone="pink">Rate · Roast · Retain ❤️</Badge>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-20 pt-10 text-center sm:pt-16">
        <div className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-soft px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cream/60">
          <StarDoodle className="h-3 w-3 text-orange" />
          Raksha Bandhan, six ways, live now
        </div>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-cream sm:text-6xl">
          One sibling.{' '}
          <span className="bg-gradient-to-r from-hotpink via-coral to-orange bg-clip-text text-transparent">
            Many worlds.
          </span>
        </h1>

        <p className="mt-5 max-w-lg text-balance text-base leading-relaxed text-cream/60 sm:text-lg">
          Answer five questions and RakshaBot decides how your sibling should be
          remembered — a case file, an awards night, a stock report. Roast them a
          little. Keep them anyway.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button onClick={onStart} className="w-full sm:w-auto" data-start>
            Find Out Which <span aria-hidden>→</span>
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-cream/40">
            <HeartDoodle className="h-3.5 w-3.5 text-hotpink" />
            takes about 60 seconds
          </span>
        </div>

        {/* one of the six, built by the same generator the product uses */}
        <div className="relative mt-16 flex w-full justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-6 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple/25 blur-3xl"
          />
          {/* the card is an inline-size container, so its wrapper needs a
              definite width — it can no longer size from the card's contents */}
          <div className="relative w-full max-w-[400px] origin-top rotate-[-2deg] transition-transform duration-500 hover:rotate-0">
            <ResultCard review={PREVIEW_REVIEW} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 rounded-b-[20px] bg-gradient-to-t from-ink via-ink/75 to-transparent" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-ink-line bg-ink-soft px-4 py-1.5 font-mono text-[11px] text-cream/50">
            one of six · yours is chosen from your answers
          </span>
        </div>
      </main>

      {/* marquee strip */}
      <div className="relative z-10 overflow-hidden border-t border-ink-line bg-ink-soft/60 py-3">
        <div className="animate-marquee flex w-[200%] gap-10 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.2em] text-cream/25">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-10">
              {['Rate ✦', 'Roast ✦', 'Retain ❤️', 'Rate ✦', 'Roast ✦', 'Retain ❤️'].map(
                (t, j) => (
                  <span key={j}>{t}</span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
