import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

import type { ExtractedFile } from '@/modules/media/application/ports/file-extractor.port'

export class ExtractBodyDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: unknown

  @ApiPropertyOptional({ type: Boolean, description: 'Keep emphasis markers and embedded images' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  @IsBoolean()
  marks?: boolean
}

export class ExtractedFileResponseDto {
  @ApiProperty() name!: string
  @ApiProperty({ enum: ['docx', 'pdf', 'xlsx', 'pptx', 'text', 'unsupported'] })
  kind!: ExtractedFile['kind']

  @ApiProperty() text!: string
  @ApiPropertyOptional({ type: [String] }) slides?: string[]
  @ApiPropertyOptional({ type: [String] }) images?: string[]
  @ApiPropertyOptional() warning?: string

  static from(file: ExtractedFile): ExtractedFileResponseDto {
    const dto = new ExtractedFileResponseDto()
    dto.name = file.name
    dto.kind = file.kind
    dto.text = file.text
    dto.slides = file.slides
    dto.images = file.images
    dto.warning = file.warning
    return dto
  }
}

export class QuotaDto {
  @ApiProperty() used!: number
  @ApiProperty() limit!: number
  @ApiProperty({ enum: ['month'] }) scope!: 'month'
  @ApiPropertyOptional() base?: number
  @ApiPropertyOptional() credits?: number
}

export class VisionBodyDto {
  @ApiProperty({ type: [String], description: '1 to 3 page images as jpeg/png/webp data URLs' })
  @IsArray()
  images!: unknown[]
}

export class VisionResponseDto {
  @ApiProperty() text!: string
  @ApiProperty({ type: QuotaDto, nullable: true }) quota!: QuotaDto | null
}

export class ImageBodyDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  prompt!: string
}

export class ImageResponseDto {
  @ApiProperty() dataUrl!: string
  @ApiProperty({ type: QuotaDto, nullable: true }) quota!: QuotaDto | null
}

export class FigureBodyDto {
  @ApiProperty({ description: 'English name, letters, spaces and hyphens only' })
  @IsString()
  @MaxLength(40)
  en!: string
}

export class FigureResponseDto {
  @ApiProperty() url!: string
  @ApiProperty() cached!: boolean
  @ApiPropertyOptional({ type: QuotaDto, nullable: true }) quota?: QuotaDto | null
}
