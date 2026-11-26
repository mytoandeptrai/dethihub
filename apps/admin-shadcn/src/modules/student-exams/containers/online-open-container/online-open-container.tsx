'use client'
import { OnlineOpenStudentFormUi, OnlineOpenUi } from '@/modules/student-exams/components'
import { OnlineOpenModel } from '@/modules/student-exams/hooks'

export function OnlineOpenContainer(
  ...args: Parameters<typeof OnlineOpenModel.useOnlineOpenContainer>
) {
  const props = OnlineOpenModel.useOnlineOpenContainer(...args)
  return <OnlineOpenUi {...props} parts={OnlineOpenParts} />
}

export function StudentFormContainer(
  ...args: Parameters<typeof OnlineOpenModel.useStudentFormContainer>
) {
  const props = OnlineOpenModel.useStudentFormContainer(...args)
  return <OnlineOpenStudentFormUi {...props} parts={OnlineOpenParts} />
}

export const OnlineOpenParts = {
  OnlineOpen: OnlineOpenContainer,
  StudentForm: StudentFormContainer,
}
export default OnlineOpenContainer
