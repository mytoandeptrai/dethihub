export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER')

export interface VerifiedToken {
  userId: string
  email: string | null
}

export interface TokenVerifier {
  /** null = token is invalid or expired; throws when the keys cannot be fetched */
  verify(token: string): Promise<VerifiedToken | null>
}
