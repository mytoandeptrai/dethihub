import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { ArrowRight, BookOpen, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'
import { t as translate } from '@/i18n/translate'

import type { useAuthFormContainer } from '@/modules/auth/shared/hooks'

type AuthFormUiProps = ReturnType<typeof useAuthFormContainer>

const AuthFormUi = ({
  t,
  mode,
  form,
  onSubmit,
  onGoogle,
  onAcceptedChange,
  accepted,
  isBusy,
  showPassword,
  onTogglePassword,
  title,
  submitLabel,
  notice,
  error,
  resetInvalid,
  isSessionLoading,
  redirectTo,
  needsTerms,
  fields,
}: AuthFormUiProps) => {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <main id="main-content" className="auth-shell mx-auto w-full max-w-6xl px-5 py-7 sm:px-8">
      <Link
        href={appPaths.home.href}
        className="mb-10 inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
      >
        <span className="rounded-lg bg-primary p-2 text-primary-foreground">
          <BookOpen className="size-5" />
        </span>
        {translate('common.brand')}
      </Link>
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-10">
        <div className="rounded-xl border bg-muted/40 p-6 lg:min-h-[520px] lg:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {mode === 'forgot' && (
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t('forgotBody')}</p>
          )}
          <div
            aria-hidden="true"
            className="relative mt-24 hidden h-56 max-w-sm rounded-2xl border bg-card p-6 shadow-sm lg:block"
          >
            <span className="text-xs font-semibold text-muted-foreground">{t('artTitle')}</span>
            <div className="mt-6 space-y-4">
              <div className="h-2 w-4/5 rounded bg-muted" />
              <div className="h-2 rounded bg-muted" />
              <div className="h-2 w-3/5 rounded bg-muted" />
            </div>
            <span className="absolute right-5 bottom-5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              {t('saved')}
            </span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 border-b pb-5 text-xl font-semibold">{title}</h2>
          {isSessionLoading ? (
            <p role="status">{translate('common.loading')}</p>
          ) : resetInvalid ? (
            <div className="space-y-5">
              <p>{t('invalidReset')}</p>
              <Link href={appPaths.auth.forgot.href} className="text-primary underline">
                {t('newLink')}
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              {needsTerms && (
                <>
                  <label className="flex items-start gap-2.5 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-primary"
                      {...register('accepted')}
                      checked={accepted}
                      onChange={(event) => onAcceptedChange(event.target.checked)}
                      aria-describedby={errors.accepted ? 'accepted-error' : undefined}
                    />
                    <span>
                      {t('agree')}{' '}
                      <Link
                        href={appPaths.terms.href}
                        target="_blank"
                        className="font-semibold underline"
                      >
                        {t('terms')}
                      </Link>{' '}
                      {t('and')}{' '}
                      <Link
                        href={appPaths.privacy.href}
                        target="_blank"
                        className="font-semibold underline"
                      >
                        {t('privacy')}
                      </Link>
                    </span>
                  </label>
                  {errors.accepted && (
                    <p id="accepted-error" role="alert" className="text-sm text-destructive">
                      {errors.accepted.message}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    disabled={isBusy}
                    onClick={onGoogle}
                  >
                    {t('google')}
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    {t('emailDivider')}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}
              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label htmlFor={field.name} className="text-sm font-semibold">
                    {field.label}
                  </label>
                  <Input
                    id={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    {...register(field.name)}
                    aria-invalid={!!errors[field.name]}
                    aria-describedby={errors[field.name] ? field.name + '-error' : undefined}
                    className="h-11"
                  />
                  {errors[field.name] && (
                    <p id={field.name + '-error'} role="alert" className="text-sm text-destructive">
                      {errors[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
              {mode !== 'forgot' && (
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {t(showPassword ? 'hidePassword' : 'showPassword')}
                </button>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="rounded-md bg-primary/10 p-3 text-sm">
                  {notice}
                </p>
              )}
              <Button type="submit" className="h-11 w-full" disabled={isBusy}>
                {isBusy ? t('processing') : submitLabel}
                {!isBusy && <ArrowRight className="size-4" />}
              </Button>
              <div className="flex flex-wrap justify-between gap-3 pt-2 text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    <Link href={appPaths.auth.forgot.href}>{t('forgotTitle')}?</Link>
                    <Link
                      href={appPaths.auth.register.getHref(redirectTo)}
                      className="font-semibold text-foreground"
                    >
                      {t('registerTitle')}
                    </Link>
                  </>
                ) : (
                  <Link href={appPaths.auth.login.getHref(redirectTo)}>
                    {t(mode === 'register' ? 'existingAccount' : 'backLogin')}
                  </Link>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
export default AuthFormUi
