import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import type { Database } from '@ballatlas/database'

import { env } from '@/lib/env'

// @supabase/ssr@0.6.1 was built against supabase-js with a 3-param SupabaseClient
// generic. supabase-js@2.107.0 changed to 5 params, making the 3rd positional arg
// (Schema) land in the wrong slot and collapse to never. Casting to SupabaseClient<Database>
// lets the new defaults resolve correctly without changing runtime behaviour.

// Server-side Supabase client for Server Components, Server Actions, Route Handlers.
// Uses the anon key — respects RLS policies.
// Next.js 15: cookies() is async — must be awaited.
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Session refresh is handled by the middleware client.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>
}

// Admin client using the service role key — bypasses RLS.
// ONLY use in trusted server-side contexts (admin operations, migrations, seed scripts).
// NEVER call from Client Components or expose to the browser.
export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as SupabaseClient<Database>
}
