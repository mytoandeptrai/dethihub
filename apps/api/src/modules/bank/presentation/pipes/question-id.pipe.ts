import { BadRequestException } from '@nestjs/common'

import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { PipeTransform } from '@nestjs/common'

// Ids come from static questions too, so only the shape is checked
const QUESTION_ID = /^[\w.-]{1,100}$/

export class QuestionIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!QUESTION_ID.test(value)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Mã câu hỏi không hợp lệ.',
      })
    }
    return value
  }
}
