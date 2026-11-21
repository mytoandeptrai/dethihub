import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

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

/** Inverse of decryptKey; the caller checks the secret length first */
export function encryptKey(secret: string, plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':')
}
