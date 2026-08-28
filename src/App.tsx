import { useCallback, useState } from 'react'
import { LandingScreen } from '@/screens/LandingScreen'
import { QuestionFlowScreen } from '@/screens/QuestionFlowScreen'
import { GenerationScreen } from '@/screens/GenerationScreen'
import { ReviewResultScreen } from '@/screens/ReviewResultScreen'
import { generateReview, toReviewData, type ReviewResult } from '@/lib/review'
import type { Answers, ReviewData, SiblingIdentity } from '@/types'

type Stage = 'landing' | 'questions' | 'generating' | 'result'

interface Submission {
  identity: SiblingIdentity
  answers: Answers
}

function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [review, setReview] = useState<ReviewData | null>(null)

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
