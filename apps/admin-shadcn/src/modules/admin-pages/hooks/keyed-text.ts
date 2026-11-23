export function keyedText(lines: string[]) {
  const occurrences = new Map<string, number>()
  return lines.map((value) => {
    const occurrence = occurrences.get(value) ?? 0
    occurrences.set(value, occurrence + 1)
    return { key: `${value}:${occurrence}`, value }
  })
}
