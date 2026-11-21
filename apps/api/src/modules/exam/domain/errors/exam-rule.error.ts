export type ExamRuleViolation = 'not-owner' | 'removed' | 'under-review'

export class ExamRuleError extends Error {
  readonly violation: ExamRuleViolation

  constructor(violation: ExamRuleViolation) {
    super(`Exam rule violated: ${violation}`)
    this.violation = violation
  }
}
