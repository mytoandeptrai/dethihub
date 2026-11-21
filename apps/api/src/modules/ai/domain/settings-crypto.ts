import { createDecipheriv, createHash } from 'node:crypto'

export const MIN_SETTINGS_SECRET_LENGTH = 32

/** `v1:iv:tag:data` (base64) sealed with AES-256-GCM; a wrong secret or damaged data gives null */
export function decryptKey(secret: string, sealed: string): string | null {
  const [version, iv, tag, data] = sealed.split(':')
  if (version !== 'v1' || !iv || !tag || !data || secret.length < MIN_SETTINGS_SECRET_LENGTH) {
    return null
  }
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      createHash('sha256').update(secret).digest(),
      Buffer.from(iv, 'base64'),
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
      'utf8',
    )
  } catch {
    return null
  }
}
