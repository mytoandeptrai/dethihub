import { createTranslator } from 'next-intl'

import core from './messages/core'
import examInspectorCopy from './messages/exam-inspector-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, examInspectorCopy } })
