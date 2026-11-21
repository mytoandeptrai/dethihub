export const FILE_EXTRACTOR = Symbol('FILE_EXTRACTOR')

export interface ExtractedFile {
  name: string
  kind: 'docx' | 'pdf' | 'xlsx' | 'pptx' | 'text' | 'unsupported'
  text: string
  /** .pptx only: text of each slide, in order */
  slides?: string[]
  /** .docx with `marks` only: embedded images as data URLs, referenced from the text by U+E002<index>U+E003 */
  images?: string[]
  warning?: string
}

export interface FileExtractorPort {
  /** Never throws on a bad file: the failure comes back as kind `unsupported` with a Vietnamese warning */
  extract(name: string, data: Buffer, marks: boolean): Promise<ExtractedFile>
}
