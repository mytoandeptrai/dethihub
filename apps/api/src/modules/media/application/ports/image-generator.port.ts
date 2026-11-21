export const IMAGE_GENERATOR = Symbol('IMAGE_GENERATOR')

export interface GeneratedImage {
  buffer: Buffer
  mime: string
}

/** No image provider has a key */
export class ImageProviderNotConfiguredError extends Error {}

export interface ImageGeneratorPort {
  /** Tries each configured provider in turn; throws when none is configured or all of them fail */
  generate(prompt: string): Promise<GeneratedImage>
}
