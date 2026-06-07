// @ballatlas/database
//
// Exports:
//   - Database types (auto-generated from Supabase schema)
//   - Supabase JS client factory (for non-SSR contexts: Edge Functions, scripts)
//   - Environment variable keys (for reference)
//
// SSR-aware clients for Next.js (createServerClient, createBrowserClient)
// live in apps/web/lib/supabase/ — they depend on @supabase/ssr and next/headers.

export type { Database, Json } from './types.generated'
export { createSupabaseClient } from './client'
export { SUPABASE_URL_KEY, SUPABASE_ANON_KEY_KEY, SUPABASE_SERVICE_ROLE_KEY_KEY } from './constants'
