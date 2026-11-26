'use client'
import {
  DbStatusCardDbStatusCardUi,
  DbStatusCardSgFlagUi,
} from '@/modules/admin-pages/components/db-status-card-ui'
import { DbStatusCardModel } from '@/modules/admin-pages/hooks'
export function SgFlagContainer(...args: Parameters<typeof DbStatusCardModel.useSgFlagContainer>) {
  const props = DbStatusCardModel.useSgFlagContainer(...args)
  return <DbStatusCardSgFlagUi {...props} parts={DbStatusCardParts} />
}
export function DbStatusCardContainer(
  ...args: Parameters<typeof DbStatusCardModel.useDbStatusCardContainer>
) {
  const props = DbStatusCardModel.useDbStatusCardContainer(...args)
  return <DbStatusCardDbStatusCardUi {...props} parts={DbStatusCardParts} />
}
export const DbStatusCardParts = { SgFlag: SgFlagContainer, DbStatusCard: DbStatusCardContainer }
export default DbStatusCardContainer
