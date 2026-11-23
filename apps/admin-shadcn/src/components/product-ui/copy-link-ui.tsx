'use client'
import { cn } from '@workspace/ui/lib/utils'
import { Check, Copy, Link2 } from 'lucide-react'
import { useState } from 'react'

import { SiteButton as Button } from '@/components/product-ui'
import { t } from '@/i18n/translate'
export function CopyLink({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <div className={cn('bg-sunken flex items-center gap-2 rounded-[6px] p-1.5 pl-3.5', className)}>
      <Link2 className="text-ink-3 size-4 shrink-0" />
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label={t('onlineExamsCopy.m500')}
        className="text-ink min-w-0 flex-1 bg-transparent text-[13px] outline-none"
      />
      <Button variant="soft" size="sm" onClick={copy} className="shrink-0 bg-white">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? t('onlineExamsCopy.m255') : t('onlineExamsCopy.m501')}
      </Button>
    </div>
  )
}
