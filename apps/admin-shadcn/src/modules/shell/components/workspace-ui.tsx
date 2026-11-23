import { t } from '@/i18n/translate'

type WorkspaceUiProps = { title: string }
export default function WorkspaceUi({ title }: WorkspaceUiProps) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-ink-3 mt-6 text-sm">{t('common.comingSoon')}</p>
    </div>
  )
}
