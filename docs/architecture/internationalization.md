# Internationalization Architecture

**Phase:** 8 — Internationalization Foundation  
**Library:** next-intl v3  
**Supported locales:** English (`en`), Norwegian (`no`)  
**Default locale:** `en`

---

## Routing Strategy

All public routes are locale-prefixed. The locale is the first path segment.

| English                          | Norwegian                        |
| -------------------------------- | -------------------------------- |
| `/en`                            | `/no`                            |
| `/en/balls/titleist-pro-v1-2025` | `/no/balls/titleist-pro-v1-2025` |
| `/en/brands/titleist`            | `/no/brands/titleist`            |
| `/en/search`                     | `/no/search`                     |
| `/en/compare`                    | `/no/compare`                    |
| `/en/identify`                   | `/no/identify`                   |

Routes excluded from locale routing (no prefix):

- `/admin/*` — internal tooling, no translation requirement
- `/api/*` — JSON API, language-agnostic

**Key files:**

- `i18n/routing.ts` — `defineRouting()` with locales and default
- `i18n/navigation.ts` — `createNavigation()` exports locale-aware `Link`, `useRouter`, `usePathname`, `redirect`, `getPathname`
- `i18n/request.ts` — `getRequestConfig()` loads message files per request

---

## Locale Detection

Priority order on first visit:

1. `NEXT_LOCALE` cookie (set when user switches language)
2. `Accept-Language` request header
3. Default locale (`en`)

The next-intl middleware at `middleware.ts` handles detection and redirects bare paths (e.g., `/balls/pro-v1`) to the detected locale prefix (e.g., `/en/balls/pro-v1`).

**Cookie:** next-intl uses `NEXT_LOCALE` as the cookie name (Next.js platform standard). The language switcher calls `router.replace(pathname, { locale })` which updates the cookie automatically.

---

## Translation File Structure

Messages live in `messages/` at the web app root:

```
messages/
  en.json   ← English (source language)
  no.json   ← Norwegian
```

Structure is hierarchical by feature area:

```json
{
  "navigation": { "browse": "Browse", ... },
  "home": { "tagline": "...", "stats": { "brands": "Brands" } },
  "search": { "placeholder": "Search golf balls…", ... },
  "filters": { "brand": "Brand", ... },
  "ballDetail": { "sections": { ... }, "specs": { ... } },
  "brands": { ... },
  "brandDetail": { ... },
  "compare": { ... },
  "identify": { "form": { ... }, "results": { ... } },
  "feedback": { ... },
  "common": { "notFound": { ... } },
  "languageSwitcher": { ... },
  "metadata": { "home": { ... }, "search": { ... }, ... }
}
```

**Key rules:**

- Keys are semantic (e.g., `search.placeholder`), never flat string names
- All keys remain in English regardless of locale
- ICU message format for plurals: `"{count, plural, one {# result} other {# results}}"`

---

## App Layout Structure

```
app/
  layout.tsx              ← Minimal root (returns children only)
  [locale]/
    layout.tsx            ← HTML + body + NextIntlClientProvider
    page.tsx              ← Home
    search/page.tsx
    balls/[slug]/
      page.tsx
      loading.tsx
      not-found.tsx
      actions.ts          ← Server Actions (feedback submit)
    brands/
      page.tsx
      [slug]/page.tsx
    compare/page.tsx
    identify/page.tsx     ← 'use client' page (uses useTranslations)
  (admin)/admin/…         ← Unchanged, no locale
  api/…                   ← Unchanged, no locale
```

---

## Server vs Client Translation API

| Context                 | API                                       | Example                                         |
| ----------------------- | ----------------------------------------- | ----------------------------------------------- |
| Async Server Components | `getTranslations` from `next-intl/server` | `const t = await getTranslations('navigation')` |
| Sync Server Components  | Pass translated strings as props          | From async parent                               |
| Client Components       | `useTranslations` from `next-intl`        | `const t = useTranslations('filters')`          |
| `generateMetadata`      | `getTranslations({ locale, namespace })`  | Locale from `params`                            |

`NextIntlClientProvider` in `app/[locale]/layout.tsx` bridges messages to client components.

---

## Language Switcher

`components/registry/LanguageSwitcher.tsx` — accessible button group in `SiteHeader`.

- Renders 🇬🇧 / 🇳🇴 flag buttons with `aria-pressed` state
- Calls `router.replace(pathname, { locale })` from next-intl's navigation
- Preserves current page — `/en/balls/pro-v1` → `/no/balls/pro-v1`
- Sets `NEXT_LOCALE` cookie for subsequent visits

---

## SEO

### hreflang

Every page's `generateMetadata` includes `alternates.languages`:

```typescript
alternates: {
  canonical: `${base}/${locale}/balls/${slug}`,
  languages: {
    en: `${base}/en/balls/${slug}`,
    no: `${base}/no/balls/${slug}`,
  }
}
```

This generates `<link rel="alternate" hreflang="…" />` tags.

### Sitemap

`app/sitemap.ts` generates entries for all locales:

- `/en` and `/no` (home)
- `/en/brands` and `/no/brands`
- One entry per brand per locale
- One entry per published ball version per locale
- Search and compare excluded (`robots: { index: false }`)

### Canonical URLs

Locale-specific. `/en/balls/titleist-pro-v1-2025` and `/no/balls/titleist-pro-v1-2025` each have their own canonical.

### Metadata Language

The `<html lang="…">` attribute is set dynamically in `app/[locale]/layout.tsx` using the request locale.

---

## Data Localization Policy

**Only UI strings are localized.** Database content is never translated:

- Brand names (Titleist, Callaway, TaylorMade)
- Family names (Pro V1, Chrome Soft)
- Version names
- Technical specifications
- User-submitted content

---

## Adding Future Locales

1. Add the locale code to `locales` in `i18n/routing.ts`
2. Create `messages/{locale}.json` with all translations
3. No routing changes required — `localePrefix: 'always'` handles it automatically

Example for Swedish:

```typescript
// i18n/routing.ts
export const locales = ['en', 'no', 'sv'] as const
```

```
messages/sv.json   ← Swedish translations
```

---

## Known Limitations

- **Cookie name:** next-intl uses `NEXT_LOCALE` (not `locale`). This is the Next.js platform standard and is readable by next-intl's middleware automatically.
- **Admin UI:** Not localized. Admin is internal tooling; translation would require separate translation keys and wrapping admin layouts with `NextIntlClientProvider`.
- **Database content:** Ball names, brand names, and specifications remain in English. Content localization (if ever needed) would require a separate database schema with locale columns or a translation table.
- **`typedRoutes`:** The `typedRoutes: true` Next.js setting is retained. next-intl's `Link` component uses its own `href` typing derived from the routing config, which is compatible but requires removing `as Route` casts from links using next-intl's `Link`.
