import { SiteHeader } from './SiteHeader'

export function RegistryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: 'var(--ba-paper)' }}>
      <SiteHeader />
      <main className="relative">{children}</main>
    </div>
  )
}
