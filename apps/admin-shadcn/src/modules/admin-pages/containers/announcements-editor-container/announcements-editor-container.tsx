'use client'
import { AnnouncementsEditorAnnouncementsEditorUi } from '@/modules/admin-pages/components/announcements-editor-ui'
import { AnnouncementsEditorModel } from '@/modules/admin-pages/hooks'
export function AnnouncementsEditorContainer(
  ...args: Parameters<typeof AnnouncementsEditorModel.useAnnouncementsEditorContainer>
) {
  const props = AnnouncementsEditorModel.useAnnouncementsEditorContainer(...args)
  return <AnnouncementsEditorAnnouncementsEditorUi {...props} parts={AnnouncementsEditorParts} />
}
export const AnnouncementsEditorParts = { AnnouncementsEditor: AnnouncementsEditorContainer }
export default AnnouncementsEditorContainer
