export const USER_IMAGE_REPOSITORY = Symbol('USER_IMAGE_REPOSITORY')

export type ReserveImageResult = { created: boolean } | { violation: string }

export interface UserImageRepositoryPort {
  /** `created: false` means the owner already has this image, so nothing is counted again */
  reserve(
    ownerId: string,
    key: string,
    size: number,
    check: (used: number, size: number) => string | null,
  ): Promise<ReserveImageResult>
  release(ownerId: string, key: string): Promise<void>
}
