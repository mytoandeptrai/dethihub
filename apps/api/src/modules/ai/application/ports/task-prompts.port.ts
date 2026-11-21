export interface TaskPrompts {
  /** system prompt of the task; null when the task is unknown or its input has the wrong shape */
  build(task: unknown, input: unknown): string | null
}

export const TASK_PROMPTS = Symbol('TASK_PROMPTS')
