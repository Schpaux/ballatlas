import { SiteHeader } from './SiteHeader'

export function RegistryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <SiteHeader />
      <main>{children}</main>
    </div>
  )
}
