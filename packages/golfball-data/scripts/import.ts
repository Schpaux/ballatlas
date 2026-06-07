#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Import curated seed data into Supabase.
 *
 * Pipeline:
 *   1. LOAD     — Read raw JSON files
 *   2. VALIDATE — Run Zod schemas
 *   3. NORMALIZE — Resolve slugs to IDs, generate DB rows
 *   4. UPSERT  — Insert or update (idempotent via slug conflict)
 *   5. REPORT  — Print summary
 *
 * Usage:
 *   pnpm import:balls              # Full import
 *   pnpm import:balls --dry-run    # Validate + normalize only, no DB writes
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  RawBrandsFileSchema,
  RawFamiliesFileSchema,
  RawVersionsFileSchema,
} from '@ballatlas/validators'

import { createImportClient } from '../imports/client'
import { normalizeBrand, normalizeFamily, normalizeVersion } from '../imports/normalizer'

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Counters ───────────────────────────────────────────────────────────────

type Counter = { inserted: number; skipped: number; failed: number }

function makeCounter(): Counter {
  return { inserted: 0, skipped: 0, failed: 0 }
}

// ─── Load and validate ───────────────────────────────────────────────────────

function loadAndValidate<T>(
  filename: string,
  schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: { message: string } } }
): T {
  const path = resolve(__dirname, '..', 'raw', filename)
  const raw = JSON.parse(readFileSync(path, 'utf-8'))
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Validation failed for ${filename}:\n${result.error?.message}`)
  }
  return result.data as T
}

// ─── Main import ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nBallAtlas Import Pipeline${DRY_RUN ? ' [DRY RUN]' : ''}\n${'─'.repeat(50)}`)

  const brands = loadAndValidate('brands.json', RawBrandsFileSchema)
  const families = loadAndValidate('families.json', RawFamiliesFileSchema)
  const versions = loadAndValidate('versions.json', RawVersionsFileSchema)

  console.log(
    `Loaded: ${brands.length} brands, ${families.length} families, ${versions.length} versions`
  )

  if (DRY_RUN) {
    console.log('\nDry run complete — no changes made.\n')
    return
  }

  const db = createImportClient()

  // ─── Phase 1: Upsert brands ─────────────────────────────────────────────────
  console.log('\nImporting brands...')
  const brandCounter = makeCounter()
  const brandIdBySlug = new Map<string, string>()

  for (const raw of brands) {
    const row = normalizeBrand(raw)
    const { data, error } = await db
      .from('brands')
      .upsert(row, { onConflict: 'slug', ignoreDuplicates: false })
      .select('id, slug')
      .single()

    if (error) {
      console.error(`  ✗ ${row.name}: ${error.message}`)
      brandCounter.failed++
    } else if (data) {
      brandIdBySlug.set(data.slug, data.id)
      brandCounter.inserted++
    }
  }
  printCounter('Brands', brandCounter)

  // ─── Phase 2: Upsert families ───────────────────────────────────────────────
  console.log('\nImporting families...')
  const familyCounter = makeCounter()
  // Key: `{brand_slug}::{family_slug}` → family_id
  const familyIdByKey = new Map<string, string>()

  for (const raw of families) {
    const brandId = brandIdBySlug.get(raw.brand_slug)
    if (!brandId) {
      console.error(`  ✗ Family "${raw.name}": brand_slug "${raw.brand_slug}" not found`)
      familyCounter.failed++
      continue
    }
    const row = normalizeFamily(raw, brandId)
    const { data, error } = await db
      .from('ball_families')
      .upsert(row, { onConflict: 'brand_id,slug', ignoreDuplicates: false })
      .select('id, slug')
      .single()

    if (error) {
      console.error(`  ✗ ${row.name}: ${error.message}`)
      familyCounter.failed++
    } else if (data) {
      familyIdByKey.set(`${raw.brand_slug}::${data.slug}`, data.id)
      familyCounter.inserted++
    }
  }
  printCounter('Families', familyCounter)

  // ─── Phase 3: Upsert versions + related data ─────────────────────────────────
  console.log('\nImporting versions...')
  const versionCounter = makeCounter()

  for (const raw of versions) {
    const key = `${raw.brand_slug}::${raw.family_slug}`
    const familyId = familyIdByKey.get(key)
    if (!familyId) {
      console.error(`  ✗ Version "${raw.name}": family key "${key}" not found`)
      versionCounter.failed++
      continue
    }

    const row = normalizeVersion(raw, familyId)
    const { data: versionData, error: versionError } = await db
      .from('ball_versions')
      .upsert(row, { onConflict: 'slug', ignoreDuplicates: false })
      .select('id')
      .single()

    if (versionError || !versionData) {
      console.error(`  ✗ ${row.name}: ${versionError?.message ?? 'no data returned'}`)
      versionCounter.failed++
      continue
    }

    const versionId = versionData.id
    versionCounter.inserted++

    // Upsert technical specs
    if (raw.specs) {
      await db
        .from('technical_specs')
        .upsert({ ...raw.specs, version_id: versionId }, { onConflict: 'version_id' })
    }

    // Upsert visual signature
    if (raw.visual) {
      await db
        .from('visual_signatures')
        .upsert({ ...raw.visual, version_id: versionId }, { onConflict: 'version_id' })
    }

    // Replace identification features (delete existing, insert fresh)
    if (raw.features && raw.features.length > 0) {
      await db.from('identification_features').delete().eq('version_id', versionId)
      await db
        .from('identification_features')
        .insert(raw.features.map((f) => ({ ...f, version_id: versionId })))
    }

    // Resolve segment slugs and upsert version_segments
    if (raw.segments && raw.segments.length > 0) {
      const { data: segmentRows } = await db
        .from('segments')
        .select('id, slug')
        .in('slug', raw.segments)

      if (segmentRows && segmentRows.length > 0) {
        // Delete and re-insert for idempotency
        await db.from('version_segments').delete().eq('version_id', versionId)
        await db
          .from('version_segments')
          .insert(segmentRows.map((s) => ({ version_id: versionId, segment_id: s.id })))
      }
    }
  }
  printCounter('Versions', versionCounter)

  // ─── Summary ─────────────────────────────────────────────────────────────────
  const totalFailed = brandCounter.failed + familyCounter.failed + versionCounter.failed
  console.log('\n' + '─'.repeat(50))
  if (totalFailed === 0) {
    console.log('✓ Import complete — no errors.\n')
  } else {
    console.error(`✗ Import complete with ${totalFailed} error(s). Review output above.\n`)
    process.exit(1)
  }
}

function printCounter(label: string, c: Counter) {
  console.log(`  ${label}: ${c.inserted} upserted, ${c.skipped} skipped, ${c.failed} failed`)
}

main().catch((err: unknown) => {
  console.error('\nFatal error:', err)
  process.exit(1)
})
