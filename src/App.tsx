import { useState } from 'react'
import { LandingScreen } from '@/screens/LandingScreen'
import { QuestionFlowScreen } from '@/screens/QuestionFlowScreen'
import { GenerationScreen } from '@/screens/GenerationScreen'
import { ReviewResultScreen } from '@/screens/ReviewResultScreen'
import { SAMPLE_REVIEW } from '@/data/mockData'
import type { Answers } from '@/types'

type Stage = 'landing' | 'questions' | 'generating' | 'result'

function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [, setAnswers] = useState<Answers>({})

  switch (stage) {
    case 'landing':
      return <LandingScreen onStart={() => setStage('questions')} />

    case 'questions':
      return (
        <QuestionFlowScreen
          onExit={() => setStage('landing')}
          onComplete={(collected) => {
            setAnswers(collected)
            setStage('generating')
          }}
        />
      )

    case 'generating':
      return <GenerationScreen onComplete={() => setStage('result')} />

    case 'result':
      return (
        <ReviewResultScreen review={SAMPLE_REVIEW} onRestart={() => setStage('landing')} />
      )
  }
}

export default App
