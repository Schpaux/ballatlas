#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Validate raw seed data without touching the database.
 * Usage: pnpm validate:balls
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  RawBrandsFileSchema,
  RawFamiliesFileSchema,
  RawVersionsFileSchema,
} from '@ballatlas/validators'

function loadJson(filename: string): unknown {
  const path = resolve(__dirname, '..', 'raw', filename)
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function printResult(label: string, count: number, errors: string[]) {
  const status = errors.length === 0 ? '✓' : '✗'
  console.log(`${status} ${label}: ${count} records`)
  for (const err of errors) {
    console.error(`  → ${err}`)
  }
}

function main() {
  console.log('\nBallAtlas Seed Data Validation\n' + '─'.repeat(40))
  let totalErrors = 0

  // Validate brands
  const rawBrands = loadJson('brands.json')
  const brandsResult = RawBrandsFileSchema.safeParse(rawBrands)
  if (!brandsResult.success) {
    const errs = brandsResult.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`)
    printResult('brands.json', 0, errs)
    totalErrors += errs.length
  } else {
    printResult('brands.json', brandsResult.data.length, [])
  }

  // Validate families
  const rawFamilies = loadJson('families.json')
  const familiesResult = RawFamiliesFileSchema.safeParse(rawFamilies)
  if (!familiesResult.success) {
    const errs = familiesResult.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`)
    printResult('families.json', 0, errs)
    totalErrors += errs.length
  } else {
    // Cross-check: every brand_slug in families must exist in brands
    if (brandsResult.success) {
      const brandSlugs = new Set(brandsResult.data.map((b) => b.slug))
      const missingBrands = familiesResult.data
        .filter((f) => !brandSlugs.has(f.brand_slug))
        .map((f) => `Family "${f.name}" references unknown brand_slug "${f.brand_slug}"`)
      printResult('families.json', familiesResult.data.length, missingBrands)
      totalErrors += missingBrands.length
    } else {
      printResult('families.json', familiesResult.data.length, [])
    }
  }

  // Validate versions
  const rawVersions = loadJson('versions.json')
  const versionsResult = RawVersionsFileSchema.safeParse(rawVersions)
  if (!versionsResult.success) {
    const errs = versionsResult.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`)
    printResult('versions.json', 0, errs)
    totalErrors += errs.length
  } else {
    const crossErrors: string[] = []
    if (familiesResult.success && brandsResult.success) {
      const familyKey = (brandSlug: string, familySlug: string) => `${brandSlug}::${familySlug}`
      const familyKeys = new Set(familiesResult.data.map((f) => familyKey(f.brand_slug, f.slug)))
      for (const v of versionsResult.data) {
        const key = familyKey(v.brand_slug, v.family_slug)
        if (!familyKeys.has(key)) {
          crossErrors.push(
            `Version "${v.name}" references unknown brand_slug="${v.brand_slug}" family_slug="${v.family_slug}"`
          )
        }
      }
      // Check for duplicate slugs
      const slugsSeen = new Set<string>()
      for (const v of versionsResult.data) {
        if (slugsSeen.has(v.slug)) {
          crossErrors.push(`Duplicate version slug: "${v.slug}"`)
        }
        slugsSeen.add(v.slug)
      }
    }
    printResult('versions.json', versionsResult.data.length, crossErrors)
    totalErrors += crossErrors.length
  }

  console.log('\n' + '─'.repeat(40))
  if (totalErrors === 0) {
    console.log('✓ All data valid. Ready to import.\n')
    process.exit(0)
  } else {
    console.error(`✗ ${totalErrors} error(s) found. Fix before importing.\n`)
    process.exit(1)
  }
}

main()
