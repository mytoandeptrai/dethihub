'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { submitFeedback } from '@/apis/feedback/requests'
import { useSession } from '@/hooks'
import { t } from '@/i18n/translate'

const schema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.union([z.email(t('product.feedbackEmail')), z.literal('')])),
  message: z
    .string()
    .trim()
    .min(1, t('product.feedbackEmpty'))
    .max(2000, t('product.feedbackLong')),
})
export type FeedbackProps = { open: boolean; onOpenChange: (value: boolean) => void }

export function useFeedbackContainer({ open, onOpenChange }: FeedbackProps) {
  const pathname = usePathname()
  const { session } = useSession()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '', message: '' },
  })
  useEffect(() => {
    if (open && session?.user.email) form.setValue('email', session.user.email)
  }, [open, session?.user.email, form])
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      submitFeedback({
        message: values.message,
        ...(values.email ? { email: values.email } : {}),
        page: pathname,
      }),
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
      toast.success(t('product.feedbackSent'))
    },
    onError: (error) => toast.error(error.message),
  })
  return {
    open,
    onOpenChange,
    register: form.register,
    errors: form.formState.errors,
    sending: mutation.isPending,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
  }
}
