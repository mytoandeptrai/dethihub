'use client'

import { Suspense } from 'react'

import { SkeletonCard } from '@/components/product-ui'
import { OnlineListItemCardUi, OnlineListOnlineListUi } from '@/modules/online-exams/components'
import { PublishedPanelContainer } from '@/modules/online-exams/containers/online-published-container'
import { OnlineListModel } from '@/modules/online-exams/hooks'

function OnlineListContent() {
  const props = OnlineListModel.useOnlineListContainer()
  return <OnlineListOnlineListUi {...props} parts={OnlineListParts} />
}
export function OnlineListContainer() {
  return (
    <Suspense fallback={<SkeletonCard variant="exam" />}>
      <OnlineListContent />
    </Suspense>
  )
}

export function ItemCardContainer(
  ...args: Parameters<typeof OnlineListModel.useItemCardContainer>
) {
  const props = OnlineListModel.useItemCardContainer(...args)
  return <OnlineListItemCardUi {...props} parts={OnlineListParts} />
}

export const OnlineListParts = {
  OnlineList: OnlineListContainer,
  ItemCard: ItemCardContainer,
  PublishedPanel: PublishedPanelContainer,
}
export default OnlineListContainer
