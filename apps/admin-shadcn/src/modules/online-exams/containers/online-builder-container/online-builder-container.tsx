'use client'

import {
  OnlineBuilderExamPreviewUi,
  OnlineBuilderIconBtnUi,
  OnlineBuilderOnlineBuilderUi,
  OnlineBuilderQuestionEditorUi,
  OnlineBuilderToggleUi,
} from '@/modules/online-exams/components'
import { OnlineBuilderModel } from '@/modules/online-exams/hooks'

export function OnlineBuilderContainer(
  ...args: Parameters<typeof OnlineBuilderModel.useOnlineBuilderContainer>
) {
  const props = OnlineBuilderModel.useOnlineBuilderContainer(...args)
  return <OnlineBuilderOnlineBuilderUi {...props} parts={OnlineBuilderParts} />
}

export function ExamPreviewContainer(
  ...args: Parameters<typeof OnlineBuilderModel.useExamPreviewContainer>
) {
  const props = OnlineBuilderModel.useExamPreviewContainer(...args)
  return <OnlineBuilderExamPreviewUi {...props} parts={OnlineBuilderParts} />
}

export function ToggleContainer(...args: Parameters<typeof OnlineBuilderModel.useToggleContainer>) {
  const props = OnlineBuilderModel.useToggleContainer(...args)
  return <OnlineBuilderToggleUi {...props} parts={OnlineBuilderParts} />
}

export function IconBtnContainer(
  ...args: Parameters<typeof OnlineBuilderModel.useIconBtnContainer>
) {
  const props = OnlineBuilderModel.useIconBtnContainer(...args)
  return <OnlineBuilderIconBtnUi {...props} parts={OnlineBuilderParts} />
}

export function QuestionEditorContainer(
  ...args: Parameters<typeof OnlineBuilderModel.useQuestionEditorContainer>
) {
  const props = OnlineBuilderModel.useQuestionEditorContainer(...args)
  return <OnlineBuilderQuestionEditorUi {...props} parts={OnlineBuilderParts} />
}

export const OnlineBuilderParts = {
  OnlineBuilder: OnlineBuilderContainer,
  ExamPreview: ExamPreviewContainer,
  Toggle: ToggleContainer,
  IconBtn: IconBtnContainer,
  QuestionEditor: QuestionEditorContainer,
}
export default OnlineBuilderContainer
