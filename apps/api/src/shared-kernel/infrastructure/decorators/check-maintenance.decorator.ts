import { SetMetadata } from '@nestjs/common'

export const CHECK_MAINTENANCE_KEY = 'checkMaintenance'

export const CheckMaintenance = () => SetMetadata(CHECK_MAINTENANCE_KEY, true)
