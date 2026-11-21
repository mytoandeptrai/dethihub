import { BadRequestException, Inject, Injectable, PayloadTooLargeException } from '@nestjs/common'

import { FILE_EXTRACTOR } from '@/modules/media/application/ports/file-extractor.port'
import { MAX_EXTRACT_BYTES } from '@/modules/media/domain/policies/extract-input.policy'
import { ErrorCode } from '@/shared-kernel/infrastructure/enums/error-code'

import type {
  ExtractedFile,
  FileExtractorPort,
} from '@/modules/media/application/ports/file-extractor.port'

@Injectable()
export class FileExtractService {
  constructor(@Inject(FILE_EXTRACTOR) private readonly extractor: FileExtractorPort) {}

  extract(name: string, data: Buffer, marks: boolean): Promise<ExtractedFile> {
    if (data.length === 0) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Tệp rỗng' })
    }
    if (data.length > MAX_EXTRACT_BYTES) {
      throw new PayloadTooLargeException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Tệp quá lớn (tối đa 12 MB).',
      })
    }
    return this.extractor.extract(name, data, marks)
  }
}
