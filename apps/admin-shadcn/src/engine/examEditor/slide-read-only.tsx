import { useImperativeHandle, useMemo, useState, type Ref } from 'react'

import { PrintDeck } from '@/engine/examEditor/SlideEditor'
import { SlideThumb } from '@/engine/examEditor/slideRender'
import { normalizeTheme } from '@/engine/lib/slideTheme'

import type { SlideEditorActions } from '@/engine/examEditor/SlideEditor'
import type { Deck } from '@/engine/store/docs'

export function SlideReadOnly({
  deck,
  actionsRef,
}: {
  deck: Deck
  actionsRef?: Ref<SlideEditorActions>
}) {
  const theme = useMemo(() => normalizeTheme(deck.theme), [deck.theme])
  const [printing, setPrinting] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [index, setIndex] = useState(0)
  useImperativeHandle(
    actionsRef,
    () => ({
      present: () => setPresenting(true),
      exportPptx: () =>
        import('@/engine/lib/exportDeck').then((module) => module.exportDeckPptx(deck)),
      exportPdf: () => setPrinting(true),
    }),
    [deck],
  )
  return (
    <div className="slide-editor min-h-0 flex-1 overflow-auto p-4" aria-label="Slide chỉ xem">
      {presenting && (
        <div
          role="dialog"
          aria-label="Trình chiếu"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-4"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setPresenting(false)
          }}
        >
          <div className="w-full max-w-6xl">
            {deck.slides[index] && (
              <SlideThumb
                slide={deck.slides[index]}
                theme={theme}
                footer={deck.footer}
                slideIndex={index}
              />
            )}
          </div>
          <div className="flex gap-4 p-3 text-white">
            <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Trước
            </button>
            <button
              type="button"
              disabled={index >= deck.slides.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Tiếp
            </button>
            <button type="button" autoFocus onClick={() => setPresenting(false)}>
              Đóng trình chiếu
            </button>
          </div>
        </div>
      )}
      {printing && (
        <PrintDeck
          slides={deck.slides}
          theme={theme}
          footer={deck.footer}
          onDone={() => setPrinting(false)}
        />
      )}
      <div className="mx-auto max-w-5xl space-y-6">
        {deck.slides.map((slide, index) => (
          <div key={slide.id}>
            <SlideThumb slide={slide} theme={theme} footer={deck.footer} slideIndex={index} />
          </div>
        ))}
      </div>
    </div>
  )
}
