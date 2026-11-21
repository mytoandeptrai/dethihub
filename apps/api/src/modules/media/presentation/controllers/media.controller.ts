import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { memoryStorage } from 'multer'

import { FigureService } from '@/modules/media/application/services/figure.service'
import { FileExtractService } from '@/modules/media/application/services/file-extract.service'
import { ImageGenerationService } from '@/modules/media/application/services/image-generation.service'
import { SourceVisionService } from '@/modules/media/application/services/source-vision.service'
import { MAX_EXTRACT_BYTES } from '@/modules/media/domain/policies/extract-input.policy'
import {
  ExtractBodyDto,
  ExtractedFileResponseDto,
  FigureBodyDto,
  FigureResponseDto,
  ImageBodyDto,
  ImageResponseDto,
  VisionBodyDto,
  VisionResponseDto,
} from '@/modules/media/presentation/dtos/media.dto'
import { CheckMaintenance } from '@/shared-kernel/infrastructure/decorators/check-maintenance.decorator'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'
import { SkipTimeout } from '@/shared-kernel/infrastructure/decorators/skip-timeout.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly extracts: FileExtractService,
    private readonly vision: SourceVisionService,
    private readonly images: ImageGenerationService,
    private readonly figures: FigureService,
  ) {}

  @Post('extract')
  @RateLimit('extract')
  @SkipTimeout()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_EXTRACT_BYTES, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ExtractBodyDto })
  @ApiOperation({ summary: 'Read the text of a docx, pdf, xlsx, pptx or text file' })
  @ApiResponse({ status: 201, type: ExtractedFileResponseDto })
  async extract(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: ExtractBodyDto,
  ): Promise<ExtractedFileResponseDto> {
    if (!file) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Thiếu tệp tải lên.' })
    }
    // multer reads the header as latin1, which garbles Vietnamese file names
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8')
    return ExtractedFileResponseDto.from(
      await this.extracts.extract(name, file.buffer, body.marks === true),
    )
  }

  @Post('extract/vision')
  @RateLimit('extract')
  @CheckMaintenance()
  @SkipTimeout()
  @ApiOperation({ summary: 'Read scanned PDF pages (up to 3 images) with a vision model' })
  @ApiResponse({ status: 201, type: VisionResponseDto })
  async readPages(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: VisionBodyDto,
  ): Promise<VisionResponseDto> {
    return this.vision.readPages(user.id, body.images)
  }

  @Post('images')
  @RateLimit('image')
  @CheckMaintenance()
  @SkipTimeout()
  @ApiOperation({ summary: 'Draw an AI image; costs AI points' })
  @ApiResponse({ status: 201, type: ImageResponseDto })
  async drawImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ImageBodyDto,
  ): Promise<ImageResponseDto> {
    const image = await this.images.draw(user.id, body.prompt)
    return {
      dataUrl: `data:${image.mime};base64,${image.buffer.toString('base64')}`,
      quota: image.quota,
    }
  }

  @Post('figures')
  @RateLimit('image')
  @CheckMaintenance()
  @SkipTimeout()
  @ApiOperation({ summary: 'Get a shared figure by English name; drawn once, free afterwards' })
  @ApiResponse({ status: 201, type: FigureResponseDto })
  getFigure(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: FigureBodyDto,
  ): Promise<FigureResponseDto> {
    return this.figures.getOrDraw(user.id, body.en)
  }
}
