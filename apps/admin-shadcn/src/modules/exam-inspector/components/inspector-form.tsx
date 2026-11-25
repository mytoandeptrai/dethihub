'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'

import { t } from '@/i18n/translate'
import type { ExamInspector, InspectorBlock } from '@/modules/exam-inspector/hooks/use-exam-inspector'
import type { InspectorField } from '@/modules/exam-inspector/lib/block-registry'
import type { Control, UseFormReturn } from 'react-hook-form'

type Values = Record<string, unknown>
const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

function defaultItem(fields: InspectorField[]): Values {
  return Object.fromEntries(fields.map((field) => [field.key, field.kind === 'list' ? [] : field.kind === 'number' ? 1 : field.kind === 'select' ? field.options?.[0]?.value ?? '' : '']))
}

function nextLabel(items: Values[], sequence: 'upper' | 'lower') {
  const labels = new Set(items.map((item) => sequence === 'lower' ? String(item.label).toLowerCase() : String(item.label)))
  for (let index = 1; ; index++) {
    let number = index
    let label = ''
    while (number > 0) {
      number--
      label = String.fromCharCode(65 + number % 26) + label
      number = Math.floor(number / 26)
    }
    if (sequence === 'lower') label = label.toLowerCase()
    if (!labels.has(label)) return label
  }
}

function ListField({ metadata, path }: { metadata: InspectorField; path: string }) {
  const { control, getValues } = useFormContext<Values>()
  const { fields, append, remove } = useFieldArray<Record<string, Record<string, unknown>[]>>({ control: control as unknown as Control<Record<string, Record<string, unknown>[]>>, name: path })
  const add = () => {
    const item = defaultItem(metadata.fields ?? [])
    if (metadata.labelSequence) item.label = nextLabel(getValues(path) as Values[], metadata.labelSequence)
    append(item)
  }
  return <fieldset className="min-w-0 space-y-2 rounded-md border border-slate-200 p-2">
    <legend className="px-1 text-xs font-medium text-slate-600">{metadata.label}</legend>
    {fields.map((item, index) => <div key={item.id} className="space-y-2 border-b border-slate-100 pb-2 last:border-0">
      <div className="flex justify-between text-[11px] text-slate-500"><span>{t('examInspectorCopy.item', { number: index + 1 })}</span>{!metadata.fixedLength && <button type="button" disabled={fields.length <= (metadata.minItems ?? 0)} onClick={() => remove(index)} className="text-indigo-600 disabled:text-slate-300">{t('examInspectorCopy.remove')}</button>}</div>
      {metadata.fields?.map((child) => <SchemaField key={child.key} metadata={child} path={`${path}.${index}.${child.key}`} />)}
    </div>)}
    {!metadata.fixedLength && <button type="button" className="text-xs font-medium text-indigo-600" onClick={add}>{t('examInspectorCopy.add')}</button>}
  </fieldset>
}

function SchemaField({ metadata, path }: { metadata: InspectorField; path: string }) {
  const { control } = useFormContext<Values>()
  if (metadata.kind === 'list') return <ListField metadata={metadata} path={path} />
  return <Controller control={control} name={path} render={({ field, fieldState }) => <label className="block space-y-1 text-xs text-slate-600">
    <span>{metadata.label}</span>
    {metadata.kind === 'select' ? <select {...field} value={String(field.value ?? '')} data-testid={`inspector-field-${path}`} className={inputClass} onChange={(event) => field.onChange(metadata.options?.find((option) => String(option.value) === event.target.value)?.value)}>
      {metadata.options?.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
    </select> : metadata.kind === 'textarea' ? <textarea {...field} value={String(field.value ?? '')} rows={3} data-testid={`inspector-field-${path}`} className={inputClass} /> : <input {...field} value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''} type={metadata.kind === 'number' ? 'number' : 'text'} data-testid={`inspector-field-${path}`} className={inputClass} onChange={(event) => field.onChange(metadata.kind === 'number' ? event.target.value === '' ? null : Number(event.target.value) : event.target.value)} />}
    {fieldState.error && <span role="alert" className="text-red-600">{t('examInspectorCopy.invalid')}</span>}
  </label>} />
}

function synchronize(form: UseFormReturn<Values>, next: Values, focused?: string) {
  const visit = (value: unknown, path: string) => {
    if (path === focused) return
    if (Array.isArray(value)) {
      const current = form.getValues(path)
      if (Array.isArray(current) && current.length === value.length) { value.forEach((item, index) => visit(item, `${path}.${index}`)); return }
      if (focused?.startsWith(`${path}.`)) return
    } else if (value !== null && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) visit(child, path ? `${path}.${key}` : key)
      return
    }
    form.setValue(path, value, { shouldDirty: false, shouldValidate: false })
  }
  for (const [key, value] of Object.entries(next)) visit(value, key)
}

export function InspectorForm({ block, inspector }: { block: InspectorBlock; inspector: ExamInspector }) {
  const form = useForm<Values>({ resolver: zodResolver(block.schema.schema), defaultValues: block.schema.read(block.node), mode: 'onChange' })
  const root = useRef<HTMLFormElement>(null)
  const synchronizing = useRef(false)
  const previousSchema = useRef(block.schema)
  const latest = useRef({ inspector, block })
  latest.current = { inspector, block }
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (synchronizing.current || !name) return
      const parsed = latest.current.block.schema.schema.safeParse(values)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) form.setError(issue.path.join('.') || 'root.schema', { type: 'schema', message: issue.message })
        return
      }
      form.clearErrors()
      latest.current.inspector.writeValues(latest.current.block.id, values, name)
    })
    return () => subscription.unsubscribe()
  }, [form])
  useEffect(() => {
    const schemaChanged = previousSchema.current !== block.schema
    previousSchema.current = block.schema
    if (!schemaChanged && inspector.origin === 'form') return
    const active = document.activeElement
    const focused = inspector.origin !== 'history' && root.current?.contains(active) && active instanceof HTMLElement ? active.getAttribute('name') ?? undefined : undefined
    synchronizing.current = true
    try {
      if (schemaChanged) {
        for (const key of Object.keys(form.getValues())) if (!(key in block.schema.schema.shape)) form.unregister(key)
        form.clearErrors()
      }
      synchronize(form, block.schema.read(block.node), focused)
    } finally { synchronizing.current = false }
  }, [block.node, block.schema, form, inspector.origin, inspector.revision])
  if (block.schema.fields.length === 0) return <p className="py-3 text-xs text-slate-500">{t('examInspectorCopy.empty')}</p>
  return <FormProvider {...form}><form ref={root} onSubmit={(event) => event.preventDefault()} className="space-y-3 py-3" onKeyDownCapture={(event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); inspector.undo(event.shiftKey) }
  }} onBlur={() => { requestAnimationFrame(() => { if (root.current && !root.current.contains(document.activeElement)) { synchronizing.current = true; try { synchronize(form, latest.current.block.schema.read(latest.current.block.node)) } finally { synchronizing.current = false } } }) }}>
    {form.formState.errors.root && <p role="alert" className="text-xs text-red-600">{t('examInspectorCopy.invalid')}</p>}
    {block.schema.fields.map((metadata) => <SchemaField key={metadata.key} metadata={metadata} path={metadata.key} />)}
  </form></FormProvider>
}
