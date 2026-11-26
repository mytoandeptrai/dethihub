import { TooltipLayer } from '@/engine/components/Tooltip'
import ComposeDoc from '@/engine/pages/ComposeDoc'

export { prepareAiApplication } from '@/engine/examEditor/aiApplication'

export default function EditorRoot() {
  return (
    <>
      <ComposeDoc />
      <TooltipLayer />
    </>
  )
}
