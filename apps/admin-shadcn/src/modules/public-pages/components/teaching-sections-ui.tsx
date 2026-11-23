'use client'
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  FileCheck2,
  FileText,
  Image,
  Layers,
  PenLine,
  Send,
  Sigma,
  Sparkles,
} from 'lucide-react'

import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { Link, Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/public-pages/components/public-primitives-ui'

import { GraphIllustrationUi, SlidesIllustrationUi } from './illustrations-ui'
import { SectionUi } from './section-ui'
export function FeaturesSectionUi() {
  return (
    <SectionUi id="cong-cu" eyebrow={t('publicCopy.m33')} title={t('publicCopy.m34')}>
      <div className="home-bento">
        <article className="home-tile home-tile-wide home-tile-document">
          <div className="home-tile-icon">
            <FileText />
          </div>
          <h3>{t('publicCopy.m35')}</h3>
          <p>{t('publicCopy.m36')}</p>
          <div className="home-bank-preview" aria-hidden="true">
            <div>
              <BookOpen size={16} />
              <b>{t('publicCopy.m37')}</b>
              <span>{t('publicCopy.m38')}</span>
            </div>
            <p>
              <span className="home-tiny-check">
                <Check size={12} />
              </span>
              {t('publicCopy.m39')}
              <span>{t('publicCopy.m40')}</span>
            </p>
            <p>
              <span className="home-tiny-check">
                <Check size={12} />
              </span>
              {t('publicCopy.m41')}
              <span>{t('publicCopy.m42')}</span>
            </p>
          </div>
        </article>
        <article className="home-tile home-tile-math">
          <div className="home-tile-icon">
            <Sigma />
          </div>
          <h3>{t('publicCopy.m43')}</h3>
          <p>{t('publicCopy.m44')}</p>
          <div className="home-formula" aria-hidden="true">
            <span>{t('publicCopy.m45')}</span>
            <span className="home-fraction">
              <span>
                {t('publicCopy.m46')}
                <span className="home-radicand">{t('publicCopy.m47')}</span>
              </span>
              <span>{t('publicCopy.m48')}</span>
            </span>
          </div>
        </article>
        <article className="home-tile">
          <div className="home-tile-icon">
            <PenLine />
          </div>
          <h3>{t('publicCopy.m49')}</h3>
          <p>{t('publicCopy.m50')}</p>
          <div className="home-graph-preview">
            <GraphIllustrationUi />
          </div>
        </article>
        <article className="home-tile home-tile-slides">
          <div className="home-tile-icon">
            <Layers />
          </div>
          <h3>{t('publicCopy.m51')}</h3>
          <p>{t('publicCopy.m52')}</p>
          <SlidesIllustrationUi />
        </article>
        <article className="home-tile">
          <div className="home-tile-icon">
            <CheckCheck />
          </div>
          <h3>{t('publicCopy.m53')}</h3>
          <p>{t('publicCopy.m54')}</p>
          <div className="home-grading-preview" aria-hidden="true">
            <span>{t('publicCopy.m55')}</span>
            <span className="home-correct-answer">
              {t('publicCopy.m56')}
              <Check size={12} />
            </span>
            <span>{t('publicCopy.m57')}</span>
            <span>{t('publicCopy.m58')}</span>
          </div>
          <Link className="home-text-link" to={appPaths.grading.href}>
            <Image size={15} aria-hidden="true" />
            {t('publicCopy.m59')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </article>
        <article className="home-tile home-tile-ai">
          <div className="home-tile-icon">
            <Sparkles />
          </div>
          <div>
            <h3>{t('publicCopy.m60')}</h3>
            <p>{t('publicCopy.m61')}</p>
          </div>
          <span className="home-ai-label">{t('publicCopy.m62')}</span>
        </article>
      </div>
    </SectionUi>
  )
}
const STEPS = [
  { icon: PenLine, title: t('publicCopy.m63'), text: t('publicCopy.m64') },
  { icon: Send, title: t('publicCopy.m65'), text: t('publicCopy.m66') },
  { icon: FileCheck2, title: t('publicCopy.m67'), text: t('publicCopy.m68') },
]
export function WorkflowSectionUi() {
  return (
    <SectionUi
      id="cach-dung"
      eyebrow={t('publicCopy.m69')}
      title={t('publicCopy.m70')}
      tone="home-wash"
    >
      <ol className="home-steps">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <div className="home-step-number">
              {t('publicCopy.m71')}
              {i + 1}
              <step.icon aria-hidden="true" />
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </SectionUi>
  )
}
const AUDIENCES = [
  {
    id: 'school',
    label: t('publicCopy.m72'),
    title: t('publicCopy.m73'),
    bullets: [t('publicCopy.m74'), t('publicCopy.m75'), t('publicCopy.m76')],
    subject: t('publicCopy.m77'),
    document: t('publicCopy.m78'),
    notes: [t('publicCopy.m79'), t('publicCopy.m80'), t('publicCopy.m81')],
  },
  {
    id: 'university',
    label: t('publicCopy.m82'),
    title: t('publicCopy.m83'),
    bullets: [t('publicCopy.m84'), t('publicCopy.m85'), t('publicCopy.m86')],
    subject: t('publicCopy.m87'),
    document: t('publicCopy.m88'),
    notes: [t('publicCopy.m89'), t('publicCopy.m90'), t('publicCopy.m91')],
  },
  {
    id: 'center',
    label: t('publicCopy.m92'),
    title: t('publicCopy.m93'),
    bullets: [t('publicCopy.m94'), t('publicCopy.m95'), t('publicCopy.m96')],
    subject: t('publicCopy.m97'),
    document: t('publicCopy.m98'),
    notes: [t('publicCopy.m99'), t('publicCopy.m100'), t('publicCopy.m101')],
  },
]
export function AudienceSectionUi() {
  return (
    <SectionUi id="danh-cho-ai" eyebrow={t('publicCopy.m102')} title={t('publicCopy.m103')}>
      <Tabs defaultValue="school" className="home-audiences">
        <TabsList aria-label={t('publicCopy.m104')} className="home-audience-tabs">
          {AUDIENCES.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {AUDIENCES.map((item) => (
          <TabsContent key={item.id} value={item.id} className="home-audience-panel">
            <div>
              <h3>{item.title}</h3>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>
                    <Check aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <Link to={appPaths.editor.href} className="home-text-link">
                {t('publicCopy.m105')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div
              className={`home-audience-art home-audience-${item.id}`}
              role="img"
              aria-label={t('publicCopy.m106', { value0: item.document })}
            >
              <div aria-hidden="true">
                <span className="home-art-label">{item.subject}</span>
                <strong>{item.document}</strong>
                {item.notes.map((note) => (
                  <p key={note}>
                    <FileText size={15} />
                    {note}
                    <span>
                      <Check size={13} />
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </SectionUi>
  )
}
