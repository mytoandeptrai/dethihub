import { createTranslator } from 'next-intl'

import core from './messages/core'
import publicCopy from './messages/public-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, publicCopy } })
