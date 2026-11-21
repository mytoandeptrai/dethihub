import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import type { StudentView } from '@/modules/exam/domain/policies/student-view.policy'

export class PlayResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true, description: 'Exam document' })
  doc!: Record<string, unknown>

  @ApiPropertyOptional({ description: 'Present when answers were withheld' })
  hidden?: boolean

  static from(view: StudentView): PlayResponseDto {
    return Object.assign(new PlayResponseDto(), {
      doc: view.doc as unknown as Record<string, unknown>,
      ...(view.hidden && { hidden: true }),
    })
  }
}

export class GateResponseDto {
  @ApiProperty()
  listed!: boolean

  @ApiProperty()
  attempted!: boolean
}
