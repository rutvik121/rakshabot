import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ProgressIndicator } from '@/components/ui/ProgressIndicator'
import { QuestionCard } from '@/components/ui/QuestionCard'
import { QUESTIONS } from '@/data/mockData'
import type { Answers } from '@/types'

interface QuestionFlowScreenProps {
  onComplete: (answers: Answers) => void
  onExit: () => void
}

export function QuestionFlowScreen({ onComplete, onExit }: QuestionFlowScreenProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1
  const canAdvance = (answers[question.id] ?? '').trim().length > 0

  function handleBack() {
    if (step === 0) {
      onExit()
    } else {
      setStep((s) => s - 1)
    }
  }

  function handleNext() {
    if (!canAdvance) return
    if (isLast) {
      onComplete(answers)
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(145,97,255,0.5), rgba(255,61,129,0.25) 45%, transparent 70%)',
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <button
          onClick={handleBack}
          className="grid h-10 w-10 place-items-center rounded-full border border-ink-line text-cream/70 transition-colors hover:border-white/30 hover:text-cream"
          aria-label="Back"
        >
          ←
        </button>
        <ProgressIndicator total={QUESTIONS.length} current={step} />
        <div className="w-10" />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-10 sm:px-10">
        <QuestionCard
          key={question.id}
          question={question}
          value={answers[question.id] ?? ''}
          onChange={(value) => setAnswers((a) => ({ ...a, [question.id]: value }))}
        />
      </main>

      <footer className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-ink-line bg-ink/90 px-6 py-5 backdrop-blur-sm sm:px-10">
        <Button
          onClick={handleNext}
          disabled={!canAdvance}
          className="w-full sm:w-auto"
        >
          {isLast ? 'Generate Review' : 'Next'} <span aria-hidden>→</span>
        </Button>
      </footer>
    </div>
  )
}
