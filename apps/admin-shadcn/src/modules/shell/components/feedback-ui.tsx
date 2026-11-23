'use client'

import { Button } from '@workspace/ui/components/button'
import { Dialog, DialogContent, DialogTitle } from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { MessageSquare } from 'lucide-react'

import { t } from '@/i18n/translate'

import type { useFeedbackContainer } from '@/modules/shell/hooks'

type FeedbackUiProps = ReturnType<typeof useFeedbackContainer>
export default function FeedbackUi({
  open,
  onOpenChange,
  register,
  sending,
  errors,
  onSubmit,
}: FeedbackUiProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="text-clay size-4" />
          {t('product.feedbackTitle')}
        </DialogTitle>
        <form onSubmit={onSubmit} className="space-y-4 text-sm">
          <label className="block space-y-2">
            <span>
              {t('product.email')} <span className="text-ink-3">{t('product.optional')}</span>
            </span>
            <Input type="email" {...register('email')} aria-invalid={!!errors.email} />
          </label>
          <label className="block space-y-2">
            <span>{t('product.message')} *</span>
            <Textarea
              {...register('message')}
              required
              rows={4}
              maxLength={2000}
              placeholder={t('product.feedbackPlaceholder')}
              aria-invalid={!!errors.message}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              {t('product.cancel')}
            </Button>
            <Button type="submit" disabled={sending}>
              {t(sending ? 'product.sending' : 'product.feedback')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
