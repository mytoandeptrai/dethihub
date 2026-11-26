'use client'
import {
  LibraryDocGridUi,
  LibraryDocumentCardUi,
  LibraryDocumentsUi,
  LibrarySignInPromptUi,
  LibraryUi,
} from '@/modules/library/components'
import { LibraryModel } from '@/modules/library/hooks'
export function LibraryContainer(...args: Parameters<typeof LibraryModel.useLibraryContainer>) {
  const props = LibraryModel.useLibraryContainer(...args)
  return <LibraryUi {...props} parts={LibraryParts} />
}
export function SignInPromptContainer(
  ...args: Parameters<typeof LibraryModel.useSignInPromptContainer>
) {
  const props = LibraryModel.useSignInPromptContainer(...args)
  return <LibrarySignInPromptUi {...props} parts={LibraryParts} />
}
export function DocumentsContainer(...args: Parameters<typeof LibraryModel.useDocumentsContainer>) {
  const props = LibraryModel.useDocumentsContainer(...args)
  return <LibraryDocumentsUi {...props} parts={LibraryParts} />
}
export function DocGridContainer(...args: Parameters<typeof LibraryModel.useDocGridContainer>) {
  const props = LibraryModel.useDocGridContainer(...args)
  return <LibraryDocGridUi {...props} parts={LibraryParts} />
}
export function DocumentCardContainer(
  ...args: Parameters<typeof LibraryModel.useDocumentCardContainer>
) {
  const props = LibraryModel.useDocumentCardContainer(...args)
  return <LibraryDocumentCardUi {...props} parts={LibraryParts} />
}
export const LibraryParts = {
  Library: LibraryContainer,
  SignInPrompt: SignInPromptContainer,
  Documents: DocumentsContainer,
  DocGrid: DocGridContainer,
  DocumentCard: DocumentCardContainer,
}
export default LibraryContainer
