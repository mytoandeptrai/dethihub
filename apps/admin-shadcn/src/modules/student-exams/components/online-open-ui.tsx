'use client'
import { Link } from '@student-engine'
import { AlertCircle, ArrowRight, CheckCircle2, LogIn } from 'lucide-react'

import { PageSkeleton } from '@/components/page-skeleton'
import {
  SiteButton as Button,
  Card,
  EmptyState,
  Field,
  inputClass,
  PageHeader,
  PageShell,
  SiteSelect,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-student'

import type {
  OnlineOpenParts as Imported0,
  OnlineOpenParts as Imported1,
} from '@/modules/student-exams/containers/online-open-container/online-open-container'
import type { OnlineOpenModel } from '@/modules/student-exams/hooks'

export function OnlineOpenUi(
  props: ReturnType<typeof OnlineOpenModel.useOnlineOpenContainer> & {
    parts: typeof Imported0
  },
) {
  const { StudentForm } = props.parts
  if (props.viewState === 0) {
    const { done, error } = props
    return (
      <PageShell className="max-w-[760px] py-8 lg:py-12">
        <EmptyState
          icon={
            done ? (
              <CheckCircle2 className="size-6" strokeWidth={1.6} />
            ) : (
              <AlertCircle className="size-6" strokeWidth={1.6} />
            )
          }
          title={done ? t('studentCopy.m283') : t('studentCopy.m284')}
          description={done ? t('studentCopy.m285') : error!}
          action={
            <Link to={appPaths.home.href}>
              <Button variant="primary">{t('studentCopy.m286')}</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }
  if (props.viewState === 1) {
    const { loginHref } = props
    return (
      <PageShell className="max-w-[760px] py-8 lg:py-12">
        <EmptyState
          icon={<LogIn className="size-6" strokeWidth={1.6} />}
          title={t('studentCopy.m287')}
          description={t('studentCopy.m288')}
          action={
            <Link to={loginHref}>
              <Button variant="primary">{t('studentCopy.m107')}</Button>
            </Link>
          }
        />
      </PageShell>
    )
  }
  if (props.viewState === 2) {
    const { exam, onStudentStart } = props
    return <StudentForm exam={exam} onStart={onStudentStart} />
  }
  if (props.viewState === 3) return <PageSkeleton variant="form" />
  return null
}
export function OnlineOpenStudentFormUi(
  props: ReturnType<typeof OnlineOpenModel.useStudentFormContainer> & {
    parts: typeof Imported1
  },
) {
  if (props.viewState === 0) {
    const {
      exam,
      submit,
      roster,
      rosterIdx,
      name,
      setName,
      className,
      setClassName,
      seat,
      setSeat,
      err,
    } = props
    return (
      <PageShell className="max-w-[760px] py-8 lg:py-12">
        <PageHeader eyebrow={t('studentCopy.m290')} title={exam.title} description="" />
        <Card asChild className="p-5 sm:p-7">
          <form onSubmit={submit}>
            {exam.settings?.oneAttempt ? (
              <p className="bg-honey-soft text-honey mt-3 rounded-[6px] px-3 py-2 text-[12.5px]">
                {t('studentCopy.m291')}
              </p>
            ) : null}

            <div className="mt-6 space-y-4">
              <Field label={t('studentCopy.m292')}>
                {roster.length > 0 ? (
                  <SiteSelect
                    value={rosterIdx >= 0 ? name : ''}
                    options={[
                      { value: '', label: t('studentCopy.m293') },
                      ...roster.map((r, i) => ({ value: r, label: `${i + 1}. ${r}` })),
                    ]}
                    onChange={setName}
                    label={t('studentCopy.m294')}
                    className="w-full"
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    autoComplete="name"
                  />
                )}
              </Field>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Field label={t('studentCopy.m144')}>
                  <input
                    className={inputClass}
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    maxLength={30}
                    placeholder={t('studentCopy.m295')}
                  />
                </Field>
                <Field label={t('studentCopy.m296')}>
                  {roster.length > 0 ? (
                    <input
                      className={inputClass}
                      value={rosterIdx >= 0 ? rosterIdx + 1 : ''}
                      readOnly
                      tabIndex={-1}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      value={seat}
                      onChange={(e) => setSeat(e.target.value)}
                      inputMode="numeric"
                      placeholder={t('studentCopy.m297')}
                    />
                  )}
                </Field>
              </div>
            </div>

            {err ? (
              <p role="alert" className="text-clay-deep mt-4 text-[13px] font-medium">
                {err}
              </p>
            ) : null}
            <Button variant="clay" type="submit" className="mt-6 w-full">
              {t('studentCopy.m298')}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </Card>
      </PageShell>
    )
  }
  return null
}
