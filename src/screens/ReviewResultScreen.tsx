import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ResultCard } from '@/components/result/ResultCard'
import { HeartDoodle } from '@/components/decorative/Doodles'
import type { StyledReview } from '@/lib/review/styles'
import type { ReviewSource } from '@/lib/review'
import { downloadCard, shareCard } from '@/lib/share/cardImage'

interface ReviewResultScreenProps {
  review: StyledReview
  /** The photo the user gave, if any. */
  photoUrl?: string
  /** Anything other than 'ai' is labelled on screen, never passed off as real. */
  source?: ReviewSource
  onRestart: () => void
}

export function ReviewResultScreen({
  review,
  photoUrl,
  source = 'ai',
  onRestart,
}: ReviewResultScreenProps) {
  /*
   * The export rasterises the live card rather than re-rendering a copy, so
   * what gets shared is exactly what the user is looking at — no second code
   * path to drift out of sync with the templates.
   */
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function run(kind: 'share' | 'download') {
    const node = cardRef.current?.firstElementChild
    if (!(node instanceof HTMLElement) || busy) return
    setBusy(kind)
    setNote(null)
    try {
      if (kind === 'download') {
        await downloadCard(node, review.subjectName)
        setNote('Saved to your device.')
      } else {
        const outcome = await shareCard(node, review.subjectName)
        if (outcome === 'downloaded') setNote('Your browser cannot share files — saved instead.')
        else if (outcome === 'shared') setNote('Sent. Brace yourself.')
      }
    } catch {
      setNote('That did not work. Screenshotting the card works too.')
    } finally {
      setBusy(null)
    }
  }

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

      <div
        ref={cardRef}
        className="relative z-10 mt-8 flex w-full justify-center [&>*]:w-full [&>*]:max-w-[400px]"
      >
        <ResultCard review={review} photoUrl={photoUrl} />
      </div>

      {/* actions */}
      <div className="relative z-10 mt-9 flex w-full max-w-[400px] flex-col gap-3">
        <Button className="w-full" onClick={() => run('share')} disabled={busy !== null}>
          {busy === 'share' ? 'Preparing…' : 'Share My Card'} <span aria-hidden>↗</span>
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => run('download')}
          disabled={busy !== null}
        >
          {busy === 'download' ? 'Rendering…' : 'Download'} <span aria-hidden>↓</span>
        </Button>
        {note && (
          <p aria-live="polite" className="text-center text-[12px] text-cream/50">
            {note}
          </p>
        )}
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
