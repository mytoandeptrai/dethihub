import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
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
    <div
      data-slot="page-shell"
      className="mx-auto w-full max-w-[1180px] min-w-0 px-4 py-8 sm:px-6 sm:py-12"
    >
      <section className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10">
        <div className="border-line bg-sunken/40 shadow-soft flex min-w-0 flex-col gap-8 rounded-xl border p-6 lg:min-h-[520px] lg:justify-between lg:p-8">
          <div>
            <h1 className="font-display text-ink text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {mode === 'forgot' && (
              <p className="text-ink-3 mt-2 max-w-sm text-sm leading-relaxed">{t('forgotBody')}</p>
            )}
          </div>
          <div
            aria-hidden="true"
            className="relative hidden h-[220px] w-full max-w-[420px] lg:block"
          >
            <div
              className="bg-sunken/80 absolute inset-x-5 top-5 bottom-0 rounded-[22px]"
              style={{ transform: 'rotate(-2.4deg)' }}
            />
            <div
              className="bg-surface shadow-float absolute inset-0 rounded-[18px] p-6"
              style={{ transform: 'rotate(1.4deg)' }}
            >
              <div className="flex items-center gap-2">
                <span className="bg-clay size-2 rounded-full" />
                <span className="text-ink-3 text-[11px] font-semibold tracking-[0.08em] uppercase">
                  {t('artTitle')}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {['w-4/5', 'w-full', 'w-3/5', 'w-11/12'].map((width) => (
                  <div key={width} className={`bg-sunken h-2.5 rounded-full ${width}`} />
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                {['A', 'B', 'C', 'D'].map((choice) => (
                  <span
                    key={choice}
                    className={`flex size-9 items-center justify-center rounded-[8px] text-[13px] font-bold ${choice === 'C' ? 'bg-clay text-white' : 'bg-canvas text-ink-3'}`}
                  >
                    {choice}
                  </span>
                ))}
              </div>
              <span className="bg-sage-soft text-sage absolute right-5 bottom-5 rounded-full px-3 py-1.5 text-[12px] font-semibold">
                ✓ {t('saved')}
              </span>
            </div>
          </div>
        </div>
        <div className="border-line shadow-soft min-w-0 rounded-xl border bg-card p-5 sm:p-7">
          <h2 className="font-display text-subtitle text-ink border-line mb-6 border-b pb-5 font-semibold">
            {title}
          </h2>
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
            <form onSubmit={onSubmit} noValidate className="space-y-3.5">
              {needsTerms && (
                <>
                  <label className="text-ink-2 flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-snug">
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
                        className="text-clay font-semibold hover:underline"
                      >
                        {t('terms')}
                      </Link>{' '}
                      {t('and')}{' '}
                      <Link
                        href={appPaths.privacy.href}
                        target="_blank"
                        className="text-clay font-semibold hover:underline"
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
                    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
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
                  <label htmlFor={field.name} className="text-ink-2 text-[13px] font-semibold">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      {...register(field.name)}
                      aria-invalid={!!errors[field.name]}
                      aria-describedby={errors[field.name] ? field.name + '-error' : undefined}
                      className="h-10"
                    />
                    {field.name === 'password' && (
                      <button
                        type="button"
                        onClick={onTogglePassword}
                        aria-label={t(showPassword ? 'hidePassword' : 'showPassword')}
                        className="text-ink-3 absolute inset-y-0 right-3"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    )}
                  </div>
                  {errors[field.name] && (
                    <p id={field.name + '-error'} role="alert" className="text-sm text-destructive">
                      {errors[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
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
              <Button
                type="submit"
                className="h-12 w-full rounded-lg font-semibold shadow-accent"
                disabled={isBusy}
              >
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
    </div>
  )
}
export default AuthFormUi
