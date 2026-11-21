import { Injectable } from '@nestjs/common'

import { buildTaskSystem } from '@/modules/ai/infrastructure/prompts/task-registry'

import type { TaskPrompts } from '@/modules/ai/application/ports/task-prompts.port'

@Injectable()
export class TaskPromptsAdapter implements TaskPrompts {
  build(task: unknown, input: unknown): string | null {
    return buildTaskSystem(task, input)
  }
}
