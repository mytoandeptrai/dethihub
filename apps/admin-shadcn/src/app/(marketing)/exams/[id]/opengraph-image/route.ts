import Image from '@/app/(marketing)/exams/[id]/opengraph-image'

export function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return Image(context)
}
