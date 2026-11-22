/** What an AI call was for, derived from the task name and its server-checked input (never a label the client picks) */
export function aiKind(task: unknown, input: unknown): string {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  switch (task) {
    case 'soan-de':
      return o['intent'] === 'chat' ? 'question' : 'task-doc'
    case 'hoi-truoc':
      return 'ask-clarify'
    case 'slide-chat':
      if (o['variant'] === 'chat') return 'question'
      return o['variant'] === 'html' ? 'task-slide-html' : 'task-slide'
    case 'slide-lo':
    case 'slide-trang':
      return 'task-slide'
    case 'slide-sua':
    case 'sua-slide':
      return 'edit-slide'
    case 'bang-ve':
      return 'board'
    case 'tim-web':
      return 'web-search'
    case 'de-online':
      return 'task-exam-online'
    case 'sua-cau':
      return 'edit-question'
    case 've-do-thi':
    case 'chon-hinh':
      return 'figure'
    case 'ngan-hang':
      return 'bank'
    case 'ma-tran':
      return 'matrix'
    default:
      return typeof task === 'string' ? 'other' : 'untagged'
  }
}
