export function clearAuthState() {
  if (typeof document === 'undefined') return
  localStorage.clear()
  sessionStorage.clear()
  for (const cookie of document.cookie.split(';')) {
    document.cookie = cookie.split('=')[0] + '=; Max-Age=0; path=/'
  }
}
