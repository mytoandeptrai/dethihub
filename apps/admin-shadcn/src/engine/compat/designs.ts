import { SLIDE_DESIGNS, buildDesignSlides, designTheme } from '@/engine/lib/slideDesigns'
import { ensureFonts } from '@/engine/lib/slideFonts'
import { skinById } from '@/engine/lib/slideSkins'
import { normalizeTheme } from '@/engine/lib/slideTheme'

export { SlideThumb } from '@/engine/examEditor/SlideEditor'

export async function loadDesignRows() {
  await Promise.all(
    SLIDE_DESIGNS.map((design) => ensureFonts({ theme: designTheme(design), slides: [] })),
  )
  return SLIDE_DESIGNS.map((design) => {
    const theme = normalizeTheme(designTheme(design))
    const slides = buildDesignSlides(design, theme)
    return {
      design,
      skin: skinById(design.id),
      theme,
      slide1: slides[0],
      slide3: slides[2],
      slideClosing: slides[slides.length - 1],
    }
  })
}
