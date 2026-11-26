'use client'
import {
  QuizLegendRowUi,
  QuizQuestionCardUi,
  QuizResultViewUi,
  QuizReviewViewUi,
  QuizShortAnswerInputUi,
  QuizTrueFalseInputUi,
  QuizUi,
} from '@/modules/student-exams/components'
import { QuizModel } from '@/modules/student-exams/hooks'

export function QuizContainer(...args: Parameters<typeof QuizModel.useQuizContainer>) {
  const props = QuizModel.useQuizContainer(...args)
  return <QuizUi {...props} parts={QuizParts} />
}

export function LegendRowContainer(...args: Parameters<typeof QuizModel.useLegendRowContainer>) {
  const props = QuizModel.useLegendRowContainer(...args)
  return <QuizLegendRowUi {...props} parts={QuizParts} />
}

export function QuestionCardContainer(
  ...args: Parameters<typeof QuizModel.useQuestionCardContainer>
) {
  const props = QuizModel.useQuestionCardContainer(...args)
  return <QuizQuestionCardUi {...props} parts={QuizParts} />
}

export function ReviewViewContainer(...args: Parameters<typeof QuizModel.useReviewViewContainer>) {
  const props = QuizModel.useReviewViewContainer(...args)
  return <QuizReviewViewUi {...props} parts={QuizParts} />
}

export function TrueFalseInputContainer(
  ...args: Parameters<typeof QuizModel.useTrueFalseInputContainer>
) {
  const props = QuizModel.useTrueFalseInputContainer(...args)
  return <QuizTrueFalseInputUi {...props} parts={QuizParts} />
}

export function ShortAnswerInputContainer(
  ...args: Parameters<typeof QuizModel.useShortAnswerInputContainer>
) {
  const props = QuizModel.useShortAnswerInputContainer(...args)
  return <QuizShortAnswerInputUi {...props} parts={QuizParts} />
}

export function ResultViewContainer(...args: Parameters<typeof QuizModel.useResultViewContainer>) {
  const props = QuizModel.useResultViewContainer(...args)
  return <QuizResultViewUi {...props} parts={QuizParts} />
}

export const QuizParts = {
  Quiz: QuizContainer,
  LegendRow: LegendRowContainer,
  QuestionCard: QuestionCardContainer,
  ReviewView: ReviewViewContainer,
  TrueFalseInput: TrueFalseInputContainer,
  ShortAnswerInput: ShortAnswerInputContainer,
  ResultView: ResultViewContainer,
}
export default QuizContainer
