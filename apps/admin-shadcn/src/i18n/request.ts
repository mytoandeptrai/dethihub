import { getRequestConfig } from 'next-intl/server'

import messages from './messages/vi'

export default getRequestConfig(async () => ({ locale: 'vi', messages }))
