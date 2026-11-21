import { SetMetadata } from '@nestjs/common'

export const PROTECT_TARGET_KEY = 'protectTarget'

/** Rejects the request when the `:id` route param is the caller or another admin; the denial is audited as `<action>.denied` */
export const ProtectTarget = (action: string) => SetMetadata(PROTECT_TARGET_KEY, action)
