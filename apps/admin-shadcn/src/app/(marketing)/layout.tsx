import ProductFontPreloads from '@/components/product-font-preloads'
import { MarketingContainer } from '@/modules/public-pages'
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProductFontPreloads />
      <MarketingContainer>{children}</MarketingContainer>
    </>
  )
}
