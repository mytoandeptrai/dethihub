import { useEffect } from 'react'

import { ExamEditor, type ExamEditorProps } from '@/engine/examEditor/ExamEditor'

export function StudentExamEditor(props: ExamEditorProps) {
  useEffect(() => {
    document.documentElement.dataset.editorEngine = ''
    return () => {
      delete document.documentElement.dataset.editorEngine
    }
  }, [])
  return <ExamEditor {...props} />
}
