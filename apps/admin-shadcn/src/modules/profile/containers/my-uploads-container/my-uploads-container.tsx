'use client'
import {
  MyUploadsMyFilesCardUi,
  MyUploadsMyUploadsUi,
  MyUploadsStorageBarUi,
} from '@/modules/profile/components'
import { MyUploadsModel } from '@/modules/profile/hooks'
export function MyUploadsContainer(
  ...args: Parameters<typeof MyUploadsModel.useMyUploadsContainer>
) {
  const props = MyUploadsModel.useMyUploadsContainer(...args)
  return <MyUploadsMyUploadsUi {...props} parts={MyUploadsParts} />
}
export function StorageBarContainer(
  ...args: Parameters<typeof MyUploadsModel.useStorageBarContainer>
) {
  const props = MyUploadsModel.useStorageBarContainer(...args)
  return <MyUploadsStorageBarUi {...props} parts={MyUploadsParts} />
}
export function MyFilesCardContainer(
  ...args: Parameters<typeof MyUploadsModel.useMyFilesCardContainer>
) {
  const props = MyUploadsModel.useMyFilesCardContainer(...args)
  return <MyUploadsMyFilesCardUi {...props} parts={MyUploadsParts} />
}
export const MyUploadsParts = {
  MyUploads: MyUploadsContainer,
  StorageBar: StorageBarContainer,
  MyFilesCard: MyFilesCardContainer,
}
export default MyUploadsContainer
