import { createTranslator } from 'next-intl'

import core from './messages/core'
import workspaceCopy from './messages/workspace-copy'

export const t = createTranslator({ locale: 'vi', messages: { ...core, workspaceCopy } })
