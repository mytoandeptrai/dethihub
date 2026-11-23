'use client'
import {
  ExamViewDocViewUi,
  ExamViewReportExamButtonUi,
  ExamViewSaveMenuUi,
  ExamViewUi,
} from '@/modules/student-exams/components'
import { ExamViewModel } from '@/modules/student-exams/hooks'

export function ExamViewContainer(...args: Parameters<typeof ExamViewModel.useExamViewContainer>) {
  const props = ExamViewModel.useExamViewContainer(...args)
  return <ExamViewUi {...props} parts={ExamViewParts} />
}

export function SaveMenuContainer(...args: Parameters<typeof ExamViewModel.useSaveMenuContainer>) {
  const props = ExamViewModel.useSaveMenuContainer(...args)
  return <ExamViewSaveMenuUi {...props} parts={ExamViewParts} />
}

export function DocViewContainer(...args: Parameters<typeof ExamViewModel.useDocViewContainer>) {
  const props = ExamViewModel.useDocViewContainer(...args)
  return <ExamViewDocViewUi {...props} parts={ExamViewParts} />
}

export function ReportExamButtonContainer(
  ...args: Parameters<typeof ExamViewModel.useReportExamButtonContainer>
) {
  const props = ExamViewModel.useReportExamButtonContainer(...args)
  return <ExamViewReportExamButtonUi {...props} parts={ExamViewParts} />
}

export const ExamViewParts = {
  ExamView: ExamViewContainer,
  SaveMenu: SaveMenuContainer,
  DocView: DocViewContainer,
  ReportExamButton: ReportExamButtonContainer,
}
export default ExamViewContainer
