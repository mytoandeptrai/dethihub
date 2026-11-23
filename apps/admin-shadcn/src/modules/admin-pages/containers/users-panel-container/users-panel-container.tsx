'use client'
import {
  UsersPanelGrantCreditsModalUi,
  UsersPanelStorageSectionUi,
  UsersPanelUserAvatarUi,
  UsersPanelUserAvatarWithPresenceUi,
  UsersPanelUserDetailDrawerUi,
  UsersPanelUsersPanelUi,
} from '@/modules/admin-pages/components'
import { UsersPanelModel } from '@/modules/admin-pages/hooks'
export function UsersPanelContainer(
  ...args: Parameters<typeof UsersPanelModel.useUsersPanelContainer>
) {
  const props = UsersPanelModel.useUsersPanelContainer(...args)
  return <UsersPanelUsersPanelUi {...props} parts={UsersPanelParts} />
}
export function UserDetailDrawerContainer(
  ...args: Parameters<typeof UsersPanelModel.useUserDetailDrawerContainer>
) {
  const props = UsersPanelModel.useUserDetailDrawerContainer(...args)
  return <UsersPanelUserDetailDrawerUi {...props} parts={UsersPanelParts} />
}
export function GrantCreditsModalContainer(
  ...args: Parameters<typeof UsersPanelModel.useGrantCreditsModalContainer>
) {
  const props = UsersPanelModel.useGrantCreditsModalContainer(...args)
  return <UsersPanelGrantCreditsModalUi {...props} parts={UsersPanelParts} />
}
export function UserAvatarContainer(
  ...args: Parameters<typeof UsersPanelModel.useUserAvatarContainer>
) {
  const props = UsersPanelModel.useUserAvatarContainer(...args)
  return <UsersPanelUserAvatarUi {...props} parts={UsersPanelParts} />
}
export function UserAvatarWithPresenceContainer(
  ...args: Parameters<typeof UsersPanelModel.useUserAvatarWithPresenceContainer>
) {
  const props = UsersPanelModel.useUserAvatarWithPresenceContainer(...args)
  return <UsersPanelUserAvatarWithPresenceUi {...props} parts={UsersPanelParts} />
}
export function StorageSectionContainer(
  ...args: Parameters<typeof UsersPanelModel.useStorageSectionContainer>
) {
  const props = UsersPanelModel.useStorageSectionContainer(...args)
  return <UsersPanelStorageSectionUi {...props} parts={UsersPanelParts} />
}
export const UsersPanelParts = {
  UsersPanel: UsersPanelContainer,
  UserDetailDrawer: UserDetailDrawerContainer,
  GrantCreditsModal: GrantCreditsModalContainer,
  UserAvatar: UserAvatarContainer,
  UserAvatarWithPresence: UserAvatarWithPresenceContainer,
  StorageSection: StorageSectionContainer,
}
export default UsersPanelContainer
