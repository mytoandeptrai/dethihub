import { AppShellContainer } from '@/modules/shell'
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <AppShellContainer>{children}</AppShellContainer>
}
