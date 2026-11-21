import { extname } from 'node:path'

import { Injectable } from '@nestjs/common'

import {
  capImages,
  compactImages,
  extractDocx,
  stitchRuns,
} from '@/modules/media/infrastructure/extractors/docx'
import { extractPdf } from '@/modules/media/infrastructure/extractors/pdf'
import { extractPptxSlides } from '@/modules/media/infrastructure/extractors/pptx'
import { capped } from '@/modules/media/infrastructure/extractors/text'
import { extractXlsx } from '@/modules/media/infrastructure/extractors/xlsx'
import { assertSafeZip } from '@/modules/media/infrastructure/extractors/zip-guard'

import type {
  ExtractedFile,
  FileExtractorPort,
} from '@/modules/media/application/ports/file-extractor.port'

@Injectable()
export class FileExtractorAdapter implements FileExtractorPort {
  async extract(name: string, data: Buffer, marks: boolean): Promise<ExtractedFile> {
    const ext = extname(name).toLowerCase()
    try {
      if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx') assertSafeZip(data)
      if (ext === '.docx') {
        const doc = await extractDocx(data, marks)
        const cut = capped(doc.text)
        const warning = [doc.warning, cut.warning].filter(Boolean).join(' ') || undefined
        if (!marks) return { name, kind: 'docx', text: cut.text, warning }
        const stitched = await stitchRuns(cut.text, doc.images)
        const first = compactImages(stitched.text, stitched.images)
        const capped2 = capImages(first.text, first.images)
        const packed = compactImages(capped2.text, capped2.images)
        const note = capped2.dropped
          ? `${capped2.dropped} ảnh vượt giới hạn trả về bị bỏ.`
          : undefined
        return {
          name,
          kind: 'docx',
          text: packed.text,
          ...(packed.images.length > 0 ? { images: packed.images } : {}),
          warning: [warning, note].filter(Boolean).join(' ') || undefined,
        }
      }
      if (ext === '.pdf') {
        const { text, warning } = capped(await extractPdf(data, marks))
        return { name, kind: 'pdf', text, warning }
      }
      if (ext === '.xlsx') {
        const { text, warning } = capped(await extractXlsx(data))
        return { name, kind: 'xlsx', text, warning }
      }
      if (ext === '.pptx') {
        const slides = await extractPptxSlides(data)
        const { text, warning } = capped(slides.join('\n\n'))
        return { name, kind: 'pptx', text, slides, warning }
      }
      if (ext === '.csv' || ext === '.txt' || ext === '.md' || ext === '.json') {
        const { text, warning } = capped(data.toString('utf8'))
        return { name, kind: 'text', text, warning }
      }
      if (ext === '.doc' || ext === '.xls' || ext === '.ppt') {
        return {
          name,
          kind: 'unsupported',
          text: '',
          warning:
            'Định dạng .doc/.xls/.ppt cũ chưa đọc được; hãy lưu lại thành .docx/.xlsx/.pptx.',
        }
      }
      return {
        name,
        kind: 'unsupported',
        text: '',
        warning: 'Chưa hỗ trợ đọc nội dung định dạng này.',
      }
    } catch (error) {
      return {
        name,
        kind: 'unsupported',
        text: '',
        warning: `Không đọc được tệp: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}
