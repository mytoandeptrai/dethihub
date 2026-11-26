import { MathText } from './MathText'
import { QuestionBodyView } from './question-body-view'

import type { QuestionBodyProps } from './question-body-view'

export function QuestionBody(props: QuestionBodyProps) {
  return <QuestionBodyView {...props} Text={MathText} />
}
