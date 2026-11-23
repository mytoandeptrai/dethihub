'use client'
import { Suspense } from 'react'

import { MyDocsFilterSelectUi, MyDocsItemMenuUi, MyDocsUi, WorkspaceLoadingUi } from '@/modules/workspace/components'
import { MyDocsModel } from '@/modules/workspace/hooks'

export function FilterSelectContainer(
  ...args: Parameters<typeof MyDocsModel.useFilterSelectContainer>
) {
  const props = MyDocsModel.useFilterSelectContainer(...args)
  return <MyDocsFilterSelectUi {...props} parts={MyDocsParts} />
}

export function ItemMenuContainer(...args: Parameters<typeof MyDocsModel.useItemMenuContainer>) {
  const props = MyDocsModel.useItemMenuContainer(...args)
  return <MyDocsItemMenuUi {...props} parts={MyDocsParts} />
}

function MyDocsContentContainer() {
  const props = MyDocsModel.useMyDocsContainer()
  return <MyDocsUi {...props} parts={MyDocsParts} />
}

export function MyDocsContainer() {
  return (
    <Suspense fallback={<WorkspaceLoadingUi />}>
      <MyDocsContentContainer />
    </Suspense>
  )
}

export const MyDocsParts = {
  FilterSelect: FilterSelectContainer,
  ItemMenu: ItemMenuContainer,
  MyDocs: MyDocsContainer,
}
export default MyDocsContainer
