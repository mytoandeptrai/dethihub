'use client'
import { CONTACT } from '@engine-pricing'
import { cn } from '@workspace/ui/lib/utils'
import { Mail } from 'lucide-react'
import Image from 'next/image'

import { t } from '@/i18n/translate'
const SOCIAL = [
  {
    label: t('publicCopy.m346'),
    tip: `${t('publicCopy.m346')}: ${CONTACT.phone}`,
    href: CONTACT.zalo,
    src: '/brand/social/zalo.svg',
  },
  {
    label: t('publicCopy.m347'),
    tip: t('publicCopy.m347'),
    href: CONTACT.facebook,
    src: '/brand/social/facebook.svg',
  },
  {
    label: t('publicCopy.m348'),
    tip: t('publicCopy.m348'),
    href: CONTACT.threads,
    src: '/brand/social/threads.svg',
  },
]
export function ContactLinks({
  className,
  showEmail = true,
}: {
  className?: string
  showEmail?: boolean
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {showEmail && (
        <a
          href={`mailto:${CONTACT.email}`}
          className="text-ink-2 hover:text-clay mr-1 inline-flex items-center gap-1.5 font-medium hover:underline"
        >
          <Mail className="size-4" />
          {CONTACT.email}
        </a>
      )}
      {SOCIAL.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.tip}
          data-tip={s.tip}
          className="block size-8 shrink-0 rounded-[8px] transition-transform hover:-translate-y-0.5"
        >
          <Image unoptimized src={s.src} alt="" width={32} height={32} className="size-8" />
        </a>
      ))}
    </div>
  )
}
