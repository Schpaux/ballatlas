import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Session refresh via @supabase/ssr is restored here when auth is implemented (Phase 4+).
// Supabase-js uses process.version which crashes Edge Runtime — Node.js middleware
// support is not stable across Next.js 15.x patch versions yet.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
