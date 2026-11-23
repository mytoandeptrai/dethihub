import { mutationOptions } from '@tanstack/react-query'

import { mediaKeys } from './keys'
import * as requests from './requests'

export const mediaQueries = {
  extract: () => mutationOptions({ mutationKey: [...mediaKeys.all, 'extract'], mutationFn: requests.mediaExtract }),
  readPages: () => mutationOptions({ mutationKey: [...mediaKeys.all, 'read-pages'], mutationFn: requests.mediaReadPages }),
  drawImage: () => mutationOptions({ mutationKey: [...mediaKeys.all, 'draw-image'], mutationFn: requests.mediaDrawImage }),
  figure: () => mutationOptions({ mutationKey: [...mediaKeys.all, 'figure'], mutationFn: requests.mediaGetFigure }),
}
