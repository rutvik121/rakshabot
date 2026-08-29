import { useCallback, useState } from 'react'
import { LandingScreen } from '@/screens/LandingScreen'
import { QuestionFlowScreen } from '@/screens/QuestionFlowScreen'
import { GenerationScreen } from '@/screens/GenerationScreen'
import { ReviewResultScreen } from '@/screens/ReviewResultScreen'
import { generateReview, toReviewData, type ReviewResult, type ReviewSource } from '@/lib/review'
import { TemplateGallery } from '@/dev/TemplateGallery'
import type { Answers, ReviewData, SiblingIdentity } from '@/types'

type Stage = 'landing' | 'questions' | 'generating' | 'result'

interface Submission {
  identity: SiblingIdentity
  answers: Answers
}

/*
 * Development-only template gallery. The output templates are a fixed-canvas
 * design problem best judged side by side at export width, so `?preview=all`
 * (or a single style, or `stress`) renders them directly. The flag is a
 * compile-time constant, so this branch and the gallery are eliminated from a
 * production build.
 */
function devPreview(): string | null {
  if (!import.meta.env.DEV) return null
  return new URLSearchParams(window.location.search).get('preview')
}

function App() {
  const preview = devPreview()
  // A wrapper, so the flow's hooks are never behind a condition.
  return preview ? <TemplateGallery which={preview} /> : <ReviewFlow />
}

function ReviewFlow() {

  const [stage, setStage] = useState<Stage>('landing')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [review, setReview] = useState<ReviewData | null>(null)
  const [source, setSource] = useState<ReviewSource>('ai')

  /*
   * Generation runs while the loading screen plays, and the screen only advances
   * once both the animation and the request have finished — so the wait always
   * feels deliberate rather than truncated or stalled.
   */
  const runGeneration = useCallback(async (): Promise<ReviewResult> => {
    if (!submission) throw new Error('No answers to generate from')
    const result = await generateReview({
      siblingName: submission.identity.name,
      answers: submission.answers,
    })
    setReview(toReviewData(result.review, submission.identity.photoUrl))
    setSource(result.source)
    return result
  }, [submission])

  switch (stage) {
    case 'landing':
      return <LandingScreen onStart={() => setStage('questions')} />

    case 'questions':
      return (
        <QuestionFlowScreen
          onExit={() => setStage('landing')}
          onComplete={(identity, answers) => {
            setSubmission({ identity, answers })
            setStage('generating')
          }}
        />
      )

    case 'generating':
      return (
        <GenerationScreen
          generate={runGeneration}
          onComplete={() => setStage('result')}
          onExit={() => {
            setSubmission(null)
            setReview(null)
            setStage('landing')
          }}
        />
      )

    case 'result':
      // The generation screen only advances once the review exists.
      return review ? (
        <ReviewResultScreen
          review={review}
          source={source}
          onRestart={() => {
            setSubmission(null)
            setReview(null)
            setStage('landing')
          }}
        />
      ) : null
  }
}

export default App
