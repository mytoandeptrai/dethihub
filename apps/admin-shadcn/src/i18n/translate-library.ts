import { createTranslator } from 'next-intl'

import core from './messages/core'
import libraryCopy from './messages/library-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, libraryCopy } })
