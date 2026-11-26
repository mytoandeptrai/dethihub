'use client'
import { Suspense } from 'react'

import { MyExamsMenuItemUi, MyExamsUi, WorkspaceLoadingUi } from '@/modules/workspace/components'
import { MyExamsModel } from '@/modules/workspace/hooks'

function MyExamsContentContainer() {
  const props = MyExamsModel.useMyExamsContainer()
  return <MyExamsUi {...props} parts={MyExamsParts} />
}

export function MyExamsContainer() {
  return (
    <Suspense fallback={<WorkspaceLoadingUi />}>
      <MyExamsContentContainer />
    </Suspense>
  )
}

export function MenuItemContainer(...args: Parameters<typeof MyExamsModel.useMenuItemContainer>) {
  const props = MyExamsModel.useMenuItemContainer(...args)
  return <MyExamsMenuItemUi {...props} parts={MyExamsParts} />
}

export const MyExamsParts = { MyExams: MyExamsContainer, MenuItem: MenuItemContainer }
export default MyExamsContainer
