import { createTranslator } from 'next-intl'

import core from './messages/core'
import profileCopy from './messages/profile-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, profileCopy } })
