import { LegalContainer } from '@/modules/public-pages'
import { publicPageMetadata } from '@/modules/public-pages/public-page-seo'

export const metadata = publicPageMetadata('privacy')
export default function PrivacyPage() {
  return <LegalContainer kind="privacy" />
}
