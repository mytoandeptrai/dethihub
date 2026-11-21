import { SetMetadata } from '@nestjs/common'

export const SKIP_TIMEOUT_KEY = 'skipTimeout'

/** Opts a long-running route out of the global request timeout */
export const SkipTimeout = () => SetMetadata(SKIP_TIMEOUT_KEY, true)
