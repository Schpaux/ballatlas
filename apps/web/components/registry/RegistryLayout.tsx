import { SiteHeader } from './SiteHeader'

export function RegistryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100">
      {/* ── Atmospheric background ─────────────────────────────────────────────
          Fixed so the lighting stays in place as the page scrolls.
          Creates the physical-space depth that makes glass cards legible.
       ──────────────────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {/* Primary atmosphere: large emerald bloom, top-center */}
        <div className="animate-atmosphere-drift absolute -top-16 left-1/2 h-[680px] w-[1100px] -translate-x-1/2 rounded-full bg-emerald-500/[0.034] blur-[140px]" />

        {/* Secondary: cooler teal accent, mid-right */}
        <div className="absolute right-[8%] top-[28%] h-[380px] w-[480px] rounded-full bg-teal-500/[0.018] blur-[120px]" />

        {/* Tertiary: warm base, bottom-left — grounds the space */}
        <div className="absolute -bottom-16 left-[8%] h-[340px] w-[420px] rounded-full bg-emerald-900/[0.048] blur-[100px]" />
      </div>

      <SiteHeader />
      <main className="relative">{children}</main>
    </div>
  )
}
