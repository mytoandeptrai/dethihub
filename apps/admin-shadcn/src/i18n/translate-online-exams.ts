import { createTranslator } from 'next-intl'

import core from './messages/core'
import onlineExamsCopy from './messages/online-exams-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, onlineExamsCopy } })
