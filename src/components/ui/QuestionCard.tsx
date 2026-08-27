import type { CSSProperties } from 'react'
import type { Question } from '@/types'

interface QuestionCardProps {
  question: Question
  value: string
  onChange: (value: string) => void
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span
          className="animate-float text-5xl leading-none"
          aria-hidden
          style={{ '--rot': '-6deg' } as CSSProperties}
        >
          {question.emoji}
        </span>
        <div className="flex flex-col gap-1.5 pt-1">
          <h2 className="font-display text-2xl font-bold leading-tight text-cream sm:text-3xl">
            {question.prompt}
          </h2>
          {question.helper && <p className="text-sm text-cream/50">{question.helper}</p>}
        </div>
      </div>

      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-ink-line bg-ink-soft px-5 py-4 font-sans text-lg text-cream placeholder:text-cream/25 outline-none transition-colors focus:border-hotpink/60 focus:ring-2 focus:ring-hotpink/20"
      />
    </div>
  )
}
