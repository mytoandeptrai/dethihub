'use client'
import { store_app_useApp as useApp, useNavigate } from '@workspace-engine'
import { useState } from 'react'

import { appPaths } from '@/config/app-paths'
import { useClientReady, usePaged } from '@/hooks'
export function useMyExamsContainer() {
  const navigate = useNavigate()
  const storedExams = useApp((s) => s.myExams)
  const ready = useClientReady()
  const myExams = ready ? storedExams : []
  const paged = usePaged(myExams, 12)
  const duplicateExam = useApp((s) => s.duplicateExam)
  const deleteExam = useApp((s) => s.deleteExam)
  const toggleShared = useApp((s) => s.toggleShared)
  const setDraft = useApp((s) => s.setDraft)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const actionsFor = (exam: (typeof myExams)[number]) => ({
    remove: () => {
      deleteExam(exam.id)
      setConfirmDelete(null)
    },
    edit: () => {
      setDraft(exam)
      navigate(appPaths.editor.href)
    },
    quiz: () => {
      setMenuFor(null)
      navigate(appPaths.quiz.getHref(exam.id))
    },
    duplicate: () => {
      duplicateExam(exam.id)
      setMenuFor(null)
    },
    share: () => {
      toggleShared(exam.id)
      setMenuFor(null)
    },
    requestDelete: () => {
      setConfirmDelete(exam.id)
      setMenuFor(null)
    },
  })
  if (myExams.length === 0) {
    return { viewState: 0 as const }
  }
  return {
    viewState: 1 as const,
    myExams,
    paged,
    confirmDelete,
    setConfirmDelete,
    menuFor,
    setMenuFor,
    actionsFor,
  }
}
export function useMenuItemContainer({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return { viewState: 0 as const, onClick, danger, icon, children }
}
