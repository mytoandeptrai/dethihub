import { createTranslator } from 'next-intl'

import adminOpsCopy from './messages/admin-ops-copy'
import core from './messages/core'

export const t = createTranslator({ locale: 'vi', messages: { ...core, adminOpsCopy } })
