'use client'
import {
  Bold,
  Check,
  FileText,
  GripVertical,
  Italic,
  LayoutTemplate,
  MoreHorizontal,
  MousePointer2,
  PenLine,
  Plus,
  Sigma,
  Sparkles,
} from 'lucide-react'

import { t } from '@/i18n/translate-public'
export function GraphIllustrationUi() {
  return (
    <svg
      width="300"
      height="140"
      viewBox="0 0 300 140"
      fill="none"
      aria-hidden="true"
      className="home-graph"
    >
      <path
        d="M20 112H280M150 130V8m-5 7 5-7 5 7m118 92 7 5-7 5"
        stroke="currentColor"
        opacity=".4"
      />
      <path d="M50 15Q150 207 250 15" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="150" cy="111" r="5" fill="#a3e635" stroke="#4f46e5" strokeWidth="2" />
    </svg>
  )
}
export function EditorIllustrationUi() {
  return (
    <figure className="home-editor" role="img" aria-label={t('publicCopy.m10')}>
      <div aria-hidden="true">
        <div className="home-window-bar">
          <span className="home-window-dots">
            <i />
            <i />
            <i />
          </span>
          <FileText size={13} />
          <span>{t('publicCopy.m11')}</span>
          <span className="home-window-state">
            <Check size={12} />
            {t('publicCopy.m12')}
          </span>
        </div>
        <div className="home-editor-stage">
          <div className="home-editor-rail">
            <span className="home-rail-active">
              <MousePointer2 />
            </span>
            <Plus />
            <Sigma />
            <PenLine />
            <LayoutTemplate />
          </div>
          <div className="home-floating-tools">
            <GripVertical />
            <span />
            <Bold />
            <Italic />
            <Sigma />
            <span />
            <MoreHorizontal />
          </div>
          <div className="home-paper">
            <div className="home-paper-kicker">{t('publicCopy.m13')}</div>
            <strong>{t('publicCopy.m14')}</strong>
            <p>{t('publicCopy.m15')}</p>
            <div className="home-paper-rule" />
            <b>{t('publicCopy.m16')}</b>
            <p>
              <b>{t('publicCopy.m17')}</b>
              {t('publicCopy.m18')}
            </p>
            <GraphIllustrationUi />
            <div className="home-answer-grid">
              <span>{t('publicCopy.m19')}</span>
              <span className="home-answer-selected">{t('publicCopy.m20')}</span>
              <span>{t('publicCopy.m21')}</span>
              <span>{t('publicCopy.m22')}</span>
            </div>
            <p>
              <b>{t('publicCopy.m23')}</b>
              {t('publicCopy.m24')}
            </p>
            <div className="home-equation">{t('publicCopy.m25')}</div>
            <div className="home-paper-lines">
              <i />
              <i />
            </div>
          </div>
          <div className="home-ai-note">
            <span>
              <Sparkles size={15} />
              {t('publicCopy.m26')}
            </span>
            <p>{t('publicCopy.m27')}</p>
            <div>
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
export function SlidesIllustrationUi() {
  return (
    <div className="home-slides" aria-hidden="true">
      <div className="home-slide-back" />
      <div className="home-slide-front">
        <small>{t('publicCopy.m28')}</small>
        <strong>
          {t('publicCopy.m29')}
          <br />
          {t('publicCopy.m30')}
        </strong>
        <div>
          <i />
          <i />
          <i />
        </div>
        <span>{t('publicCopy.m31')}</span>
      </div>
      <div className="home-board-note">
        <PenLine size={15} />
        {t('publicCopy.m32')}
      </div>
    </div>
  )
}
