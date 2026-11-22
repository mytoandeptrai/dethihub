export const IMAGE_GENERATOR = Symbol('IMAGE_GENERATOR')

export interface GeneratedImage {
  buffer: Buffer
  mime: string
}

/** The picture plus the model that drew it */
export interface ProducedImage extends GeneratedImage {
  model: string
}

/** No image provider has a key */
export class ImageProviderNotConfiguredError extends Error {}

export interface ImageGeneratorPort {
  /** Tries each configured provider in turn; throws when none is configured or all of them fail */
  generate(prompt: string): Promise<ProducedImage>
}
