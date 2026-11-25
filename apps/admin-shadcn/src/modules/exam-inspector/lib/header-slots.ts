import { children, newTextNode, withChildren, withText } from './node-slots'

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export interface HeaderValues {
  soGiaoDuc: string
  tenTruong: string
  loaiDe: string
  maDe: string
  kyThi: string
  namHoc: string
  monThi: string
  thoiGian: number | null
}

const CODE = /^\s*Mã\s*đề\s*:?\s*/iu
const SUBJECT = /^\s*Môn(?:\s+thi)?\s*:\s*/iu
const MINUTES = /(\d+)\s*phút/iu

function leftLines(node: ProseMirrorNode) {
  return children(node.child(0)).filter((line) => !CODE.test(line.textContent))
}

export function readHeader(node: ProseMirrorNode): HeaderValues {
  const left = leftLines(node)
  const right = children(node.child(1))
  const duration = right[3]?.textContent.match(MINUTES)
  return {
    soGiaoDuc: left[0]?.textContent ?? '',
    tenTruong: left[1]?.textContent ?? '',
    loaiDe: left[2]?.textContent ?? '',
    maDe:
      children(node.child(0))
        .find((line) => CODE.test(line.textContent))
        ?.textContent.replace(CODE, '') ?? '',
    kyThi: right[0]?.textContent ?? '',
    namHoc: right[1]?.textContent ?? '',
    monThi: right[2]?.textContent.replace(SUBJECT, '') ?? '',
    thoiGian: duration ? Number(duration[1]) : null,
  }
}

function updateLines(column: ProseMirrorNode, values: string[]): ProseMirrorNode {
  const lines = children(column)
  for (const [index, value] of values.entries()) {
    if (!lines[index] && !value) continue
    while (lines.length <= index) lines.push(newTextNode(column, 'paragraph', ''))
    lines[index] = withText(lines[index]!, value)
  }
  return withChildren(column, lines)
}

export function writeHeader(node: ProseMirrorNode, values: HeaderValues): ProseMirrorNode {
  const previous = readHeader(node)
  const originalLeft = node.child(0)
  const codeIndex = children(originalLeft).findIndex((line) => CODE.test(line.textContent))
  let left = updateLines(withChildren(originalLeft, leftLines(node)), [
    values.soGiaoDuc,
    values.tenTruong,
    values.loaiDe,
  ])
  if (codeIndex >= 0 || values.maDe) {
    const code = codeIndex >= 0 ? originalLeft.child(codeIndex) : newTextNode(node, 'paragraph', '')
    const line = values.maDe === previous.maDe ? code : withText(code, `Mã đề: ${values.maDe}`)
    const lines = children(left)
    while (lines.length < 3) lines.push(newTextNode(node, 'paragraph', ''))
    lines.splice(codeIndex >= 0 ? Math.min(codeIndex, lines.length) : 3, 0, line)
    children(originalLeft).forEach((extra, index) => {
      if (index > codeIndex && CODE.test(extra.textContent)) lines.splice(Math.min(index, lines.length), 0, extra)
    })
    left = withChildren(left, lines)
  }
  const right = node.child(1)
  const subject = right.maybeChild(2)?.textContent ?? ''
  const duration = right.maybeChild(3)?.textContent ?? ''
  const subjectText =
    values.monThi === previous.monThi
      ? subject
      : `${subject.match(SUBJECT)?.[0] ?? 'Môn thi: '}${values.monThi}`
  let durationText = duration
  if (values.thoiGian !== previous.thoiGian) {
    durationText =
      values.thoiGian === null
        ? ''
        : MINUTES.test(duration)
          ? duration.replace(MINUTES, `${values.thoiGian} phút`)
          : `Thời gian làm bài: ${values.thoiGian} phút`
  }
  return withChildren(node, [
    left,
    updateLines(right, [values.kyThi, values.namHoc, subjectText, durationText]),
  ])
}
