import { describe, expect, it } from 'vitest'

import { appPaths } from '@/config/app-paths'

import { getActiveNavigationPath } from './active-navigation'

const paths = [
  appPaths.myDocs.href,
  appPaths.myDocs.analytics,
  appPaths.onlineExams.href,
  appPaths.admin.href,
  appPaths.admin.users,
  appPaths.admin.stats,
]

describe('getActiveNavigationPath', () => {
  it('matches an exact navigation item', () => {
    expect(getActiveNavigationPath(appPaths.onlineExams.href, paths)).toBe(
      appPaths.onlineExams.href,
    )
  })

  it('keeps online exam details and results active', () => {
    for (const path of [
      appPaths.onlineExams.getHref('exam-id'),
      appPaths.onlineExams.results('exam-id'),
    ]) {
      expect(getActiveNavigationPath(path, paths)).toBe(appPaths.onlineExams.href)
    }
  })

  it('chooses the most specific item regardless of its position', () => {
    for (const items of [paths, paths.toReversed()]) {
      expect(getActiveNavigationPath(appPaths.myDocs.analytics, items)).toBe(
        appPaths.myDocs.analytics,
      )
      expect(getActiveNavigationPath(`${appPaths.admin.stats}/daily`, items)).toBe(
        appPaths.admin.stats,
      )
      expect(getActiveNavigationPath(`${appPaths.admin.users}/user-id`, items)).toBe(
        appPaths.admin.users,
      )
    }
  })

  it('falls back to a visible parent when no child item exists', () => {
    expect(getActiveNavigationPath(appPaths.myDocs.analytics, [appPaths.myDocs.href])).toBe(
      appPaths.myDocs.href,
    )
    expect(getActiveNavigationPath(`${appPaths.admin.href}/unknown`, paths)).toBe(
      appPaths.admin.href,
    )
  })

  it('does not match a partial path segment', () => {
    expect(getActiveNavigationPath(`${appPaths.onlineExams.href}-archive`, paths)).toBeUndefined()
    expect(getActiveNavigationPath(`${appPaths.admin.href}istrator`, paths)).toBeUndefined()
  })

  it('matches trailing slashes', () => {
    expect(getActiveNavigationPath(`${appPaths.onlineExams.href}/`, paths)).toBe(
      appPaths.onlineExams.href,
    )
  })

  it('only matches the root item on the root route', () => {
    expect(getActiveNavigationPath(appPaths.home.href, [appPaths.home.href])).toBe(
      appPaths.home.href,
    )
    expect(getActiveNavigationPath(appPaths.community.href, [appPaths.home.href])).toBeUndefined()
  })

  it('returns no active item for empty or unmatched input', () => {
    expect(getActiveNavigationPath('', paths)).toBeUndefined()
    expect(getActiveNavigationPath(appPaths.community.href, paths)).toBeUndefined()
    expect(getActiveNavigationPath(appPaths.onlineExams.href, [])).toBeUndefined()
  })
})
