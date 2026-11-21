import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsObject } from 'class-validator'

import { ItemKind } from '@/modules/workspace/domain/enums/item-kind.enum'
import {
  IsInField,
  IsStringField,
  MaxLengthField,
  MinLengthField,
} from '@/shared-kernel/infrastructure/decorators/validators'

import type { StoredItem } from '@/modules/workspace/application/ports/workspace-item.repository.port'

const KINDS = Object.values(ItemKind)

const csvToList = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : value

export class ItemKindQueryDto {
  @ApiProperty({ enum: KINDS })
  @IsInField(KINDS)
  kind!: ItemKind
}

export class ItemParamsDto {
  @ApiProperty({ enum: KINDS })
  @IsInField(KINDS)
  kind!: ItemKind

  @ApiProperty({ maxLength: 100 })
  @IsStringField()
  @MinLengthField(1)
  @MaxLengthField(100)
  id!: string
}

export class ItemKindParamDto {
  @ApiProperty({ enum: KINDS })
  @IsInField(KINDS)
  kind!: ItemKind
}

export class DeleteItemsQueryDto {
  @ApiProperty({ description: 'Comma-separated item ids, at most 200' })
  @Transform(csvToList)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsStringField({ each: true })
  @MaxLengthField(100, { each: true })
  ids!: string[]
}

export class SaveItemDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'The whole item, stored as it is',
  })
  @IsObject()
  data!: Record<string, unknown>
}

export class ItemResponseDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ type: 'object', additionalProperties: true })
  data!: Record<string, unknown>

  static from(item: StoredItem): ItemResponseDto {
    return Object.assign(new ItemResponseDto(), item)
  }
}
