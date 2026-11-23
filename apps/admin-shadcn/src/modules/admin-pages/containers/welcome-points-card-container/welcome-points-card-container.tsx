'use client'
import { WelcomePointsCardWelcomePointsCardUi } from '@/modules/admin-pages/components'
import { WelcomePointsCardModel } from '@/modules/admin-pages/hooks'
export function WelcomePointsCardContainer(
  ...args: Parameters<typeof WelcomePointsCardModel.useWelcomePointsCardContainer>
) {
  const props = WelcomePointsCardModel.useWelcomePointsCardContainer(...args)
  return <WelcomePointsCardWelcomePointsCardUi {...props} parts={WelcomePointsCardParts} />
}
export const WelcomePointsCardParts = { WelcomePointsCard: WelcomePointsCardContainer }
export default WelcomePointsCardContainer
