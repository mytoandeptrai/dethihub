import { ApiProperty } from '@nestjs/swagger'

import type { CreditEvent } from '@/modules/ai/application/ports/credit.repository.port'

export class CreditEventResponseDto {
  @ApiProperty()
  id!: number

  @ApiProperty({ example: 'welcome' })
  kind!: string

  @ApiProperty()
  tokens!: number

  @ApiProperty()
  createdAt!: string

  static from(event: CreditEvent): CreditEventResponseDto {
    return Object.assign(new CreditEventResponseDto(), {
      id: event.id,
      kind: event.kind,
      tokens: event.tokens,
      createdAt: event.createdAt.toISOString(),
    })
  }
}
