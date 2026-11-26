import ProductFontPreloads from '@/components/product-font-preloads'
import { PublicLinks } from '@/components/seo/public-links'
import { getServerSupabase } from '@/lib/supabase/server'
import MarketingContainer from '@/modules/public-pages/containers/marketing-container/marketing-container'
import AppShellContainer from '@/modules/shell/containers/app-shell-container/app-shell-container'

import type { ReactNode } from 'react'

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return (
      <>
        <ProductFontPreloads />
        <MarketingContainer>{children}</MarketingContainer>
      </>
    )
  return (
    <AppShellContainer>
      {children}
      <footer>
        <PublicLinks />
      </footer>
    </AppShellContainer>
  )
}
