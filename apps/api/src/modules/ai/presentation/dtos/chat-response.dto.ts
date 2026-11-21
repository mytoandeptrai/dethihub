import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { QuotaDto } from '@/modules/ai/presentation/dtos/quota-response.dto'

import type { ChatReply } from '@/modules/ai/application/services/chat.service'
import type { Quota } from '@/modules/ai/domain/quota'

class CitationDto {
  @ApiProperty()
  url!: string

  @ApiProperty()
  title!: string
}

export class ChatResponseDto {
  @ApiProperty()
  content!: string

  @ApiProperty()
  reasoning!: string

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  usage!: object | null

  @ApiProperty()
  finishReason!: string

  @ApiProperty({ type: QuotaDto, nullable: true })
  quota!: Quota | null

  @ApiPropertyOptional({
    description: 'Send as X-Ai-Retry-Of to retry an unusable reply with a refund',
  })
  receipt?: string

  @ApiPropertyOptional({ type: CitationDto, isArray: true })
  citations?: CitationDto[]

  static from(reply: ChatReply): ChatResponseDto {
    return Object.assign(new ChatResponseDto(), reply)
  }
}
