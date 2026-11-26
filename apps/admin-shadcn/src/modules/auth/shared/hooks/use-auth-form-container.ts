'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { appPaths, safeRedirect } from '@/config/app-paths'
import { env } from '@/config/env'
import { useSession } from '@/hooks'
import { getBrowserSupabase } from '@/lib/supabase/browser'

import { authSchema, initialAuthFormData } from './schema'

import type { AuthMode, AuthFormData } from './schema'

const TERMS_KEY = 'dethihub.terms-accepted'

export function useAuthFormContainer(mode: AuthMode) {
  const t = useTranslations('auth')
  const router = useRouter()
  const search = useSearchParams()
  const { session, isLoading } = useSession()
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState(
    search.get('error') === 'callback' ? t('callbackError') : '',
  )
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema(mode, t)),
    defaultValues: initialAuthFormData,
    mode: 'onChange',
  })
  const { setValue } = form
  useEffect(() => {
    try {
      setValue('accepted', localStorage.getItem(TERMS_KEY) === '1')
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }, [setValue])
  const redirectTo = safeRedirect(search.get('redirectTo'))
  const callbackUrl = (next: string) =>
    env.NEXT_PUBLIC_APP_URL + appPaths.auth.callback.href + '?next=' + encodeURIComponent(next)
  const onAcceptedChange = (accepted: boolean) => {
    setValue('accepted', accepted, { shouldValidate: true })
    try {
      if (accepted) localStorage.setItem(TERMS_KEY, '1')
      else localStorage.removeItem(TERMS_KEY)
    } catch {
      /* Consent remains valid for this mounted form. */
    }
  }
  const onGoogle = async () => {
    if (!form.getValues('accepted')) {
      form.setError('accepted', { message: t('termsError') })
      return
    }
    setIsGoogleLoading(true)
    setFormError('')
    try {
      const { error: failure } = await getBrowserSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl(redirectTo) },
      })
      if (failure) throw failure
    } catch (error) {
      const message = error instanceof Error ? error.message : t('callbackError')
      setFormError(message)
      toast.error(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }
  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    setNotice('')
    const supabase = getBrowserSupabase()
    try {
      if (mode === 'login') {
        const { error: failure } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        })
        if (failure) throw failure
        router.replace(redirectTo)
        router.refresh()
      } else if (mode === 'register') {
        const { data, error: failure } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            data: { display_name: values.name.trim() },
            emailRedirectTo: callbackUrl(redirectTo),
          },
        })
        if (failure) throw failure
        if (data.session) {
          router.replace(redirectTo)
          router.refresh()
        } else {
          setNotice(t('confirmation'))
          toast.success(t('confirmation'))
        }
      } else if (mode === 'forgot') {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
          redirectTo: callbackUrl(appPaths.auth.reset.href),
        })
        if (failure) throw failure
        setNotice(t('resetSent'))
        toast.success(t('resetSent'))
      } else {
        if (!session) throw new Error(t('invalidReset'))
        const { error: failure } = await supabase.auth.updateUser({ password: values.password })
        if (failure) throw failure
        form.resetField('password')
        form.resetField('confirm')
        setNotice(t('resetDone'))
        toast.success(t('resetDone'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('callbackError')
      setFormError(message)
      toast.error(message)
    }
  })
  const needsTerms = mode === 'login' || mode === 'register'
  const fields = [
    ...(mode === 'register'
      ? [{ name: 'name' as const, label: t('name'), type: 'text', autoComplete: 'name' }]
      : []),
    ...(mode === 'reset'
      ? []
      : [{ name: 'email' as const, label: t('email'), type: 'email', autoComplete: 'email' }]),
    ...(mode === 'forgot'
      ? []
      : [
          {
            name: 'password' as const,
            label: t(mode === 'reset' ? 'newPassword' : 'password'),
            type: showPassword ? 'text' : 'password',
            autoComplete: mode === 'login' ? 'current-password' : 'new-password',
          },
        ]),
    ...(mode === 'register' || mode === 'reset'
      ? [
          {
            name: 'confirm' as const,
            label: t('confirm'),
            type: showPassword ? 'text' : 'password',
            autoComplete: 'new-password',
          },
        ]
      : []),
  ]
  return {
    needsTerms,
    fields,
    t,
    mode,
    form,
    onSubmit,
    onGoogle,
    onAcceptedChange,
    accepted: form.watch('accepted'),
    isBusy: form.formState.isSubmitting || isGoogleLoading,
    showPassword,
    onTogglePassword: () => setShowPassword((value) => !value),
    title: t(`${mode}Title`),
    submitLabel: t(`${mode}Submit`),
    notice,
    error: formError,
    resetInvalid: mode === 'reset' && !isLoading && !session,
    isSessionLoading: mode === 'reset' && isLoading,
    redirectTo,
  }
}
