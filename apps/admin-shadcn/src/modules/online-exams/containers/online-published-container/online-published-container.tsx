'use client'

import {
  OnlinePublishedBandsUi,
  OnlinePublishedIconBtnUi,
  OnlinePublishedOnlineResultsUi,
  OnlinePublishedPodiumUi,
  OnlinePublishedPublishedCardUi,
  OnlinePublishedPublishedPanelUi,
  OnlinePublishedStatUi,
} from '@/modules/online-exams/components'
import { OnlinePublishedModel } from '@/modules/online-exams/hooks'

export function PublishedPanelContainer(
  ...args: Parameters<typeof OnlinePublishedModel.usePublishedPanelContainer>
) {
  const props = OnlinePublishedModel.usePublishedPanelContainer(...args)
  return <OnlinePublishedPublishedPanelUi {...props} parts={OnlinePublishedParts} />
}

export function PublishedCardContainer(
  ...args: Parameters<typeof OnlinePublishedModel.usePublishedCardContainer>
) {
  const props = OnlinePublishedModel.usePublishedCardContainer(...args)
  return <OnlinePublishedPublishedCardUi {...props} parts={OnlinePublishedParts} />
}

export function IconBtnContainer(
  ...args: Parameters<typeof OnlinePublishedModel.useIconBtnContainer>
) {
  const props = OnlinePublishedModel.useIconBtnContainer(...args)
  return <OnlinePublishedIconBtnUi {...props} parts={OnlinePublishedParts} />
}

export function StatContainer(...args: Parameters<typeof OnlinePublishedModel.useStatContainer>) {
  const props = OnlinePublishedModel.useStatContainer(...args)
  return <OnlinePublishedStatUi {...props} parts={OnlinePublishedParts} />
}

export function BandsContainer(...args: Parameters<typeof OnlinePublishedModel.useBandsContainer>) {
  const props = OnlinePublishedModel.useBandsContainer(...args)
  return <OnlinePublishedBandsUi {...props} parts={OnlinePublishedParts} />
}

export function PodiumContainer(
  ...args: Parameters<typeof OnlinePublishedModel.usePodiumContainer>
) {
  const props = OnlinePublishedModel.usePodiumContainer(...args)
  return <OnlinePublishedPodiumUi {...props} parts={OnlinePublishedParts} />
}

export function OnlineResultsContainer(
  ...args: Parameters<typeof OnlinePublishedModel.useOnlineResultsContainer>
) {
  const props = OnlinePublishedModel.useOnlineResultsContainer(...args)
  return <OnlinePublishedOnlineResultsUi {...props} parts={OnlinePublishedParts} />
}

export const OnlinePublishedParts = {
  PublishedPanel: PublishedPanelContainer,
  PublishedCard: PublishedCardContainer,
  IconBtn: IconBtnContainer,
  Stat: StatContainer,
  Bands: BandsContainer,
  Podium: PodiumContainer,
  OnlineResults: OnlineResultsContainer,
}
export default OnlineResultsContainer
