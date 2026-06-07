#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Dataset quality report — reads raw JSON files and prints stats + issues.
 * Does not connect to the database.
 *
 * Usage:
 *   pnpm dataset:report
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  RawBrandsFileSchema,
  RawFamiliesFileSchema,
  RawVersionsFileSchema,
  RawAliasesFileSchema,
} from '@ballatlas/validators'

function load<T>(filename: string, schema: { parse: (d: unknown) => T }): T {
  const path = resolve(__dirname, '..', 'raw', filename)
  return schema.parse(JSON.parse(readFileSync(path, 'utf-8')))
}

function header(title: string) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(60))
}

function main() {
  const brands = load('brands.json', RawBrandsFileSchema)
  const families = load('families.json', RawFamiliesFileSchema)
  const versions = load('versions.json', RawVersionsFileSchema)
  const aliases = load('aliases.json', RawAliasesFileSchema)

  // ─── Overview ──────────────────────────────────────────────────────────────
  header('DATASET OVERVIEW')
  console.log(`  Brands:    ${brands.length}`)
  console.log(`  Families:  ${families.length}`)
  console.log(`  Versions:  ${versions.length}`)
  console.log(`  Aliases:   ${aliases.length}`)

  // ─── Versions by brand ──────────────────────────────────────────────────────
  header('VERSIONS BY BRAND')
  const countByBrand = new Map<string, number>()
  for (const v of versions) {
    countByBrand.set(v.brand_slug, (countByBrand.get(v.brand_slug) ?? 0) + 1)
  }
  for (const [slug, count] of [...countByBrand.entries()].sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round(count / 2))
    console.log(`  ${slug.padEnd(20)} ${String(count).padStart(3)}  ${bar}`)
  }

  // ─── Versions by segment ────────────────────────────────────────────────────
  header('VERSIONS BY SEGMENT')
  const countBySegment = new Map<string, number>()
  let noSegment = 0
  for (const v of versions) {
    if (!v.segments || v.segments.length === 0) {
      noSegment++
    } else {
      for (const s of v.segments) {
        countBySegment.set(s, (countBySegment.get(s) ?? 0) + 1)
      }
    }
  }
  for (const [seg, count] of [...countBySegment.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${seg.padEnd(20)} ${count}`)
  }
  if (noSegment > 0) console.log(`  (no segment)         ${noSegment}`)

  // ─── Missing fields ─────────────────────────────────────────────────────────
  header('DATA COMPLETENESS')
  let missingYear = 0
  let missingSpecs = 0
  let missingVisual = 0
  let missingFeatures = 0
  let missingMsrp = 0

  for (const v of versions) {
    if (!v.release_year) missingYear++
    if (!v.specs) missingSpecs++
    if (!v.visual) missingVisual++
    if (!v.features || v.features.length === 0) missingFeatures++
    if (!v.msrp_usd) missingMsrp++
  }

  const pct = (n: number) => `${n} (${Math.round((n / versions.length) * 100)}%)`
  console.log(`  Missing release_year:  ${pct(missingYear)}`)
  console.log(`  Missing specs:         ${pct(missingSpecs)}`)
  console.log(`  Missing visual:        ${pct(missingVisual)}`)
  console.log(`  Missing features:      ${pct(missingFeatures)}`)
  console.log(`  Missing msrp_usd:      ${pct(missingMsrp)}`)

  // ─── Duplicate slug check ───────────────────────────────────────────────────
  header('DUPLICATE CHECK')
  const slugCounts = new Map<string, number>()
  for (const v of versions) {
    slugCounts.set(v.slug, (slugCounts.get(v.slug) ?? 0) + 1)
  }
  const duplicates = [...slugCounts.entries()].filter(([, c]) => c > 1)
  if (duplicates.length === 0) {
    console.log('  ✓ No duplicate version slugs')
  } else {
    console.log(`  ✗ ${duplicates.length} duplicate slug(s) found:`)
    for (const [slug, count] of duplicates) {
      console.log(`    ${slug} (${count}x)`)
    }
  }

  // ─── Referential integrity ──────────────────────────────────────────────────
  header('REFERENTIAL INTEGRITY')
  const brandSlugs = new Set(brands.map((b) => b.slug))
  const familyKeys = new Set(families.map((f) => `${f.brand_slug}::${f.slug}`))
  const versionSlugs = new Set(versions.map((v) => v.slug))

  const orphanedFamilies = families.filter((f) => !brandSlugs.has(f.brand_slug))
  const orphanedVersions = versions.filter(
    (v) => !familyKeys.has(`${v.brand_slug}::${v.family_slug}`)
  )
  const orphanedAliases = aliases.filter((a) => !versionSlugs.has(a.version_slug))

  if (
    orphanedFamilies.length === 0 &&
    orphanedVersions.length === 0 &&
    orphanedAliases.length === 0
  ) {
    console.log('  ✓ All references valid')
  } else {
    if (orphanedFamilies.length > 0) {
      console.log(`  ✗ Families with missing brand (${orphanedFamilies.length}):`)
      for (const f of orphanedFamilies) console.log(`    ${f.brand_slug}/${f.slug}`)
    }
    if (orphanedVersions.length > 0) {
      console.log(`  ✗ Versions with missing family (${orphanedVersions.length}):`)
      for (const v of orphanedVersions)
        console.log(`    ${v.slug} → ${v.brand_slug}::${v.family_slug}`)
    }
    if (orphanedAliases.length > 0) {
      console.log(`  ✗ Aliases with missing version (${orphanedAliases.length}):`)
      for (const a of orphanedAliases) console.log(`    "${a.alias}" → ${a.version_slug}`)
    }
  }

  // ─── Versions missing from families ────────────────────────────────────────
  header('FAMILIES WITH NO VERSIONS')
  const familiesWithVersions = new Set(versions.map((v) => `${v.brand_slug}::${v.family_slug}`))
  const emptyFamilies = families.filter(
    (f) => !familiesWithVersions.has(`${f.brand_slug}::${f.slug}`)
  )
  if (emptyFamilies.length === 0) {
    console.log('  ✓ All families have at least one version')
  } else {
    console.log(`  ${emptyFamilies.length} family/families with no versions:`)
    for (const f of emptyFamilies) console.log(`    ${f.brand_slug}/${f.slug}`)
  }

  // ─── Year range ─────────────────────────────────────────────────────────────
  header('YEAR RANGE')
  const years = versions.map((v) => v.release_year).filter((y): y is number => y != null)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  console.log(`  Oldest:  ${minYear}`)
  console.log(`  Newest:  ${maxYear}`)
  const byDecade: Record<string, number> = {}
  for (const y of years) {
    const decade = `${Math.floor(y / 10) * 10}s`
    byDecade[decade] = (byDecade[decade] ?? 0) + 1
  }
  for (const [decade, count] of Object.entries(byDecade).sort()) {
    console.log(`  ${decade}:  ${count}`)
  }

  console.log('\n' + '─'.repeat(60) + '\n')
}

main()
