'use client'
import {
  lib_math_formatPoints as formatPoints,
  Link,
  data_types_totalPoints as totalPoints,
  components_appIcons_TrashIcon as TrashIcon,
} from '@workspace-engine'
import { cn } from '@workspace/ui/lib/utils'
import { Copy, FileText, FolderOpen, MonitorPlay, MoreHorizontal, Share2 } from 'lucide-react'

import {
  SiteBadge as Badge,
  SiteButton as Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  PageHeader,
  Pager,
  PageShell,
} from '@/components/product-ui'
import { appPaths } from '@/config/app-paths'
import { t } from '@/i18n/translate-workspace'

import type { MyExamsParts } from '@/modules/workspace/containers/my-exams-container'
import type { MyExamsModel } from '@/modules/workspace/hooks'

export function MyExamsUi(
  props: ReturnType<typeof MyExamsModel.useMyExamsContainer> & {
    parts: typeof MyExamsParts
  },
) {
  const { MenuItem } = props.parts
  if (props.viewState === 0) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={t('workspaceCopy.m57')}
          title={t('workspaceCopy.m58')}
          count={<>{t('workspaceCopy.m59')}</>}
        />
        <EmptyState
          icon={<FolderOpen className="size-7" strokeWidth={1.4} />}
          title={t('workspaceCopy.m60')}
          description={t('workspaceCopy.m61')}
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link to={appPaths.editor.href}>
                <Button variant="primary">{t('workspaceCopy.m22')}</Button>
              </Link>
              <Link to={appPaths.community.href}>
                <Button variant="outline">{t('workspaceCopy.m62')}</Button>
              </Link>
            </div>
          }
        />
      </PageShell>
    )
  }
  if (props.viewState === 1) {
    const { myExams, paged, confirmDelete, setConfirmDelete, menuFor, setMenuFor, actionsFor } =
      props
    return (
      <PageShell>
        <PageHeader
          eyebrow={t('workspaceCopy.m57')}
          title={t('workspaceCopy.m58')}
          count={
            <>
              {myExams.length}
              {t('workspaceCopy.m63')}
            </>
          }
          actions={
            <Link to={appPaths.editor.href}>
              <Button variant="primary">
                <FileText className="size-4" />
                {t('workspaceCopy.m22')}
              </Button>
            </Link>
          }
        />

        <div className="space-y-3">
          {paged.items.map((exam) => {
            const nq = exam.sections.reduce((n, s) => n + s.questions.length, 0)
            const target = confirmDelete === exam.id
            const actions = actionsFor(exam)
            return (
              <Card
                key={exam.id}
                className="group hover:shadow-lift relative flex min-w-0 flex-wrap items-center gap-3 rounded-xl p-4 transition-shadow duration-200 motion-reduce:transition-none sm:gap-4"
              >
                <span className="bg-sunken text-ink-2 flex size-11 shrink-0 items-center justify-center rounded-[8px]">
                  <FileText className="size-4.5" strokeWidth={1.7} />
                </span>

                <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-0">
                  <Link
                    to={appPaths.exams.getHref(exam.id)}
                    className="font-display text-ink hover:text-clay line-clamp-2 text-[16.5px] font-semibold transition-colors"
                  >
                    {exam.title}
                  </Link>
                  <p className="text-ink-3 mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px]">
                    <span>{exam.subject}</span>
                    <span className="text-ink-4">{t('workspaceCopy.m64')}</span>
                    <span>{exam.grade}</span>
                    <span className="text-ink-4">{t('workspaceCopy.m64')}</span>
                    <span className="tnum">
                      {nq}
                      {t('workspaceCopy.m65')}
                    </span>
                    <span className="text-ink-4">{t('workspaceCopy.m64')}</span>
                    <span className="tnum">
                      {formatPoints(totalPoints(exam))}
                      {t('workspaceCopy.m66')}
                    </span>
                    {exam.shared ? (
                      <Badge tone="sage" className="ml-1">
                        <Share2 className="size-2.5" />
                        {t('workspaceCopy.m67')}
                      </Badge>
                    ) : null}
                  </p>
                </div>

                {target ? (
                  <div className="anim-slide flex items-center gap-1.5">
                    <span className="text-ink-3 text-[12.5px]">{t('workspaceCopy.m68')}</span>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={actions.remove}
                      className="text-clay hover:bg-clay-soft"
                    >
                      <TrashIcon className="size-3.5" />
                      {t('workspaceCopy.m8')}
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(null)}>
                      {t('workspaceCopy.m69')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button variant="quiet" size="sm" onClick={actions.edit}>
                      {t('workspaceCopy.m70')}
                    </Button>
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={actions.edit}
                      data-tip={t('workspaceCopy.m71')}
                    >
                      {t('workspaceCopy.m5')}
                    </Button>
                    <DropdownMenu
                      open={menuFor === exam.id}
                      onOpenChange={(open) => setMenuFor(open ? exam.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={t('workspaceCopy.m15', { value0: exam.title })}
                          className="text-ink-3 hover:bg-sunken hover:text-ink flex size-9 items-center justify-center rounded-full transition-colors"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <MenuItem
                          icon={<MonitorPlay className="size-3.5" />}
                          onClick={actions.quiz}
                        >
                          {t('workspaceCopy.m72')}
                        </MenuItem>
                        <MenuItem icon={<Copy className="size-3.5" />} onClick={actions.duplicate}>
                          {t('workspaceCopy.m73')}
                        </MenuItem>
                        <MenuItem icon={<Share2 className="size-3.5" />} onClick={actions.share}>
                          {exam.shared ? t('workspaceCopy.m74') : t('workspaceCopy.m7')}
                        </MenuItem>
                        <DropdownMenuSeparator />
                        <MenuItem
                          icon={<TrashIcon className="size-3.5" />}
                          danger
                          onClick={actions.requestDelete}
                        >
                          {t('workspaceCopy.m14')}
                        </MenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
        <Pager {...paged} />
      </PageShell>
    )
  }
  return null
}
export function MyExamsMenuItemUi(
  props: ReturnType<typeof MyExamsModel.useMenuItemContainer> & {
    parts: typeof MyExamsParts
  },
) {
  if (props.viewState === 0) {
    const { onClick, danger, icon, children } = props
    return (
      <DropdownMenuItem
        onSelect={onClick}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold transition-colors',
          danger ? 'text-clay hover:bg-clay-soft' : 'text-ink-2 hover:bg-sunken hover:text-ink',
        )}
      >
        {icon}
        {children}
      </DropdownMenuItem>
    )
  }
  return null
}
