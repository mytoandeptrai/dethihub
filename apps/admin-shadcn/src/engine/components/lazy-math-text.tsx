'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { cn } from '@/engine/lib/cn'
import { containsMath, renderRichText } from '@/engine/lib/rich-text-html'

import type { MathText as EngineMathText } from './MathText'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof EngineMathText>

const FormulaText = dynamic(() => import('./MathText').then((module) => module.MathText), {
  ssr: false,
})

function PlainText({ children, className, as: As = 'span', style }: Props) {
  const html = useMemo(() => renderRichText(children), [children])
  return <As className={cn(className)} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

export function MathText(props: Props) {
  return containsMath(props.children) ? <FormulaText {...props} /> : <PlainText {...props} />
}
