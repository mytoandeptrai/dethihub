import { createTranslator } from 'next-intl'

import core from './messages/core'
import studentCopy from './messages/student-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, studentCopy } })
