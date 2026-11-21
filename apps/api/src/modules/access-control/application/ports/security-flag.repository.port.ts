export const SECURITY_FLAG_REPOSITORY = Symbol('SECURITY_FLAG_REPOSITORY')

export interface StrikeResult {
  strikes: number
  isNew: boolean
}

export interface SecurityFlagRepositoryPort {
  recordStrike(userId: string, action: string, ip: string): Promise<StrikeResult>
  revertStrike(userId: string, strikes: number): Promise<void>
}
