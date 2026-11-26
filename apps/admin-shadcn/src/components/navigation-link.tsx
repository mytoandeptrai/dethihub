import NextLink from 'next/link'

import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof NextLink>

export function isPrivateLink(href: Props['href']) {
  try {
    const path =
      typeof href === 'string' ? new URL(href, 'http://localhost').pathname : (href.pathname ?? '')
    return /^\/(editor|grading|online-exams|my-docs|library|profile|admin|play|quiz)(\/|$)/.test(
      path,
    )
  } catch {
    return false
  }
}

export default function NavigationLink({ href, prefetch, ...props }: Props) {
  return <NextLink {...props} href={href} prefetch={isPrivateLink(href) ? false : prefetch} />
}
