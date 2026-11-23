'use client'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { Card, ContactLinks, Link, PageHeader, PageShell } from '@/modules/public-pages/components'
const UPDATED = '18/11/2026'
type Block = string | string[] | 'contact'
type SectionUi = {
  h: string
  b: Block[]
}
const PRIVACY_INTRO = t('publicCopy.m155')
const PRIVACY: SectionUi[] = [
  {
    h: t('publicCopy.m156'),
    b: [
      t('publicCopy.m157'),
      [
        t('publicCopy.m158'),
        t('publicCopy.m159'),
        t('publicCopy.m160'),
        t('publicCopy.m161'),
        t('publicCopy.m162'),
      ],
    ],
  },
  {
    h: t('publicCopy.m163'),
    b: [
      [
        t('publicCopy.m164'),
        t('publicCopy.m165'),
        t('publicCopy.m166'),
        t('publicCopy.m167'),
        t('publicCopy.m168'),
      ],
      t('publicCopy.m169'),
    ],
  },
  {
    h: t('publicCopy.m170'),
    b: [t('publicCopy.m171'), t('publicCopy.m172')],
  },
  {
    h: t('publicCopy.m173'),
    b: [t('publicCopy.m174'), t('publicCopy.m175'), t('publicCopy.m176')],
  },
  {
    h: t('publicCopy.m177'),
    b: [
      [
        t('publicCopy.m178'),
        t('publicCopy.m179'),
        t('publicCopy.m180'),
        t('publicCopy.m181'),
        t('publicCopy.m182'),
      ],
      t('publicCopy.m183'),
    ],
  },
  {
    h: t('publicCopy.m184'),
    b: [t('publicCopy.m185'), t('publicCopy.m186')],
  },
  {
    h: t('publicCopy.m187'),
    b: [t('publicCopy.m188'), t('publicCopy.m189')],
  },
  {
    h: t('publicCopy.m190'),
    b: [t('publicCopy.m191')],
  },
  {
    h: t('publicCopy.m192'),
    b: [t('publicCopy.m193'), 'contact'],
  },
]
const TERMS_INTRO = t('publicCopy.m194')
const TERMS: SectionUi[] = [
  {
    h: t('publicCopy.m195'),
    b: [t('publicCopy.m196'), 'contact'],
  },
  {
    h: t('publicCopy.m197'),
    b: [t('publicCopy.m198')],
  },
  {
    h: t('publicCopy.m199'),
    b: [t('publicCopy.m200')],
  },
  {
    h: t('publicCopy.m201'),
    b: [
      t('publicCopy.m202'),
      [t('publicCopy.m203'), t('publicCopy.m204'), t('publicCopy.m205'), t('publicCopy.m206')],
    ],
  },
  {
    h: t('publicCopy.m207'),
    b: [[t('publicCopy.m208'), t('publicCopy.m209'), t('publicCopy.m210'), t('publicCopy.m211')]],
  },
  {
    h: t('publicCopy.m212'),
    b: [t('publicCopy.m213'), t('publicCopy.m214')],
  },
  {
    h: t('publicCopy.m215'),
    b: [
      t('publicCopy.m216'),
      [
        t('publicCopy.m217'),
        t('publicCopy.m218'),
        t('publicCopy.m219'),
        t('publicCopy.m220'),
        t('publicCopy.m221'),
      ],
      t('publicCopy.m222'),
    ],
  },
  {
    h: t('publicCopy.m223'),
    b: [
      [
        t('publicCopy.m224'),
        t('publicCopy.m225'),
        t('publicCopy.m226'),
        t('publicCopy.m227'),
        t('publicCopy.m228'),
      ],
    ],
  },
  {
    h: t('publicCopy.m229'),
    b: [
      [t('publicCopy.m230'), t('publicCopy.m231')],
      t('publicCopy.m232'),
      [t('publicCopy.m233'), t('publicCopy.m234'), t('publicCopy.m235'), t('publicCopy.m236')],
      t('publicCopy.m237'),
    ],
  },
  {
    h: t('publicCopy.m238'),
    b: [t('publicCopy.m239'), t('publicCopy.m240'), t('publicCopy.m241')],
  },
  {
    h: t('publicCopy.m242'),
    b: [t('publicCopy.m243')],
  },
  {
    h: t('publicCopy.m244'),
    b: [
      t('publicCopy.m245'),
      [t('publicCopy.m246'), t('publicCopy.m247'), t('publicCopy.m248'), t('publicCopy.m249')],
      t('publicCopy.m250'),
      [t('publicCopy.m251'), t('publicCopy.m252'), t('publicCopy.m253')],
    ],
  },
  {
    h: t('publicCopy.m254'),
    b: [
      t('publicCopy.m255'),
      [t('publicCopy.m256'), t('publicCopy.m257'), t('publicCopy.m258')],
      t('publicCopy.m259'),
      [t('publicCopy.m260'), t('publicCopy.m261'), t('publicCopy.m262'), t('publicCopy.m263')],
      t('publicCopy.m264'),
    ],
  },
  {
    h: t('publicCopy.m265'),
    b: [t('publicCopy.m266')],
  },
]
export default function LegalUi({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy'
  const sections = privacy ? PRIVACY : TERMS
  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <>
            {t('publicCopy.m267')}
            {UPDATED}
          </>
        }
        title={privacy ? t('publicCopy.m268') : t('publicCopy.m269')}
        description={privacy ? PRIVACY_INTRO : TERMS_INTRO}
      />
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label={t('publicCopy.m270')}
          className="border-line bg-surface hidden max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-xl border p-3 lg:sticky lg:top-24 lg:block"
        >
          <ol className="space-y-1">
            {sections.map((s, i) => (
              <li key={s.h}>
                <a
                  href={`#section-${i + 1}`}
                  className="text-caption text-ink-3 hover:bg-sunken hover:text-ink block rounded-lg px-3 py-2 leading-relaxed transition-colors"
                >
                  {s.h}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <Card asChild className="min-w-0 rounded-xl p-5 break-words sm:p-8">
          <article>
            <div className="space-y-8">
              {sections.map((s, index) => (
                <section key={s.h} id={`section-${index + 1}`} className="scroll-mt-24">
                  <h2 className="border-line font-display text-subtitle text-ink mb-3 border-b pb-3 font-semibold">
                    {s.h}
                  </h2>
                  <div className="text-ink-2 space-y-2 text-[14.5px] leading-[1.75]">
                    {s.b.map((block) =>
                      block === 'contact' ? (
                        <ContactLinks key="contact" className="pt-1 text-[14px]" />
                      ) : Array.isArray(block) ? (
                        <ul
                          key={block.join('|')}
                          className="marker:text-ink-4 list-disc space-y-1 pl-5"
                        >
                          {block.map((text) => (
                            <li key={text}>{text}</li>
                          ))}
                        </ul>
                      ) : (
                        <p key={block}>{block}</p>
                      ),
                    )}
                  </div>
                </section>
              ))}
            </div>
            <p className="text-ink-3 mt-10 text-[14px]">
              <Link
                to={privacy ? appPaths.terms.href : appPaths.privacy.href}
                className="text-clay font-semibold hover:underline"
              >
                {privacy ? t('publicCopy.m269') : t('publicCopy.m268')}
              </Link>
            </p>
          </article>
        </Card>
      </div>
    </PageShell>
  )
}
