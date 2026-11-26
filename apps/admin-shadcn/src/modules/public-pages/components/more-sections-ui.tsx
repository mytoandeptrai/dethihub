'use client'
import { basePoints } from '@engine-pricing'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Accordion } from 'radix-ui'

import { LoadingRegion, CardGridSkeleton } from '@/components/page-skeleton'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-public'
import { Button, Link } from '@/modules/public-pages/components/public-primitives-ui'
import { homeFaq } from '@/modules/public-pages/home-faq'

import { SectionUi } from './section-ui'

import type { useHomeContainer } from '@/modules/public-pages/hooks'
const SAMPLES = [
  {
    tag: t('publicCopy.m107'),
    title: t('publicCopy.m78'),
    text: t('publicCopy.m108'),
    color: 'indigo',
  },
  {
    tag: t('publicCopy.m109'),
    title: t('publicCopy.m110'),
    text: t('publicCopy.m111'),
    color: 'lime',
  },
  {
    tag: t('publicCopy.m112'),
    title: t('publicCopy.m113'),
    text: t('publicCopy.m114'),
    color: 'slate',
  },
]
export function SamplesSectionUi() {
  return (
    <SectionUi
      id="de-mau"
      eyebrow={t('publicCopy.m115')}
      title={t('publicCopy.m116')}
      description={t('publicCopy.m117')}
    >
      <div className="home-samples">
        {SAMPLES.map((item) => (
          <Link to={appPaths.community.href} key={item.title} className="home-sample">
            <div className={`home-sample-cover home-cover-${item.color}`} aria-hidden="true">
              <FileText />
              <i />
              <i />
              <i />
              <span>{t('publicCopy.m118')}</span>
            </div>
            <div className="home-sample-copy">
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="home-text-link">
                {t('publicCopy.m119')}
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </SectionUi>
  )
}
export function PricingSectionUi({
  packs,
  pricingError,
}: Pick<ReturnType<typeof useHomeContainer>, 'packs' | 'pricingError'>) {
  return (
    <SectionUi
      id="chi-phi"
      eyebrow={t('publicCopy.m120')}
      title={t('publicCopy.m121')}
      description={t('publicCopy.m122')}
      tone="home-wash"
    >
      {pricingError && <p role="alert">{pricingError}</p>}
      <div className="home-pricing">
        <article className="home-price-free">
          <BookOpen className="size-6 text-indigo-600" aria-hidden="true" />
          <h3>{t('publicCopy.m123')}</h3>
          <strong>{t('publicCopy.m124')}</strong>
          <ul>
            {[t('publicCopy.m125'), t('publicCopy.m126'), t('publicCopy.m127')].map((item) => (
              <li key={item}>
                <Check aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline">
            <Link to={appPaths.editor.href}>
              {t('publicCopy.m128')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        </article>
        <article className="home-price-ai">
          <div className="home-price-ai-heading">
            <Sparkles aria-hidden="true" />
            <h3>{t('publicCopy.m129')}</h3>
          </div>
          <p>{t('publicCopy.m130')}</p>
          <div className="home-packs" aria-live="polite" aria-busy={packs === null}>
            {packs === null ? (
              <LoadingRegion>
                <CardGridSkeleton />
              </LoadingRegion>
            ) : packs.length === 0 ? (
              <p>{t('publicCopy.m132')}</p>
            ) : (
              <ul>
                {packs.map((pack) => (
                  <li key={pack.vnd}>
                    <span>
                      {pack.vnd.toLocaleString('vi-VN')}
                      <small>{t('publicCopy.m133')}</small>
                    </span>
                    <span>
                      {basePoints(pack.vnd).toLocaleString('vi-VN')}
                      {t('publicCopy.m134')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="home-price-note">{t('publicCopy.m135')}</p>
          <Button asChild className="bg-white text-indigo-700 shadow-none hover:bg-indigo-50">
            <Link to={appPaths.pricing.href}>
              {t('publicCopy.m136')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        </article>
      </div>
    </SectionUi>
  )
}
export function FaqSectionUi() {
  return (
    <SectionUi id="cau-hoi" eyebrow={t('publicCopy.m149')} title={t('publicCopy.m150')}>
      <Accordion.Root type="single" collapsible className="home-faq">
        {homeFaq.map((item, i) => (
          <Accordion.Item key={item.question} value={`faq-${i}`} className="home-faq-item">
            <Accordion.Header>
              <Accordion.Trigger className="home-faq-trigger">
                {item.question}
                <ChevronDown aria-hidden="true" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="home-faq-answer">
              <p>{item.answer}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </SectionUi>
  )
}
export function FinalCtaSectionUi() {
  return (
    <section className="home-container" aria-labelledby="home-final-title">
      <div className="home-final">
        <div>
          <p className="home-eyebrow">{t('publicCopy.m151')}</p>
          <h2 id="home-final-title">{t('publicCopy.m152')}</h2>
          <p>{t('publicCopy.m153')}</p>
        </div>
        <div className="home-actions">
          <Button
            asChild
            size="lg"
            className="bg-lime-300 text-slate-900 shadow-none hover:bg-lime-200"
          >
            <Link to={appPaths.editor.href}>
              {t('publicCopy.m5')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
          <Link to={appPaths.library.href} className="home-final-link">
            {t('publicCopy.m154')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
