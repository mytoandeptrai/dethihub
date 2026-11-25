'use client'

import { useEffect, useState } from 'react'

import { useSite } from '@/apis/site'

export function useEditorContainer() {
  const [ready, setReady] = useState(false)
  useSite()
  useEffect(() => {
    document.documentElement.dataset.editorEngine = ''
    setReady(true)
    return () => {
      delete document.documentElement.dataset.editorEngine
    }
  }, [])
  return { ready }
}
