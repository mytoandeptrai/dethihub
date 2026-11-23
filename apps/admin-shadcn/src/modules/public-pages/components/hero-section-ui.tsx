'use client'
import { ArrowRight, Globe, Printer } from 'lucide-react'

import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { Button, Link } from '@/modules/public-pages/components'

import { EditorIllustrationUi } from './illustrations-ui'
export function HeroSectionUi() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-mesh" aria-hidden="true" />
      <div className="home-container home-hero-grid">
        <div>
          <p className="home-eyebrow">
            <span className="home-dot" />
            {t('publicCopy.m1')}
          </p>
          <h1 id="home-title">
            {t('publicCopy.m2')}
            <br />
            <span>{t('publicCopy.m3')}</span>
          </h1>
          <p className="home-hero-description">{t('publicCopy.m4')}</p>
          <div className="home-actions">
            <Button asChild size="lg">
              <Link to={appPaths.editor.href}>
                {t('publicCopy.m5')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={appPaths.community.href}>{t('publicCopy.m6')}</Link>
            </Button>
          </div>
          <p className="home-trust">
            <Globe aria-hidden="true" />
            {t('publicCopy.m7')}
            <span aria-hidden="true">{t('publicCopy.m8')}</span>
            <Printer aria-hidden="true" />
            {t('publicCopy.m9')}
          </p>
        </div>
        <div className="home-product">
          <EditorIllustrationUi />
        </div>
      </div>
    </section>
  )
}
