import type { CSSProperties } from 'react'
import type { Question } from '@/types'

interface QuestionCardProps {
  question: Question
  value: string
  onChange: (value: string) => void
}

/*
 * The `compact:` variants below are for when the on-screen keyboard is open:
 * the visible viewport drops to roughly 350–450px, and shrinking the emoji,
 * heading and padding keeps the question, the input and the Next button on
 * screen together. See `useKeyboardViewport` for what drives the variant.
 */
export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-6 compact:gap-3">
      <div className="flex items-start gap-4 compact:gap-3">
        <span
          className="animate-float text-5xl leading-none compact:text-3xl"
          aria-hidden
          style={{ '--rot': '-6deg' } as CSSProperties}
        >
          {question.emoji}
        </span>
        <div className="flex flex-col gap-1.5 pt-1">
          <h2 className="font-display text-2xl font-bold leading-tight text-cream sm:text-3xl compact:text-xl">
            {question.prompt}
          </h2>
          {question.helper && (
            <p className="text-sm text-cream/50 compact:hidden">
              {question.helper}
            </p>
          )}
        </div>
      </div>

      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-ink-line bg-ink-soft px-5 py-4 font-sans text-lg text-cream outline-none transition-colors placeholder:text-cream/25 focus:border-hotpink/60 focus:ring-2 focus:ring-hotpink/20 compact:rounded-xl compact:py-2.5 compact:text-base"
      />
    </div>
  )
}
