import type { StyledReview } from '@/lib/review/styles'
import { CaseFileCard } from './CaseFileCard'
import { AwardsNightCard } from './AwardsNightCard'
import { SiblingWrappedCard } from './SiblingWrappedCard'
import { ScrapbookCard } from './ScrapbookCard'
import { StockReportCard } from './StockReportCard'
import { CharacterStatsCard } from './CharacterStatsCard'

/**
 * Renders whichever universe the model chose.
 *
 * The switch is exhaustive over the discriminated union, so adding a seventh
 * style is a type error here until its card exists — the renderer can never
 * silently fall through to a default that shows the wrong artifact.
 */
export function ResultCard({ review, photoUrl }: { review: StyledReview; photoUrl?: string }) {
  switch (review.style) {
    case 'CASE_FILE':
      return <CaseFileCard review={review} photoUrl={photoUrl} />
    case 'AWARDS_NIGHT':
      return <AwardsNightCard review={review} photoUrl={photoUrl} />
    case 'SIBLING_WRAPPED':
      return <SiblingWrappedCard review={review} photoUrl={photoUrl} />
    case 'SCRAPBOOK':
      return <ScrapbookCard review={review} photoUrl={photoUrl} />
    case 'STOCK_REPORT':
      return <StockReportCard review={review} photoUrl={photoUrl} />
    case 'CHARACTER_STATS':
      return <CharacterStatsCard review={review} photoUrl={photoUrl} />
  }
}
