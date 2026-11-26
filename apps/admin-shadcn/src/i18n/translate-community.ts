import { createTranslator } from 'next-intl'

import communityCopy from './messages/community-copy'
import core from './messages/core'

export const t = createTranslator({ locale: 'vi', messages: { ...core, communityCopy } })
