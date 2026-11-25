'use client'

import { Accordion } from '@base-ui/react/accordion'
import { useEffect, useRef } from 'react'

import { t } from '@/i18n/translate'
import { InspectorForm } from './inspector-form'

import type { ExamInspector } from '@/modules/exam-inspector/hooks/use-exam-inspector'

export function InspectorPanel({ inspector }: { inspector: ExamInspector }) {
  const root = useRef<HTMLDivElement>(null)
  const active = inspector.activeInspectorBlock?.id
  useEffect(() => {
    const item = root.current?.querySelector<HTMLElement>('[data-inspector-active="true"]')
    item?.scrollIntoView?.({ block: 'nearest', behavior: 'instant' })
  }, [active])
  return <div ref={root} className="nav-body min-h-0 overflow-y-auto p-3" data-testid="inspector-panel">
    {inspector.blocks.length === 0 && <p className="text-xs text-slate-500">{t('examInspectorCopy.noBlocks')}</p>}
    <Accordion.Root value={active ? [active] : []} onValueChange={(value) => { if (value[0]) inspector.activate(String(value[0])) }}>
    {inspector.blocks.map((block) => <Accordion.Item key={block.id} value={block.id} className="mb-2 rounded-lg border border-slate-200 bg-white px-2" data-testid={`inspector-item-${block.schema.id}`} data-inspector-active={active === block.id}>
      <Accordion.Header><Accordion.Trigger className="flex w-full min-w-0 flex-col gap-1 py-2 text-left text-xs hover:text-indigo-600">
        <span className="font-semibold">{block.schema.label}</span><span className="block max-w-full truncate text-[11px] font-normal text-slate-400">{block.node.textContent.slice(0, 70)}</span>
      </Accordion.Trigger></Accordion.Header>
      <Accordion.Panel><InspectorForm block={block} inspector={inspector} /></Accordion.Panel>
    </Accordion.Item>)}
    </Accordion.Root>
  </div>
}
