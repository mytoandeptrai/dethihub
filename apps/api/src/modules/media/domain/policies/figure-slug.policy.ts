const STYLE =
  "black and white line art, clean bold outlines, no shading, no color, no background, no text, centered, children's textbook illustration style, coloring book style, entire object fully visible with generous margin"

/** "Red Apple" → "red-apple"; anything else (digits, symbols, too long) → null */
export function figureSlug(name: unknown): string | null {
  if (typeof name !== 'string') return null
  const words = name.trim().toLowerCase()
  if (!/^[a-z][a-z -]{1,39}$/.test(words)) return null
  const slug = words.replaceAll(/[\s-]+/g, '-').replaceAll(/^-|-$/g, '')
  return slug.length >= 2 ? slug : null
}

export const figureKey = (slug: string): string => `fig/${slug}.png`

export const figureUrl = (slug: string): string => `/api/files/${figureKey(slug)}`

/** Built from the slug alone, so every caller gets the same kind of picture */
export const figurePrompt = (slug: string): string =>
  `A single ${slug.replaceAll('-', ' ')}, ${STYLE}`
