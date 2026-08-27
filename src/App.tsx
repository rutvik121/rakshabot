import { useState } from 'react'
import { LandingScreen } from '@/screens/LandingScreen'
import { QuestionFlowScreen } from '@/screens/QuestionFlowScreen'
import { GenerationScreen } from '@/screens/GenerationScreen'
import { ReviewResultScreen } from '@/screens/ReviewResultScreen'
import { SAMPLE_REVIEW, buildReview } from '@/data/mockData'
import type { ReviewData } from '@/types'

type Stage = 'landing' | 'questions' | 'generating' | 'result'

function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [review, setReview] = useState<ReviewData>(SAMPLE_REVIEW)

  switch (stage) {
    case 'landing':
      return <LandingScreen onStart={() => setStage('questions')} />

    case 'questions':
      return (
        <QuestionFlowScreen
          onExit={() => setStage('landing')}
          onComplete={(identity) => {
            // Answers will drive the generated prose later; for now the
            // sibling's name and photo are what personalise the poster.
            setReview(buildReview(identity))
            setStage('generating')
          }}
        />
      )

    case 'generating':
      return <GenerationScreen onComplete={() => setStage('result')} />

    case 'result':
      return <ReviewResultScreen review={review} onRestart={() => setStage('landing')} />
  }
}

export default App
