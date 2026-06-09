import type { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function buildLogoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${storagePath}`
}

export async function resolveBrandLogoUrl(
  supabase: SupabaseClient,
  brandId: string,
  legacyUrl?: string | null
): Promise<string | null> {
  const { data } = await supabase
    .from('brand_assets')
    .select('storage_path, asset_type')
    .eq('brand_id', brandId)
    .eq('review_status', 'approved')
    .in('asset_type', ['logo_svg', 'logo_png'])
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(2)

  const svg = data?.find((a) => a.asset_type === 'logo_svg')
  const png = data?.find((a) => a.asset_type === 'logo_png')
  const asset = svg ?? png

  if (asset) return buildLogoUrl(asset.storage_path)
  return legacyUrl ?? null
}

// Fetches logos for multiple brands in a single query. SVG preferred over PNG.
export async function resolveBrandLogoUrlsBatch(
  supabase: SupabaseClient,
  brandIds: string[]
): Promise<Map<string, string>> {
  if (brandIds.length === 0) return new Map()

  const { data } = await supabase
    .from('brand_assets')
    .select('brand_id, storage_path, asset_type')
    .eq('review_status', 'approved')
    .in('asset_type', ['logo_svg', 'logo_png'])
    .in('brand_id', brandIds)
    // 'logo_svg' > 'logo_png' alphabetically — descending puts SVG first
    .order('asset_type', { ascending: false })
    .order('quality_score', { ascending: false, nullsFirst: false })

  const result = new Map<string, string>()
  for (const asset of data ?? []) {
    if (!result.has(asset.brand_id)) {
      result.set(asset.brand_id, buildLogoUrl(asset.storage_path))
    }
  }
  return result
}
