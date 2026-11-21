import { MAX_COLS, MAX_ROWS } from '@/modules/media/infrastructure/extractors/text'

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.text === 'string') return v.text
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((part) =>
          part && typeof part === 'object' ? String((part as { text?: unknown }).text ?? '') : '',
        )
        .join('')
    }
    if (v.result !== null && v.result !== undefined) return String(v.result)
    if (typeof v.hyperlink === 'string' && typeof v.text === 'string') return v.text
  }
  return ''
}

export async function extractXlsx(data: Buffer): Promise<string> {
  // exceljs is CommonJS; the default export depends on the runtime.
  const mod = await import('exceljs')
  const ExcelJS: any = (mod as unknown as { default?: any }).default ?? mod
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(data)
  const out: string[] = []
  wb.eachSheet((ws: any) => {
    out.push(`## ${ws.name}`)
    let rows = 0
    ws.eachRow((row: any) => {
      if (rows++ >= MAX_ROWS) return
      const values = (row.values as unknown[]).slice(1, MAX_COLS + 1)
      const line = values
        .map((cell) => cellText(cell))
        .join(' | ')
        .trim()
      if (line) out.push(line)
    })
  })
  return out.join('\n')
}
