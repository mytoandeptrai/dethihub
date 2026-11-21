export const VISION_READER = Symbol('VISION_READER')

export type VisionMode = 'text' | 'questions'

export interface VisionResult {
  content: string
  model: string
  /** Real tokens when the provider reported them, otherwise a high estimate */
  tokens: number
}

export interface VisionReaderPort {
  /** `images` are already validated data URLs; throws when no provider could read them */
  read(userId: string, images: string[], mode: VisionMode): Promise<VisionResult>
}
