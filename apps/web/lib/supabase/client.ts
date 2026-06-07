'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@ballatlas/database'

// Browser (client-side) Supabase client.
// Safe to use in Client Components — only accesses public anon key.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
