const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

/**
 * One key per real mailbox: lowercase, the part after `+` dropped; Gmail also ignores dots and
 * googlemail.com is the same box. Null when the address is unusable.
 */
export function mailboxKey(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase()
  const at = value?.indexOf('@') ?? -1
  if (!value || at < 1) return null
  const [local = '', domain = ''] = value.split('@')
  const base = local.split('+')[0] ?? ''
  return GMAIL_DOMAINS.has(domain) ? `${base.replaceAll('.', '')}@gmail.com` : `${base}@${domain}`
}
