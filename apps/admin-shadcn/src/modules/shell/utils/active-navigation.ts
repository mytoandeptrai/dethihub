export function getActiveNavigationPath(pathname: string, paths: readonly string[]) {
  let activePath: string | undefined
  for (const path of paths) {
    if (
      (pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))) &&
      (!activePath || path.length > activePath.length)
    ) {
      activePath = path
    }
  }
  return activePath
}
