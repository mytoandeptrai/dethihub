'use client'
import {
  CommunityExamCardUi,
  CommunityExamRowUi,
  CommunityKeyBadgeUi,
  CommunityPublishModalUi,
  CommunityUi,
  CommunityViewToggleUi,
} from '@/modules/community/components'
import { CommunityModel } from '@/modules/community/hooks'
export function CommunityContainer(
  ...args: Parameters<typeof CommunityModel.useCommunityContainer>
) {
  const props = CommunityModel.useCommunityContainer(...args)
  return <CommunityUi {...props} parts={CommunityParts} />
}
export function PublishModalContainer(
  ...args: Parameters<typeof CommunityModel.usePublishModalContainer>
) {
  const props = CommunityModel.usePublishModalContainer(...args)
  return <CommunityPublishModalUi {...props} parts={CommunityParts} />
}
export function ExamCardContainer(...args: Parameters<typeof CommunityModel.useExamCardContainer>) {
  const props = CommunityModel.useExamCardContainer(...args)
  return <CommunityExamCardUi {...props} parts={CommunityParts} />
}
export function KeyBadgeContainer(...args: Parameters<typeof CommunityModel.useKeyBadgeContainer>) {
  const props = CommunityModel.useKeyBadgeContainer(...args)
  return <CommunityKeyBadgeUi {...props} parts={CommunityParts} />
}
export function ExamRowContainer(...args: Parameters<typeof CommunityModel.useExamRowContainer>) {
  const props = CommunityModel.useExamRowContainer(...args)
  return <CommunityExamRowUi {...props} parts={CommunityParts} />
}
export function ViewToggleContainer(
  ...args: Parameters<typeof CommunityModel.useViewToggleContainer>
) {
  const props = CommunityModel.useViewToggleContainer(...args)
  return <CommunityViewToggleUi {...props} parts={CommunityParts} />
}
export const CommunityParts = {
  Community: CommunityContainer,
  PublishModal: PublishModalContainer,
  ExamCard: ExamCardContainer,
  KeyBadge: KeyBadgeContainer,
  ExamRow: ExamRowContainer,
  ViewToggle: ViewToggleContainer,
}
export default CommunityContainer
