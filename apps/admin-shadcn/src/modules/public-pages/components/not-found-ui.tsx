'use client'
import { BookOpen, Home } from 'lucide-react'

import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate'
import { Button, Card, Link } from '@/modules/public-pages/components/public-primitives-ui'
import { PageHeader, PageShell } from '@/modules/public-pages/components/page-header-ui'

import type { CSSProperties } from 'react'
const OPTIONS = [
  { key: 'A', text: t('publicCopy.m271'), delay: 280 },
  { key: 'B', text: t('publicCopy.m272'), delay: 360 },
  { key: 'C', text: t('publicCopy.m273'), delay: 440 },
  { key: 'D', text: t('publicCopy.m274'), delay: 520 },
] as const
function delayStyle(ms: number, dur?: number): CSSProperties {
  return {
    '--nf-d': `${ms}ms`,
    ...(dur === undefined ? {} : { '--nf-dur': `${dur}ms` }),
  } as CSSProperties
}
export default function NotFoundUi({ requestedPath }: { requestedPath: string }) {
  return (
    <PageShell className="flex min-h-[calc(100dvh-69px)] flex-col">
      <div className="my-auto grid w-full min-w-0 items-center gap-7 sm:gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="nf-paper mx-auto w-full max-w-[520px] min-w-0 lg:mx-0">
          <Card className="nf-float relative rounded-xl p-5 sm:p-7">
            <div className="border-line flex items-start justify-between gap-3 border-b pb-3.5">
              <p className="eyebrow pt-1.5 leading-snug">{t('publicCopy.m276')}</p>

              <svg
                viewBox="0 0 96 46"
                className="text-clay -mt-1 -mr-1 h-auto w-[clamp(72px,17vw,98px)] shrink-0 -rotate-6"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M 19 6 C 15 12, 11 17, 7 22 C 13 21.5, 20 21, 27 21 M 21.5 11 C 20.5 18, 19.8 25, 19 32"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={3.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nf-draw"
                  style={delayStyle(1520, 160)}
                />
                <path
                  d="M 47 8 C 38 8, 34 15, 35 23 C 36 30, 44 32, 51 28 C 57 24, 57 12, 49 8 C 46 7, 43 8, 42 10"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={3.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nf-draw"
                  style={delayStyle(1650, 170)}
                />
                <path
                  d="M 77 5 C 73 11, 69 16, 65 21 C 72 20.5, 79 20, 87 20 M 80 10 C 79.2 17, 78.6 24, 78 31"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={3.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nf-draw"
                  style={delayStyle(1780, 160)}
                />
                <path
                  d="M 8 38 C 33 35.5, 63 34.5, 87 36.5"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  className="nf-draw"
                  style={delayStyle(1900, 180)}
                />
              </svg>
            </div>

            <div className="mt-4 sm:mt-5">
              <p
                className="nf-step text-ink text-[15px] leading-relaxed sm:text-[16px]"
                style={delayStyle(180)}
              >
                <strong className="font-display text-ink font-bold">{t('publicCopy.m277')}</strong>{' '}
                <span>{t('publicCopy.m278')}</span>
              </p>

              <ul className="text-ink-2 mt-3.5 space-y-2.5 text-[14.5px] leading-snug sm:mt-4 sm:space-y-3 sm:text-[15px]">
                {OPTIONS.map((opt) => {
                  const picked = opt.key === 'D'
                  return (
                    <li
                      key={opt.key}
                      className="nf-step flex min-w-0 items-baseline gap-2.5"
                      style={delayStyle(opt.delay)}
                    >
                      <span
                        className={
                          picked
                            ? 'text-clay relative inline-flex shrink-0 items-center justify-center font-semibold'
                            : 'text-ink inline-flex shrink-0 font-semibold'
                        }
                      >
                        {opt.key}
                        {t('publicCopy.m279')}
                        {picked && (
                          <svg
                            viewBox="0 0 46 36"
                            className="text-clay pointer-events-none absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+16px)] overflow-visible"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M 30 6 C 18 3, 5 9, 4 19 C 3 29, 16 33, 29 31 C 41 29, 44 19, 40 11 C 37 6, 27 5, 20 8"
                              pathLength={1}
                              stroke="currentColor"
                              strokeWidth={2.3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="nf-draw"
                              style={delayStyle(820, 550)}
                            />
                          </svg>
                        )}
                      </span>
                      <span className={picked ? 'text-ink min-w-0 font-medium' : 'min-w-0'}>
                        {opt.text}
                      </span>
                      {picked && (
                        <svg
                          viewBox="0 0 32 24"
                          className="text-clay ml-0.5 h-[1.15em] w-auto shrink-0 self-center overflow-visible"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M 4 13 C 7 15.5, 10 18.5, 11.5 20 C 16 14, 21.5 8.5, 28 4"
                            pathLength={1}
                            stroke="currentColor"
                            strokeWidth={2.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="nf-draw"
                            style={delayStyle(1320, 240)}
                          />
                        </svg>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>
        </div>

        <div
          className="nf-step mx-auto w-full max-w-[520px] min-w-0 text-center lg:mx-0 lg:text-left"
          style={delayStyle(180)}
        >
          <PageHeader
            title={t('publicCopy.m280')}
            description={t('publicCopy.m281')}
            className="mb-0"
          />

          <div className="mt-4 flex justify-center lg:justify-start">
            <p className="border-line bg-sunken/70 text-ink-3 inline-flex max-w-full min-w-0 items-center rounded-[6px] border px-3 py-1.5 font-mono text-[12.5px]">
              <span className="truncate">{requestedPath}</span>
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Link to={appPaths.home.href} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="min-h-11 w-full sm:w-auto">
                <Home className="size-4" />
                {t('publicCopy.m282')}
              </Button>
            </Link>
            <Link to={appPaths.community.href} className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="min-h-11 w-full sm:w-auto">
                <BookOpen className="size-4" />
                {t('publicCopy.m283')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
