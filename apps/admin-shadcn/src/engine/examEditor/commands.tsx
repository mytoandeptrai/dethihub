import { Children, cloneElement, isValidElement, type ReactNode } from 'react'

import { COMMON_COLORS } from './ColorPalette'

import type { RibbonGroupDef } from './RibbonAdaptive'

export interface ExamCommand {
  id: string
  family: string
  label: string
  keywords?: string[]
  group: string
  tab: string
  disabled?: boolean
  run: () => void
}

export interface ExamCommandGroup {
  id: string
  label: string
  tab: string
  content: ReactNode
}

export const normalizeCommand = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

export function scoreExamCommand(value: string, query: string, keywords: string[] = []): number {
  const search = normalizeCommand(query).trim()
  if (!search) return 1
  const label = normalizeCommand(keywords[0] ?? value)
  if (label === search) return 1
  if (label.startsWith(search)) return 0.8
  if (label.includes(search)) return 0.6
  return normalizeCommand([value, ...keywords].join(' ')).includes(search) ? 0.4 : 0
}

export function readSlashQuery(
  text: string,
  parentType: string,
  empty: boolean,
  hasFollowingContent = false,
): string | null {
  if (hasFollowingContent && text.startsWith('/')) return null
  const match =
    empty && (parentType === 'paragraph' || parentType === 'examParagraph')
      ? /(?:^|\s)\/([^/]{0,64})$/u.exec(text)
      : null
  return match?.[1] ?? null
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child)
      return isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : ''
    })
    .join(' ')
    .trim()
}

/** Metadata wraps the original elements; callbacks remain owned by Ribbon. */
export function createExamCommands(
  tabs: Record<string, RibbonGroupDef[]>,
  reveal: (tab: string, anchors: string[]) => void,
  overrides: Record<string, () => void> = {},
) {
  const commands: ExamCommand[] = []
  const groups: ExamCommandGroup[] = []
  for (const [tab, definitions] of Object.entries(tabs))
    for (const definition of definitions) {
      function visit(
        node: ReactNode,
        parents: string[] = [],
        register = true,
        inheritedDisabled = false,
      ): ReactNode {
        return Children.map(node, (child) => {
          if (!isValidElement<Record<string, unknown>>(child)) return child
          const props = child.props
          const disabled = inheritedDisabled || Boolean(props.disabled)
          const family = typeof props['data-command'] === 'string' ? props['data-command'] : null
          const label = String(
            props['data-command-label'] ??
              props['aria-label'] ??
              props.ariaLabel ??
              props.label ??
              props.title ??
              props['data-tip'] ??
              textOf(typeof props.children === 'function' ? null : (props.children as ReactNode)) ??
              '',
          ).trim()
          const key = family ? `${family}::${label}` : ''
          const id = key
          const anchors = family ? [...parents, id] : parents
          if (family && register) {
            const click = props.onClick
            const action =
              overrides[family] ??
              (typeof click === 'function' && click.length === 0
                ? () => click()
                : () => reveal(tab, anchors))
            commands.push({
              id,
              family,
              label: label || definition.label,
              keywords: typeof props.title === 'string' ? [props.title] : [],
              group: definition.label,
              tab,
              disabled,
              run: () => {
                if (!disabled) action()
              },
            })
            const pick = props.onPick ?? props.onChange
            const options = props.options
            if (typeof pick === 'function' && Array.isArray(options))
              for (const option of options) {
                const value = option.value ?? option.key
                commands.push({
                  id: `${id}:${value}`,
                  family,
                  label: `${label}: ${option.label}`,
                  group: definition.label,
                  tab,
                  disabled: Boolean(disabled || option.disabled),
                  run: () => {
                    if (!disabled && !option.disabled) pick(value)
                  },
                })
              }
            if (
              typeof props.onPick === 'function' &&
              Array.isArray(props.colors) &&
              props.colors.length
            )
              for (const color of COMMON_COLORS) {
                const pickColor = props.onPick
                commands.push({
                  id: `${id}:${color}`,
                  family,
                  label: `${label}: ${color}`,
                  group: definition.label,
                  tab,
                  disabled,
                  run: () => {
                    if (!disabled) pickColor(color)
                  },
                })
              }
            if (Array.isArray(props.items))
              for (const [i, item] of props.items.entries()) {
                if (typeof item.onClick === 'function')
                  commands.push({
                    id: `${id}:item:${i}`,
                    family,
                    label: `${label}: ${item.label}`,
                    group: definition.label,
                    tab,
                    disabled,
                    run: () => {
                      if (!disabled) item.onClick()
                    },
                  })
              }
            const none = props.none as { label: string; onClick: () => void } | undefined
            if (none)
              commands.push({
                id: `${id}:none`,
                family,
                label: `${label}: ${none.label}`,
                group: definition.label,
                tab,
                disabled,
                run: () => {
                  if (!disabled) none.onClick()
                },
              })
          }
          const children = props.children
          const nextChildren =
            typeof children === 'function'
              ? (...args: unknown[]) => visit(children(...args), anchors, false, disabled)
              : visit(children as ReactNode, anchors, register, disabled)
          // Render-function menus also contribute their closed-menu commands to the palette.
          if (typeof children === 'function' && register)
            visit(
              children(() => {}),
              anchors,
              true,
              disabled,
            )
          const element = cloneElement(child, {
            children: nextChildren,
            ...(props.trigger
              ? { trigger: visit(props.trigger as ReactNode, anchors, register, disabled) }
              : {}),
          })
          return family ? (
            <span key={id} data-exam-command={id} style={{ display: 'contents' }}>
              {element}
            </span>
          ) : (
            element
          )
        })
      }
      groups.push({
        id: definition.id,
        label: definition.label,
        tab,
        content: visit(definition.render()),
      })
    }
  return { commands, groups }
}
