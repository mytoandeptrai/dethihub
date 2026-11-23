import { Module } from '@nestjs/common'

import { FILE_EXTRACTOR } from '@/modules/media/application/ports/file-extractor.port'
import { IMAGE_GENERATOR } from '@/modules/media/application/ports/image-generator.port'
import { FigureService } from '@/modules/media/application/services/figure.service'
import { FileExtractService } from '@/modules/media/application/services/file-extract.service'
import { ImageGenerationService } from '@/modules/media/application/services/image-generation.service'
import { MediaMeterService } from '@/modules/media/application/services/media-meter.service'
import { SourceVisionService } from '@/modules/media/application/services/source-vision.service'
import { FileExtractorAdapter } from '@/modules/media/infrastructure/adapters/file-extractor.adapter'
import { ImageGeneratorAdapter } from '@/modules/media/infrastructure/adapters/image-generator.adapter'
import { MediaController } from '@/modules/media/presentation/controllers/media.controller'

@Module({
  controllers: [MediaController],
  providers: [
    FileExtractService,
    SourceVisionService,
    ImageGenerationService,
    FigureService,
    MediaMeterService,
    { provide: FILE_EXTRACTOR, useClass: FileExtractorAdapter },
    { provide: IMAGE_GENERATOR, useClass: ImageGeneratorAdapter },
  ],
})
export class MediaModule {}
