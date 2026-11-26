'use client'
import {
  ProfileAdminCardUi,
  ProfileCreditCardUi,
  ProfileCreditHistoryUi,
  ProfileEditCardUi,
  ProfileIdentityCardUi,
  ProfileProfilePageUi,
  ProfileProfileUi,
} from '@/modules/profile/components'
import { ProfileModel } from '@/modules/profile/hooks'
export function ProfileContainer(...args: Parameters<typeof ProfileModel.useProfileContainer>) {
  const props = ProfileModel.useProfileContainer(...args)
  return <ProfileProfileUi {...props} parts={ProfileParts} />
}
export function ProfilePageContainer(
  ...args: Parameters<typeof ProfileModel.useProfilePageContainer>
) {
  const props = ProfileModel.useProfilePageContainer(...args)
  return <ProfileProfilePageUi {...props} parts={ProfileParts} />
}
export function AdminCardContainer(...args: Parameters<typeof ProfileModel.useAdminCardContainer>) {
  const props = ProfileModel.useAdminCardContainer(...args)
  return <ProfileAdminCardUi {...props} parts={ProfileParts} />
}
export function IdentityCardContainer(
  ...args: Parameters<typeof ProfileModel.useIdentityCardContainer>
) {
  const props = ProfileModel.useIdentityCardContainer(...args)
  return <ProfileIdentityCardUi {...props} parts={ProfileParts} />
}
export function EditCardContainer(...args: Parameters<typeof ProfileModel.useEditCardContainer>) {
  const props = ProfileModel.useEditCardContainer(...args)
  return <ProfileEditCardUi {...props} parts={ProfileParts} />
}
export function CreditCardContainer(
  ...args: Parameters<typeof ProfileModel.useCreditCardContainer>
) {
  const props = ProfileModel.useCreditCardContainer(...args)
  return <ProfileCreditCardUi {...props} parts={ProfileParts} />
}
export function CreditHistoryContainer(
  ...args: Parameters<typeof ProfileModel.useCreditHistoryContainer>
) {
  const props = ProfileModel.useCreditHistoryContainer(...args)
  return <ProfileCreditHistoryUi {...props} parts={ProfileParts} />
}
export const ProfileParts = {
  Profile: ProfileContainer,
  ProfilePage: ProfilePageContainer,
  AdminCard: AdminCardContainer,
  IdentityCard: IdentityCardContainer,
  EditCard: EditCardContainer,
  CreditCard: CreditCardContainer,
  CreditHistory: CreditHistoryContainer,
}
export default ProfileContainer
