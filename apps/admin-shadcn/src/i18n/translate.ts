import { createTranslator } from 'next-intl'

import messages from './messages/vi'

export const t = createTranslator({ locale: 'vi', messages })
