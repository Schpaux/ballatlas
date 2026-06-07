import { createClient } from '@supabase/supabase-js'

import type { Database } from '@ballatlas/database'

// Import pipeline uses the service role key to bypass RLS.
// This module is server-only — never used in browser code.
export function createImportClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  })
}
