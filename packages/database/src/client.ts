import { createClient } from '@supabase/supabase-js'

import type { Database } from './types.generated'

// Standard Supabase client for non-SSR contexts (Edge Functions, CLI scripts).
// For Next.js SSR use apps/web/lib/supabase/server.ts and client.ts instead.
export function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient<Database>(supabaseUrl, supabaseKey)
}
