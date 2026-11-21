import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { memoryStorage } from 'multer'

import { FileUploadService } from '@/modules/storage/application/services/file-upload.service'
import { UserDocumentService } from '@/modules/storage/application/services/user-document.service'
import {
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
} from '@/modules/storage/domain/policies/file-key.policy'
import {
  DocumentParamsDto,
  DocumentResponseDto,
  KindUsageDto,
  StorageUsageResponseDto,
  UploadDocumentBodyDto,
  UploadFileBodyDto,
  UploadImageResponseDto,
} from '@/modules/storage/presentation/dtos/storage.dto'
import { CheckMaintenance } from '@/shared-kernel/infrastructure/decorators/check-maintenance.decorator'
import { CurrentUser } from '@/shared-kernel/infrastructure/decorators/current-user.decorator'
import { RateLimit } from '@/shared-kernel/infrastructure/decorators/rate-limit.decorator'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type { AuthenticatedUser } from '@/shared-kernel/infrastructure/types/authenticated-user'

const upload = (limit: number) =>
  FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: limit, files: 1 } })

const requireFile = (file: Express.Multer.File | undefined): Buffer => {
  if (!file) {
    throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Thiếu tệp tải lên.' })
  }
  return file.buffer
}

@ApiTags('storage')
@ApiBearerAuth()
@ApiExtraModels(KindUsageDto)
@RateLimit('upload')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly uploads: FileUploadService,
    private readonly documents: UserDocumentService,
  ) {}

  @Post('images')
  @CheckMaintenance()
  @UseInterceptors(upload(MAX_IMAGE_BYTES))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileBodyDto })
  @ApiOperation({ summary: 'Upload an image (PNG, JPEG, WebP, GIF; up to 8 MB)' })
  @ApiResponse({ status: 201, type: UploadImageResponseDto })
  uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UploadImageResponseDto> {
    return this.uploads.uploadImage(user.id, requireFile(file))
  }

  @Post('documents')
  @CheckMaintenance()
  @UseInterceptors(upload(MAX_DOCUMENT_BYTES))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentBodyDto })
  @ApiOperation({ summary: 'Upload a private document (PDF or DOCX; up to 20 MB)' })
  @ApiResponse({ status: 201, type: DocumentResponseDto })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadDocumentBodyDto,
  ): Promise<DocumentResponseDto> {
    const record = await this.uploads.uploadDocument(user.id, requireFile(file), body)
    return DocumentResponseDto.from(record)
  }

  @Get('documents')
  @ApiOperation({ summary: 'Documents uploaded by the current user' })
  @ApiResponse({ status: 200, type: DocumentResponseDto, isArray: true })
  async listDocuments(@CurrentUser() user: AuthenticatedUser): Promise<DocumentResponseDto[]> {
    const rows = await this.documents.list(user.id)
    return rows.map((row) => DocumentResponseDto.from(row))
  }

  @Delete('documents/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a document and its stored file' })
  async removeDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: DocumentParamsDto,
  ): Promise<void> {
    await this.documents.remove(user.id, params.id)
  }

  @Get('usage')
  @ApiOperation({ summary: 'Storage used and allowed for the current user' })
  @ApiResponse({ status: 200, type: StorageUsageResponseDto })
  async usage(@CurrentUser() user: AuthenticatedUser): Promise<StorageUsageResponseDto> {
    return StorageUsageResponseDto.from(await this.documents.usage(user.id))
  }
}
