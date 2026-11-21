import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import type { PasswordHasherPort } from '@/modules/auth/application/ports/password-hasher.port'

const BCRYPT_ROUNDS = 12

/**
 * Bcrypt password hasher implementation
 */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
  }

  async verify(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash)
  }
}
