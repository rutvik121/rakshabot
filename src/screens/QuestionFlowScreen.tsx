import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ProgressIndicator } from '@/components/ui/ProgressIndicator'
import { QuestionCard } from '@/components/ui/QuestionCard'
import { IdentityCard } from '@/components/ui/IdentityCard'
import { useViewportHeight } from '@/hooks/useViewportHeight'
import { QUESTIONS } from '@/data/mockData'
import type { Answers, SiblingIdentity } from '@/types'

interface QuestionFlowScreenProps {
  onComplete: (identity: SiblingIdentity, answers: Answers) => void
  onExit: () => void
}

/** The identity step sits in front of the questions. */
const TOTAL_STEPS = QUESTIONS.length + 1

export function QuestionFlowScreen({ onComplete, onExit }: QuestionFlowScreenProps) {
  useViewportHeight()

  const [step, setStep] = useState(0)
  const [identity, setIdentity] = useState<SiblingIdentity>({ name: '' })
  const [answers, setAnswers] = useState<Answers>({})

  const isIdentityStep = step === 0
  const question = isIdentityStep ? null : QUESTIONS[step - 1]
  const isLast = step === TOTAL_STEPS - 1

  const canAdvance = isIdentityStep
    ? identity.name.trim().length > 0
    : (answers[question!.id] ?? '').trim().length > 0

  function handleBack() {
    if (step === 0) onExit()
    else setStep((s) => s - 1)
  }

  function handleNext() {
    if (!canAdvance) return
    if (isLast) onComplete(identity, answers)
    else setStep((s) => s + 1)
  }

  return (
    /*
     * Height follows the visual viewport, so when the keyboard opens the screen
     * shrinks to what's actually visible instead of scrolling the question away.
     * The header and footer are fixed rows of this column and the middle
     * scrolls on its own, so the question the user is answering stays put.
     */
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ height: 'var(--app-height, 100dvh)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(145,97,255,0.5), rgba(255,61,129,0.25) 45%, transparent 70%)',
        }}
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between px-6 pt-6 pb-2 sm:px-10">
        <button
          onClick={handleBack}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink-line text-cream/70 transition-colors hover:border-white/30 hover:text-cream"
          aria-label="Back"
        >
          ←
        </button>
        <ProgressIndicator total={TOTAL_STEPS} current={step} />
        <div className="w-10" />
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 sm:px-10">
        <div className="mx-auto w-full max-w-xl">
          {isIdentityStep ? (
            <IdentityCard identity={identity} onChange={setIdentity} />
          ) : (
            <QuestionCard
              key={question!.id}
              question={question!}
              value={answers[question!.id] ?? ''}
              onChange={(value) => setAnswers((a) => ({ ...a, [question!.id]: value }))}
            />
          )}
        </div>
      </main>

      <footer className="relative z-10 flex shrink-0 justify-end gap-3 border-t border-ink-line bg-ink/90 px-6 py-4 backdrop-blur-sm sm:px-10">
        <Button onClick={handleNext} disabled={!canAdvance} className="w-full sm:w-auto">
          {isLast ? 'Generate Review' : 'Next'} <span aria-hidden>→</span>
        </Button>
      </footer>
    </div>
  )
}
