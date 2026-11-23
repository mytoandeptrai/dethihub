'use client'
import {
  ContentPanelContentPanelUi,
  ContentPanelDocsTabUi,
  ContentPanelExamDrawerUi,
  ContentPanelExamsTabUi,
  ContentPanelFeedbackTabUi,
  ContentPanelReportsTabUi,
} from '@/modules/admin-pages/components'
import { ContentPanelModel } from '@/modules/admin-pages/hooks'
export function ContentPanelContainer(
  ...args: Parameters<typeof ContentPanelModel.useContentPanelContainer>
) {
  const props = ContentPanelModel.useContentPanelContainer(...args)
  return <ContentPanelContentPanelUi {...props} parts={ContentPanelParts} />
}
export function ExamsTabContainer(
  ...args: Parameters<typeof ContentPanelModel.useExamsTabContainer>
) {
  const props = ContentPanelModel.useExamsTabContainer(...args)
  return <ContentPanelExamsTabUi {...props} parts={ContentPanelParts} />
}
export function ExamDrawerContainer(
  ...args: Parameters<typeof ContentPanelModel.useExamDrawerContainer>
) {
  const props = ContentPanelModel.useExamDrawerContainer(...args)
  return <ContentPanelExamDrawerUi {...props} parts={ContentPanelParts} />
}
export function ReportsTabContainer(
  ...args: Parameters<typeof ContentPanelModel.useReportsTabContainer>
) {
  const props = ContentPanelModel.useReportsTabContainer(...args)
  return <ContentPanelReportsTabUi {...props} parts={ContentPanelParts} />
}
export function DocsTabContainer(
  ...args: Parameters<typeof ContentPanelModel.useDocsTabContainer>
) {
  const props = ContentPanelModel.useDocsTabContainer(...args)
  return <ContentPanelDocsTabUi {...props} parts={ContentPanelParts} />
}
export function FeedbackTabContainer(
  ...args: Parameters<typeof ContentPanelModel.useFeedbackTabContainer>
) {
  const props = ContentPanelModel.useFeedbackTabContainer(...args)
  return <ContentPanelFeedbackTabUi {...props} parts={ContentPanelParts} />
}
export const ContentPanelParts = {
  ContentPanel: ContentPanelContainer,
  ExamsTab: ExamsTabContainer,
  ExamDrawer: ExamDrawerContainer,
  ReportsTab: ReportsTabContainer,
  DocsTab: DocsTabContainer,
  FeedbackTab: FeedbackTabContainer,
}
export default ContentPanelContainer
