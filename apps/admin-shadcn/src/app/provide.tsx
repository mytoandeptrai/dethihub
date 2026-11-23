'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@workspace/ui/components/sonner'
import { ThemeProvider } from 'next-themes'

import { getQueryClient } from '@/lib/react-query'
import { GlobalContainer } from '@/modules/shell'

export function AppProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <GlobalContainer>{children}</GlobalContainer>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
