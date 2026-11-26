import { createTranslator } from 'next-intl'

import messages from './messages/core'

export const t = createTranslator({ locale: 'vi', messages })
