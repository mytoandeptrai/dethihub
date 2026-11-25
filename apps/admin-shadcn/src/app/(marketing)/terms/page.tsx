import { LegalContainer } from '@/modules/public-pages'
import { publicPageMetadata } from '@/modules/public-pages/public-page-seo'

export const metadata = publicPageMetadata('terms')
export default function TermsPage() {
  return <LegalContainer kind="terms" />
}
