export const SECURITY_STRIKE = Symbol('SECURITY_STRIKE')

export interface SecurityStrikePort {
  recordIntruder(userId: string, action: string, ip: string): Promise<string | null>
}
